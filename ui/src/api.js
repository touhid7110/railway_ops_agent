const BASE = '/api';

async function json(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const fetchStats = () =>
  fetch(`${BASE}/stats`).then(json);

export const fetchJobs = () =>
  fetch(`${BASE}/jobs`).then(json);

export const fetchJob = (id) =>
  fetch(`${BASE}/jobs/${id}`).then(json);

export const createJob = (body) =>
  fetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json);

export const submitOtp = (jobId, otp) =>
  fetch(`${BASE}/jobs/${jobId}/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp }),
  }).then(json);

export const fetchSettings = () =>
  fetch(`${BASE}/settings`).then(json);

export const saveSettings = (body) =>
  fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json);

export const fetchPassengers = () =>
  fetch(`${BASE}/passengers`).then(json);

export const addPassenger = (body) =>
  fetch(`${BASE}/passengers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json);

export const deletePassenger = (id) =>
  fetch(`${BASE}/passengers/${id}`, { method: 'DELETE' });
