"""
CIVIL ESTIMATION A1 - Local HTTP Server Runner
Starts a local web server and automatically opens CIVIL ESTIMATION A1 in the default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    # Find free port if 8080 is occupied
    port = PORT
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print("=" * 65)
                print("  CIVIL ESTIMATION A1 - 2D Plan Upload & AI Estimation")
                print("=" * 65)
                print(f"[*] Serving files from: {DIRECTORY}")
                print(f"[*] App URL: {url}")
                print("[*] Opening in default web browser...")
                print("[*] Press Ctrl+C to stop the server.")
                print("=" * 65)
                webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\n[*] Server stopped.")
        sys.exit(0)
