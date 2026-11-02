import json
import threading
import urllib.request
from http.server import ThreadingHTTPServer

from app import main


def test_root_describes_the_service():
    status, content_type, body = main.route("/")
    assert status == 200
    assert content_type == "application/json"
    data = json.loads(body)
    assert data["app"] == main.APP_NAME
    assert data["environment"] == main.APP_ENV


def test_browser_gets_a_page_in_the_environment_colour():
    status, content_type, body = main.route("/", accept="text/html,application/xhtml+xml")
    assert status == 200
    assert content_type.startswith("text/html")
    assert f'<div class="env">{main.APP_ENV}</div>' in body


def test_health_check():
    assert main.route("/healthz") == (200, "text/plain", "ok\n")


def test_metrics_include_the_running_version():
    status, _, body = main.route("/metrics")
    assert status == 200
    assert f'version="{main.APP_VERSION}"' in body


def test_unknown_path_is_404():
    assert main.route("/does-not-exist")[0] == 404


def test_server_answers_over_http():
    server = ThreadingHTTPServer(("127.0.0.1", 0), main.Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        url = f"http://127.0.0.1:{server.server_port}/"
        with urllib.request.urlopen(url, timeout=5) as response:
            assert response.status == 200
            assert json.loads(response.read())["app"] == main.APP_NAME
        assert 'path="/",status="200"' in main.render_metrics()
    finally:
        server.shutdown()
