import { getDatabase } from '../database/db';
import { Gender, Member, MemberCategory, MembershipStatus, MemberWithStatus } from '../types';
import { getTodayString } from './membershipService';

export async function generateGymId(category: MemberCategory, studentId?: string): Promise<string> {
  const db = await getDatabase();

  if (category === 'student') {
    if (!studentId || !studentId.trim()) {
      throw new Error('Student ID is required for student members');
    }
    const cleanId = studentId.trim();
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM members WHERE gym_id = ? OR institution_id = ?',
      [cleanId, cleanId]
    );
    if (existing) {
      throw new Error('A student with this ID already exists');
    }
    return cleanId;
  }

  // For staff or external, monotonically increment sequence
  let generatedId = '';
  await db.withTransactionAsync(async () => {
    const seqRow = await db.getFirstAsync<{ last_number: number }>(
      'SELECT last_number FROM id_sequences WHERE category = ?',
      [category]
    );
    const nextNum = (seqRow?.last_number ?? 0) + 1;
    await db.runAsync(
      'UPDATE id_sequences SET last_number = ? WHERE category = ?',
      [nextNum, category]
    );

    const prefix = category === 'staff' ? 'STF' : 'EXT';
    generatedId = `${prefix}-${String(nextNum).padStart(4, '0')}`;
  });

  return generatedId;
}

