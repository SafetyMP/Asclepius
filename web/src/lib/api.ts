const API_BASE = "/api";

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; body?: unknown };

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem("asclepius_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const diagnostics =
        typeof body === "object" &&
        body &&
        "issue" in body &&
        Array.isArray((body as { issue: { diagnostics?: string }[] }).issue)
          ? (body as { issue: { diagnostics?: string }[] }).issue[0]?.diagnostics
          : res.statusText;
      return { ok: false, error: diagnostics ?? res.statusText, status: res.status, body };
    }
    return { ok: true, data: body as T, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error", status: 0 };
  }
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem("asclepius_token", token);
  else sessionStorage.removeItem("asclepius_token");
}

export async function issueDevToken(body: { sub: string; scopes: string; role?: string }) {
  return request<{ access_token: string; expires_in: number; scope: string }>("/auth/token", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function searchPatients(name?: string) {
  const qs = name ? `?name=${encodeURIComponent(name)}` : "";
  return request<Record<string, unknown>>(`/Patient${qs}`);
}

export async function readPatient(id: string) {
  return request<Record<string, unknown>>(`/Patient/${encodeURIComponent(id)}`);
}

export async function checkInteractions(payload: Record<string, unknown>) {
  return request<Record<string, unknown>>("/MedicationRequest/$check-interactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function invokeCds(serviceId: string, payload: Record<string, unknown>) {
  return request<Record<string, unknown>>(`/cds-services/${encodeURIComponent(serviceId)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateResource(type: string, payload: Record<string, unknown>) {
  return request<Record<string, unknown>>(`/${encodeURIComponent(type)}/$validate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
