import { cookies } from 'next/headers';

const API_BASE = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type SessionResponse = {
  authenticated: boolean;
  user?: { username: string; role: 'admin' | 'user' };
  csrfToken?: string;
};

export async function fetchInitialSession(): Promise<SessionResponse> {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();
  const response = await fetch(`${API_BASE}/api/auth/session`, {
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    credentials: 'include',
    cache: 'no-store'
  });
  if (!response.ok) {
    return { authenticated: false };
  }
  return response.json();
}
