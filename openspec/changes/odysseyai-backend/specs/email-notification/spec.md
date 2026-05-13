## ADDED Requirements

### Requirement: Gmail SMTP SSL email on payment URL capture
The `mailer.py` module SHALL send an HTML email using `smtplib.SMTP_SSL` on port 465. It SHALL be called exclusively by the `save_payment_url` agent tool — never directly from the API layer. SMTP credentials SHALL be loaded from `config.py` (SMTP_EMAIL, SMTP_APP_PASSWORD).

#### Scenario: Email sent when payment URL is captured
- **WHEN** the agent calls save_payment_url with a valid URL
- **THEN** send_booking_email is called and an HTML email is delivered to the notify_email address

#### Scenario: API cannot trigger email directly
- **WHEN** any FastAPI endpoint is called
- **THEN** no code path in the endpoint handlers directly calls send_booking_email

### Requirement: HTML email content
The email SHALL include: a journey summary table (source, destination, date, travel_class, number of passengers), a prominent CTA button labelled "Complete Payment →" linking to the payment URL, the truncated payment URL in monospace text below the button, and a footer: "Sent by OdysseyAI Agent. Complete payment before your IRCTC session expires."

#### Scenario: Email contains payment URL
- **WHEN** send_booking_email is called with a payment_url
- **THEN** the HTML body contains the payment_url in both the CTA href and the monospace text block

### Requirement: SMTP failure does not crash the agent
The `send_booking_email` function SHALL wrap the SMTP call in a try/except. If sending fails, it SHALL log the error via `emit_sse` with tag=ERROR and continue — the payment URL is already saved to the database and the job is already marked success.

#### Scenario: SMTP failure is non-fatal
- **WHEN** the SMTP server is unreachable during send_booking_email
- **THEN** the exception is caught, an ERROR log is emitted, and the job status remains "success" (URL was already persisted)
