import fs from 'node:fs/promises';
import path from 'node:path';
import dayjs from 'dayjs';
import slugify from 'slugify';
import { v4 as uuid } from 'uuid';
import { ZodSchema } from 'zod';
import { MOVIES_ROOT, SERIES_ROOT, CATEGORIES_PATH } from './paths.js';
import { ensureDir, writeJSONFile, fileExists, removeFile } from './fileStore.js';
import {
  movieSchema,
  seriesSchema,
  seasonSchema,
  episodeSchema,
  categorySchema,
  type Movie,
  type Series,
  type Category,
  type Season,
  type Episode
} from './validation.js';

async function readDirectoryJSON<T>(directory: string, schema: ZodSchema<T>): Promise<T[]> {
  await ensureDir(directory);
  const files = await fs.readdir(directory);
  const items: T[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(directory, file);
    try {
      const raw = await fs.readFile(fullPath, 'utf8');
      const payload = JSON.parse(raw);
      const parsed = schema.safeParse(payload);
      if (parsed.success) {
        items.push(parsed.data);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return items;
}

export async function listMovies(): Promise<Movie[]> {
  return readDirectoryJSON<Movie>(MOVIES_ROOT, movieSchema);
}

export async function getMovie(id: string): Promise<Movie | null> {
  const file = path.join(MOVIES_ROOT, `${id}.json`);
  if (!(await fileExists(file))) return null;
  const raw = await fs.readFile(file, 'utf8');
  const parsed = movieSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export async function saveMovie(
  payload: Omit<Movie, 'createdAt' | 'updatedAt' | 'views'> & { views?: number }
): Promise<Movie> {
  await ensureDir(MOVIES_ROOT);
  const now = dayjs().toISOString();
  const id = payload.id ?? uuid();
  const existing = await getMovie(id);
  const movie: Movie = movieSchema.parse({
    ...payload,
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    views: existing?.views ?? payload.views ?? 0
  });
  await writeJSONFile(path.join(MOVIES_ROOT, `${id}.json`), movie);
  return movie;
}

export async function deleteMovie(id: string): Promise<void> {
  const file = path.join(MOVIES_ROOT, `${id}.json`);
  await removeFile(file);
}

function sortSeasons(seasons: Season[]): Season[] {
  return [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
}

function sortEpisodes(episodes: Episode[]): Episode[] {
  return [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
}

export function slugForSeries(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export async function getSeries(slug: string): Promise<Series | null> {
  const file = path.join(SERIES_ROOT, `${slug}.json`);
  if (!(await fileExists(file))) return null;
  const raw = await fs.readFile(file, 'utf8');
  const parsed = seriesSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export async function listSeries(): Promise<Series[]> {
  return readDirectoryJSON<Series>(SERIES_ROOT, seriesSchema);
}

export interface UpsertEpisodeInput {
  seriesTitle: string;
  slug?: string;
  series: Omit<Series, 'slug' | 'createdAt' | 'updatedAt'> & { slug?: string };
  seasonNumber: number;
  episode: Episode;
}

export async function upsertSeriesEpisode(input: UpsertEpisodeInput): Promise<Series> {
  const slug = input.slug ?? slugForSeries(input.seriesTitle);
  const existing = await getSeries(slug);
  const now = dayjs().toISOString();
  let seasons: Season[] = existing?.seasons ?? [];
  const targetSeasonIndex = seasons.findIndex((season) => season.seasonNumber === input.seasonNumber);
  if (targetSeasonIndex >= 0) {
    const season = seasons[targetSeasonIndex];
    const episodes = season.episodes.filter((ep) => ep.episodeNumber !== input.episode.episodeNumber);
    episodes.push(input.episode);
    seasons[targetSeasonIndex] = seasonSchema.parse({
      ...season,
      episodes: sortEpisodes(episodes)
    });
  } else {
    const baseSeason = input.series.seasons.find((s) => s.seasonNumber === input.seasonNumber);
    const newSeason = seasonSchema.parse({
      seasonNumber: input.seasonNumber,
      title: baseSeason?.title ?? `Season ${input.seasonNumber}`,
      synopsis: baseSeason?.synopsis ?? input.series.description,
      episodes: sortEpisodes([input.episode])
    });
    seasons = [...seasons, newSeason];
  }
  seasons = sortSeasons(seasons);
  const seriesPayload: Series = seriesSchema.parse({
    slug,
    title: input.series.title ?? input.seriesTitle,
    description: input.series.description,
    year: input.series.year,
    genres: input.series.genres,
    posterUrl: input.series.posterUrl,
    backdropUrl: input.series.backdropUrl,
    featured: input.series.featured ?? false,
    published: input.series.published ?? false,
    seasons,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    tags: input.series.tags ?? []
  });
  await ensureDir(SERIES_ROOT);
  await writeJSONFile(path.join(SERIES_ROOT, `${slug}.json`), seriesPayload);
  return seriesPayload;
}

export async function saveSeries(series: Series): Promise<Series> {
  const now = dayjs().toISOString();
  const payload = seriesSchema.parse({
    ...series,
    createdAt: series.createdAt ?? now,
    updatedAt: now,
    seasons: sortSeasons(series.seasons).map((season) => ({
      ...season,
      episodes: sortEpisodes(season.episodes)
    }))
  });
  await ensureDir(SERIES_ROOT);
  await writeJSONFile(path.join(SERIES_ROOT, `${payload.slug}.json`), payload);
  return payload;
}

export async function deleteSeries(slug: string): Promise<void> {
  await removeFile(path.join(SERIES_ROOT, `${slug}.json`));
}

export async function listCategories(): Promise<Category[]> {
  const raw = await fs.readFile(CATEGORIES_PATH, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return '[]';
    }
    throw error;
  });
  const parsed = JSON.parse(raw) as unknown[];
  return parsed
    .map((category) => categorySchema.parse(category))
    .sort((a, b) => a.order - b.order);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  const payload = categories
    .map((category) => categorySchema.parse(category))
    .sort((a, b) => a.order - b.order);
  await writeJSONFile(CATEGORIES_PATH, payload);
}
