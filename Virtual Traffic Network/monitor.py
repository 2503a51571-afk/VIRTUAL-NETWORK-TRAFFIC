
import subprocess
import time
import re
from datetime import datetime

TARGET_IP = "172.31.26.58"
INTERVAL = 3

def check_connection():
    try:
        result = subprocess.run(
            ["ping", "-c", "1", "-W", "2", TARGET_IP],
            capture_output=True,
            text=True,
            timeout=5
        )

        connected = result.returncode == 0
        latency = None

        if connected:
            match = re.search(r"time=([\d.]+)", result.stdout)
            if match:
                latency = float(match.group(1))

        return connected, latency
    except (subprocess.TimeoutExpired, OSError):
        return False, None

print("NETWORK TRAFFIC LIGHT MONITOR")
print("Monitoring:", TARGET_IP)
print("Press Ctrl+C to stop")

try:
    while True:
        connected, latency = check_connection()
        timestamp = datetime.now().strftime("%H:%M:%S")

        if connected:
            print(
                f"[{timestamp}] GREEN LED ON | "
                f"CONNECTED | Latency: {latency} ms"
            )
        else:
            print(
                f"[{timestamp}] RED LED ON | "
                "DISCONNECTED"
            )

        time.sleep(INTERVAL)

except KeyboardInterrupt:
    print("\nMonitoring stopped.")
