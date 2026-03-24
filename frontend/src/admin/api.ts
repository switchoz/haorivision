const API = import.meta.env.VITE_API_URL || "";

export async function adminLogin(email: string, password: string) {
  const r = await fetch(`${API}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

export function setToken(t: string) {
  localStorage.setItem("admin_jwt", t);
}

export function getToken() {
  return localStorage.getItem("admin_jwt");
}

export async function api(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = {
    ...(init.headers || {}),
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
  const r = await fetch(`${API}${path}`, { ...init, headers });
  if (r.status === 401) {
    localStorage.removeItem("admin_jwt");
    throw new Error("UNAUTH");
  }
  return r.json();
}

export function getRole(): "admin" | "editor" | "viewer" | null {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload?.role || null;
  } catch {
    return null;
  }
}
