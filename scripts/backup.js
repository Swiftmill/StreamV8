#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const backupDir = path.join(root, 'backups');

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

function timestamp() {
  const now = new Date();
  const pad = (value) => value.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

async function run() {
  await ensureDir(backupDir);
  const fileName = `backup-${timestamp()}.zip`;
  const destination = path.join(backupDir, fileName);
  await new Promise((resolve, reject) => {
    const child = spawn('zip', ['-r', destination, 'data'], {
      cwd: root,
      stdio: 'inherit'
    });
    child.on('exit', (code) => {
      if (code === 0) resolve(null);
      else reject(new Error(`zip command exited with code ${code}`));
    });
    child.on('error', reject);
  });
  console.log(`Backup created at ${destination}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
