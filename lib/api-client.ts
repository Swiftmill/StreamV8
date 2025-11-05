const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiFetchOptions extends RequestInit {
  method?: HttpMethod;
  cookies?: string;
  csrfToken?: string;
}

async function buildHeaders(options: ApiFetchOptions): Promise<HeadersInit> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.csrfToken) {
    headers.set('x-csrf-token', options.csrfToken);
  }
  return headers;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = await buildHeaders(options);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error ?? response.statusText);
  }
  return response.json() as Promise<T>;
}

export async function getSession(): Promise<{
  authenticated: boolean;
  user?: { username: string; role: 'admin' | 'user' };
  csrfToken?: string;
}> {
  return apiFetch('/api/auth/session', { method: 'GET' });
}
