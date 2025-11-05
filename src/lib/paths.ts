import path from 'node:path';

export const DATA_ROOT = path.resolve(process.cwd(), 'data');
export const USERS_ROOT = path.join(DATA_ROOT, 'users');
export const CATALOG_ROOT = path.join(DATA_ROOT, 'catalog');
export const MOVIES_ROOT = path.join(CATALOG_ROOT, 'movies');
export const SERIES_ROOT = path.join(CATALOG_ROOT, 'series');
export const HISTORY_ROOT = path.join(USERS_ROOT, 'history');
export const AUDIT_LOG_PATH = path.join(DATA_ROOT, 'audit.log');
export const CATEGORIES_PATH = path.join(CATALOG_ROOT, 'categories.json');
export const SETTINGS_PATH = path.join(DATA_ROOT, 'settings.json');
export const SESSION_STORE_PATH = path.join(DATA_ROOT, 'sessions.json');
export const USERS_DB_PATH = path.join(USERS_ROOT, 'users.json');
export const ADMIN_DB_PATH = path.join(USERS_ROOT, 'admin.json');

export const ALLOWED_VIDEO_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'example.com',
  'cdn.example.com',
  'stream.mediacdn.local'
];
