import * as SQLite from 'expo-sqlite';
import { DB_NAME, SCHEMA_SQL } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(dbInstance);
  }
  return dbInstance;
}

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys and WAL mode for reliability & concurrency
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Execute schema tables and indexes
  await db.execAsync(SCHEMA_SQL);

  // Safe migration for existing installations adding member photo support
  try {
    await db.execAsync('ALTER TABLE members ADD COLUMN photo_uri TEXT;');
  } catch {
    // Column already exists
  }

  // Initialize sequence tracking if not exists
  await db.runAsync(`INSERT OR IGNORE INTO id_sequences (category, last_number) VALUES ('staff', 0);`);
  await db.runAsync(`INSERT OR IGNORE INTO id_sequences (category, last_number) VALUES ('external', 0);`);

  // Initialize default gym settings
  await db.runAsync(`INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('gym_name', 'DBU Gym');`);
  await db.runAsync(`INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('university_name', 'Debre Berhan University');`);
  await db.runAsync(`INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('contact_phone', '+251 91 234 5678');`);
  await db.runAsync(`INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('currency', 'ETB');`);
  await db.runAsync(`INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('language', 'en');`);

  // Seed standard membership plans if none exist
  const existingPlans = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM membership_plans');
  if (!existingPlans || existingPlans.count === 0) {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO membership_plans (plan_name, duration_days, price, member_category, is_active, created_at) VALUES 
      ('Monthly Student', 30, 350, 'student', 1, ?),
      ('Monthly Staff', 30, 450, 'staff', 1, ?),
      ('Monthly Standard', 30, 500, 'all', 1, ?),
      ('Quarterly Plan (3 Months)', 90, 1350, 'all', 1, ?),
      ('Weekly Pass', 7, 150, 'all', 1, ?),
      ('Annual Standard', 365, 5000, 'all', 1, ?)`,
      [now, now, now, now, now, now]
    );
  }
}
