/**
 * Girls Bar Fairy - Billing Service
 * Real Supabase-connected service for customer bill data
 */

import { supabase } from '@/integrations/supabase/client';
import { CustomerBillResponse, CustomerOrderItem, floorToNearest10 } from '@/types/billing';

/**
 * Shared helper: build a CustomerBillResponse from a bill row + its orders
 */
function buildBillResponse(
  bill: any,
  orders: any[]
): CustomerBillResponse {
  const store = bill.stores as any;
  const table = bill.floor_tables as any;

  // Calculate current total from orders
  let baseTotal = 0;
  const orderItems: CustomerOrderItem[] = [];

  (orders || []).forEach(order => {
    const product = order.products as any;
    if (!product) return;

    const isTaxable = product.tax_applicable ?? true;
    const linePrice = order.unit_price * order.quantity;
    const lineTotal = isTaxable ? Math.floor(linePrice * 1.2) : linePrice;
    baseTotal += lineTotal;

    orderItems.push({
      name_jp: product.name_jp,
      quantity: order.quantity,
      unit_price: order.unit_price,
      tax_applicable: isTaxable,
      category: product.category,
    });
  });

  const currentTotal = floorToNearest10(baseTotal);

  // Calculate time
  const startTime = new Date(bill.start_time);
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  // Calculate total allowed minutes (base + extensions)
  const extensionOrders = (orders || []).filter(o => {
    const product = o.products as any;
    return product?.category === 'extension';
  });
  let totalExtensionMinutes = 0;
  extensionOrders.forEach(o => {
    const product = o.products as any;
    if (product?.name_jp?.includes('20分')) {
      totalExtensionMinutes += 20 * o.quantity;
    } else if (product?.name_jp?.includes('40分')) {
      totalExtensionMinutes += 40 * o.quantity;
    }
  });

  const totalMinutes = (bill.base_minutes || 60) + totalExtensionMinutes;
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);

  // Extension preview - estimate next extension cost
  const extensionPreviewPrice = 3000; // 40分フリー延長 base
  const extensionPreviewTotal = floorToNearest10(baseTotal + Math.floor(extensionPreviewPrice * 1.2));

  return {
    store_id: bill.store_id,
    store_name: store?.name || 'Girls Bar Fairy',
    table_id: bill.table_id,
    table_label: table?.label || '',
    start_time: bill.start_time,
    elapsed_minutes: elapsedMinutes,
    remaining_minutes: remainingMinutes,
    current_total: currentTotal,
    show_extension_preview: remainingMinutes <= 5,
    extension_preview_total: extensionPreviewTotal,
    accepted_payment_methods: ['cash', 'card', 'qr', 'contactless'],
    footer_note: '別途 税・サ20%',
    last_updated: now.toISOString(),
    order_items: orderItems,
    seating_type: bill.seating_type || 'free',
    base_minutes: bill.base_minutes || 60,
  };
}

const BILL_SELECT = `
  id,
  table_id,
  store_id,
  status,
  start_time,
  base_minutes,
  read_token,
  seating_type,
  stores (id, name),
  floor_tables (id, label)
`;

async function fetchOrdersForBill(billId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      quantity,
      unit_price,
      is_cancelled,
      products (name_jp, category, tax_applicable, price)
    `)
    .eq('bill_id', billId)
    .eq('is_cancelled', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch customer bill data from Supabase using read_token
 */
export async function fetchCustomerBill(readToken: string): Promise<CustomerBillResponse> {
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select(BILL_SELECT)
    .eq('read_token', readToken)
    .eq('status', 'open')
    .single();

  if (billError || !bill) {
    throw new Error('Bill not found');
  }

  const orders = await fetchOrdersForBill(bill.id);
  return buildBillResponse(bill, orders);
}

/**
 * Fetch customer bill data by table_id (for permanent QR codes)
 * Returns null if no open bill exists for the table
 */
export async function fetchCustomerBillByTable(tableId: string): Promise<CustomerBillResponse | null> {
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select(BILL_SELECT)
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle();

  if (billError) throw billError;
  if (!bill) return null;

  const orders = await fetchOrdersForBill(bill.id);
  return buildBillResponse(bill, orders);
}

/**
 * Check if a bill exists for the given token
 */
export async function checkBillExists(readToken: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bills')
    .select('id')
    .eq('read_token', readToken)
    .eq('status', 'open')
    .maybeSingle();

  return !error && !!data;
}

// API endpoint for production (would be environment variable)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Production API call - now uses real Supabase queries
 */
export async function fetchCustomerBillAPI(readToken: string): Promise<CustomerBillResponse> {
  return fetchCustomerBill(readToken);
}

/**
 * Production API call - table-based lookup
 */
export async function fetchCustomerBillByTableAPI(tableId: string): Promise<CustomerBillResponse | null> {
  return fetchCustomerBillByTable(tableId);
}
