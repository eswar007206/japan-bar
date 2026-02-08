/**
 * Cast Data Hooks
 * Fetches stores, tables, products, bills, shifts, and earnings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  calculateNetPayout,
  calculateDrinkPoints,
  calculateDailyBonus,
  calculateShiftTimePay,
  calculateChampagneShare,
  calculateDailyChampagnePoints,
  isInHouseExtension,
  isDesignatedExtension,
  isWeekendOrHoliday,
  type CastEarningsBreakdown,
  type ProductCategory,
} from '@/types/cast';
import type {
  Store,
  FloorTable,
  Product,
  Bill,
  Order,
  CastShift,
  BillDesignation
} from '@/types/cast';
import type { SettingsMap } from '@/hooks/useSettings';
import { getBusinessDayRange, getBusinessDate } from '@/lib/timezone';

// Check if product is any extension type
function isExtensionProduct(product: Product): boolean {
  return isInHouseExtension(product) || isDesignatedExtension(product);
}

// Fetch all stores
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async (): Promise<Store[]> => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data as Store[];
    },
  });
}

// Fetch tables for a specific store with bill info
export function useFloorTables(storeId: number | null) {
  return useQuery({
    queryKey: ['floor_tables', storeId],
    queryFn: async (): Promise<FloorTable[]> => {
      if (!storeId) return [];

      const { data: tables, error: tablesError } = await supabase
        .from('floor_tables')
        .select('*')
        .eq('store_id', storeId)
        .order('label');
      
      if (tablesError) throw tablesError;

      // Get open bills with their totals
      const { data: openBills } = await supabase
        .from('bills')
        .select(`
          id,
          table_id,
          start_time,
          base_minutes
        `)
        .eq('store_id', storeId)
        .eq('status', 'open');

      const billsByTable = new Map(openBills?.map(b => [b.table_id, b]) || []);

      // Calculate totals for each bill
      const tablesWithBillInfo = await Promise.all((tables as FloorTable[]).map(async (table) => {
        const bill = billsByTable.get(table.id);
        
        if (!bill) {
          return { ...table, has_open_bill: false };
        }

        // Get orders for this bill
        const { data: orders } = await supabase
          .from('orders')
          .select('unit_price, quantity, product_id')
          .eq('bill_id', bill.id);

        // Get products to check tax_applicable
        const productIds = orders?.map(o => o.product_id) || [];
        const { data: products } = await supabase
          .from('products')
          .select('id, tax_applicable')
          .in('id', productIds);

        const productTaxMap = new Map(products?.map(p => [p.id, p.tax_applicable]) || []);

        // Calculate total with tax
        const currentTotal = orders?.reduce((sum, order) => {
          const price = order.unit_price * order.quantity;
          const isTaxable = productTaxMap.get(order.product_id) ?? true;
          return sum + (isTaxable ? Math.floor(price * 1.2) : price);
        }, 0) || 0;

        // Calculate remaining time
        const startTime = new Date(bill.start_time);
        const now = new Date();
        const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        const remainingMinutes = bill.base_minutes - elapsedMinutes;

        return {
          ...table,
          has_open_bill: true,
          current_total: currentTotal,
          remaining_minutes: remainingMinutes,
        };
      }));

      return tablesWithBillInfo;
    },
    enabled: !!storeId,
    refetchInterval: 10000,
  });
}

// Fetch products by category
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

// Fetch open bill for a table
export function useTableBill(tableId: string | null) {
  return useQuery({
    queryKey: ['table_bill', tableId],
    queryFn: async (): Promise<Bill | null> => {
      if (!tableId) return null;

      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'open')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Bill | null;
    },
    enabled: !!tableId,
  });
}

// Get bill designation for a cast
export function useBillDesignation(billId: string | null, castId: string | null) {
  return useQuery({
    queryKey: ['bill_designation', billId, castId],
    queryFn: async (): Promise<BillDesignation | null> => {
      if (!billId || !castId) return null;

      const { data, error } = await supabase
        .from('bill_designations')
        .select('*')
        .eq('bill_id', billId)
        .eq('cast_id', castId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as BillDesignation | null;
    },
    enabled: !!billId && !!castId,
  });
}

// Add order to bill with designation tracking
export function useAddOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billId,
      productId,
      castId,
      unitPrice,
      backAmount,
      pointsAmount,
      product,
    }: {
      billId: string;
      productId: string;
      castId: string;
      unitPrice: number;
      backAmount: number;
      pointsAmount: number;
      product: Product;
    }) => {
      // Insert the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          bill_id: billId,
          product_id: productId,
          cast_id: castId,
          quantity: 1,
          unit_price: unitPrice,
          back_amount: backAmount,
          points_amount: pointsAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Check if this is an extension product that affects designation
      if (isExtensionProduct(product)) {
        // Get or create bill designation
        const { data: existing } = await supabase
          .from('bill_designations')
          .select('*')
          .eq('bill_id', billId)
          .eq('cast_id', castId)
          .single();

        if (existing) {
          const newCount = (existing.extension_count || 0) + 1;
          const shouldDesignate = newCount >= 3 && !existing.is_designated;

          await supabase
            .from('bill_designations')
            .update({
              extension_count: newCount,
              is_designated: shouldDesignate || existing.is_designated,
              designated_at: shouldDesignate ? new Date().toISOString() : existing.designated_at,
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('bill_designations')
            .insert({
              bill_id: billId,
              cast_id: castId,
              extension_count: 1,
              is_designated: false,
            });
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table_bill'] });
      queryClient.invalidateQueries({ queryKey: ['cast_earnings'] });
      queryClient.invalidateQueries({ queryKey: ['floor_tables'] });
      queryClient.invalidateQueries({ queryKey: ['bill_orders'] });
      queryClient.invalidateQueries({ queryKey: ['bill_designation'] });
    },
  });
}

// Fetch orders for a bill
export function useBillOrders(billId: string | null) {
  return useQuery({
    queryKey: ['bill_orders', billId],
    queryFn: async (): Promise<Order[]> => {
      if (!billId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (*)
        `)
        .eq('bill_id', billId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(order => ({
        ...order,
        product: order.products as unknown as Product,
      })) as Order[];
    },
    enabled: !!billId,
  });
}

// Cast shift management
export function useCurrentShift(castId: string | null) {
  return useQuery({
    queryKey: ['current_shift', castId],
    queryFn: async (): Promise<CastShift | null> => {
      if (!castId) return null;

      const { start: dayStart } = getBusinessDayRange(getBusinessDate());

      // Get today's shift (approved or pending)
      const { data, error } = await supabase
        .from('cast_shifts')
        .select('*')
        .eq('cast_id', castId)
        .gte('clock_in', dayStart)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CastShift | null;
    },
    enabled: !!castId,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ castId, storeId }: { castId: string; storeId: number }) => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .insert({
          cast_id: castId,
          store_id: storeId,
          clock_in: new Date().toISOString(),
          clock_in_status: 'pending', // Requires staff approval
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_shift'] });
      queryClient.invalidateQueries({ queryKey: ['pending_shift_approvals'] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId }: { shiftId: string }) => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .update({
          clock_out: new Date().toISOString(),
          clock_out_status: 'pending', // Requires staff approval
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_shift'] });
      queryClient.invalidateQueries({ queryKey: ['cast_earnings'] });
      queryClient.invalidateQueries({ queryKey: ['pending_shift_approvals'] });
    },
  });
}

// Fetch cast earnings for today with full calculation engine
// Aggregates across ALL stores for cross-store wage calculation
export function useCastEarnings(
  castId: string | null,
  hourlyRate: number = 4000,
  transportFee: number = 0,
  settings?: SettingsMap
) {
  const welfareFee = settings?.welfare_fee ?? 1000;
  const taxRate = settings?.tax_rate != null ? settings.tax_rate / 100 : 0.9;
  const latePickupBonus = settings?.late_pickup_bonus ?? 500;
  const referralBonusAmount = settings?.referral_bonus ?? 2000;

  return useQuery({
    queryKey: ['cast_earnings', castId],
    queryFn: async (): Promise<CastEarningsBreakdown> => {
      const emptyEarnings: CastEarningsBreakdown = {
        shifts: [],
        total_work_minutes: 0,
        total_time_pay: 0,
        has_late_pickup: false,
        total_backs: 0,
        backs_by_category: {
          set: 0,
          extension: 0,
          nomination: 0,
          companion: 0,
          drinks: 0,
          bottles: 0,
        },
        drink_s_units: 0,
        drink_points: 0,
        champagne_points: 0,
        total_points: 0,
        orders_count: 0,
        store_sales: 0,
        bonus_per_point: 0,
        bonus_amount: 0,
        bonus_qualified: false,
        subtotal: 0,
        tax_rate: taxRate,
        after_tax: 0,
        welfare_fee: welfareFee,
        transport_fee: transportFee,
        gross_amount: 0,
        net_payout: 0,
        referral_count: 0,
        referral_bonus: 0,
      };

      if (!castId) return emptyEarnings;

      // Get today's business day range in UTC
      const businessDate = getBusinessDate();
      const { start: dayStart } = getBusinessDayRange(businessDate);

      // Fetch all required data in parallel (NO store filter - cross-store)
      const [ordersResult, shiftsResult, storeSalesResult, referralsResult] = await Promise.all([
        // Get today's orders across ALL stores
        supabase
          .from('orders')
          .select(`
            id,
            back_amount,
            points_amount,
            is_cancelled,
            bill_id,
            products (id, category, drink_units, points, name_jp)
          `)
          .eq('cast_id', castId)
          .eq('is_cancelled', false)
          .gte('created_at', dayStart),

        // Get today's shifts across ALL stores (only approved)
        supabase
          .from('cast_shifts')
          .select('id, clock_in, clock_out, is_late_pickup, late_pickup_start, store_id')
          .eq('cast_id', castId)
          .gte('clock_in', dayStart)
          .eq('clock_in_status', 'approved'), // Only count approved shifts

        // Get store sales for bonus calculation (per store)
        supabase
          .from('orders')
          .select(`
            unit_price,
            quantity,
            is_cancelled,
            bills!inner (store_id, start_time)
          `)
          .eq('is_cancelled', false)
          .gte('bills.start_time', dayStart),

        // Get referral count (people this cast referred who worked today)
        supabase
          .from('cast_shifts')
          .select('id, cast_id, cast_members!inner(referred_by)')
          .eq('cast_members.referred_by', castId)
          .gte('clock_in', dayStart),
      ]);

      if (ordersResult.error) throw ordersResult.error;

      // Process shifts with late pickup calculation (across all stores)
      const shifts = (shiftsResult.data || []).map(shift => {
        return calculateShiftTimePay(
          new Date(shift.clock_in),
          shift.clock_out ? new Date(shift.clock_out) : null,
          hourlyRate,
          shift.is_late_pickup || false,
          shift.late_pickup_start ? new Date(shift.late_pickup_start) : null,
          latePickupBonus
        );
      });

      const totalWorkMinutes = shifts.reduce((sum, s) => sum + s.work_minutes, 0);
      const totalTimePay = shifts.reduce((sum, s) => sum + s.time_pay, 0);
      const hasLatePickup = shifts.some(s => s.is_late_pickup);

      // Process orders - backs by category (across all stores)
      const orders = ordersResult.data || [];
      const backsByCategory: Record<ProductCategory, number> = {
        set: 0,
        extension: 0,
        nomination: 0,
        companion: 0,
        drinks: 0,
        bottles: 0,
      };

      let drinkSUnits = 0;
      let champagnePoints = 0;

      orders.forEach(order => {
        const product = order.products as unknown as Product;
        if (product?.category) {
          backsByCategory[product.category as ProductCategory] += order.back_amount || 0;

          // Drink S-units
          if (product.category === 'drinks') {
            drinkSUnits += product.drink_units || 0;
          }

          // Champagne points (full points for now, split logic handled elsewhere)
          if (product.category === 'bottles') {
            champagnePoints += product.points || 0;
          }
        }
      });

      const totalBacks = Object.values(backsByCategory).reduce((sum, v) => sum + v, 0);
      const drinkPoints = calculateDrinkPoints(drinkSUnits);
      const totalPoints = drinkPoints + champagnePoints;

      // Calculate bonus PER STORE (bonus threshold is per-store, not combined)
      // Get unique store IDs from shifts
      const storeIds = [...new Set((shiftsResult.data || []).map(s => s.store_id))];
      const isWeekend = isWeekendOrHoliday(businessDate);

      // Calculate sales per store
      const salesByStore = new Map<number, number>();
      (storeSalesResult.data || []).forEach(order => {
        const bill = order.bills as any;
        const storeId = bill?.store_id;
        if (storeId) {
          const amount = (order.unit_price || 0) * (order.quantity || 1);
          salesByStore.set(storeId, (salesByStore.get(storeId) || 0) + amount);
        }
      });

      // Calculate bonus from each store and take the best qualifying one
      let totalBonusAmount = 0;
      let bestBonusPerPoint = 0;
      let anyBonusQualified = false;
      let totalStoreSales = 0;

      for (const stId of storeIds) {
        const stSales = salesByStore.get(stId) || 0;
        totalStoreSales += stSales;
        const bonus = calculateDailyBonus(stSales, totalPoints, isWeekend, {
          thresholdWeekday: settings?.bonus_threshold_weekday,
          thresholdWeekend: settings?.bonus_threshold_weekend,
          increment: settings?.bonus_increment,
          baseBonus: settings?.bonus_base_per_point,
          maxBonus: settings?.bonus_max_per_point,
        });
        if (bonus.qualified) {
          anyBonusQualified = true;
          if (bonus.bonusPerPoint > bestBonusPerPoint) {
            bestBonusPerPoint = bonus.bonusPerPoint;
          }
          totalBonusAmount += bonus.totalBonus;
        }
      }

      // Calculate net payout
      const payout = calculateNetPayout(
        totalTimePay,
        totalBacks,
        totalBonusAmount,
        welfareFee,
        transportFee,
        taxRate
      );

      // Referral bonus
      const referralCount = referralsResult.data?.length || 0;
      const referralBonus = referralCount * referralBonusAmount;

      return {
        shifts,
        total_work_minutes: totalWorkMinutes,
        total_time_pay: totalTimePay,
        has_late_pickup: hasLatePickup,
        total_backs: totalBacks,
        backs_by_category: backsByCategory,
        drink_s_units: drinkSUnits,
        drink_points: drinkPoints,
        champagne_points: champagnePoints,
        total_points: totalPoints,
        orders_count: orders.length,
        store_sales: totalStoreSales,
        bonus_per_point: bestBonusPerPoint,
        bonus_amount: totalBonusAmount,
        bonus_qualified: anyBonusQualified,
        subtotal: payout.subtotal,
        tax_rate: taxRate,
        after_tax: payout.afterTax,
        welfare_fee: welfareFee,
        transport_fee: transportFee,
        gross_amount: payout.afterTax,
        net_payout: payout.net,
        referral_count: referralCount,
        referral_bonus: referralBonus,
      };
    },
    enabled: !!castId,
    refetchInterval: 30000,
  });
}
