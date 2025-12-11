#!/bin/sh
LOG_FILE="/var/log/app/log_data.txt"
HTTP_PORT="8080"

echo "Starting simple HTTP server on port $HTTP_PORT, reading from $LOG_FILE"

# Ensure the log file exists (even if empty, until generator starts)
mkdir -p $(dirname $LOG_FILE)
touch $LOG_FILE

# Simple Python HTTP server using standard libraries to serve the file content.
cat << EOF > /usr/local/bin/reader_server.py
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
import time

LOG_FILE_PATH = "$LOG_FILE"
PORT = $HTTP_PORT

class LogHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Only serve the root path
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            
            try:
                # Read the shared log file content
                with open(LOG_FILE_PATH, 'r') as f:
                    content = f.read()
                self.wfile.write(content.encode('utf-8'))
            except FileNotFoundError:
                self.wfile.write(b"Log file not yet created.")
            except Exception as e:
                self.wfile.write(f"Error reading log: {e}".encode('utf-8'))
        else:
            self.send_error(404)

if __name__ == '__main__':
    # Change directory to the log file's parent to simplify file path handling
    try:
        os.chdir(os.path.dirname(LOG_FILE_PATH)) 
    except FileNotFoundError:
        # If the directory doesn't exist yet, that's fine, the writer will create it.
        pass
        
    print(f"[{time.ctime()}] Starting server on 0.0.0.0:{PORT}")
    try:
        httpd = HTTPServer(('0.0.0.0', PORT), LogHandler)
        httpd.serve_forever()
    except Exception as e:
        print(f"[{time.ctime()}] CRITICAL: Server startup failed: {e}")
        import sys
        sys.exit(1)
EOF

# Execute the simple Python server
python3 /usr/local/bin/reader_server.py