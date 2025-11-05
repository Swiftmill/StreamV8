import dayjs from 'dayjs';
import { ADMIN_DB_PATH, USERS_DB_PATH } from './paths.js';
import { readJSONFile, writeJSONFile } from './fileStore.js';
import type { UserRecord } from './validation.js';

interface UsersFile {
  users: UserRecord[];
}

async function loadUsersFile(filePath: string): Promise<UsersFile> {
  return readJSONFile<UsersFile>(filePath, { users: [] });
}

async function saveUsersFile(filePath: string, payload: UsersFile): Promise<void> {
  await writeJSONFile(filePath, payload);
}

async function getAllUsersInternal(): Promise<UserRecord[]> {
  const [admins, users] = await Promise.all([loadUsersFile(ADMIN_DB_PATH), loadUsersFile(USERS_DB_PATH)]);
  return [...admins.users, ...users.users];
}

export async function getAllUsers(): Promise<UserRecord[]> {
  return getAllUsersInternal();
}

export async function findUser(username: string): Promise<UserRecord | undefined> {
  const all = await getAllUsersInternal();
  return all.find((user) => user.username.toLowerCase() === username.toLowerCase());
}

function fileForRole(role: 'admin' | 'user'): string {
  return role === 'admin' ? ADMIN_DB_PATH : USERS_DB_PATH;
}

export async function upsertUser(record: UserRecord): Promise<void> {
  const targetFile = fileForRole(record.role);
  const file = await loadUsersFile(targetFile);
  const nextUsers = file.users.filter((user) => user.username !== record.username);
  nextUsers.push({ ...record, updatedAt: dayjs().toISOString() });
  await saveUsersFile(targetFile, { users: nextUsers });
}

export async function deleteUser(username: string): Promise<void> {
  const [adminFile, userFile] = await Promise.all([loadUsersFile(ADMIN_DB_PATH), loadUsersFile(USERS_DB_PATH)]);
  const nextAdmin = adminFile.users.filter((user) => user.username !== username);
  const nextUser = userFile.users.filter((user) => user.username !== username);
  await Promise.all([
    saveUsersFile(ADMIN_DB_PATH, { users: nextAdmin }),
    saveUsersFile(USERS_DB_PATH, { users: nextUser })
  ]);
}

export async function replaceUsers(role: 'admin' | 'user', users: UserRecord[]): Promise<void> {
  const filePath = fileForRole(role);
  await saveUsersFile(filePath, { users });
}
