import asyncio
import uuid
from datetime import datetime, timezone
import os

# --- Configuration ---
# Path must be consistent with the volume mount in the Kubernetes manifest
LOG_FILE_PATH = "/var/log/app/log_data.txt" 
MAX_LOG_LINES = 20
RUNTIME_ID = str(uuid.uuid4())

def iso_z_now():
    """Returns the current UTC time in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')

# Background Ticker
async def ticker():
    """Background task that logs the runtime ID and timestamp every 5 seconds into a file."""
    # Ensure the directory exists before writing
    os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
    
    # Initialize the log file with the runtime ID
    with open(LOG_FILE_PATH, 'w') as f:
        f.write(f"Initial Random ID: {RUNTIME_ID}\n")
    
    print(f"[{iso_z_now()}] Generator started. Writing to: {LOG_FILE_PATH}", flush=True)

    while True:
        timestamp = iso_z_now()
        log_line = f"{timestamp} - Log Entry for ID: {RUNTIME_ID}"
        
        try:
            # Append the new log line
            with open(LOG_FILE_PATH, 'a') as f:
                f.write(log_line + "\n")
            
            # Keep only the last N lines to prevent file growth
            with open(LOG_FILE_PATH, 'r') as f:
                lines = f.readlines()
            
            if len(lines) > MAX_LOG_LINES:
                lines = lines[-MAX_LOG_LINES:]
                with open(LOG_FILE_PATH, 'w') as f:
                    # Write the temporary log back to the file
                    f.writelines(lines) 
            
            print(f"[{timestamp}] Wrote line to file: {log_line}", flush=True)

        except Exception as e:
            print(f"[{timestamp}] Error writing to log file: {e}", flush=True)
            
        await asyncio.sleep(5)

# Main entry point for the Generator container
if __name__ == "__main__":
    print(f"[{iso_z_now()}] starting Log Generator process...", flush=True)
    try:
        asyncio.run(ticker())
    except KeyboardInterrupt:
        print("\nGenerator stopped by user.", flush=True)
    except Exception as e:
        print(f"[{iso_z_now()}] CRITICAL: Log Generator failed: {e}", flush=True)
        import sys
        sys.exit(1)