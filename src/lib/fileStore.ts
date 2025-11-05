import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import lockfile from 'proper-lockfile';

export async function ensureDir(dirPath: string): Promise<void> {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function prepareLockFile(targetPath: string): Promise<string> {
  const lockPath = `${targetPath}.lock`;
  await ensureDir(path.dirname(lockPath));
  await fsp.open(lockPath, 'a').then(file => file.close());
  return lockPath;
}

export async function withFileLock<T>(targetPath: string, fn: () => Promise<T>): Promise<T> {
  const lockPath = await prepareLockFile(targetPath);
  const release = await lockfile.lock(lockPath, {
    retries: {
      retries: 5,
      factor: 2,
      minTimeout: 50,
      maxTimeout: 200
    },
    realpath: false,
    stale: 5000
  });
  try {
    return await fn();
  } finally {
    await release();
  }
}

export async function readJSONFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

export async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await withFileLock(filePath, async () => {
    await fsp.writeFile(tmpPath, payload, 'utf8');
    await fsp.rename(tmpPath, filePath);
  });
}

export async function appendLine(filePath: string, line: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await withFileLock(filePath, async () => {
    await fsp.appendFile(filePath, `${line}\n`, 'utf8');
  });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function removeFile(filePath: string): Promise<void> {
  try {
    await fsp.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
