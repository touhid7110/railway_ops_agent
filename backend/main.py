import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

import db
import sse as sse_registry
from models import (
    BookingRequest,
    JobOut,
    LogEntry,
    OTPRequest,
    PassengerIn,
    SettingsIn,
    SettingsOut,
)
from agent.runner import run_booking_agent, _emit_error
from agent.graph import build_booking_graph
from agent.tools import build_custom_tools


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    yield


app = FastAPI(title="OdysseyAI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

@app.post("/api/jobs", status_code=201)
async def create_job(body: BookingRequest):
    job_id = await db.create_job(
        source=body.source,
        destination=body.destination,
        date=body.date,
        travel_class=body.travel_class,
        booking_type=body.booking_type,
        notify_email=body.notify_email,
    )
    sse_queue = sse_registry.create_queue(job_id)

    booking_input = body.model_dump()
    asyncio.create_task(run_booking_agent(job_id, booking_input, sse_queue))

    return {"job_id": job_id, "status": "queued"}


@app.get("/api/jobs")
async def list_jobs():
    return await db.list_jobs()


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/api/jobs/{job_id}/otp")
async def submit_otp(job_id: str, body: OTPRequest):
    job = await db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "waiting_otp":
        raise HTTPException(
            status_code=409,
            detail=f"Job is not waiting for OTP (current status: {job['status']})",
        )

    booking_summary = {
        "source": job["source"],
        "destination": job["destination"],
        "date": job["date"],
        "travel_class": job["travel_class"],
        "passengers": [],
    }
    custom_tools = build_custom_tools(
        job_id=job_id,
        notify_email=job["notify_email"],
        booking_summary=booking_summary,
    )

    async def _resume():
        async with AsyncSqliteSaver.from_conn_string(db.DB_PATH) as checkpointer:
            graph = build_booking_graph(custom_tools, checkpointer)
            config = {"configurable": {"thread_id": job_id}}
            otp_state = {"messages": [HumanMessage(content=f"OTP: {body.otp}")]}
            try:
                await graph.ainvoke(otp_state, config=config)
            except Exception as exc:
                await _emit_error(job_id, exc)

    asyncio.create_task(_resume())
    return {"status": "resumed"}


@app.get("/api/jobs/{job_id}/logs/stream")
async def stream_logs(job_id: str):
    job = await db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    q = sse_registry.get_queue(job_id)
    if q is None:
        raise HTTPException(status_code=404, detail="No active SSE stream for this job")

    async def event_generator():
        try:
            while True:
                event = await q.get()
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("type") in ("done", "error"):
                    break
        finally:
            sse_registry.drop_queue(job_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@app.get("/api/stats")
async def get_stats():
    jobs = await db.list_jobs()
    total = len(jobs)
    successful = sum(1 for j in jobs if j["status"] == "success")
    pending = sum(1 for j in jobs if j["status"] in ("running", "waiting_otp", "queued"))

    latencies = []
    for j in jobs:
        if j["status"] == "success" and j.get("created_at") and j.get("completed_at"):
            try:
                t0 = datetime.fromisoformat(j["created_at"])
                t1 = datetime.fromisoformat(j["completed_at"])
                latencies.append((t1 - t0).total_seconds() * 1000)
            except Exception:
                pass

    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    recent = [
        {
            "id": j["id"],
            "source": j["source"],
            "destination": j["destination"],
            "status": j["status"],
            "created_at": j["created_at"],
        }
        for j in jobs[:4]
    ]

    return {
        "total_bookings": total,
        "successful_bookings": successful,
        "pending_bookings": pending,
        "avg_latency_ms": round(avg_latency, 2),
        "recent_jobs": recent,
    }


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

_BOOL_KEYS = {"email_alerts", "sms_gateway", "push_sync"}
_STRING_KEYS = {"irctc_username", "smtp_notify_email"}


@app.get("/api/settings")
async def get_settings():
    stored = await db.get_settings_map()
    return SettingsOut(
        irctc_username=stored.get("irctc_username", ""),
        smtp_notify_email=stored.get("smtp_notify_email", ""),
        irctc_password="",
        email_alerts=stored.get("email_alerts", "false").lower() == "true",
        sms_gateway=stored.get("sms_gateway", "false").lower() == "true",
        push_sync=stored.get("push_sync", "false").lower() == "true",
    )


@app.put("/api/settings")
async def update_settings(body: SettingsIn):
    data = body.model_dump(exclude_none=True)
    for key, value in data.items():
        if key == "irctc_password":
            await db.upsert_setting("irctc_password", str(value))
        elif isinstance(value, bool):
            await db.upsert_setting(key, "true" if value else "false")
        else:
            await db.upsert_setting(key, str(value))
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Passengers
# ---------------------------------------------------------------------------

@app.get("/api/passengers")
async def get_passengers():
    return await db.list_passengers()


@app.post("/api/passengers", status_code=201)
async def add_passenger(body: PassengerIn):
    pid = await db.insert_passenger(body.name, body.age, body.id_type, body.id_number)
    return {"id": pid, **body.model_dump()}


@app.delete("/api/passengers/{passenger_id}", status_code=204)
async def remove_passenger(passenger_id: int):
    deleted = await db.delete_passenger(passenger_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Passenger not found")
    return Response(status_code=204)
