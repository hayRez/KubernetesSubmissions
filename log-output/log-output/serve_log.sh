#!/bin/sh
LOG_FILE="${LOG_FILE_PATH:-/var/log/app/log_data.txt}"
HTTP_PORT="${HTTP_PORT:-8080}"

mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

cat << EOF > /usr/local/bin/reader_server.py
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os, time

LOG_FILE_PATH = "$LOG_FILE"
PORT = int("$HTTP_PORT")

class LogHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            try:
                with open(LOG_FILE_PATH) as f:
                    self.wfile.write(f.read().encode())
            except Exception as e:
                self.wfile.write(str(e).encode())
        else:
            self.send_error(404)

HTTPServer(('0.0.0.0', PORT), LogHandler).serve_forever()
EOF

python3 /usr/local/bin/reader_server.py
