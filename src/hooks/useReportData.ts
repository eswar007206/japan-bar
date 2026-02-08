/**
 * Report Data Hooks
 * Fetch aggregated data for daily reports
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getBusinessDayRange, formatBusinessDate } from '@/lib/timezone';
import type { SeatingType } from '@/types/staff';
import { calculateChampagneShare, calculateDailyChampagnePoints } from '@/types/cast';
import type { SettingsMap } from '@/hooks/useSettings';

// ==========================================
// CAST DAILY EARNINGS
// ==========================================

interface CastDailyEarning {
  cast_id: string;
  cast_name: string;
  clock_in: string | null;
  clock_out: string | null;
  work_minutes: number;
  time_pay: number;
  hourly_rate: number;
  backs: {
    designation_20: number;
    designation_40: number;
    inhouse: number;
    companion: number;
    drinks: number;
    bottles: number;
  };
  drinks: {
    s: number;
    m: number;
    l: number;
    shot: number;
  };
  champagne_shares: number[];  // Individual shares (rounded to 1 decimal)
  champagne_points: number;    // Final floored total
  total_backs: number;
  total_points: number;
  net_payout: number;
  transport_fee: number;
}

export function useDailyCastEarnings(storeId: number, date: Date, settings?: SettingsMap) {
  const { start: dayStart, end: dayEnd } = getBusinessDayRange(date);
  const dateStr = formatBusinessDate(date);
  const welfareFee = settings?.welfare_fee ?? 1000;
  const taxRate = settings?.tax_rate != null ? settings.tax_rate / 100 : 0.9;
  const latePickupBonus = settings?.late_pickup_bonus ?? 500;

  return useQuery({
    queryKey: ['daily_cast_earnings', storeId, dateStr],
    queryFn: async (): Promise<CastDailyEarning[]> => {

      // Get all shifts for the day at this store (only approved)
      const { data: shifts, error: shiftsError } = await supabase
        .from('cast_shifts')
        .select(`
          *,
          cast_members (id, name, hourly_rate, transport_fee)
        `)
        .eq('store_id', storeId)
        .gte('clock_in', dayStart)
        .lte('clock_in', dayEnd)
        .eq('clock_in_status', 'approved'); // Only approved clock-ins

      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) return [];

      // Get all orders for the day attributed to casts who worked
      const castIds = shifts.map(s => s.cast_id);
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          products (*),
          bills!inner (store_id, start_time)
        `)
        .in('cast_id', castIds)
        .eq('bills.store_id', storeId)
        .gte('bills.start_time', dayStart)
        .lte('bills.start_time', dayEnd)
        .eq('is_cancelled', false);

      if (ordersError) throw ordersError;

      // Aggregate by cast
      const earningsBycast = new Map<string, CastDailyEarning>();

      for (const shift of shifts) {
        const cast = shift.cast_members as any;
        if (!cast) continue;

        const clockIn = new Date(shift.clock_in);
        const clockOut = shift.clock_out ? new Date(shift.clock_out) : new Date();
        const workMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
        
        // Check for late pickup (revival)
        let hourlyRate = cast.hourly_rate || 4000;
        if (shift.is_late_pickup && shift.late_pickup_start) {
          // Add late pickup bonus per hour for late pickup portion
          hourlyRate += latePickupBonus;
        }
        
        const timePay = Math.floor((workMinutes / 60) * hourlyRate);

        earningsBycast.set(cast.id, {
          cast_id: cast.id,
          cast_name: cast.name,
          clock_in: shift.clock_in,
          clock_out: shift.clock_out,
          work_minutes: workMinutes,
          time_pay: timePay,
          hourly_rate: hourlyRate,
          backs: {
            designation_20: 0,
            designation_40: 0,
            inhouse: 0,
            companion: 0,
            drinks: 0,
            bottles: 0,
          },
          drinks: { s: 0, m: 0, l: 0, shot: 0 },
          champagne_shares: [],  // Individual shares (rounded to 1 decimal each)
          champagne_points: 0,   // Will be calculated at the end (floor of sum)
          total_backs: 0,
          total_points: 0,
          net_payout: 0,
          transport_fee: cast.transport_fee || 0,
        });
      }

      // Get cast assignments to determine champagne point splits
      const billIds = [...new Set((orders || []).map(o => (o.bills as any)?.id || o.bill_id).filter(Boolean))];
      const { data: assignments } = billIds.length > 0
        ? await supabase
            .from('cast_table_assignments')
            .select('bill_id, cast_id')
            .in('bill_id', billIds)
            .eq('is_active', true)
        : { data: [] };

      // Count casts per bill for champagne splitting
      const castsPerBill = new Map<string, string[]>();
      assignments?.forEach(a => {
        const list = castsPerBill.get(a.bill_id) || [];
        list.push(a.cast_id);
        castsPerBill.set(a.bill_id, list);
      });

      // Process orders
      for (const order of orders || []) {
        const earning = earningsBycast.get(order.cast_id!);
        if (!earning) continue;

        const product = order.products as any;
        if (!product) continue;

        const backAmount = (order.back_amount || 0) * order.quantity;
        const points = (order.points_amount || 0) * order.quantity;

        // Categorize backs
        if (product.category === 'extension') {
          if (product.name_jp.includes('本指名')) {
            if (product.name_jp.includes('20分')) {
              earning.backs.designation_20 += order.quantity;
            } else {
              earning.backs.designation_40 += order.quantity;
            }
          } else if (product.name_jp.includes('場内')) {
            earning.backs.inhouse += order.quantity;
          }
        } else if (product.category === 'companion') {
          earning.backs.companion += order.quantity;
        } else if (product.category === 'drinks') {
          earning.backs.drinks += backAmount;
          // Count by size
          if (product.name_jp.includes('S')) {
            earning.drinks.s += order.quantity;
          } else if (product.name_jp.includes('M')) {
            earning.drinks.m += order.quantity;
          } else if (product.name_jp.includes('L')) {
            earning.drinks.l += order.quantity;
          } else if (product.name_jp.includes('ショット')) {
            earning.drinks.shot += order.quantity;
          }
        } else if (product.category === 'bottles') {
          earning.backs.bottles += backAmount;
          
          // ============================================
          // CHAMPAGNE POINT SHARING LOGIC
          // Split points among all casts assigned to the bill
          // Each share rounded to 1 decimal, then floor the daily total
          // ============================================
          const billId = order.bill_id;
          const castsOnBill = castsPerBill.get(billId) || [order.cast_id!];
          const numDrinkers = castsOnBill.length;
          
          // Calculate this cast's share (rounded to 1 decimal)
          const share = calculateChampagneShare(points, numDrinkers);
          earning.champagne_shares.push(share);
        }

        earning.total_backs += backAmount;
        earning.total_points += points;
      }

      // Calculate net payouts with proper champagne point calculation
      for (const earning of earningsBycast.values()) {
        // Calculate final champagne points (floor of sum of all shares)
        earning.champagne_points = calculateDailyChampagnePoints(earning.champagne_shares);
        
        // Formula: (time_pay + backs + bonus) * taxRate - welfare - transport
        const subtotal = earning.time_pay + earning.total_backs;
        const afterTax = subtotal * taxRate;
        const netBeforeRounding = afterTax - welfareFee - earning.transport_fee;
        earning.net_payout = Math.floor(netBeforeRounding / 10) * 10;
      }

      return Array.from(earningsBycast.values()).sort((a, b) => 
        (a.clock_in || '').localeCompare(b.clock_in || '')
      );
    },
    enabled: !!storeId,
  });
}

// ==========================================
// DAILY REPORT (日計表)
// ==========================================

interface DailyReportData {
  groups: number;
  avgPerCustomer: number;
  hourlyEntries: Record<string, number>;
  sales: number;
  cardSales: number;
}

export function useDailyReport(storeId: number | 'both', date: Date) {
  const { start: dayStart, end: dayEnd } = getBusinessDayRange(date);
  const dateStr = formatBusinessDate(date);

  return useQuery({
    queryKey: ['daily_report', storeId, dateStr],
    queryFn: async (): Promise<DailyReportData> => {

      // Get all bills for the day (exclude cancelled)
      let billsQuery = supabase
        .from('bills')
        .select('*')
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .neq('payment_method', 'cancelled');

      if (storeId !== 'both') {
        billsQuery = billsQuery.eq('store_id', storeId);
      }

      const { data: bills, error: billsError } = await billsQuery;
      if (billsError) throw billsError;

      const billIds = bills?.map(b => b.id) || [];

      // Get orders for those bills
      const { data: orders } = billIds.length > 0
        ? await supabase
            .from('orders')
            .select('*, products (*)')
            .in('bill_id', billIds)
            .eq('is_cancelled', false)
        : { data: [] };

      // Get price adjustments for those bills
      const { data: adjustments } = billIds.length > 0
        ? await supabase
            .from('price_adjustments')
            .select('*')
            .in('bill_id', billIds)
        : { data: [] };

      // Calculate totals
      let totalSales = 0;
      const salesByBill = new Map<string, number>();
      orders?.forEach(order => {
        const product = order.products as any;
        const price = order.unit_price * order.quantity;
        const isTaxable = product?.tax_applicable ?? true;
        const orderTotal = isTaxable ? Math.floor(price * 1.2) : price;
        totalSales += orderTotal;
        salesByBill.set(order.bill_id, (salesByBill.get(order.bill_id) || 0) + orderTotal);
      });

      // Apply adjustments
      let totalAdjustments = 0;
      adjustments?.forEach(adj => {
        totalAdjustments += adj.adjusted_amount;
      });
      totalSales += totalAdjustments;
      totalSales = Math.floor(totalSales / 10) * 10;

      // Payment method breakdown
      let cardSales = 0;
      bills?.forEach(bill => {
        const billTotal = Math.floor((salesByBill.get(bill.id) || 0) / 10) * 10;
        if (bill.payment_method === 'card' || bill.payment_method === 'qr' || bill.payment_method === 'contactless') {
          cardSales += billTotal;
        }
      });

      // Hourly breakdown
      const hourlyEntries: Record<string, number> = {};
      bills?.forEach(bill => {
        const hour = new Date(bill.start_time).getHours();
        const hourLabel = `${hour}時`;
        hourlyEntries[hourLabel] = (hourlyEntries[hourLabel] || 0) + 1;
      });

      const groups = bills?.length || 0;
      const avgPerCustomer = groups > 0 ? Math.floor(totalSales / groups) : 0;

      return {
        groups,
        avgPerCustomer,
        hourlyEntries,
        sales: totalSales,
        cardSales,
      };
    },
  });
}

// ==========================================
// SESSION LOG (来店記録)
// ==========================================

interface SessionLogEntry {
  id: string;
  start_time: string;
  close_time: string | null;
  customer_count: number;
  seating_type: SeatingType;
  table_label: string;
  extensions: Array<{ minutes: number; type: SeatingType }>;
  base_charge: number;
  total: number;
  notes: string | null;
}

export function useSessionLog(storeId: number, date: Date) {
  const { start: dayStart, end: dayEnd } = getBusinessDayRange(date);
  const dateStr = formatBusinessDate(date);

  return useQuery({
    queryKey: ['session_log', storeId, dateStr],
    queryFn: async (): Promise<SessionLogEntry[]> => {

      // Get all bills for the day (exclude cancelled)
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select(`
          *,
          floor_tables (label)
        `)
        .eq('store_id', storeId)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .neq('payment_method', 'cancelled')
        .order('start_time');

      if (billsError) throw billsError;
      if (!bills) return [];

      // Get orders for each bill
      const billIds = bills.map(b => b.id);
      const { data: allOrders } = billIds.length > 0
        ? await supabase
            .from('orders')
            .select('*, products (*)')
            .in('bill_id', billIds)
            .eq('is_cancelled', false)
        : { data: [] };

      // Group orders by bill
      const ordersByBill = new Map<string, typeof allOrders>();
      allOrders?.forEach(order => {
        const list = ordersByBill.get(order.bill_id) || [];
        list.push(order);
        ordersByBill.set(order.bill_id, list);
      });

      return bills.map(bill => {
        const orders = ordersByBill.get(bill.id) || [];
        const table = bill.floor_tables as any;

        // Calculate total
        let total = 0;
        const extensions: Array<{ minutes: number; type: SeatingType }> = [];

        orders.forEach(order => {
          const product = order.products as any;
          const price = order.unit_price * order.quantity;
          const isTaxable = product?.tax_applicable ?? true;
          total += isTaxable ? Math.floor(price * 1.2) : price;

          // Track extensions
          if (product?.category === 'extension') {
            const minutes = product.name_jp.includes('20分') ? 20 : 40;
            const type: SeatingType = product.name_jp.includes('本指名') 
              ? 'designated' 
              : product.name_jp.includes('場内') 
                ? 'inhouse' 
                : 'free';
            for (let i = 0; i < order.quantity; i++) {
              extensions.push({ minutes, type });
            }
          }
        });

        total = Math.floor(total / 10) * 10;

        // Base charge (set menu)
        const baseCharge = orders.find(o => (o.products as any)?.category === 'set')
          ? orders.find(o => (o.products as any)?.category === 'set')!.unit_price
          : 0;

        return {
          id: bill.id,
          start_time: bill.start_time,
          close_time: bill.close_time,
          customer_count: 1, // Would need customer count tracking
          seating_type: (bill.seating_type || 'free') as SeatingType,
          table_label: table?.label || '-',
          extensions,
          base_charge: baseCharge,
          total,
          notes: bill.notes,
        };
      });
    },
  });
}

// ==========================================
// SAVE DAILY REPORT (日締め)
// ==========================================

export function useSaveDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      date,
      totalSales,
      totalBills,
      totalCustomers,
      isWeekendHoliday,
      bonusTier,
      bonusPerPoint,
    }: {
      storeId: number;
      date: Date;
      totalSales: number;
      totalBills: number;
      totalCustomers: number;
      isWeekendHoliday: boolean;
      bonusTier: number;
      bonusPerPoint: number;
    }) => {
      const reportDate = formatBusinessDate(date);

      // Check if report already exists
      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('store_id', storeId)
        .eq('report_date', reportDate)
        .maybeSingle();

      if (existing) {
        // Update existing report
        const { data, error } = await supabase
          .from('daily_reports')
          .update({
            total_sales: totalSales,
            total_bills: totalBills,
            total_customers: totalCustomers,
            is_weekend_holiday: isWeekendHoliday,
            bonus_tier: bonusTier,
            bonus_per_point: bonusPerPoint,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new report
        const { data, error } = await supabase
          .from('daily_reports')
          .insert({
            store_id: storeId,
            report_date: reportDate,
            total_sales: totalSales,
            total_bills: totalBills,
            total_customers: totalCustomers,
            is_weekend_holiday: isWeekendHoliday,
            bonus_tier: bonusTier,
            bonus_per_point: bonusPerPoint,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_report'] });
    },
  });
}
