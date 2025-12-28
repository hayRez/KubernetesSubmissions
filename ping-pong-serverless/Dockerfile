FROM python:3.11-slim

WORKDIR /app

COPY serverless_pingpong.py /app/

RUN pip install aiohttp

ENV PORT=8080

CMD ["python", "serverless_pingpong.py"]
