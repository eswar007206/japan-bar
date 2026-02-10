/**
 * Staff Data Hooks
 * Fetch and mutate data for staff dashboard
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TableSession, SeatingType, CastAssignment } from '@/types/staff';
import type { FloorTable, Product, Order } from '@/types/cast';
import { generateReadToken } from '@/types/staff';
import { getBusinessDayRange, getBusinessDate } from '@/lib/timezone';

// ==========================================
// TABLE SESSIONS (BILLS) QUERIES
// ==========================================

interface TableWithSession extends FloorTable {
  bill?: TableSession | null;
}

export function useStaffFloorTables(storeId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['staff_floor_tables', storeId],
    queryFn: async (): Promise<TableWithSession[]> => {
      if (!storeId) return [];

      // Get all tables for the store
      const { data: tables, error: tablesError } = await supabase
        .from('floor_tables')
        .select('*')
        .eq('store_id', storeId)
        .order('label');
      
      if (tablesError) throw tablesError;

      // Get open bills for this store
      const { data: openBills, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'open');

      if (billsError) throw billsError;

      // Map bills to tables
      const billsByTable = new Map(openBills?.map(b => [b.table_id, b]) || []);

      // Get orders for open bills to calculate totals
      const billIds = openBills?.map(b => b.id) || [];
      const { data: orders } = billIds.length > 0 
        ? await supabase
            .from('orders')
            .select('bill_id, unit_price, quantity, product_id, is_cancelled, products(category)')
            .in('bill_id', billIds)
            .eq('is_cancelled', false)
        : { data: [] };

      // Get products for tax calculation
      const productIds = [...new Set(orders?.map(o => o.product_id) || [])];
      const { data: products } = productIds.length > 0
        ? await supabase
            .from('products')
            .select('id, tax_applicable')
            .in('id', productIds)
        : { data: [] };

      const productTaxMap = new Map<string, boolean>(products?.map(p => [p.id, p.tax_applicable ?? true] as [string, boolean]) || []);

      // Calculate totals per bill and count extensions
      const billTotals = new Map<string, number>();
      const billOrderCounts = new Map<string, number>();
      const billExtensionCounts = new Map<string, number>();
      
      orders?.forEach(order => {
        const price = order.unit_price * order.quantity;
        const isTaxable = productTaxMap.get(order.product_id) ?? true;
        const total = isTaxable ? Math.floor(price * 1.2) : price;
        
        billTotals.set(order.bill_id, (billTotals.get(order.bill_id) || 0) + total);
        billOrderCounts.set(order.bill_id, (billOrderCounts.get(order.bill_id) || 0) + 1);
        
        // Count extensions for auto-upgrade tracking
        const category = (order.products as any)?.category;
        if (category === 'extension') {
          billExtensionCounts.set(order.bill_id, (billExtensionCounts.get(order.bill_id) || 0) + order.quantity);
        }
      });

      // Get cast assignments
      const { data: assignments } = billIds.length > 0
        ? await supabase
            .from('cast_table_assignments')
            .select(`
              *,
              cast_members (name)
            `)
            .in('bill_id', billIds)
            .eq('is_active', true)
        : { data: [] };

      const assignmentsByBill = new Map<string, CastAssignment[]>();
      assignments?.forEach(a => {
        const list = assignmentsByBill.get(a.bill_id) || [];
        list.push({
          ...a,
          cast_name: (a.cast_members as any)?.name || 'Unknown',
        });
        assignmentsByBill.set(a.bill_id, list);
      });

      // Combine tables with bill info
      return (tables as FloorTable[]).map(table => {
        const bill = billsByTable.get(table.id);
        
        if (!bill) {
          return { ...table, bill: null };
        }

        // Calculate remaining time
        const startTime = new Date(bill.start_time);
        const now = new Date();
        const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        const remainingMinutes = (bill.base_minutes || 60) - elapsedMinutes;

        const session: TableSession = {
          id: bill.id,
          table_id: bill.table_id,
          store_id: bill.store_id,
          start_time: bill.start_time,
          base_minutes: bill.base_minutes || 60,
          seating_type: (bill.seating_type || 'free') as SeatingType,
          status: bill.status as 'open' | 'closed',
          close_time: bill.close_time,
          read_token: bill.read_token,
          notes: bill.notes,
          table_label: table.label,
          current_total: Math.floor((billTotals.get(bill.id) || 0) / 10) * 10,
          remaining_minutes: remainingMinutes,
          elapsed_minutes: elapsedMinutes,
          orders_count: billOrderCounts.get(bill.id) || 0,
          extension_count: billExtensionCounts.get(bill.id) || 0,
          payment_method: bill.payment_method || null,
          assigned_casts: assignmentsByBill.get(bill.id) || [],
        };

        return { ...table, bill: session };
      });
    },
    enabled: !!storeId,
    refetchInterval: 5000, // Faster refresh for staff
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`staff-store-${storeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', storeId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', storeId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cast_table_assignments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', storeId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);

  return query;
}

// ==========================================
// SESSION MANAGEMENT MUTATIONS
// ==========================================

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tableId,
      storeId,
      seatingType,
      baseMinutes = 40,
    }: {
      tableId: string;
      storeId: number;
      seatingType: SeatingType;
      baseMinutes?: number;
    }) => {
      const readToken = generateReadToken();

      const { data, error } = await supabase
        .from('bills')
        .insert({
          table_id: tableId,
          store_id: storeId,
          seating_type: seatingType,
          base_minutes: baseMinutes,
          read_token: readToken,
          status: 'open',
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['floor_tables', variables.storeId] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billId,
      storeId,
      paymentMethod,
    }: {
      billId: string;
      storeId: number;
      paymentMethod?: string;
    }) => {
      const { data, error } = await supabase
        .from('bills')
        .update({
          status: 'closed',
          close_time: new Date().toISOString(),
          payment_method: paymentMethod || null,
        })
        .eq('id', billId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['floor_tables', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['daily_report'] });
      queryClient.invalidateQueries({ queryKey: ['daily_sales_stats'] });
    },
  });
}

export function useExtendSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billId,
      additionalMinutes,
      storeId,
      extensionType = 'free',
    }: {
      billId: string;
      additionalMinutes: number;
      storeId: number;
      extensionType?: 'free' | 'inhouse' | 'designated';
    }) => {
      // Get current bill with extension count
      const { data: bill, error: fetchError } = await supabase
        .from('bills')
        .select('base_minutes, seating_type')
        .eq('id', billId)
        .single();

      if (fetchError) throw fetchError;

      // Count existing extensions for this bill
      const { data: orders } = await supabase
        .from('orders')
        .select('id, products!inner(category, name_jp)')
        .eq('bill_id', billId)
        .eq('is_cancelled', false);

      const extensionCount = orders?.filter(o => 
        (o.products as any)?.category === 'extension'
      ).length || 0;

      const newExtensionCount = extensionCount + 1;
      const newMinutes = (bill.base_minutes || 60) + additionalMinutes;

      // ============================================
      // AUTO TABLE UPGRADE RULE (テーブル昇格システム)
      // On 3rd extension at a FREE seat, auto-upgrade to DESIGNATED
      // From this point, backs and points use designated rates
      // ============================================
      let newSeatingType = bill.seating_type || 'free';
      
      if (newSeatingType === 'free' && newExtensionCount >= 3) {
        // Auto-upgrade to designated on 3rd extension!
        newSeatingType = 'designated';
        console.log(`[TABLE UPGRADE] Bill ${billId}: FREE → DESIGNATED on extension #${newExtensionCount}`);
      }

      const { data, error } = await supabase
        .from('bills')
        .update({
          base_minutes: newMinutes,
          seating_type: newSeatingType,
        })
        .eq('id', billId)
        .select()
        .single();

      if (error) throw error;
      
      return { 
        ...data, 
        wasUpgraded: newSeatingType !== bill.seating_type,
        extensionCount: newExtensionCount,
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['floor_tables', variables.storeId] });
    },
  });
}

// ==========================================
// ORDER MANAGEMENT
// ==========================================

export function useBillOrdersStaff(billId: string | null) {
  return useQuery({
    queryKey: ['staff_bill_orders', billId],
    queryFn: async (): Promise<Order[]> => {
      if (!billId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (*),
          cast_members (name)
        `)
        .eq('bill_id', billId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(order => ({
        ...order,
        product: order.products as unknown as Product,
        cast_name: (order.cast_members as any)?.name || null,
      })) as Order[];
    },
    enabled: !!billId,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      staffId,
      reason,
    }: {
      orderId: string;
      staffId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({
          is_cancelled: true,
          cancelled_by: staffId,
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason || null,
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_bill_orders'] });
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables'] });
    },
  });
}

// ==========================================
// CAST ASSIGNMENT
// ==========================================

export function useAssignCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billId,
      castId,
    }: {
      billId: string;
      castId: string;
    }) => {
      const { data, error } = await supabase
        .from('cast_table_assignments')
        .insert({
          bill_id: billId,
          cast_id: castId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables'] });
    },
  });
}

export function useUnassignCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
    }: {
      assignmentId: string;
    }) => {
      const { data, error } = await supabase
        .from('cast_table_assignments')
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables'] });
    },
  });
}

// ==========================================
// BILL ADJUSTMENTS
// ==========================================

export function useBillAdjustments(billId: string | null) {
  return useQuery({
    queryKey: ['bill_adjustments', billId],
    queryFn: async () => {
      if (!billId) return [];

      const { data, error } = await supabase
        .from('price_adjustments')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!billId,
  });
}

export function useAddAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billId,
      staffId,
      adjustmentType,
      originalAmount,
      adjustedAmount,
      reason,
    }: {
      billId: string;
      staffId: string;
      adjustmentType: string;
      originalAmount: number;
      adjustedAmount: number;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('price_adjustments')
        .insert({
          bill_id: billId,
          staff_id: staffId,
          adjustment_type: adjustmentType,
          original_amount: originalAmount,
          adjusted_amount: adjustedAmount,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill_adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables'] });
      queryClient.invalidateQueries({ queryKey: ['staff_bill_orders'] });
    },
  });
}

// ==========================================
// SESSION CANCELLATION
// ==========================================

export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billId,
      storeId,
    }: {
      billId: string;
      storeId: number;
    }) => {
      const { data, error } = await supabase
        .from('bills')
        .update({
          status: 'closed',
          close_time: new Date().toISOString(),
          payment_method: 'cancelled',
        })
        .eq('id', billId)
        .select()
        .single();

      if (error) throw error;

      // Cancel all orders for this bill
      await supabase
        .from('orders')
        .update({ is_cancelled: true, cancel_reason: 'セッションキャンセル' })
        .eq('bill_id', billId);

      // Deactivate cast assignments
      await supabase
        .from('cast_table_assignments')
        .update({ is_active: false, removed_at: new Date().toISOString() })
        .eq('bill_id', billId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff_floor_tables', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['floor_tables', variables.storeId] });
    },
  });
}

// ==========================================
// DAILY SALES STATS
// ==========================================

export function useDailySalesStats(storeId: number | null) {
  return useQuery({
    queryKey: ['daily_sales_stats', storeId],
    queryFn: async () => {
      if (!storeId) return { totalSales: 0, totalBills: 0, closedBills: 0 };

      const { start, end } = getBusinessDayRange(getBusinessDate());

      // Get all bills today (open + closed, excluding cancelled)
      const { data: bills } = await supabase
        .from('bills')
        .select('id, status, payment_method')
        .eq('store_id', storeId)
        .gte('start_time', start)
        .lt('start_time', end);

      const validBills = bills?.filter(b => b.payment_method !== 'cancelled') || [];
      const billIds = validBills.map(b => b.id);

      // Get orders for revenue calculation
      const { data: orders } = billIds.length > 0
        ? await supabase
            .from('orders')
            .select('bill_id, unit_price, quantity, product_id, products(tax_applicable)')
            .in('bill_id', billIds)
            .eq('is_cancelled', false)
        : { data: [] };

      let totalSales = 0;
      orders?.forEach(order => {
        const price = order.unit_price * order.quantity;
        const isTaxable = (order.products as any)?.tax_applicable ?? true;
        totalSales += isTaxable ? Math.floor(price * 1.2) : price;
      });
      totalSales = Math.floor(totalSales / 10) * 10;

      return {
        totalSales,
        totalBills: validBills.length,
        closedBills: validBills.filter(b => b.status === 'closed').length,
      };
    },
    enabled: !!storeId,
    refetchInterval: 15000,
  });
}

// ==========================================
// ACTIVE CASTS
// ==========================================

export function useActiveCasts() {
  return useQuery({
    queryKey: ['active_casts'],
    queryFn: async () => {
      const { start: dayStart } = getBusinessDayRange(getBusinessDate());

      const { data, error } = await supabase
        .from('cast_shifts')
        .select(`
          *,
          cast_members (*)
        `)
        .gte('clock_in', dayStart)
        .is('clock_out', null);

      if (error) throw error;
      
      return data?.map(shift => ({
        ...shift.cast_members,
        shift_id: shift.id,
        clock_in: shift.clock_in,
        store_id: shift.store_id,
      })) || [];
    },
  });
}
