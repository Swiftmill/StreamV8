import { z } from 'zod';
import { ALLOWED_VIDEO_DOMAINS } from './paths.js';

const urlWhitelist = z
  .string()
  .url()
  .refine((value) => {
    const hostname = new URL(value).hostname;
    return ALLOWED_VIDEO_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  }, 'URL domain is not allowed');

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8)
});

export const csrfTokenSchema = z.object({
  csrfToken: z.string().min(32)
});

export const subtitleSchema = z.object({
  language: z.string().min(2),
  url: urlWhitelist
});

export const baseContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  genres: z.array(z.string().min(2)).min(1),
  posterUrl: z.string().url(),
  backdropUrl: z.string().url(),
  streamUrl: urlWhitelist,
  duration: z.number().int().min(1),
  contentRating: z.string().min(1),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  subtitles: z.array(subtitleSchema).default([])
});

export const movieUpsertSchema = baseContentSchema.extend({
  id: z.string().min(1).optional(),
  categories: z.array(z.string().min(1)).default([])
});

export const movieSchema = movieUpsertSchema.extend({
  id: z.string().min(1),
  categories: z.array(z.string().min(1)).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  views: z.number().int().min(0).default(0)
});

export const episodeSchema = z.object({
  episodeNumber: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(10),
  duration: z.number().int().min(1),
  streamUrl: urlWhitelist,
  subtitles: z.array(subtitleSchema).default([]),
  thumbnailUrl: z.string().url(),
  releasedAt: z.string().datetime(),
  published: z.boolean().default(true)
});

export const episodeUpsertSchema = episodeSchema.extend({
  episodeNumber: z.number().int().min(1)
});

export const seasonSchema = z.object({
  seasonNumber: z.number().int().min(1),
  title: z.string().min(1),
  synopsis: z.string().min(10),
  episodes: z.array(episodeSchema).default([])
});

export const seasonUpsertSchema = z.object({
  seasonNumber: z.number().int().min(1),
  title: z.string().min(1),
  synopsis: z.string().min(10),
  episodes: z.array(episodeUpsertSchema).default([])
});

export const seriesUpsertSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(10),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  genres: z.array(z.string().min(2)).min(1),
  posterUrl: z.string().url(),
  backdropUrl: z.string().url(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  seasons: z.array(seasonUpsertSchema).default([]),
  tags: z.array(z.string()).default([])
});

export const seriesSchema = seriesUpsertSchema.extend({
  slug: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().min(1),
  order: z.number().int().min(0),
  heroId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const categoryUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(1).optional(),
  order: z.number().int().min(0),
  heroId: z.string().optional()
});

export const userSchema = z.object({
  username: z.string().min(3),
  passwordHash: z.string().min(20),
  role: z.enum(['admin', 'user']),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  forcePasswordReset: z.boolean().default(false)
});

export const userCreateSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(12),
  role: z.enum(['admin', 'user'])
});

export const userUpdateSchema = z.object({
  password: z.string().min(12).optional(),
  active: z.boolean().optional(),
  forcePasswordReset: z.boolean().optional(),
  role: z.enum(['admin', 'user']).optional()
});

export const historyEntrySchema = z.object({
  contentId: z.string().min(1),
  type: z.enum(['movie', 'series']),
  progress: z.number().min(0).max(1),
  lastWatched: z.string().datetime(),
  season: z.number().int().min(1).optional(),
  episode: z.number().int().min(1).optional()
});

export const settingsSchema = z.object({
  featuredIds: z.array(z.string()).default([]),
  heroBanner: z.string().optional(),
  maintenanceMode: z.boolean().default(false)
});

export type LoginPayload = z.infer<typeof loginSchema>;
export type Movie = z.infer<typeof movieSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type UserRecord = z.infer<typeof userSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type MovieInput = z.infer<typeof movieUpsertSchema>;
export type SeriesInput = z.infer<typeof seriesUpsertSchema>;
export type CategoryInput = z.infer<typeof categoryUpsertSchema>;
export type EpisodeInput = z.infer<typeof episodeUpsertSchema>;
