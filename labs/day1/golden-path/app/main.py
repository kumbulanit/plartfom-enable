"""A deliberately small web service for walking the PE Lab golden path.

It needs nothing beyond the Python standard library and answers on three paths:

    /          a coloured page in a browser; JSON (name, version, ...) for programs
    /healthz   liveness and readiness probe
    /metrics   Prometheus metrics: request counts, app info and uptime

Settings come from environment variables, so the same image runs unchanged in
dev, staging and prod (see deploy/<env>/kustomization.yaml).
"""

import json
import os
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_NAME = os.environ.get("APP_NAME", "hello")
APP_VERSION = os.environ.get("APP_VERSION", "dev")
APP_ENV = os.environ.get("APP_ENV", "local")
GREETING = os.environ.get("GREETING", "Hello from the PE Lab golden path")

STARTED_AT = time.time()
REQUESTS: Counter[tuple[str, int]] = Counter()
QUIET_PATHS = {"/healthz", "/metrics"}


def render_metrics() -> str:
    """Return the current metrics in the Prometheus text format."""
    lines = [
        "# HELP http_requests_total HTTP requests handled, by path and status code.",
        "# TYPE http_requests_total counter",
    ]
    for (path, status), count in sorted(REQUESTS.items()):
        lines.append(f'http_requests_total{{path="{path}",status="{status}"}} {count}')
    lines += [
        "# HELP app_info The running version of the service.",
        "# TYPE app_info gauge",
        f'app_info{{app="{APP_NAME}",version="{APP_VERSION}",env="{APP_ENV}"}} 1',
        "# HELP app_uptime_seconds Seconds since the service started.",
        "# TYPE app_uptime_seconds gauge",
        f"app_uptime_seconds {time.time() - STARTED_AT:.0f}",
    ]
    return "\n".join(lines) + "\n"


# The colour of each environment's name on the page: from red (dev, anything
# goes) to green (prod, what customers use).
ENV_COLOURS = {"dev": "#e53935", "test": "#fb8c00", "staging": "#fdd835", "prod": "#43a047"}


def render_page(body: dict[str, str]) -> str:
    """Return the page a browser shows: the environment's name, huge, in its colour."""
    # Imported here, not at the top, so GREETING stays on line 22, where the labs point.
    from html import escape

    colour = ENV_COLOURS.get(APP_ENV.lower(), "#90a4ae")
    text = {key: escape(str(value)) for key, value in body.items()}
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{text["app"]} · {text["environment"]}</title>
<style>
  body {{ margin: 0; min-height: 100vh; display: flex; flex-direction: column;
         align-items: center; justify-content: center; gap: 1.5rem;
         background: #111; color: #eee; font-family: system-ui, sans-serif; text-align: center; }}
  .env {{ font-size: clamp(4rem, 20vw, 14rem); font-weight: 900; line-height: 1;
          color: {colour}; letter-spacing: 0.05em; text-transform: uppercase; }}
  .message {{ font-size: clamp(1.25rem, 4vw, 2.5rem); }}
  .facts {{ font-size: 1.1rem; color: #aaa; }}
</style></head>
<body>
  <div class="env">{text["environment"]}</div>
  <div class="message">{text["message"]}</div>
  <div class="facts">{text["app"]} · version {text["version"]}</div>
</body></html>
"""


def route(path: str, accept: str = "") -> tuple[int, str, str]:
    """Return (status, content type, body) for a request path.

    A browser (Accept: text/html) gets the coloured page; curl and programs get JSON.
    """
    path = path.split("?", 1)[0]
    if path == "/":
        body = {
            "app": APP_NAME,
            "version": APP_VERSION,
            "environment": APP_ENV,
            "message": GREETING,
        }
        if "text/html" in accept:
            return 200, "text/html; charset=utf-8", render_page(body)
        return 200, "application/json", json.dumps(body) + "\n"
    if path == "/healthz":
        return 200, "text/plain", "ok\n"
    if path == "/metrics":
        return 200, "text/plain; version=0.0.4", render_metrics()
    return 404, "application/json", json.dumps({"error": "not found", "path": path}) + "\n"


class Handler(BaseHTTPRequestHandler):
    """Serves route() over HTTP and logs one JSON line per request."""

    server_version = "hello"

    def do_GET(self) -> None:  # noqa: N802 (name required by BaseHTTPRequestHandler)
        started = time.perf_counter()
        status, content_type, body = route(self.path, self.headers.get("Accept", ""))
        payload = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

        path = self.path.split("?", 1)[0]
        REQUESTS[(path if status != 404 else "unknown", status)] += 1
        if path not in QUIET_PATHS:
            log(
                "request",
                method="GET",
                path=path,
                status=status,
                duration_ms=round((time.perf_counter() - started) * 1000, 2),
            )

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        """Silence the default access log; do_GET writes structured logs instead."""


def log(event: str, **fields: object) -> None:
    """Write a JSON log line to stdout, where the platform's log collector reads it."""
    print(json.dumps({"event": event, "app": APP_NAME, "env": APP_ENV, **fields}), flush=True)


def main() -> None:
    port = int(os.environ.get("PORT", "8081"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    log("started", version=APP_VERSION, port=port)
    server.serve_forever()


if __name__ == "__main__":
    main()
