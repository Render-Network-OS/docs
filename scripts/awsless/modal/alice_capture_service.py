"""
Alice capture-service on Modal.

Cost posture:
  - min_containers=0 and buffer_containers=0: no idle baseline.
  - scaledown_window=60: short warm tail after proof requests.
  - Explicit auth required for every route except health checks.

Usage:
  ~/.venvs/modal/bin/modal secret create alice-capture-auth CAPTURE_API_TOKEN=...
  ~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_capture_service.py
  ~/.venvs/modal/bin/modal app stop alice-capture-service --yes
"""

import modal

app = modal.App("alice-capture-service")

RUNTIME_BASE_URL = "https://rndrntwrk--alice.modal.run"


def build_companion_url(runtime_base_url: str, token: str) -> str:
    """Companion target with FRAGMENT token delivery (never a query token).

    The SPA bootstrap (apps/app/src/main.tsx) reads #token=... and refuses a
    query token, so the credential never reaches server logs or Referer.
    Callers must never log the returned URL.
    """
    from urllib.parse import quote

    return f"{runtime_base_url.rstrip('/')}/companion#token={quote(token, safe='')}"

CAPTURE_SERVICE = "/app"
SHARED = "/shared"

APT = [
    "ca-certificates",
    "chromium",
    "dbus-x11",
    "dumb-init",
    "ffmpeg",
    "fonts-liberation",
    "libasound2",
    "libatk-bridge2.0-0",
    "libatk1.0-0",
    "libatspi2.0-0",
    "libcairo2",
    "libcups2",
    "libdrm2",
    "libgbm1",
    "libgtk-3-0",
    "libnss3",
    "libpango-1.0-0",
    "libx11-xcb1",
    "libxcomposite1",
    "libxdamage1",
    "libxext6",
    "libxfixes3",
    "libxkbcommon0",
    "libxrandr2",
    "procps",
    "pulseaudio",
    "x11-utils",
    "xvfb",
]


def ignore_capture_upload(path):
    text = str(path)
    return any(
        part in text
        for part in [
            "node_modules",
            ".git",
            ".DS_Store",
            "coverage",
            ".nyc_output",
        ]
    )


capture_image = (
    modal.Image.from_registry("node:22-bookworm-slim", add_python="3.11")
    .apt_install(*APT)
    .env(
        {
            "PUPPETEER_SKIP_DOWNLOAD": "1",
            "PUPPETEER_EXECUTABLE_PATH": "/usr/bin/chromium",
        }
    )
    .add_local_dir(
        "555stream/services/capture-service",
        CAPTURE_SERVICE,
        copy=True,
        ignore=ignore_capture_upload,
    )
    .add_local_dir(
        "555stream/services/capture-service/shared",
        SHARED,
        copy=True,
        ignore=ignore_capture_upload,
    )
    .run_commands(
        f"cd {CAPTURE_SERVICE} && npm install --omit=dev --ignore-scripts --no-audit --no-fund",
        f"cd {SHARED} && npm install --omit=dev --ignore-scripts --no-audit --no-fund",
    )
)

CAPTURE_ENV = {
    "NODE_ENV": "production",
    "PORT": "8080",
    "PUPPETEER_EXECUTABLE_PATH": "/usr/bin/chromium",
    "PUPPETEER_SKIP_DOWNLOAD": "1",
    "CAPTURE_ALLOWED_ORIGINS": "https://stream.rndrntwrk.com,https://rndrntwrk--alice-runtime-web.modal.run",
    "CAPTURE_AUTH_DISABLED": "0",
    "REDIS_URL": "",
}


@app.function(
    image=capture_image,
    cpu=4.0,
    memory=8192,
    min_containers=0,
    # The capture API keeps browser and FFmpeg sessions in process memory.
    # Keep proof-window requests on a single container so status/screenshot
    # calls can see the session created by /api/capture/start.
    max_containers=1,
    buffer_containers=0,
    scaledown_window=60,
    timeout=3600,
    # alice-capture-auth: inbound CAPTURE_API_TOKEN for the capture API.
    # alice-api-token: MILADY_API_TOKEN, used ONLY to precompute the default
    # companion target URL with fragment token delivery (never logged).
    secrets=[
        modal.Secret.from_name("alice-capture-auth"),
        modal.Secret.from_name("alice-api-token"),
    ],
)
@modal.web_server(port=8080, startup_timeout=300, label="capture")
def capture_web():
    import os
    import subprocess

    os.environ.update(CAPTURE_ENV)
    milady_token = os.environ.get("MILADY_API_TOKEN", "").strip()
    if milady_token:
        os.environ["CAPTURE_DEFAULT_TARGET_URL"] = build_companion_url(
            os.environ.get("ALICE_RUNTIME_BASE_URL", RUNTIME_BASE_URL),
            milady_token,
        )
    subprocess.Popen(
        ["dumb-init", "--", "node", "src/index.js"],
        cwd=CAPTURE_SERVICE,
        env=os.environ.copy(),
    )


@app.local_entrypoint()
def main():
    print("Alice capture-service Modal app. Deploy with:")
    print("  ~/.venvs/modal/bin/modal deploy scripts/awsless/modal/alice_capture_service.py")
