import asyncio
import uuid
from datetime import datetime, timezone
from aiohttp import web
import aiohttp  # For HTTP requests

RUNTIME_ID = str(uuid.uuid4())

def iso_z_now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')

# -----------------------------
# Fetch pong count from ping-pong
# -----------------------------
async def get_pong_count():
    url = "http://ping-pong:3000/pingpong"  # Kubernetes Service DNS
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    return (await resp.text()).strip()
                else:
                    return f"Ping-pong returned HTTP {resp.status}"
    except Exception as e:
        return f"Ping-pong unavailable: {e}"

# Background ticker
async def ticker(app):
    while True:
        pong_count = await get_pong_count()
        print(f"{iso_z_now()}: {RUNTIME_ID} | {pong_count}", flush=True)
        await asyncio.sleep(5)

# /status endpoint
async def status(request):
    return web.json_response({
        "timestamp": iso_z_now(),
        "runtime_id": RUNTIME_ID
    })

# Startup / cleanup hooks
async def start_background_tasks(app):
    print(f"{iso_z_now()}: startup {RUNTIME_ID}", flush=True)
    app['ticker'] = asyncio.create_task(ticker(app))

async def cleanup_background_tasks(app):
    app['ticker'].cancel()
    await app['ticker']

def init_app():
    app = web.Application()
    app.router.add_get("/status", status)
    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(cleanup_background_tasks)
    return app

if __name__ == "__main__":
    app = init_app()
    try:
        web.run_app(app, host="0.0.0.0", port=8080)
    except Exception as e:
        print(f"{iso_z_now()}: CRITICAL: Server startup failed: {e}", flush=True)
        import sys
        sys.exit(1)
