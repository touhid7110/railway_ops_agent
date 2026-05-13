import asyncio
import logging
import traceback
from datetime import datetime, timezone

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

import db
import sse as sse_registry
from .graph import build_booking_graph
from .prompts import build_initial_messages
from .state import BookingAgentState
from .tools import build_custom_tools

logger = logging.getLogger(__name__)

MCP_CONFIG = {
    "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest", "--browser=chrome", "--caps=vision"],
        "transport": "stdio",
    }
}


def _unwrap_exception(exc: BaseException) -> BaseException:
    """Unwrap ExceptionGroup / TaskGroup errors to their first real cause."""
    # Python 3.11+ ExceptionGroup
    if hasattr(exc, "exceptions") and exc.exceptions:
        return _unwrap_exception(exc.exceptions[0])
    # Standard chained exception
    if exc.__cause__ is not None:
        return _unwrap_exception(exc.__cause__)
    return exc


def _format_error(exc: BaseException) -> str:
    real = _unwrap_exception(exc)
    lines = traceback.format_exception(type(real), real, real.__traceback__)
    return "".join(lines).strip()


async def _emit_error(job_id: str, exc: BaseException) -> None:
    full_tb = _format_error(exc)
    short_msg = str(_unwrap_exception(exc)) or type(_unwrap_exception(exc)).__name__

    # Always print full traceback to uvicorn stdout
    logger.error("Job %s FAILED:\n%s", job_id, full_tb)

    ts = datetime.now(timezone.utc).isoformat()
    try:
        await db.update_job_status(job_id, "failed", error_message=full_tb[:2000])
        await db.insert_log(job_id, "ERROR", short_msg, ts)
        q = sse_registry.get_queue(job_id)
        if q is not None:
            await q.put({"type": "error", "message": short_msg, "detail": full_tb, "ts": ts})
    except Exception:
        pass


async def run_booking_agent(
    job_id: str,
    booking_input: dict,
    sse_queue: asyncio.Queue,
) -> None:
    booking_summary = {
        "source": booking_input["source"],
        "destination": booking_input["destination"],
        "date": booking_input["date"],
        "travel_class": booking_input["travel_class"],
        "passengers": booking_input["passengers"],
    }

    custom_tools = build_custom_tools(
        job_id=job_id,
        notify_email=booking_input["notify_email"],
        booking_summary=booking_summary,
    )

    try:
        await db.update_job_status(job_id, "running")

        client = MultiServerMCPClient(MCP_CONFIG)
        async with client.session("playwright") as session:
            from langchain_mcp_adapters.tools import load_mcp_tools
            mcp_tools = await load_mcp_tools(session)
            all_tools = mcp_tools + custom_tools

            async with AsyncSqliteSaver.from_conn_string(db.DB_PATH) as checkpointer:
                graph = build_booking_graph(all_tools, checkpointer)

                initial_state: BookingAgentState = {
                    "messages": build_initial_messages(booking_input),
                    "job_id": job_id,
                    "source": booking_input["source"],
                    "destination": booking_input["destination"],
                    "date": booking_input["date"],
                    "travel_class": booking_input["travel_class"],
                    "booking_type": booking_input["booking_type"],
                    "passengers": booking_input["passengers"],
                    "contact_mobile": booking_input["contact_mobile"],
                    "notify_email": booking_input["notify_email"],
                    "irctc_username": booking_input["irctc_username"],
                    "irctc_password": booking_input["irctc_password"],
                    "current_step": 0,
                    "otp": None,
                    "payment_url": None,
                    "status": "running",
                    "error": None,
                }

                config = {"configurable": {"thread_id": job_id}}
                await graph.ainvoke(initial_state, config=config)

    except Exception as exc:
        await _emit_error(job_id, exc)
