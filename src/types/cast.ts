/**
 * Cast System Types
 * Types for cast authentication, orders, shifts, and earnings
 */

export interface Store {
  id: number;
  name: string;
  address?: string;
  timezone: string;
}

export interface FloorTable {
  id: string;
  store_id: number;
  label: string;
  seats: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  has_open_bill?: boolean;
  current_total?: number;
  remaining_minutes?: number;
}

export type ProductCategory = 'set' | 'extension' | 'nomination' | 'companion' | 'drinks' | 'bottles';

export interface Product {
  id: string;
  name_jp: string;
  category: ProductCategory;
  price: number;
  back: number;
  back_free: number;
  back_designated: number;
  points: number;
  tax_applicable: boolean;
  is_active: boolean;
  sort_order: number;
  drink_units: number;
}

export interface CastMember {
  id: string;
  name: string;
  username?: string;
  hourly_rate: number;
  is_active: boolean;
  transport_fee: number;
  referred_by?: string;
}

export interface CastSession {
  id: string;
  cast_id: string;
  session_token: string;
  expires_at: string;
  cast_member?: CastMember;
}

export interface CastShift {
  id: string;
  cast_id: string;
  store_id: number;
  clock_in: string;
  clock_out?: string;
  clock_in_status?: string;
  clock_out_status?: string;
  clock_in_approved_by?: string;
  clock_in_approved_at?: string;
  clock_out_approved_by?: string;
  clock_out_approved_at?: string;
  late_pickup_start?: string;
  is_late_pickup: boolean;
  notes?: string;
}

export interface Bill {
  id: string;
  table_id: string;
  store_id: number;
  status: 'open' | 'closed';
  start_time: string;
  close_time?: string;
  base_minutes: number;
  read_token?: string;
}

export interface Order {
  id: string;
  bill_id: string;
  product_id: string;
  cast_id?: string;
  quantity: number;
  unit_price: number;
  back_amount: number;
  points_amount: number;
  created_at: string;
  product?: Product;
  // Staff management fields
  is_cancelled?: boolean;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

export interface BillDesignation {
  id: string;
  bill_id: string;
  cast_id: string;
  extension_count: number;
  is_designated: boolean;
  designated_at?: string;
}

export interface CastDailyEarnings {
  id: string;
  cast_id: string;
  store_id: number;
  earning_date: string;
  work_minutes: number;
  base_wage: number;
  total_backs: number;
  drink_points: number;
  champagne_points: number;
  bonus_amount: number;
  gross_amount: number;
  tax_deduction: number;
  welfare_fee: number;
  transport_fee: number;
  net_payout: number;
}

export interface CastEarnings {
  total_backs: number;
  total_points: number;
  drink_points: number;
  champagne_points: number;
  orders_count: number;
  work_minutes: number;
  base_wage: number;
  bonus_amount: number;
  gross_amount: number;
  net_payout: number;
}

// Category display names in Japanese
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  set: 'セット',
  extension: '延長',
  nomination: '指名',
  companion: '同伴',
  drinks: 'ドリンク',
  bottles: 'ボトル',
};

// Category order for display
export const CATEGORY_ORDER: ProductCategory[] = [
  'set',
  'extension',
  'nomination',
  'companion',
  'drinks',
  'bottles',
];

/**
 * Shift with late pickup calculation
 */
export interface ShiftWithPay {
  id: string;
  clock_in: string;
  clock_out: string | null;
  is_late_pickup: boolean;
  late_pickup_start: string | null;
  work_minutes: number;
  base_hourly: number;
  effective_hourly: number;
  time_pay: number;
}

/**
 * Full earnings breakdown for a cast member
 */
export interface CastEarningsBreakdown {
  // Shift info
  shifts: ShiftWithPay[];
  total_work_minutes: number;
  total_time_pay: number;
  has_late_pickup: boolean;
  
  // Backs
  total_backs: number;
  backs_by_category: Record<ProductCategory, number>;
  
  // Points
  drink_s_units: number;
  drink_points: number;
  champagne_points: number;
  total_points: number;
  
  // Orders
  orders_count: number;
  
  // Bonus
  store_sales: number;
  bonus_per_point: number;
  bonus_amount: number;
  bonus_qualified: boolean;
  
  // Final calculation
  subtotal: number;        // time_pay + backs + bonus
  tax_rate: number;        // 0.9
  after_tax: number;       // subtotal × 0.9
  welfare_fee: number;     // ¥1,000
  transport_fee: number;
  gross_amount: number;    // after_tax - fees
  net_payout: number;      // floored to ¥10
  
  // Referral (separate)
  referral_count: number;
  referral_bonus: number;
}

/**
 * Calculate time pay for shifts with late pickup rule
 * Late pickup: +¥500/hour from late_pickup_start onward
 */
