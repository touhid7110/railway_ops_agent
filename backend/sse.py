import asyncio

SSE_QUEUES: dict[str, asyncio.Queue] = {}


def create_queue(job_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    SSE_QUEUES[job_id] = q
    return q


def get_queue(job_id: str) -> asyncio.Queue | None:
    return SSE_QUEUES.get(job_id)


def drop_queue(job_id: str) -> None:
    SSE_QUEUES.pop(job_id, None)
