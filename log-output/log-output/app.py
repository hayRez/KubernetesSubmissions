import asyncio
import os
import uuid
from datetime import datetime, timezone
from aiohttp import web
import aiohttp

RUNTIME_ID = str(uuid.uuid4())

CONFIG_FILE_PATH = os.getenv("CONFIG_FILE_PATH", "/config/information.txt")
MESSAGE = os.getenv("MESSAGE", "hello world")
PING_PONG_URL = os.getenv("PING_PONG_URL", "http://ping-pong:3000/pingpong")
HTTP_PORT = int(os.getenv("HTTP_PORT", "8080"))
SLEEP_INTERVAL = int(os.getenv("SLEEP_INTERVAL", "5"))

def iso_z_now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")

async def get_pong_count():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(PING_PONG_URL) as resp:
                if resp.status == 200:
                    return (await resp.text()).strip()
                return f"Ping-pong returned HTTP {resp.status}"
    except Exception as e:
        return f"Ping-pong unavailable: {e}"

async def ticker(app):
    # Print ConfigMap file content
    try:
        with open(CONFIG_FILE_PATH) as f:
            print("file content:", f.read().strip(), flush=True)
    except Exception as e:
        print(f"file content: <error reading file: {e}>", flush=True)

    # Print env variable
    print("env variable: MESSAGE=" + MESSAGE, flush=True)

    while True:
        pong_count = await get_pong_count()
        print(f"{iso_z_now()}: {RUNTIME_ID}.", flush=True)
        print(f"Ping / Pongs: {pong_count}", flush=True)
        await asyncio.sleep(SLEEP_INTERVAL)

async def status(request):
    return web.json_response({
        "timestamp": iso_z_now(),
        "runtime_id": RUNTIME_ID
    })

async def start_background_tasks(app):
    app["ticker"] = asyncio.create_task(ticker(app))

async def cleanup_background_tasks(app):
    app["ticker"].cancel()
    await app["ticker"]

def init_app():
    app = web.Application()
    app.router.add_get("/status", status)
    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(cleanup_background_tasks)
    return app

if __name__ == "__main__":
    app = init_app()
    web.run_app(app, host="0.0.0.0", port=HTTP_PORT)
