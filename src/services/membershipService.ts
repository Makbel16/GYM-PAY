import { getDatabase } from '../database/db';
import { Membership, MembershipPlan, MembershipStatus } from '../types';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function calculateRenewalDates(
  currentEndDate: string | null,
  durationDays: number,
  paymentDate: string = getTodayString()
): { startDate: string; endDate: string; isExtended: boolean } {
  const today = getTodayString();

  // If there is an active membership ending on or after today (or payment date), extend from current end date
  if (currentEndDate && currentEndDate >= paymentDate && currentEndDate >= today) {
    // Continuous extension from current expiration date
    const startDate = currentEndDate;
    const endDate = addDaysToDate(currentEndDate, durationDays);
    return {
      startDate,
      endDate,
      isExtended: true,
    };
  }

  // Otherwise start fresh from payment date
  const startDate = paymentDate;
  const endDate = addDaysToDate(paymentDate, durationDays);
  return {
    startDate,
    endDate,
    isExtended: false,
  };
}

export async function getMembershipPlans(category?: string): Promise<MembershipPlan[]> {
  const db = await getDatabase();
  if (category) {
    return await db.getAllAsync<MembershipPlan>(
      `SELECT * FROM membership_plans 
       WHERE is_active = 1 AND (member_category = ? OR member_category = 'all' OR member_category IS NULL)
       ORDER BY duration_days ASC`,
      [category]
    );
  }
  return await db.getAllAsync<MembershipPlan>(
    'SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY duration_days ASC'
  );
}

export async function getAllPlans(): Promise<MembershipPlan[]> {
  const db = await getDatabase();
  return await db.getAllAsync<MembershipPlan>(
    'SELECT * FROM membership_plans ORDER BY is_active DESC, duration_days ASC'
  );
}

export async function getPlanById(id: number): Promise<MembershipPlan | null> {
  const db = await getDatabase();
  const plan = await db.getFirstAsync<MembershipPlan>(
    'SELECT * FROM membership_plans WHERE id = ?',
    [id]
  );
  return plan ?? null;
}

export async function createMembershipPlan(
  planName: string,
  durationDays: number,
  price: number,
  memberCategory: string = 'all'
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO membership_plans (plan_name, duration_days, price, member_category, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [planName.trim(), durationDays, price, memberCategory, now]
  );
  return result.lastInsertRowId;
}

export async function updateMembershipPlan(
  id: number,
  planName: string,
  durationDays: number,
  price: number,
  memberCategory: string,
  isActive: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE membership_plans 
     SET plan_name = ?, duration_days = ?, price = ?, member_category = ?, is_active = ?
     WHERE id = ?`,
    [planName.trim(), durationDays, price, memberCategory, isActive, id]
  );
}

export async function getLatestMembership(memberId: number): Promise<Membership | null> {
  const db = await getDatabase();
  const membership = await db.getFirstAsync<Membership>(
    `SELECT m.*, p.plan_name, p.duration_days, p.price
     FROM memberships m
     LEFT JOIN membership_plans p ON m.plan_id = p.id
     WHERE m.member_id = ? AND m.status != 'cancelled'
     ORDER BY m.end_date DESC, m.id DESC
     LIMIT 1`,
    [memberId]
  );
  return membership ?? null;
}
