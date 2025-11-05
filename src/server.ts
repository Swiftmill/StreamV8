import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import next from 'next';
import dayjs from 'dayjs';
import {
  loginSchema,
  movieUpsertSchema,
  seriesUpsertSchema,
  categoryUpsertSchema,
  userCreateSchema,
  userUpdateSchema,
  historyEntrySchema,
  episodeUpsertSchema,
  type Category,
  type CategoryInput
} from './lib/validation.js';
import type { SafeParseSuccess } from 'zod';
import { verifyPassword, hashPassword } from './lib/password.js';
import { findUser, getAllUsers, upsertUser, deleteUser } from './lib/users.js';
import { auditLog } from './lib/audit.js';
import { createSession, serializeSessionCookie, invalidateSession } from './lib/session.js';
import { sessionMiddleware, requireAuth, requireRole, requireCsrf, AuthedRequest } from './middleware/auth.js';
import { adminRateLimiter } from './middleware/rateLimit.js';
import {
  listMovies,
  getMovie,
  saveMovie,
  deleteMovie,
  listSeries,
  getSeries,
  saveSeries,
  deleteSeries,
  saveCategories,
  listCategories,
  slugForSeries,
  upsertSeriesEpisode
} from './lib/catalog.js';
import { clearHistory, getHistory, upsertHistoryEntry } from './lib/history.js';
import { ensureDir } from './lib/fileStore.js';
import { DATA_ROOT } from './lib/paths.js';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