export function calculateShiftTimePay(
  clockIn: Date,
  clockOut: Date | null,
  baseHourly: number,
  isLatePickup: boolean,
  latePickupStart: Date | null,
  latePickupBonus: number = 500
): ShiftWithPay {
  const endTime = clockOut || new Date();
  const workMinutes = Math.floor((endTime.getTime() - clockIn.getTime()) / 60000);
  
  let timePay = 0;
  let effectiveHourly = baseHourly;
  
  if (isLatePickup && latePickupStart) {
    // Time before late pickup at base rate
    const beforeLateMinutes = Math.max(0, 
      Math.floor((latePickupStart.getTime() - clockIn.getTime()) / 60000)
    );
    // Time after late pickup at +¥500 rate
    const afterLateMinutes = Math.max(0, 
      Math.floor((endTime.getTime() - latePickupStart.getTime()) / 60000)
    );
    
    const basePay = (beforeLateMinutes / 60) * baseHourly;
    const latePickupPay = (afterLateMinutes / 60) * (baseHourly + latePickupBonus);
    timePay = basePay + latePickupPay;
    
    // Effective hourly is weighted average
    if (workMinutes > 0) {
      effectiveHourly = Math.floor(timePay / (workMinutes / 60));
    }
  } else {
    timePay = (workMinutes / 60) * baseHourly;
  }
  
  return {
    id: '',
    clock_in: clockIn.toISOString(),
    clock_out: clockOut?.toISOString() || null,
    is_late_pickup: isLatePickup,
    late_pickup_start: latePickupStart?.toISOString() || null,
    work_minutes: workMinutes,
    base_hourly: baseHourly,
    effective_hourly: effectiveHourly,
    time_pay: Math.floor(timePay), // Don't round yet
  };
}

/**
 * Calculate drink points
 * 5 S-units = 1 point, fractions dropped
 * S=1, M=2, L=3, Shot=2
 */
export function calculateDrinkPoints(totalSUnits: number): number {
  return Math.floor(totalSUnits / 5);
}

/**
 * Calculate champagne share for a cast (individual share)
 * Split if multiple cast, round to 1 decimal (keep as decimal for summing)
 * 
 * Example: 4 points / 5 drinkers = 0.8 points each
 * 
 * NOTE: Do NOT floor individual shares! Floor only the daily total.
 */
export function calculateChampagneShare(
  bottlePoints: number,
  numConsumers: number
): number {
  if (numConsumers <= 0) return bottlePoints;
  const share = bottlePoints / numConsumers;
  // Round to 1 decimal, keep as decimal (don't floor yet)
  return Math.round(share * 10) / 10;
}

/**
 * Calculate total champagne points for a day
 * Sum all individual shares (each rounded to 1 decimal)
 * Then floor the final total
 * 
 * Example:
 *   - Café de Paris (4P) drunk alone: 4.0
 *   - Moët (8P) shared with 4 others: 1.6
 *   - Total: 5.6 → floor → 5 points
 */
export function calculateDailyChampagnePoints(shares: number[]): number {
  const sum = shares.reduce((acc, share) => acc + share, 0);
  return Math.floor(sum);
}

/**
 * Calculate daily bonus (大入り)
 * 
 * Weekday: ¥400,000 threshold → ¥200/point
 *          Every +¥400,000 → +¥200/point
 *          Max ¥600/point
 * 
 * Weekend/Holiday: ¥500,000 threshold → ¥200/point
 *                  Every +¥400,000 → +¥200/point
 *                  Max ¥600/point
 */
export function calculateDailyBonus(
  storeSales: number,
  castPoints: number,
  isWeekendOrHoliday: boolean,
  settings?: {
    thresholdWeekday?: number;
    thresholdWeekend?: number;
    increment?: number;
    baseBonus?: number;
    maxBonus?: number;
  }
): { qualified: boolean; bonusPerPoint: number; totalBonus: number } {
  const thresholdWeekday = settings?.thresholdWeekday ?? 400000;
  const thresholdWeekend = settings?.thresholdWeekend ?? 500000;
  const baseThreshold = isWeekendOrHoliday ? thresholdWeekend : thresholdWeekday;
  const increment = settings?.increment ?? 400000;
  const baseBonus = settings?.baseBonus ?? 200;
  const maxBonus = settings?.maxBonus ?? 600;
  
  if (storeSales < baseThreshold) {
    return { qualified: false, bonusPerPoint: 0, totalBonus: 0 };
  }
  
  // Calculate tier: how many increments above base
  const excessSales = storeSales - baseThreshold;
  const additionalTiers = Math.floor(excessSales / increment);
  
  // Bonus per point = 200 + (tiers * 200), max 600
  const bonusPerPoint = Math.min(baseBonus + (additionalTiers * baseBonus), maxBonus);
  
  return { 
    qualified: true, 
    bonusPerPoint, 
    totalBonus: castPoints * bonusPerPoint 
  };
}

