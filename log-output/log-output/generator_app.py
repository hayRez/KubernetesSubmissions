import asyncio
import uuid
import os

RUNTIME_ID = str(uuid.uuid4())

LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", "/var/log/app/log_data.txt")
MAX_LOG_LINES = int(os.getenv("MAX_LOG_LINES", "20"))
SLEEP_INTERVAL = int(os.getenv("SLEEP_INTERVAL", "5"))

def iso_z_now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')

async def ticker():
    import os
    os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)

    with open(LOG_FILE_PATH, 'w') as f:
        f.write(f"Initial Random ID: {RUNTIME_ID}\n")

    while True:
        timestamp = iso_z_now()
        log_line = f"{timestamp} - Log Entry for ID: {RUNTIME_ID}"
        with open(LOG_FILE_PATH, 'a') as f:
            f.write(log_line + "\n")
        with open(LOG_FILE_PATH, 'r') as f:
            lines = f.readlines()
        if len(lines) > MAX_LOG_LINES:
            with open(LOG_FILE_PATH, 'w') as f:
                f.writelines(lines[-MAX_LOG_LINES:])
        print(log_line, flush=True)
        await asyncio.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    import asyncio
    asyncio.run(ticker())