function buildCorsOptions() {
  const originEnv = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
  return {
    origin: [originEnv],
    credentials: true
  };
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

async function bootstrap(): Promise<void> {
  await ensureDir(DATA_ROOT);
  await nextApp.prepare();

  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(sessionMiddleware);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/auth/session', (req: AuthedRequest, res) => {
    if (!req.session) {
      res.json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      user: {
        username: req.session.username,
        role: req.session.role
      },
      csrfToken: req.session.csrfToken
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    const { username, password } = parsed.data;
    const user = await findUser(username);
    if (!user || !user.active) {
      await auditLog(username, 'LOGIN', 'user', { success: false, reason: 'invalid credentials' });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await auditLog(username, 'LOGIN', 'user', { success: false, reason: 'invalid credentials' });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const session = await createSession(user.username, user.role);
    res.setHeader('Set-Cookie', serializeSessionCookie(session.id));
    await auditLog(user.username, 'LOGIN', 'user', { success: true });
    res.json({
      user: {
        username: user.username,
        role: user.role
      },
      csrfToken: session.csrfToken
    });
  });

  app.post('/api/auth/logout', requireAuth, requireCsrf, async (req: AuthedRequest, res) => {
    if (req.session) {
      await invalidateSession(req.session.id);
      await auditLog(req.session.username, 'LOGOUT', 'user', {});
    }
    res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict');
    res.status(204).end();
  });

  app.get('/api/catalog/movies', requireAuth, async (_req, res) => {
    const movies = await listMovies();
    res.json({ movies });
  });

  app.get('/api/catalog/movies/:id', requireAuth, async (req, res) => {
    const movie = await getMovie(req.params.id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json({ movie });
  });

  app.post('/api/catalog/movies', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = movieUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    try {
      const movie = await saveMovie({
        ...parsed.data,
        id: parsed.data.id ?? `${Date.now()}`
      });
      await auditLog(req.session!.username, 'CREATE_MOVIE', movie.id, { title: movie.title });
      res.status(201).json({ movie });
    } catch (error) {
      res.status(500).json({ error: sanitizeError(error) });
    }
  });

  app.put('/api/catalog/movies/:id', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = movieUpsertSchema.safeParse({ ...req.body, id: req.params.id });
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    try {
      const existing = await getMovie(req.params.id);
      const movie = await saveMovie({
        ...parsed.data,
        id: req.params.id,
        views: existing?.views ?? 0
      });
      await auditLog(req.session!.username, 'UPDATE_MOVIE', movie.id, { title: movie.title });
      res.json({ movie });
    } catch (error) {
      res.status(500).json({ error: sanitizeError(error) });
    }
  });

  app.delete('/api/catalog/movies/:id', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    await deleteMovie(req.params.id);
    await auditLog(req.session!.username, 'DELETE_MOVIE', req.params.id, {});
    res.status(204).end();
  });

  app.get('/api/catalog/series', requireAuth, async (_req, res) => {
    const series = await listSeries();
    res.json({ series });
  });

  app.get('/api/catalog/series/:slug', requireAuth, async (req, res) => {
    const series = await getSeries(req.params.slug);
    if (!series) {
      res.status(404).json({ error: 'Series not found' });
      return;
    }
    res.json({ series });
  });

  app.post('/api/catalog/series', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = seriesUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    const slug = parsed.data.slug ?? slugForSeries(parsed.data.title);
    const existing = await getSeries(slug);
    if (existing) {
      res.status(409).json({ error: 'Series already exists' });
      return;
    }
    const now = dayjs().toISOString();
    const series = await saveSeries({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      year: parsed.data.year,
      genres: parsed.data.genres,
      posterUrl: parsed.data.posterUrl,
      backdropUrl: parsed.data.backdropUrl,
      featured: parsed.data.featured ?? false,
      published: parsed.data.published ?? false,
      seasons: parsed.data.seasons.map((season) => ({
        seasonNumber: season.seasonNumber,
        title: season.title,
        synopsis: season.synopsis,
        episodes: season.episodes.map((episode) => episode)
      })),
      createdAt: now,
      updatedAt: now,
      tags: parsed.data.tags ?? []
    });
    await auditLog(req.session!.username, 'CREATE_SERIES', series.slug, { title: series.title });
    res.status(201).json({ series });
  });

  app.put('/api/catalog/series/:slug', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = seriesUpsertSchema.safeParse({ ...req.body, slug: req.params.slug });
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    const existing = await getSeries(req.params.slug);
    if (!existing) {
      res.status(404).json({ error: 'Series not found' });
      return;
    }
    const now = dayjs().toISOString();
    const series = await saveSeries({
      slug: req.params.slug,
      title: parsed.data.title,
      description: parsed.data.description,
      year: parsed.data.year,
      genres: parsed.data.genres,
      posterUrl: parsed.data.posterUrl,
      backdropUrl: parsed.data.backdropUrl,
      featured: parsed.data.featured ?? existing.featured,
      published: parsed.data.published ?? existing.published,
      seasons: parsed.data.seasons.map((season) => ({
        seasonNumber: season.seasonNumber,
        title: season.title,
        synopsis: season.synopsis,
        episodes: season.episodes.map((episode) => episode)
      })),
      createdAt: existing.createdAt,
      updatedAt: now,
      tags: parsed.data.tags ?? existing.tags
    });
    await auditLog(req.session!.username, 'UPDATE_SERIES', series.slug, { title: series.title });
    res.json({ series });
  });

  app.delete('/api/catalog/series/:slug', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    await deleteSeries(req.params.slug);
    await auditLog(req.session!.username, 'DELETE_SERIES', req.params.slug, {});
    res.status(204).end();
  });

  app.post('/api/catalog/series/:slug/seasons/:season/episodes', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const episodeParsed = episodeUpsertSchema.safeParse(req.body);
    if (!episodeParsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: episodeParsed.error.flatten() });
      return;
    }
    const existing = await getSeries(req.params.slug);
    if (!existing) {
      res.status(404).json({ error: 'Series not found' });
      return;
    }
    const seasonNumber = Number.parseInt(req.params.season, 10);
    if (Number.isNaN(seasonNumber) || seasonNumber < 1) {
      res.status(400).json({ error: 'Invalid season number' });
      return;
    }
    const series = await upsertSeriesEpisode({
      seriesTitle: existing.title,
      slug: existing.slug,
      series: {
        title: existing.title,
        description: existing.description,
        year: existing.year,
        genres: existing.genres,
        posterUrl: existing.posterUrl,
        backdropUrl: existing.backdropUrl,
        featured: existing.featured,
        published: existing.published,
        seasons: existing.seasons,
        tags: existing.tags
      },
      seasonNumber,
      episode: episodeParsed.data
    });
    await auditLog(req.session!.username, 'UPDATE_SERIES', series.slug, {
      episode: episodeParsed.data.episodeNumber,
      season: seasonNumber
    });
    res.json({ series });
  });

  app.get('/api/catalog/categories', requireAuth, async (_req, res) => {
    const categories = await listCategories();
    res.json({ categories });
  });

  app.put('/api/catalog/categories', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const payload = Array.isArray(req.body) ? req.body : [];
    const parsed = payload.map((category) => categoryUpsertSchema.safeParse(category));
    const errors = parsed.filter((item) => !item.success);
    if (errors.length > 0) {
      res.status(400).json({ error: 'Invalid payload', details: errors.map((error) => error.error.flatten()) });
      return;
    }
    const now = dayjs().toISOString();
    const successes = parsed.filter((result): result is SafeParseSuccess<CategoryInput> => result.success);
    const categories: Category[] = successes.map((result, index) => {
      const data = result.data;
      return {
        id: data.id ?? `${index}-${now}`,
        name: data.name,
        slug: data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-'),
        order: data.order,
        heroId: data.heroId,
        createdAt: now,
        updatedAt: now
      } satisfies Category;
    });
    await saveCategories(categories);
    await auditLog(req.session!.username, 'UPDATE_CATEGORY', 'bulk', { count: categories.length });
    res.json({ categories });
  });

  app.get('/api/users', adminRateLimiter, requireRole('admin'), async (_req: AuthedRequest, res) => {
    const users = await getAllUsers();
    res.json({ users });
  });

  app.post('/api/users', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = userCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    const existing = await findUser(parsed.data.username);
    if (existing) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const now = dayjs().toISOString();
    const record = {
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role,
      active: true,
      createdAt: now,
      updatedAt: now,
      forcePasswordReset: false
    };
    await upsertUser(record);
    await auditLog(req.session!.username, 'CREATE_USER', record.username, { role: record.role });
    res.status(201).json({ user: record });
  });

  app.patch('/api/users/:username', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    const user = await findUser(req.params.username);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const passwordHash = parsed.data.password ? await hashPassword(parsed.data.password) : user.passwordHash;
    const now = dayjs().toISOString();
    const updated = {
      ...user,
      passwordHash,
      active: parsed.data.active ?? user.active,
      forcePasswordReset: parsed.data.forcePasswordReset ?? user.forcePasswordReset,
      role: parsed.data.role ?? user.role,
      updatedAt: now
    };
    await upsertUser(updated);
    await auditLog(req.session!.username, 'UPDATE_USER', updated.username, { fields: Object.keys(parsed.data) });
    res.json({ user: updated });
  });

  app.delete('/api/users/:username', adminRateLimiter, requireRole('admin'), requireCsrf, async (req: AuthedRequest, res) => {
    await deleteUser(req.params.username);
    await auditLog(req.session!.username, 'DISABLE_USER', req.params.username, {});
    res.status(204).end();
  });

  app.get('/api/history', requireAuth, async (req: AuthedRequest, res) => {
    const history = await getHistory(req.session!.username);
    res.json({ history });
  });

  app.post('/api/history', requireAuth, requireCsrf, async (req: AuthedRequest, res) => {
    const parsed = historyEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    await upsertHistoryEntry(req.session!.username, parsed.data);
    res.status(201).json({ history: await getHistory(req.session!.username) });
  });

  app.delete('/api/history', requireAuth, requireCsrf, async (req: AuthedRequest, res) => {
    await clearHistory(req.session!.username);
    res.status(204).end();
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.all('*', (req, res) => nextHandler(req, res));

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Server ready on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
