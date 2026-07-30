const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';

export async function guestLogin(name) {
  const res = await fetch(`${BACKEND_URL}/guest-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Giriş başarısız');
  }

  return res.json();
}

export { BACKEND_URL };
