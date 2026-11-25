export type MemberCategory = 'student' | 'staff' | 'external';

export type MembershipStatus = 'active' | 'expired' | 'unpaid' | 'inactive';

export type Gender = 'male' | 'female' | 'other';

export type PaymentMethod = 'cash' | 'telebirr' | 'bank' | 'other';

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface Member {
  id: number;
  gym_id: string;
  full_name: string;
  member_type: MemberCategory;
  institution_id: string | null;
  phone: string;
  gender: Gender | null;
  photo_uri?: string | null;
  registration_date: string;
  is_active: number; // 1 or 0
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: number;
  plan_name: string;
  duration_days: number;
  price: number;
  member_category: MemberCategory | 'all' | null;
  is_active: number;
  created_at: string;
}

export interface Membership {
  id: number;
  member_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  plan_name?: string;
  duration_days?: number;
  price?: number;
}

export interface Payment {
  id: number;
  membership_id: number;
  member_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  receipt_number: string | null;
  notes: string | null;
  recorded_by: string;
  status: 'completed' | 'reversed';
  created_at: string;
  // Joined fields
  member_name?: string;
  gym_id?: string;
  member_type?: MemberCategory;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface MemberWithStatus extends Member {
  status: MembershipStatus;
  current_plan_name: string | null;
  current_membership_id: number | null;
  membership_start_date: string | null;
  membership_end_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  days_remaining: number;
}

export interface DashboardStats {
  total_members: number;
  active_members: number;
  expired_members: number;
  unpaid_members: number;
  today_income: number;
  monthly_income: number;
  monthly_growth_percent?: number | null;
  recent_payments: Payment[];
}

export interface ReportSummary {
  period: 'today' | 'month' | 'last_month' | 'year' | 'all';
  total_income: number;
  payment_count: number;
  active_count: number;
  expired_count: number;
  unpaid_count: number;
  student_count: number;
  staff_count: number;
  external_count: number;
  payments: Payment[];
}

export interface GymSetting {
  id: number;
  setting_key: string;
  setting_value: string;
}
