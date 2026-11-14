"""Serve the static export locally, including parallel browser-test asset requests."""
import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

parser = argparse.ArgumentParser()
parser.add_argument("--directory", default="out")
parser.add_argument("--port", type=int, default=3200)
args = parser.parse_args()

class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True

handler = functools.partial(SimpleHTTPRequestHandler, directory=args.directory)
with PreviewServer(("127.0.0.1", args.port), handler) as server:
    print(f"Preview: http://127.0.0.1:{args.port}", flush=True)
    server.serve_forever()
