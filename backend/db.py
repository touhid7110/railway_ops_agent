import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import aiosqlite

DB_PATH = "odysseyai.db"


@asynccontextmanager
async def _connect():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        db.row_factory = aiosqlite.Row
        yield db


async def init_db() -> None:
    async with _connect() as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                status TEXT DEFAULT 'queued',
                source TEXT,
                destination TEXT,
                date TEXT,
                travel_class TEXT,
                booking_type TEXT,
                notify_email TEXT,
                payment_url TEXT,
                error_message TEXT,
                steps_total INTEGER DEFAULT 9,
                steps_done INTEGER DEFAULT 0,
                created_at TEXT,
                completed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS job_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                tag TEXT,
                message TEXT,
                ts TEXT
            );

            CREATE TABLE IF NOT EXISTS passengers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                age INTEGER,
                id_type TEXT,
                id_number TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        """)
        await db.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_job(
    source: str,
    destination: str,
    date: str,
    travel_class: str,
    booking_type: str,
    notify_email: str,
) -> str:
    job_id = str(uuid.uuid4())
    async with _connect() as db:
        await db.execute(
            """INSERT INTO jobs (id, status, source, destination, date, travel_class,
               booking_type, notify_email, created_at)
               VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, ?)""",
            (job_id, source, destination, date, travel_class, booking_type,
             notify_email, _now()),
        )
        await db.commit()
    return job_id


async def update_job_status(
    job_id: str,
    status: str,
    error_message: str | None = None,
    payment_url: str | None = None,
    completed: bool = False,
) -> None:
    sets = ["status = ?"]
    params: list[Any] = [status]
    if error_message is not None:
        sets.append("error_message = ?")
        params.append(error_message)
    if payment_url is not None:
        sets.append("payment_url = ?")
        params.append(payment_url)
    if completed:
        sets.append("completed_at = ?")
        params.append(_now())
    params.append(job_id)
    async with _connect() as db:
        await db.execute(
            f"UPDATE jobs SET {', '.join(sets)} WHERE id = ?", params
        )
        await db.commit()


async def insert_log(job_id: str, tag: str, message: str, ts: str) -> None:
    async with _connect() as db:
        await db.execute(
            "INSERT INTO job_logs (job_id, tag, message, ts) VALUES (?, ?, ?, ?)",
            (job_id, tag, message, ts),
        )
        await db.commit()


async def get_job(job_id: str) -> dict | None:
    async with _connect() as db:
        async with db.execute(
            "SELECT * FROM jobs WHERE id = ?", (job_id,)
        ) as cur:
            row = await cur.fetchone()
        if row is None:
            return None
        job = dict(row)
        async with db.execute(
            "SELECT tag, message, ts FROM job_logs WHERE job_id = ? ORDER BY ts ASC",
            (job_id,),
        ) as cur:
            logs = [dict(r) for r in await cur.fetchall()]
        job["logs"] = logs
        return job


async def list_jobs() -> list[dict]:
    async with _connect() as db:
        async with db.execute(
            "SELECT * FROM jobs ORDER BY created_at DESC"
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]


async def upsert_setting(key: str, value: str) -> None:
    async with _connect() as db:
        await db.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, value),
        )
        await db.commit()


async def get_settings_map() -> dict[str, str]:
    async with _connect() as db:
        async with db.execute("SELECT key, value FROM settings") as cur:
            return {r["key"]: r["value"] for r in await cur.fetchall()}


async def list_passengers() -> list[dict]:
    async with _connect() as db:
        async with db.execute("SELECT * FROM passengers") as cur:
            return [dict(r) for r in await cur.fetchall()]


async def insert_passenger(
    name: str, age: int, id_type: str, id_number: str
) -> int:
    async with _connect() as db:
        cur = await db.execute(
            "INSERT INTO passengers (name, age, id_type, id_number) VALUES (?, ?, ?, ?)",
            (name, age, id_type, id_number),
        )
        await db.commit()
        return cur.lastrowid


async def delete_passenger(passenger_id: int) -> bool:
    async with _connect() as db:
        cur = await db.execute(
            "DELETE FROM passengers WHERE id = ?", (passenger_id,)
        )
        await db.commit()
        return cur.rowcount > 0
