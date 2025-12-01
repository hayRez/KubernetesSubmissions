# Dockerfile (simple, small)
FROM python:3.11-slim

WORKDIR /app
COPY app.py /app/app.py

# Make output unbuffered (so kubectl logs show lines immediately)
ENV PYTHONUNBUFFERED=1

CMD ["python", "app.py"]
