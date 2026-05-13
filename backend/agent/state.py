from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class BookingAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    job_id: str
    source: str
    destination: str
    date: str
    travel_class: str
    booking_type: str
    passengers: list[dict]
    contact_mobile: str
    notify_email: str
    irctc_username: str
    irctc_password: str
    current_step: int
    otp: str | None
    payment_url: str | None
    status: Literal["running", "waiting_otp", "success", "failed"]
    error: str | None
