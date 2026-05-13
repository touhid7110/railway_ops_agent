import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import get_settings


def _build_html(booking_summary: dict, payment_url: str) -> str:
    passengers = booking_summary.get("passengers", [])
    num_passengers = len(passengers)
    truncated_url = payment_url[:80] + "..." if len(payment_url) > 80 else payment_url

    return f"""<!DOCTYPE html>
<html>
<body style="font-family: monospace; background: #0d1117; color: #c9d1d9; padding: 24px;">
  <h2 style="color: #00f2ff;">OdysseyAI — Booking Confirmation</h2>

  <table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
    <tr style="background: #161b22;">
      <th style="padding: 8px 12px; text-align: left; border: 1px solid #30363d;">Field</th>
      <th style="padding: 8px 12px; text-align: left; border: 1px solid #30363d;">Value</th>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">From</td>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">{booking_summary.get('source', '')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">To</td>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">{booking_summary.get('destination', '')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">Date</td>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">{booking_summary.get('date', '')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">Class</td>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">{booking_summary.get('travel_class', '')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">Passengers</td>
      <td style="padding: 8px 12px; border: 1px solid #30363d;">{num_passengers}</td>
    </tr>
  </table>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{payment_url}"
       style="background: #00f2ff; color: #0d1117; padding: 14px 28px;
              text-decoration: none; font-weight: bold; border-radius: 4px; font-size: 16px;">
      Complete Payment →
    </a>
  </div>

  <p style="color: #8b949e; font-size: 12px;">Payment URL:</p>
  <pre style="background: #161b22; padding: 12px; border-radius: 4px;
              color: #00f2ff; font-size: 11px; word-break: break-all;">{truncated_url}</pre>

  <hr style="border: 1px solid #30363d; margin: 24px 0;">
  <p style="color: #8b949e; font-size: 12px;">
    Sent by OdysseyAI Agent. Complete payment before your IRCTC session expires.
  </p>
</body>
</html>"""


async def send_booking_email(
    notify_email: str,
    booking_summary: dict,
    payment_url: str,
) -> None:
    settings = get_settings()
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "OdysseyAI — Complete Your IRCTC Payment"
        msg["From"] = settings.SMTP_EMAIL
        msg["To"] = notify_email
        msg.attach(MIMEText(_build_html(booking_summary, payment_url), "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, notify_email, msg.as_string())
    except Exception as exc:
        print(f"[mailer] Failed to send email to {notify_email}: {exc}")
