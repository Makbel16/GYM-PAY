import { getDatabase } from '../database/db';
import { Payment, PaymentMethod } from '../types';
import { calculateRenewalDates, getLatestMembership, getPlanById, getTodayString } from './membershipService';

export async function recordPayment(params: {
  memberId: number;
  planId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  receiptNumber?: string | null;
  notes?: string | null;
  recordedBy: string;
}): Promise<{ paymentId: number; membershipId: number; newEndDate: string; isExtended: boolean }> {
  const db = await getDatabase();
  const payDate = params.paymentDate || getTodayString();
  const now = new Date().toISOString();

  // Get plan details
  const plan = await getPlanById(params.planId);
  if (!plan) {
    throw new Error('Membership plan not found');
  }

  // Get current active membership for renewal calculation
  const currentMembership = await getLatestMembership(params.memberId);
  const currentEndDate = currentMembership?.end_date ?? null;

  const { startDate, endDate, isExtended } = calculateRenewalDates(
    currentEndDate,
    plan.duration_days,
    payDate
  );

  let paymentId = 0;
  let membershipId = 0;

  await db.withTransactionAsync(async () => {
    // 1. Create membership period
    const membershipResult = await db.runAsync(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, created_at)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [params.memberId, params.planId, startDate, endDate, now]
    );
    membershipId = membershipResult.lastInsertRowId;

    // 2. Record payment
    const paymentResult = await db.runAsync(
      `INSERT INTO payments (membership_id, member_id, amount, payment_method, payment_date, receipt_number, notes, recorded_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
      [
        membershipId,
        params.memberId,
        params.amount,
        params.paymentMethod,
        payDate,
        params.receiptNumber ?? null,
        params.notes ?? null,
        params.recordedBy,
        now,
      ]
    );
    paymentId = paymentResult.lastInsertRowId;

    // 3. Record audit trail
    await db.runAsync(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details, performed_by, created_at)
       VALUES ('RECORD_PAYMENT', 'payment', ?, ?, ?, ?)`,
      [
        paymentId,
        `Payment of ${params.amount} ETB recorded for member #${params.memberId} (${plan.plan_name}). Valid from ${startDate} to ${endDate}.`,
        params.recordedBy,
        now,
      ]
    );
  });

  return {
    paymentId,
    membershipId,
    newEndDate: endDate,
    isExtended,
  };
}

export async function getPaymentsForMember(memberId: number): Promise<Payment[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Payment>(
    `SELECT p.*, mem.full_name as member_name, mem.gym_id, mem.member_type, pl.plan_name, ms.start_date, ms.end_date
     FROM payments p
     JOIN members mem ON p.member_id = mem.id
     JOIN memberships ms ON p.membership_id = ms.id
     JOIN membership_plans pl ON ms.plan_id = pl.id
     WHERE p.member_id = ?
     ORDER BY p.payment_date DESC, p.id DESC`,
    [memberId]
  );
}

export async function getAllPayments(limit = 100): Promise<Payment[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Payment>(
    `SELECT p.*, mem.full_name as member_name, mem.gym_id, mem.member_type, pl.plan_name, ms.start_date, ms.end_date
     FROM payments p
     JOIN members mem ON p.member_id = mem.id
     JOIN memberships ms ON p.membership_id = ms.id
     JOIN membership_plans pl ON ms.plan_id = pl.id
     ORDER BY p.payment_date DESC, p.id DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getRecentPayments(limit = 5): Promise<Payment[]> {
  return await getAllPayments(limit);
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  const db = await getDatabase();
  const payment = await db.getFirstAsync<Payment>(
    `SELECT p.*, mem.full_name as member_name, mem.gym_id, mem.member_type, pl.plan_name, ms.start_date, ms.end_date
     FROM payments p
     JOIN members mem ON p.member_id = mem.id
     JOIN memberships ms ON p.membership_id = ms.id
     JOIN membership_plans pl ON ms.plan_id = pl.id
     WHERE p.id = ?`,
    [id]
  );
  return payment ?? null;
}

export async function reversePayment(
  paymentId: number,
  reason: string,
  adminName: string
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status === 'reversed') {
    throw new Error('This payment is already reversed');
  }

  await db.withTransactionAsync(async () => {
    // 1. Mark payment as reversed
    await db.runAsync(
      `UPDATE payments SET status = 'reversed' WHERE id = ?`,
      [paymentId]
    );

    // 2. Mark membership period as cancelled
    await db.runAsync(
      `UPDATE memberships SET status = 'cancelled' WHERE id = ?`,
      [payment.membership_id]
    );

    // 3. Insert audit log
    await db.runAsync(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details, performed_by, created_at)
       VALUES ('REVERSE_PAYMENT', 'payment', ?, ?, ?, ?)`,
      [
        paymentId,
        `Payment of ${payment.amount} ETB reversed. Reason: ${reason}. Admin: ${adminName}`,
        adminName,
        now,
      ]
    );
  });
}
