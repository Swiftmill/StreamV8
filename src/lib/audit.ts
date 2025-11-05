import dayjs from 'dayjs';
import { AUDIT_LOG_PATH } from './paths.js';
import { appendLine } from './fileStore.js';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'RESET_PASSWORD'
  | 'DISABLE_USER'
  | 'CREATE_MOVIE'
  | 'UPDATE_MOVIE'
  | 'DELETE_MOVIE'
  | 'CREATE_SERIES'
  | 'UPDATE_SERIES'
  | 'DELETE_SERIES'
  | 'PUBLISH_CONTENT'
  | 'UNPUBLISH_CONTENT'
  | 'FEATURE_CONTENT'
  | 'UNFEATURE_CONTENT'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY';

export async function auditLog(
  user: string,
  action: AuditAction,
  target: string,
  details: Record<string, unknown>
): Promise<void> {
  const timestamp = dayjs().toISOString();
  const line = `${timestamp} | ${user} | ${action} | ${target} | ${JSON.stringify(details)}`;
  await appendLine(AUDIT_LOG_PATH, line);
}
