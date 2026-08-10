#!/usr/bin/env python3
"""Local dev server that mirrors the routing in vercel.json.

`python -m http.server` serves raw files, so /team and /blog/<slug> 404
locally even though they work in production. This applies the same two rules
Vercel does — cleanUrls and the /blog/:slug rewrite — so what you see here is
what deploys.

    python dev-server.py [port]     # default http://localhost:8765
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent.resolve()


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0].rstrip("/")

        # /blog/<slug>  ->  post.html   (but /blog itself -> blog.html)
        if clean.startswith("/blog/") and clean.count("/") == 2:
            return str(ROOT / "post.html")

        # /admin is an alias for the studio
        if clean == "/admin":
            return str(ROOT / "studio.html")

        # /founder redirects to /team in production; alias it locally
        if clean == "/founder":
            return str(ROOT / "team.html")

        # cleanUrls: /team -> team.html when the bare file exists
        if clean and "." not in clean.rsplit("/", 1)[-1]:
            candidate = ROOT / (clean.lstrip("/") + ".html")
            if candidate.is_file():
                return str(candidate)

        return super().translate_path(path)

    def end_headers(self):
        # Always re-read data/*.json while editing content locally.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = partial(Handler, directory=str(ROOT))
    print(f"NUMETRIC dev server  ->  http://localhost:{port}")
    print("  /            home")
    print("  /team        team page")
    print("  /blog        blog index")
    print("  /blog/<slug> article")
    print("  /studio      content studio (also /admin)")
    ThreadingHTTPServer(("", port), handler).serve_forever()
