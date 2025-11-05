import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function boot() {
  const distPath = path.join(__dirname, 'dist', 'server.js');
  try {
    await import(distPath);
  } catch (error) {
    console.error('Cannot find compiled server at dist/server.js. Run "npm run build:server" first.');
    throw error;
  }
}

boot().catch((error) => {
  console.error(error);
  process.exit(1);
});
