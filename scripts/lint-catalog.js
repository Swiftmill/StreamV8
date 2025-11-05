#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const catalogDir = path.join(root, 'data', 'catalog');

const urlWhitelist = z
  .string()
  .url()
  .refine((value) => {
    const hostname = new URL(value).hostname;
    const allowed = ['localhost', '127.0.0.1', 'example.com', 'cdn.example.com', 'stream.mediacdn.local'];
    return allowed.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  }, 'URL domain is not allowed');

const subtitleSchema = z.object({
  language: z.string().min(2),
  url: urlWhitelist
});

const movieSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(10),
  year: z.number().int().min(1900),
  genres: z.array(z.string().min(1)).min(1),
  posterUrl: z.string().url(),
  backdropUrl: z.string().url(),
  streamUrl: urlWhitelist,
  duration: z.number().int().positive(),
  contentRating: z.string().min(1),
  published: z.boolean(),
  featured: z.boolean(),
  tags: z.array(z.string()),
  subtitles: z.array(subtitleSchema),
  categories: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  views: z.number().int().min(0)
});

const episodeSchema = z.object({
  episodeNumber: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(10),
  duration: z.number().int().positive(),
  streamUrl: urlWhitelist,
  subtitles: z.array(subtitleSchema),
  thumbnailUrl: z.string().url(),
  releasedAt: z.string().datetime(),
  published: z.boolean()
});

const seasonSchema = z.object({
  seasonNumber: z.number().int().min(1),
  title: z.string().min(1),
  synopsis: z.string().min(10),
  episodes: z.array(episodeSchema)
});

const seriesSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(10),
  year: z.number().int().min(1900),
  genres: z.array(z.string().min(1)).min(1),
  posterUrl: z.string().url(),
  backdropUrl: z.string().url(),
  featured: z.boolean(),
  published: z.boolean(),
  seasons: z.array(seasonSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string())
});

async function validateDirectory(dir, schema) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const payload = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
    schema.parse(payload);
  }
}

async function run() {
  await validateDirectory(path.join(catalogDir, 'movies'), movieSchema);
  await validateDirectory(path.join(catalogDir, 'series'), seriesSchema);
  console.log('Catalog validation successful.');
}

run().catch((error) => {
  console.error('Catalog validation failed:', error);
  process.exit(1);
});
