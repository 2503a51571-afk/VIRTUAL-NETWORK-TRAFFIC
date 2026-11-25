
"use strict";

const get = (id) => document.getElementById(id);

let checking = false;

function updateLights(connected) {
  get("greenLed").classList.toggle("active", connected);
  get("redLed").classList.toggle("active", !connected);

  get("statusBadge").className =
    "status-badge " + (connected ? "available" : "unavailable");

  get("statusText").textContent =
    connected ? "AVAILABLE" : "UNAVAILABLE";

  get("connectionMessage").textContent =
    connected ? "Connection established" : "Connection unavailable";

  get("connectionMessage").className =
    "connection-message " +
    (connected ? "is-available" : "is-unavailable");

  get("connectionDescription").textContent = connected
    ? "The target AWS instance is responding to ICMP requests."
    : "No successful ping response was received from the target instance.";
}

function showError() {
  get("greenLed").classList.remove("active");
  get("redLed").classList.remove("active");

  get("statusBadge").className = "status-badge checking";
  get("statusText").textContent = "MONITOR OFFLINE";

  get("connectionMessage").textContent =
    "Monitoring service unavailable";

  get("connectionMessage").className = "connection-message";

  get("connectionDescription").textContent =
    "Unable to contact the Flask monitoring API.";

  get("latency").textContent = "—";
  get("lastChecked").textContent = "—";
}

async function refreshStatus() {
  if (checking) return;

  checking = true;

  const button = get("refreshButton");
  button.disabled = true;

  try {
    const response = await fetch("/api/status", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Status API unavailable");
    }

    const data = await response.json();

    if (typeof data.connected !== "boolean") {
      throw new Error("Invalid API response");
    }

    updateLights(data.connected);
addRecord(data);
    get("targetIp").textContent =
      data.target_ip || "172.31.26.58";

    get("latency").textContent =
      typeof data.latency_ms === "number"
        ? data.latency_ms.toFixed(2) + " ms"
        : "N/A";

    const checkedDate = new Date(data.checked_at);

    get("lastChecked").textContent =
      Number.isNaN(checkedDate.getTime())
        ? "—"
        : checkedDate.toLocaleTimeString();

  } catch (error) {
    console.error("SignalLab error:", error);
    showError();

  } finally {
    checking = false;
    button.disabled = false;
  }
}

get("refreshButton").addEventListener("click", refreshStatus);

refreshStatus();

setInterval(refreshStatus, 3000);

const monitoringRecords = [];

function addRecord(data) {
  const now = new Date();

  const record = {
    time: now.toLocaleTimeString(),
    connected: data.connected === true,
    latency: typeof data.latency_ms === "number"
      ? data.latency_ms.toFixed(2) + " ms"
      : "N/A",
    target: data.target_ip || "—"
  };

  monitoringRecords.unshift(record);

  if (monitoringRecords.length > 20) {
    monitoringRecords.pop();
  }

  renderRecords();
}

function renderRecords() {
  const body = document.getElementById("recordsBody");

  if (!body) return;

  body.replaceChildren();

  if (monitoringRecords.length === 0) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.className = "empty-records";
    cell.textContent = "No records available.";
    return;
  }

  monitoringRecords.forEach(record => {
    const row = body.insertRow();

    row.insertCell().textContent = record.time;

    const status = row.insertCell();
    const label = document.createElement("span");

    label.className =
      "record-status " +
      (record.connected ? "connected" : "disconnected");

    label.textContent =
      record.connected ? "● CONNECTED" : "● DISCONNECTED";

    status.appendChild(label);

    row.insertCell().textContent = record.latency;
    row.insertCell().textContent = record.target;
  });
}

document.getElementById("clearRecords")
  ?.addEventListener("click", () => {
    monitoringRecords.length = 0;
    renderRecords();
  });
