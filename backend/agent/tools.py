from datetime import datetime, timezone
from langchain_core.tools import tool
from langgraph.errors import NodeInterrupt

import db
import sse as sse_registry


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _make_emit_sse(job_id: str):
    @tool
    async def emit_sse(tag: str, message: str) -> str:
        """Emit a log event to the SSE stream and write it to the job_logs table."""
        try:
            ts = _now()
            event = {"type": "log", "tag": tag, "message": message, "ts": ts}
            q = sse_registry.get_queue(job_id)
            if q is not None:
                await q.put(event)
            await db.insert_log(job_id, tag, message, ts)
        except Exception:
            pass
        return "ok"

    return emit_sse


def _make_signal_otp_required(job_id: str, emit_sse_tool):
    @tool
    async def signal_otp_required(reason: str) -> str:
        """Signal that an OTP is required. Pauses the agent until the OTP is submitted."""
        try:
            ts = _now()
            event = {"type": "otp_required", "tag": "OTP", "message": reason, "ts": ts}
            q = sse_registry.get_queue(job_id)
            if q is not None:
                await q.put(event)
            await db.insert_log(job_id, "OTP", reason, ts)
            await db.update_job_status(job_id, "waiting_otp")
        except Exception:
            pass
        raise NodeInterrupt("otp_required")

    return signal_otp_required


def _make_save_payment_url(job_id: str, notify_email: str, booking_summary: dict):
    @tool
    async def save_payment_url(url: str) -> str:
        """Save the IRCTC payment URL, send confirmation email, and mark the job as success."""
        if not url.startswith("https://"):
            raise ValueError("Payment URL must start with https://")

        await db.update_job_status(
            job_id, "success", payment_url=url, completed=True
        )

        import mailer
        await mailer.send_booking_email(notify_email, booking_summary, url)

        ts = _now()
        event = {"type": "done", "payment_url": url, "ts": ts}
        q = sse_registry.get_queue(job_id)
        if q is not None:
            await q.put(event)
        await db.insert_log(job_id, "PAYMENT", f"Payment URL captured: {url}", ts)

        return "Payment URL saved. Email sent. Job marked success."

    return save_payment_url


def build_custom_tools(
    job_id: str,
    notify_email: str,
    booking_summary: dict,
) -> list:
    emit_sse = _make_emit_sse(job_id)
    signal_otp = _make_signal_otp_required(job_id, emit_sse)
    save_url = _make_save_payment_url(job_id, notify_email, booking_summary)
    return [emit_sse, signal_otp, save_url]