/**
 * Calculate net payout using exact formula:
 * (time_pay + backs + bonus) × 0.9 − welfare − transport
 * Floor to nearest 10 yen
 */
export function calculateNetPayout(
  timePay: number,
  totalBacks: number,
  bonusAmount: number,
  welfareFee: number = 1000,
  transportFee: number = 0,
  taxRate: number = 0.9
): {
  subtotal: number;
  afterTax: number;
  taxDeduction: number;
  net: number
} {
  // Subtotal = time + backs + bonus
  const subtotal = timePay + totalBacks + bonusAmount;

  // After tax = subtotal × taxRate (e.g. 0.9 means 10% deduction)
  const afterTax = subtotal * taxRate;
  const taxDeduction = subtotal - afterTax;
  
  // Net = afterTax - welfare - transport
  const netBeforeRounding = afterTax - welfareFee - transportFee;
  
  // Floor to nearest 10 yen
  const net = Math.floor(netBeforeRounding / 10) * 10;
  
  return {
    subtotal: Math.floor(subtotal),
    afterTax: Math.floor(afterTax),
    taxDeduction: Math.floor(taxDeduction),
    net: Math.max(0, net),
  };
}

/**
 * Get the correct back amount for a product based on bill seating type
 * For bottles: free vs designated seating has different commission
 * For other items: back_free and back_designated are the same
 */
export function getBackForSeatingType(
  product: Product,
  seatingType: 'free' | 'designated' | 'inhouse'
): number {
  if (seatingType === 'designated') {
    return product.back_designated || product.back || 0;
  }
  return product.back_free || product.back || 0;
}

/**
 * Check if a product is an in-house extension (場内延長)
 */
export function isInHouseExtension(product: Product): boolean {
  return product.category === 'extension' && product.name_jp.includes('場内');
}

/**
 * Check if a product is a designated extension (本指名延長)
 */
export function isDesignatedExtension(product: Product): boolean {
  return product.category === 'extension' && product.name_jp.includes('本指名');
}

// ==========================================
// JAPANESE HOLIDAY CALENDAR
// ==========================================

/**
 * Japanese national holidays for 2025-2027
 * Includes: New Year, Coming of Age Day, National Foundation Day, Emperor's Birthday,
 * Vernal Equinox, Showa Day, Constitution Day, Greenery Day, Children's Day,
 * Marine Day, Mountain Day, Respect for Aged Day, Autumnal Equinox, Sports Day,
 * Culture Day, Labour Thanksgiving Day
 */
const JAPANESE_HOLIDAYS: Record<string, string[]> = {
  '2025': [
    '2025-01-01', '2025-01-02', '2025-01-03',
    '2025-01-13', '2025-02-11', '2025-02-23', '2025-02-24',
    '2025-03-20', '2025-04-29', '2025-05-03', '2025-05-04',
    '2025-05-05', '2025-05-06', '2025-07-21', '2025-08-11',
    '2025-09-15', '2025-09-23', '2025-10-13', '2025-11-03',
    '2025-11-23', '2025-11-24',
  ],
  '2026': [
    '2026-01-01', '2026-01-02', '2026-01-03',
    '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
    '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05',
    '2026-05-06', '2026-07-20', '2026-08-11', '2026-09-21',
    '2026-09-22', '2026-09-23', '2026-10-12', '2026-11-03',
    '2026-11-23',
  ],
  '2027': [
    '2027-01-01', '2027-01-02', '2027-01-03',
    '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-21',
    '2027-03-22', '2027-04-29', '2027-05-03', '2027-05-04',
    '2027-05-05', '2027-07-19', '2027-08-11', '2027-09-20',
    '2027-09-23', '2027-10-11', '2027-11-03', '2027-11-23',
  ],
};

function isJapaneseHoliday(date: Date): boolean {
  const year = date.getFullYear().toString();
  const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return JAPANESE_HOLIDAYS[year]?.includes(dateStr) || false;
}

function isHolidayEve(date: Date): boolean {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return isJapaneseHoliday(nextDay);
}

/**
 * Check if a date qualifies for weekend/holiday bonus threshold (¥500k instead of ¥400k)
 * Friday, Saturday, holiday eves, and holidays themselves all qualify
 */
export function isWeekendOrHoliday(date: Date): boolean {
  const day = date.getDay();
  if (day === 5 || day === 6) return true;
  if (isHolidayEve(date)) return true;
  if (isJapaneseHoliday(date)) return true;
  return false;
}

/**
 * Format work time as hours and minutes
 */
export function formatWorkTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}時間${mins}分`;
}
