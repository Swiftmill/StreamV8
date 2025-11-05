import path from 'node:path';
import dayjs from 'dayjs';
import { HISTORY_ROOT } from './paths.js';
import { ensureDir, readJSONFile, writeJSONFile } from './fileStore.js';
import { historyEntrySchema, type HistoryEntry } from './validation.js';

async function historyFile(username: string): Promise<string> {
  await ensureDir(HISTORY_ROOT);
  return path.join(HISTORY_ROOT, `${username}.json`);
}

export async function getHistory(username: string): Promise<HistoryEntry[]> {
  const file = await historyFile(username);
  const payload = await readJSONFile<HistoryEntry[]>(file, []);
  return payload
    .map((entry) => historyEntrySchema.parse(entry))
    .sort((a, b) => dayjs(b.lastWatched).valueOf() - dayjs(a.lastWatched).valueOf());
}

export async function upsertHistoryEntry(username: string, entry: HistoryEntry): Promise<void> {
  const file = await historyFile(username);
  const entries = await getHistory(username);
  const filtered = entries.filter((item) => !(item.contentId === entry.contentId && item.type === entry.type));
  const newEntry = historyEntrySchema.parse(entry);
  filtered.push(newEntry);
  await writeJSONFile(file, filtered);
}

export async function clearHistory(username: string): Promise<void> {
  const file = await historyFile(username);
  await writeJSONFile(file, []);
}
