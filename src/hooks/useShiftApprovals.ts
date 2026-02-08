/**
 * Shift Approval Hooks
 * Staff approval system for cast clock-in/clock-out requests
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingShift {
  id: string;
  cast_id: string;
  store_id: number;
  clock_in: string;
  clock_out: string | null;
  clock_in_status: string | null;
  clock_out_status: string | null;
  cast_name: string;
  store_name: string;
}

/**
 * Fetch all pending shift approvals (clock-in and clock-out)
 */
export function usePendingShiftApprovals() {
  return useQuery({
    queryKey: ['pending_shift_approvals'],
    queryFn: async (): Promise<PendingShift[]> => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .select(`
          id,
          cast_id,
          store_id,
          clock_in,
          clock_out,
          clock_in_status,
          clock_out_status,
          cast_members (name),
          stores (name)
        `)
        .or('clock_in_status.eq.pending,and(clock_out.not.is.null,clock_out_status.eq.pending)')
        .order('clock_in', { ascending: false });

      if (error) throw error;

      return (data || []).map(shift => ({
        id: shift.id,
        cast_id: shift.cast_id,
        store_id: shift.store_id,
        clock_in: shift.clock_in,
        clock_out: shift.clock_out,
        clock_in_status: shift.clock_in_status,
        clock_out_status: shift.clock_out_status,
        cast_name: (shift.cast_members as any)?.name || '',
        store_name: (shift.stores as any)?.name || '',
      }));
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

/**
 * Approve clock-in
 */
export function useApproveClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shiftId,
      staffId
    }: {
      shiftId: string;
      staffId: string;
    }) => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .update({
          clock_in_status: 'approved',
          clock_in_approved_by: staffId,
          clock_in_approved_at: new Date().toISOString(),
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_shift_approvals'] });
      queryClient.invalidateQueries({ queryKey: ['current_shift'] });
      queryClient.invalidateQueries({ queryKey: ['cast_earnings'] });
      queryClient.invalidateQueries({ queryKey: ['daily_cast_earnings'] });
    },
  });
}

/**
 * Reject clock-in
 */
export function useRejectClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shiftId,
      staffId
    }: {
      shiftId: string;
      staffId: string;
    }) => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .update({
          clock_in_status: 'rejected',
          clock_in_approved_by: staffId,
          clock_in_approved_at: new Date().toISOString(),
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_shift_approvals'] });
      queryClient.invalidateQueries({ queryKey: ['current_shift'] });
    },
  });
}

/**
 * Approve clock-out
 */
export function useApproveClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shiftId,
      staffId
    }: {
      shiftId: string;
      staffId: string;
    }) => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .update({
          clock_out_status: 'approved',
          clock_out_approved_by: staffId,
          clock_out_approved_at: new Date().toISOString(),
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_shift_approvals'] });
      queryClient.invalidateQueries({ queryKey: ['cast_earnings'] });
      queryClient.invalidateQueries({ queryKey: ['daily_cast_earnings'] });
    },
  });
}

/**
 * Reject clock-out
 */
export function useRejectClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shiftId,
      staffId
    }: {
      shiftId: string;
      staffId: string;
    }) => {
      const { data, error } = await supabase
        .from('cast_shifts')
        .update({
          clock_out_status: 'rejected',
          clock_out_approved_by: staffId,
          clock_out_approved_at: new Date().toISOString(),
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_shift_approvals'] });
    },
  });
}
