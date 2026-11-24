import { getDatabase } from '../database/db';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ setting_value: string }>(
    'SELECT setting_value FROM settings WHERE setting_key = ?',
    [key]
  );
  return row?.setting_value ?? defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value',
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ setting_key: string; setting_value: string }>(
    'SELECT setting_key, setting_value FROM settings'
  );
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.setting_key] = r.setting_value;
  }
  return result;
}
