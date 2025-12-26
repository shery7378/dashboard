import { getSession } from "next-auth/react";
export const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const session = await getSession();
  const token =
    (session as any)?.accessAuthToken ||
    (typeof window !== "undefined"
      ? (localStorage.getItem("token") || localStorage.getItem("auth_token"))
      : null);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    credentials: token ? "omit" : "include",
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        msg = (data && (data.message || data.error)) || msg;
      } else {
        const text = await res.text();
        msg = text || msg;
      }
    } catch {}
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}
