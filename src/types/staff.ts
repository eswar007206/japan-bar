/**
 * Staff Types
 * Type definitions for staff dashboard
 */

export interface StaffMember {
  id: string;
  name: string;
  role: 'staff' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface StaffSession {
  id: string;
  staff_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export type SeatingType = 'free' | 'designated' | 'inhouse';

export const SEATING_TYPE_LABELS: Record<SeatingType, string> = {
  free: 'フリー',
  designated: '本指名',
  inhouse: '場内指名',
};

export interface TableSession {
  id: string;
  table_id: string;
  store_id: number;
  start_time: string;
  base_minutes: number;
  seating_type: SeatingType;
  status: 'open' | 'closed';
  close_time: string | null;
  read_token: string | null;
  notes: string | null;
  // Computed fields
  table_label?: string;
  current_total?: number;
  remaining_minutes?: number;
  elapsed_minutes?: number;
  orders_count?: number;
  extension_count?: number;  // Track extension count for auto-upgrade
  payment_method?: string | null; // Payment method selected by customer/cast/staff
  assigned_casts?: CastAssignment[];
}

export interface CastAssignment {
  id: string;
  bill_id: string;
  cast_id: string;
  assigned_at: string;
  removed_at: string | null;
  is_active: boolean;
  cast_name?: string;
}

export interface PriceAdjustment {
  id: string;
  order_id: string | null;
  bill_id: string | null;
  staff_id: string | null;
  adjustment_type: 'discount' | 'cancel' | 'price_change' | 'custom';
  original_amount: number;
  adjusted_amount: number;
  reason: string | null;
  created_at: string;
}

export interface DailySummary {
  date: string;
  store_id: number;
  total_sales: number;
  total_bills: number;
  total_customers: number;
  cash_amount: number;
  card_amount: number;
  cast_payouts: CastPayout[];
}

export interface CastPayout {
  cast_id: string;
  cast_name: string;
  work_minutes: number;
  base_wage: number;
  total_backs: number;
  bonus_amount: number;
  net_payout: number;
}

// Utility functions
export function generateReadToken(): string {
  return Array.from({ length: 12 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
}
