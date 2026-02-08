/**
 * Girls Bar Fairy - Bill Polling Hook
 * Polls backend every 8 seconds for bill updates
 * Supports both read_token and table_id lookups
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CustomerBillResponse, BillDisplayState } from '@/types/billing';
import { fetchCustomerBillAPI, fetchCustomerBillByTableAPI } from '@/services/billingService';

const POLL_INTERVAL_MS = 8000; // 8 seconds as specified

interface UseBillPollingOptions {
  readToken?: string;
  tableId?: string;
  enabled?: boolean;
}

export function useBillPolling({ readToken, tableId, enabled = true }: UseBillPollingOptions): BillDisplayState & {
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<BillDisplayState>({
    data: null,
    isLoading: true,
    isOffline: false,
    error: null,
    lastFetchTime: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedRef = useRef<string | null>(null);
  const hasIdentifier = !!(readToken || tableId);

  const fetchBill = useCallback(async () => {
    if (!readToken && !tableId) return;

    try {
      let data: CustomerBillResponse | null;

      if (tableId) {
        // Table-based lookup (permanent QR) - may return null
        data = await fetchCustomerBillByTableAPI(tableId);
      } else {
        // Token-based lookup (legacy) - throws on not found
        data = await fetchCustomerBillAPI(readToken!);
      }

      if (data) {
        // Bill found - update if changed
        if (data.last_updated !== lastUpdatedRef.current) {
          lastUpdatedRef.current = data.last_updated;
          setState({
            data,
            isLoading: false,
            isOffline: false,
            error: null,
            lastFetchTime: new Date(),
          });
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isOffline: false,
            lastFetchTime: new Date(),
          }));
        }
      } else {
        // No open bill (table QR with no active session)
        lastUpdatedRef.current = null;
        setState({
          data: null,
          isLoading: false,
          isOffline: false,
          error: null,
          lastFetchTime: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch bill:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isOffline: true,
        error: '接続が失われました。スタッフにお知らせください。',
      }));
    }
  }, [readToken, tableId]);

  // Initial fetch
  useEffect(() => {
    if (enabled && hasIdentifier) {
      fetchBill();
    }
  }, [enabled, hasIdentifier, fetchBill]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !hasIdentifier) return;

    intervalRef.current = setInterval(fetchBill, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, hasIdentifier, fetchBill]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      fetchBill();
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOffline: true,
        error: '接続が失われました。スタッフにお知らせください。',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchBill]);

  return {
    ...state,
    refetch: fetchBill,
  };
}
