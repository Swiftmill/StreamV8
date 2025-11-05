#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');

const adminUser = {
  username: 'admin',
  passwordHash: '$2y$12$rFW2uoqoKgxT0EKyDA2lXOBvlNHYbtPb/XnbiV7hIUmVqPNRjpZ1q',
  role: 'admin',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  forcePasswordReset: false
};

const defaultUser = {
  username: 'jdoe',
  passwordHash: '$2y$12$q1kaybsYibgUTtgjNDRWiO2rZwk0ZLK/paIU79yIDO2E5sx.eZjGK',
  role: 'user',
  active: true,
  createdAt: '2024-01-05T12:00:00.000Z',
  updatedAt: '2024-01-05T12:00:00.000Z',
  forcePasswordReset: false
};

const categories = [
  {
    id: 'sci-fi',
    name: 'Science Fiction',
    slug: 'sci-fi',
    order: 1,
    heroId: 'aurora-rising',
    createdAt: '2024-02-10T09:00:00.000Z',
    updatedAt: '2024-02-10T09:00:00.000Z'
  },
  {
    id: 'trending',
    name: 'Trending Now',
    slug: 'trending',
    order: 2,
    heroId: 'solstice-chronicles',
    createdAt: '2024-02-10T09:05:00.000Z',
    updatedAt: '2024-02-10T09:05:00.000Z'
  },
  {
    id: 'action',
    name: 'Action',
    slug: 'action',
    order: 3,
    heroId: 'iron-legacy',
    createdAt: '2024-02-10T09:10:00.000Z',
    updatedAt: '2024-02-10T09:10:00.000Z'
  }
];

const movies = [
  {
    id: 'aurora-rising',
    title: 'Aurora Rising',
    description: "A brilliant astrophysicist discovers a cosmic anomaly that could rewrite humanity's future, but shadowy forces race to control it.",
    year: 2023,
    genres: ['Science Fiction', 'Thriller'],
    posterUrl: 'https://cdn.example.com/images/aurora-rising/poster.jpg',
    backdropUrl: 'https://cdn.example.com/images/aurora-rising/backdrop.jpg',
    streamUrl: 'https://cdn.example.com/videos/aurora-rising/master.m3u8',
    duration: 7260,
    contentRating: 'PG-13',
    published: true,
    featured: true,
    tags: ['space', 'mystery'],
    subtitles: [
      { language: 'en', url: 'https://cdn.example.com/subtitles/aurora-rising/en.vtt' },
      { language: 'fr', url: 'https://cdn.example.com/subtitles/aurora-rising/fr.vtt' }
    ],
    categories: ['sci-fi', 'trending'],
    createdAt: '2024-02-10T09:00:00.000Z',
    updatedAt: '2024-02-10T09:00:00.000Z',
    views: 0
  },
  {
    id: 'iron-legacy',
    title: 'Iron Legacy',
    description: "A retired detective returns to the force when a string of high-tech heists reveals a conspiracy that reaches the city's elite.",
    year: 2022,
    genres: ['Action', 'Crime'],
    posterUrl: 'https://cdn.example.com/images/iron-legacy/poster.jpg',
    backdropUrl: 'https://cdn.example.com/images/iron-legacy/backdrop.jpg',
    streamUrl: 'https://cdn.example.com/videos/iron-legacy/master.m3u8',
    duration: 6780,
    contentRating: 'R',
    published: true,
    featured: false,
    tags: ['heist', 'neo-noir'],
    subtitles: [{ language: 'en', url: 'https://cdn.example.com/subtitles/iron-legacy/en.vtt' }],
    categories: ['action', 'popular'],
    createdAt: '2024-02-08T10:00:00.000Z',
    updatedAt: '2024-02-08T10:00:00.000Z',
    views: 0
  }
];

const series = [
  {
    slug: 'solstice-chronicles',
    title: 'Solstice Chronicles',
    description: 'An investigative journalist uncovers a clandestine program that manipulates the weather, sparking a global chase for the truth.',
    year: 2024,
    genres: ['Drama', 'Thriller'],
    posterUrl: 'https://cdn.example.com/images/solstice-chronicles/poster.jpg',
    backdropUrl: 'https://cdn.example.com/images/solstice-chronicles/backdrop.jpg',
    featured: true,
    published: true,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        synopsis: 'The conspiracy begins to unravel as whistleblowers risk everything.',
        episodes: [
          {
            episodeNumber: 1,
            title: 'Signal',
            description: 'A mysterious data leak points Elise toward an abandoned weather station.',
            duration: 3600,
            streamUrl: 'https://cdn.example.com/videos/solstice-chronicles/s1e1/master.m3u8',
            subtitles: [{ language: 'en', url: 'https://cdn.example.com/subtitles/solstice-chronicles/s1e1/en.vtt' }],
            thumbnailUrl: 'https://cdn.example.com/images/solstice-chronicles/s1e1.jpg',
            releasedAt: '2024-01-12T08:00:00.000Z',
            published: true
          },
          {
            episodeNumber: 2,
            title: 'Interference',
            description: 'Elise partners with a climate scientist to decode encrypted files.',
            duration: 3680,
            streamUrl: 'https://cdn.example.com/videos/solstice-chronicles/s1e2/master.m3u8',
            subtitles: [{ language: 'en', url: 'https://cdn.example.com/subtitles/solstice-chronicles/s1e2/en.vtt' }],
            thumbnailUrl: 'https://cdn.example.com/images/solstice-chronicles/s1e2.jpg',
            releasedAt: '2024-01-19T08:00:00.000Z',
            published: true
          }
        ]
      }
    ],
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T10:00:00.000Z',
    tags: ['conspiracy', 'climate']
  }
];

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function writeJson(file, payload) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function run() {
  await ensureDir(dataDir);
  await writeJson(path.join(dataDir, 'users', 'admin.json'), { users: [adminUser] });
  await writeJson(path.join(dataDir, 'users', 'users.json'), { users: [defaultUser] });
  await writeJson(path.join(dataDir, 'sessions.json'), { sessions: [] });
  await writeJson(path.join(dataDir, 'catalog', 'categories.json'), categories);
  for (const movie of movies) {
    await writeJson(path.join(dataDir, 'catalog', 'movies', `${movie.id}.json`), movie);
  }
  for (const serie of series) {
    await writeJson(path.join(dataDir, 'catalog', 'series', `${serie.slug}.json`), serie);
  }
  console.log('Seed data ready.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