export async function registerMember(params: {
  fullName: string;
  category: MemberCategory;
  phone: string;
  studentId?: string;
  gender?: Gender | null;
  photoUri?: string | null;
  registrationDate?: string;
}): Promise<Member> {
  const db = await getDatabase();
  const regDate = params.registrationDate || getTodayString();
  const now = new Date().toISOString();

  const gymId = await generateGymId(params.category, params.studentId);
  const institutionId = params.category === 'student' ? (params.studentId?.trim() ?? null) : null;

  const result = await db.runAsync(
    `INSERT INTO members (gym_id, full_name, member_type, institution_id, phone, gender, photo_uri, registration_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      gymId,
      params.fullName.trim(),
      params.category,
      institutionId,
      params.phone.trim(),
      params.gender ?? null,
      params.photoUri ?? null,
      regDate,
      now,
      now,
    ]
  );

  return {
    id: result.lastInsertRowId,
    gym_id: gymId,
    full_name: params.fullName.trim(),
    member_type: params.category,
    institution_id: institutionId,
    phone: params.phone.trim(),
    gender: params.gender ?? null,
    photo_uri: params.photoUri ?? null,
    registration_date: regDate,
    is_active: 1,
    created_at: now,
    updated_at: now,
  };
}

export function computeMemberStatus(
  isActive: number,
  membershipEndDate: string | null,
  hasPayment: boolean
): { status: MembershipStatus; daysRemaining: number } {
  if (isActive === 0) {
    return { status: 'inactive', daysRemaining: 0 };
  }

  if (!hasPayment || !membershipEndDate) {
    return { status: 'unpaid', daysRemaining: 0 };
  }

  const today = getTodayString();
  const [tY, tM, tD] = today.split('-').map(Number);
  const [eY, eM, eD] = membershipEndDate.split('-').map(Number);

  const todayTime = new Date(tY, tM - 1, tD).getTime();
  const endTime = new Date(eY, eM - 1, eD).getTime();
  const diffDays = Math.ceil((endTime - todayTime) / (1000 * 60 * 60 * 24));

  if (membershipEndDate >= today) {
    return { status: 'active', daysRemaining: Math.max(0, diffDays) };
  } else {
    return { status: 'expired', daysRemaining: 0 };
  }
}

export async function getAllMembers(filters?: {
  category?: MemberCategory | 'all';
  status?: MembershipStatus | 'all';
  searchQuery?: string;
}): Promise<MemberWithStatus[]> {
  const db = await getDatabase();

  const query = `
    SELECT 
      m.*,
      latest_m.id as current_membership_id,
      latest_m.plan_id,
      latest_m.start_date as membership_start_date,
      latest_m.end_date as membership_end_date,
      p.plan_name as current_plan_name,
      latest_pay.payment_date as last_payment_date,
      latest_pay.amount as last_payment_amount,
      CASE WHEN latest_pay.id IS NOT NULL THEN 1 ELSE 0 END as has_payment
    FROM members m
    LEFT JOIN (
      SELECT m1.*
      FROM memberships m1
      INNER JOIN (
        SELECT member_id, MAX(end_date) as max_end_date
        FROM memberships
        WHERE status != 'cancelled'
        GROUP BY member_id
      ) m2 ON m1.member_id = m2.member_id AND m1.end_date = m2.max_end_date
    ) latest_m ON m.id = latest_m.member_id
    LEFT JOIN membership_plans p ON latest_m.plan_id = p.id
    LEFT JOIN (
      SELECT p1.*
      FROM payments p1
      INNER JOIN (
        SELECT member_id, MAX(payment_date) as max_pay_date, MAX(id) as max_id
        FROM payments
        WHERE status = 'completed'
        GROUP BY member_id
      ) p2 ON p1.member_id = p2.member_id AND p1.id = p2.max_id
    ) latest_pay ON m.id = latest_pay.member_id
    ORDER BY m.id DESC
  `;

  interface RawRow extends Member {
    current_membership_id: number | null;
    current_plan_name: string | null;
    membership_start_date: string | null;
    membership_end_date: string | null;
    last_payment_date: string | null;
    last_payment_amount: number | null;
    has_payment: number;
  }

  const rows = await db.getAllAsync<RawRow>(query);

  let results: MemberWithStatus[] = rows.map((row) => {
    const { status, daysRemaining } = computeMemberStatus(
      row.is_active,
      row.membership_end_date,
      row.has_payment === 1
    );

    return {
      id: row.id,
      gym_id: row.gym_id,
      full_name: row.full_name,
      member_type: row.member_type,
      institution_id: row.institution_id,
      phone: row.phone,
      gender: row.gender,
      registration_date: row.registration_date,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status,
      current_plan_name: row.current_plan_name,
      current_membership_id: row.current_membership_id,
      membership_start_date: row.membership_start_date,
      membership_end_date: row.membership_end_date,
      last_payment_date: row.last_payment_date,
      last_payment_amount: row.last_payment_amount,
      days_remaining: daysRemaining,
    };
  });

  // Apply filters
  if (filters?.category && filters.category !== 'all') {
    results = results.filter((m) => m.member_type === filters.category);
  }

  if (filters?.status && filters.status !== 'all') {
    results = results.filter((m) => m.status === filters.status);
  }

  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    results = results.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.gym_id.toLowerCase().includes(q) ||
        (m.institution_id && m.institution_id.toLowerCase().includes(q)) ||
        m.phone.includes(q)
    );
  }

  return results;
}

export async function searchMemberByIdOrPhone(query: string): Promise<MemberWithStatus[]> {
  if (!query || !query.trim()) return [];
  return await getAllMembers({ searchQuery: query.trim() });
}

export async function getMemberById(id: number): Promise<MemberWithStatus | null> {
  const all = await getAllMembers();
  return all.find((m) => m.id === id) ?? null;
}

export async function updateMember(
  id: number,
  params: {
    fullName: string;
    phone: string;
    gender?: Gender | null;
    studentId?: string | null;
  }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE members 
     SET full_name = ?, phone = ?, gender = ?, institution_id = ?, updated_at = ?
     WHERE id = ?`,
    [params.fullName.trim(), params.phone.trim(), params.gender ?? null, params.studentId ?? null, now, id]
  );
}

export async function toggleMemberActive(id: number, active: boolean, adminName: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const newActive = active ? 1 : 0;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE members SET is_active = ?, updated_at = ? WHERE id = ?',
      [newActive, now, id]
    );

    await db.runAsync(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details, performed_by, created_at)
       VALUES (?, 'member', ?, ?, ?, ?)`,
      [
        active ? 'ACTIVATE_MEMBER' : 'DEACTIVATE_MEMBER',
        id,
        `Member status changed to ${active ? 'active' : 'inactive'}`,
        adminName,
        now,
      ]
    );
  });
}
