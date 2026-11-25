
import os
import re
import subprocess
from datetime import datetime, timezone
from flask import Flask, jsonify, render_template

app = Flask(__name__)

TARGET_IP = os.environ.get("TARGET_IP", "172.31.26.58")

def check_connection():
    try:
        result = subprocess.run(
            ["ping", "-c", "1", "-W", "2", TARGET_IP],
            capture_output=True,
            text=True,
            timeout=5
        )
        connected = result.returncode == 0
        match = re.search(r"time[=<]([\d.]+)", result.stdout)

        return {
            "connected": connected,
            "latency_ms": float(match.group(1))
            if connected and match else None,
            "checked_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "target_ip": TARGET_IP
        }
    except (OSError, subprocess.TimeoutExpired):
        return {
            "connected": False,
            "latency_ms": None,
            "checked_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "target_ip": TARGET_IP
        }

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/api/status")
def status():
    return jsonify(check_connection())

@app.get("/privacy")
def privacy():
    return render_template("privacy.html")

@app.get("/terms")
def terms():
    return render_template("terms.html")

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5055,
        debug=False
    )
