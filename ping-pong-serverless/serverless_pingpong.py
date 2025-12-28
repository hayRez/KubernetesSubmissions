import os
from aiohttp import web

PORT = int(os.getenv("PORT", "8080"))  # Knative will inject this

async def pingpong(request):
    return web.Response(text="pong")

app = web.Application()
app.router.add_get("/pingpong", pingpong)

web.run_app(app, host="0.0.0.0", port=PORT)

