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

export interface CatalogMovieSummary {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  featured: boolean;
  categories: string[];
  description: string;
  tags: string[];
  year: number;
  contentRating: string;
}

export interface CatalogSeriesSummary {
  slug: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  featured: boolean;
  description: string;
  genres: string[];
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  order: number;
  heroId?: string;
}

export interface HistoryEntry {
  contentId: string;
  type: 'movie' | 'series';
  progress: number;
  lastWatched: string;
  season?: number;
  episode?: number;
}

export async function fetchHomeData() {
  const [{ movies }, { series }, { categories }, history] = await Promise.all([
    apiGet<{ movies: CatalogMovieSummary[] }>('/api/catalog/movies'),
    apiGet<{ series: CatalogSeriesSummary[] }>('/api/catalog/series'),
    apiGet<{ categories: CategoryRow[] }>('/api/catalog/categories'),
    apiGet<{ history: HistoryEntry[] }>('/api/history').catch(() => ({ history: [] }))
  ]);
  return { movies, series, categories, history: history.history };
}
