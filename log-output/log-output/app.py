import asyncio
import uuid
from datetime import datetime, timezone
from aiohttp import web

RUNTIME_ID = str(uuid.uuid4())

def iso_z_now():
    """Returns the current UTC time in ISO 8601 format with millisecond precision."""
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')

# Background Ticker
async def ticker(app):
    """Background task that logs the runtime ID and timestamp every 5 seconds."""
    while True:
        print(f"{iso_z_now()}: {RUNTIME_ID}", flush=True)
        await asyncio.sleep(5)

# HTTP handler endpoint
async def status(request):
    """Responds to /status requests with a JSON object."""
    return web.json_response({
        "timestamp": iso_z_now(),
        "runtime_id": RUNTIME_ID
    })

# --- NEW STARTUP CODE ---
async def start_background_tasks(app):
    """Adds the ticker as a background task when the server starts."""
    print(f"{iso_z_now()}: startup {RUNTIME_ID}", flush=True)
    app['ticker'] = asyncio.create_task(ticker(app))
    
async def cleanup_background_tasks(app):
    """Cleans up the ticker task when the server shuts down."""
    app['ticker'].cancel()
    await app['ticker']

def init_app():
    """Initializes the aiohttp application."""
    app = web.Application()
    app.router.add_get("/status", status)

    # Register startup and cleanup hooks
    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(cleanup_background_tasks)
    
    return app

if __name__ == "__main__":
    app = init_app()
    print(f"{iso_z_now()}: starting web.run_app...", flush=True)
    try:
        # web.run_app is blocking and runs the server indefinitely.
        web.run_app(app, host="0.0.0.0", port=8080)
    except Exception as e:
        # Catch binding failure and log it definitively
        print(f"{iso_z_now()}: CRITICAL: Server startup failed: {e}", flush=True)
        # Exit with a non-zero code to ensure Kubernetes sees the failure
        import sys
        sys.exit(1)