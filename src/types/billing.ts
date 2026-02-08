/**
 * Girls Bar Fairy - Customer Bill Types
 * Read-only customer QR page data structures
 */

export type PaymentMethod = 'cash' | 'card' | 'qr' | 'contactless';

export interface CustomerOrderItem {
  name_jp: string;
  quantity: number;
  unit_price: number;
  tax_applicable: boolean;
  category: string;
}

export interface CustomerBillResponse {
  store_id: number;
  store_name: string;
  table_id: string;
  table_label: string;
  start_time: string; // ISO 8601 format
  elapsed_minutes: number;
  remaining_minutes: number;
  current_total: number; // JPY integer, already computed with tax/service, floored to 10
  show_extension_preview: boolean;
  extension_preview_total: number; // JPY integer, computed with extension + tax/service, floored to 10
  accepted_payment_methods: PaymentMethod[];
  footer_note: string;
  last_updated: string; // ISO 8601 format
  order_items: CustomerOrderItem[]; // List of ordered items for customer display
  seating_type: string;
  base_minutes: number;
}

export interface BillDisplayState {
  data: CustomerBillResponse | null;
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  lastFetchTime: Date | null;
}

export interface QRParams {
  store_id: string;
  table_id: string;
  read_token: string;
}

/**
 * Rounding and calculation utilities
 */

/**
 * Floor to nearest 10 yen
 * Formula: floor(amount / 10) * 10
 */
export function floorToNearest10(amount: number): number {
  return Math.floor(amount / 10) * 10;
}

/**
 * Apply tax + service multiplier (1.20 = 10% tax + 20% service)
 * Then floor to nearest 10
 */
export function applyTaxServiceAndRound(baseAmount: number): number {
  const withTaxService = baseAmount * 1.20;
  return floorToNearest10(withTaxService);
}

/**
 * Calculate extension preview total
 * Adds extension price to current charges, applies tax/service, floors to 10
 */
export function calculateExtensionPreview(
  currentBaseAmount: number,
  extensionPrice: number
): number {
  const totalBase = currentBaseAmount + extensionPrice;
  return applyTaxServiceAndRound(totalBase);
}

/**
 * Format JPY amount for display
 * e.g., 18500 → "¥18,500"
 */
export function formatJPY(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * Parse start time to HH:MM format
 */
export function formatStartTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format minutes for display
 * e.g., 152 → "152分"
 */
export function formatMinutes(minutes: number): string {
  return `${minutes}分`;
}
