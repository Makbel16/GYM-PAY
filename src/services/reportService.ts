import { getDatabase } from '../database/db';
import { DashboardStats, ReportSummary } from '../types';
import { getAllMembers } from './memberService';
import { getRecentPayments } from './paymentService';
import { getTodayString } from './membershipService';

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDatabase();
  const today = getTodayString();
  const currentMonthPrefix = today.substring(0, 7); // 'YYYY-MM'

  // Get all members with dynamically computed statuses
  const members = await getAllMembers();
  const total_members = members.length;
  const active_members = members.filter((m) => m.status === 'active').length;
  const expired_members = members.filter((m) => m.status === 'expired').length;
  const unpaid_members = members.filter((m) => m.status === 'unpaid').length;

  // Calculate today's income from completed payments
  const todayRow = await db.getFirstAsync<{ sum_amount: number | null }>(
    `SELECT SUM(amount) as sum_amount 
     FROM payments 
     WHERE payment_date = ? AND status = 'completed'`,
    [today]
  );
  const today_income = todayRow?.sum_amount ?? 0;

  // Calculate monthly income
  const monthRow = await db.getFirstAsync<{ sum_amount: number | null }>(
    `SELECT SUM(amount) as sum_amount 
     FROM payments 
     WHERE payment_date LIKE ? AND status = 'completed'`,
    [`${currentMonthPrefix}%`]
  );
  const monthly_income = monthRow?.sum_amount ?? 0;

  // Get recent 5 payments
  const recent_payments = await getRecentPayments(5);

  return {
    total_members,
    active_members,
    expired_members,
    unpaid_members,
    today_income,
    monthly_income,
    recent_payments,
  };
}

export async function getReportSummary(
  period: 'today' | 'month' | 'last_month' | 'year' | 'all'
): Promise<ReportSummary> {
  const db = await getDatabase();
  const today = getTodayString();
  const now = new Date();

  let dateFilterSql = '';
  let params: string[] = [];

  if (period === 'today') {
    dateFilterSql = 'WHERE p.payment_date = ? AND p.status = "completed"';
    params = [today];
  } else if (period === 'month') {
    const monthPrefix = today.substring(0, 7);
    dateFilterSql = 'WHERE p.payment_date LIKE ? AND p.status = "completed"';
    params = [`${monthPrefix}%`];
  } else if (period === 'last_month') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = lastMonthDate.getFullYear();
    const m = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
    const lastMonthPrefix = `${y}-${m}`;
    dateFilterSql = 'WHERE p.payment_date LIKE ? AND p.status = "completed"';
    params = [`${lastMonthPrefix}%`];
  } else if (period === 'year') {
    const yearPrefix = String(now.getFullYear());
    dateFilterSql = 'WHERE p.payment_date LIKE ? AND p.status = "completed"';
    params = [`${yearPrefix}%`];
  } else {
    dateFilterSql = 'WHERE p.status = "completed"';
    params = [];
  }

  // Get filtered payments
  const payments = await db.getAllAsync<any>(
    `SELECT p.*, mem.full_name as member_name, mem.gym_id, mem.member_type, pl.plan_name, ms.start_date, ms.end_date
     FROM payments p
     JOIN members mem ON p.member_id = mem.id
     JOIN memberships ms ON p.membership_id = ms.id
     JOIN membership_plans pl ON ms.plan_id = pl.id
     ${dateFilterSql}
     ORDER BY p.payment_date DESC, p.id DESC`,
    params
  );

  const total_income = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Get current member counts
  const members = await getAllMembers();
  const active_count = members.filter((m) => m.status === 'active').length;
  const expired_count = members.filter((m) => m.status === 'expired').length;
  const unpaid_count = members.filter((m) => m.status === 'unpaid').length;

  const student_count = members.filter((m) => m.member_type === 'student').length;
  const staff_count = members.filter((m) => m.member_type === 'staff').length;
  const external_count = members.filter((m) => m.member_type === 'external').length;

  return {
    period,
    total_income,
    payment_count: payments.length,
    active_count,
    expired_count,
    unpaid_count,
    student_count,
    staff_count,
    external_count,
    payments,
  };
}
