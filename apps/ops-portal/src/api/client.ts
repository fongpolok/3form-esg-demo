const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const TOKEN_STORAGE_KEY = 'esg.ops.accessToken';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage can throw in a private-browsing/storage-blocked context —
    // the session just won't persist across a reload, which is an
    // acceptable degradation rather than a crash.
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

// Every route in this app is behind auth except /auth/login itself, so a
// single fetch wrapper attaching the bearer token (when present) covers
// the whole app rather than repeating the header at every call site.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.code ?? body?.message ?? 'UNKNOWN_ERROR';
    throw new ApiError(response.status, code, body?.message);
  }
  return body as T;
}
