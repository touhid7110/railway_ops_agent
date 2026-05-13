from typing import Optional
from pydantic import BaseModel


class PassengerIn(BaseModel):
    name: str
    age: int
    id_type: str
    id_number: str


class BookingRequest(BaseModel):
    source: str
    destination: str
    date: str
    travel_class: str
    booking_type: str
    passengers: list[PassengerIn]
    contact_mobile: str
    notify_email: str
    irctc_username: str
    irctc_password: str


class LogEntry(BaseModel):
    tag: str
    message: str
    ts: str


class JobOut(BaseModel):
    id: str
    status: str
    source: str
    destination: str
    date: str
    travel_class: str
    booking_type: str
    notify_email: str
    payment_url: Optional[str] = None
    error_message: Optional[str] = None
    steps_total: int
    steps_done: int
    created_at: str
    completed_at: Optional[str] = None
    logs: list[LogEntry] = []


class SSEEvent(BaseModel):
    type: Optional[str] = None
    tag: Optional[str] = None
    message: Optional[str] = None
    ts: Optional[str] = None
    payment_url: Optional[str] = None


class SettingsIn(BaseModel):
    irctc_username: Optional[str] = None
    smtp_notify_email: Optional[str] = None
    irctc_password: Optional[str] = None
    email_alerts: Optional[bool] = None
    sms_gateway: Optional[bool] = None
    push_sync: Optional[bool] = None


class SettingsOut(BaseModel):
    irctc_username: str = ""
    smtp_notify_email: str = ""
    irctc_password: str = ""
    email_alerts: bool = False
    sms_gateway: bool = False
    push_sync: bool = False


class OTPRequest(BaseModel):
    otp: str
