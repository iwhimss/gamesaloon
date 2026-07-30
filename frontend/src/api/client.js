const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? 'İstek başarısız');
  }

  return res.json();
}

export function guestLogin(name) {
  return request('/guest-login', { method: 'POST', body: { name } });
}

export function fetchTables(token) {
  return request('/tables', { token });
}

export function fetchGames() {
  return request('/games');
}

export { BACKEND_URL };
