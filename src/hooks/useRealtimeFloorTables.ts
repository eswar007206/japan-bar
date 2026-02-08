/**
 * Real-time Floor Tables Hook
 * Fetches tables with bill info and subscribes to realtime updates
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FloorTable, Product } from '@/types/cast';

export function useRealtimeFloorTables(storeId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
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
        const remainingMinutes = Math.max(0, (bill.base_minutes || 60) - elapsedMinutes);

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
    refetchInterval: 10000, // Fallback polling every 10s
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!storeId) return;

    // Subscribe to bills changes
    const billsChannel = supabase
      .channel(`bills-store-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          // Invalidate queries when bills change
          queryClient.invalidateQueries({ queryKey: ['floor_tables', storeId] });
        }
      )
      .subscribe();

    // Subscribe to orders changes (to update totals)
    const ordersChannel = supabase
      .channel(`orders-store-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Invalidate queries when orders change
          queryClient.invalidateQueries({ queryKey: ['floor_tables', storeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(billsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [storeId, queryClient]);

  return query;
}
