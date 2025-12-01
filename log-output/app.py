# app.py
import asyncio
import uuid
from datetime import datetime, timezone

RUNTIME_ID = str(uuid.uuid4())

def iso_z_now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')

async def ticker():
    while True:
        print(f"{iso_z_now()}: {RUNTIME_ID}", flush=True)
        await asyncio.sleep(5)

def main():
    print(f"{iso_z_now()}: startup {RUNTIME_ID}", flush=True)
    try:
        asyncio.run(ticker())
    except (KeyboardInterrupt, SystemExit):
        print(f"{iso_z_now()}: exiting", flush=True)

if __name__ == "__main__":
    main()
