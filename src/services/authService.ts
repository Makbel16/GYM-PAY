import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/db';
import { Admin } from '../types';

const SALT = 'DBU_GYM_2026_SECURITY_SALT';

export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${password}:${SALT}`
  );
}

export async function hasAdminAccount(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM admins'
  );
  return (result?.count ?? 0) > 0;
}

export async function registerAdmin(
  username: string,
  password: string,
  fullName: string
): Promise<Admin> {
  const db = await getDatabase();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO admins (username, password_hash, full_name, role, created_at)
     VALUES (?, ?, ?, 'admin', ?)`,
    [username.trim().toLowerCase(), passwordHash, fullName.trim(), now]
  );

  return {
    id: result.lastInsertRowId,
    username: username.trim().toLowerCase(),
    password_hash: passwordHash,
    full_name: fullName.trim(),
    role: 'admin',
    created_at: now,
  };
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<Admin | null> {
  const db = await getDatabase();
  const passwordHash = await hashPassword(password);

  const admin = await db.getFirstAsync<Admin>(
    `SELECT * FROM admins WHERE username = ? AND password_hash = ?`,
    [username.trim().toLowerCase(), passwordHash]
  );

  return admin ?? null;
}

export async function getAdminById(id: number): Promise<Admin | null> {
  const db = await getDatabase();
  const admin = await db.getFirstAsync<Admin>(
    `SELECT * FROM admins WHERE id = ?`,
    [id]
  );
  return admin ?? null;
}
