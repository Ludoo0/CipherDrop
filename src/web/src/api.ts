export type User = { username: string; isAdmin: boolean };
export type SecretSummary = { id: string; opens: number; burnsAfterXOpens: number; hasFile: boolean };

type ApiError = { error?: string; details?: unknown };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(`/api${path}`, {
        ...init,
        credentials: "same-origin",
        headers,
    });

    const payload = await response.json().catch(() => null) as (T & ApiError) | null;
    if (!response.ok) {
        throw new Error(payload?.error || `Anfrage fehlgeschlagen (${response.status})`);
    }
    return payload as T;
}
