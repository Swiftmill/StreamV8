import { cookies } from 'next/headers';

const API_BASE = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function apiGet<T>(path: string): Promise<T> {
  const cookieHeader = cookies().toString();
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    credentials: 'include',
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json();
}

export async function fetchMovie(id: string) {
  return apiGet<{ movie: any }>(`/api/catalog/movies/${id}`);
}

export async function fetchSeries(slug: string) {
  return apiGet<{ series: any }>(`/api/catalog/series/${slug}`);
}
