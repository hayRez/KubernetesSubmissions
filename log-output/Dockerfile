FROM python:3.11-slim

# Install system dependencies needed for pip to correctly build/install packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY app.py .

# Install aiohttp
RUN pip install --no-cache-dir aiohttp

EXPOSE 8080
CMD ["python", "app.py"]