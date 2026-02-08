/**
 * Staff Authentication Context
 * PIN-based auth for staff members
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { StaffMember } from '@/types/staff';

interface StaffAuthContextType {
  staffMember: StaffMember | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

const STAFF_SESSION_KEY = 'staff_session_token';
const SESSION_DURATION_HOURS = 12;
const SESSION_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(STAFF_SESSION_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if session is valid
        const { data: session, error } = await supabase
          .from('staff_sessions')
          .select(`
            *,
            staff_members (*)
          `)
          .eq('session_token', token)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !session) {
          localStorage.removeItem(STAFF_SESSION_KEY);
          setIsLoading(false);
          return;
        }

        const member = session.staff_members as unknown as StaffMember;
        setStaffMember(member);
      } catch (error) {
        console.error('Session restore error:', error);
        localStorage.removeItem(STAFF_SESSION_KEY);
      }
      
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Auto-refresh session every 30 minutes to prevent expiry while app is open
  useEffect(() => {
    if (!staffMember) return;

    const refreshSession = async () => {
      const token = localStorage.getItem(STAFF_SESSION_KEY);
      if (!token) return;

      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + SESSION_DURATION_HOURS);

      await supabase
        .from('staff_sessions')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('session_token', token);
    };

    const interval = setInterval(refreshSession, SESSION_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [staffMember]);

  const login = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find staff member with matching PIN
      const { data: member, error: memberError } = await supabase
        .from('staff_members')
        .select('*')
        .eq('pin_hash', pin)
        .eq('is_active', true)
        .single();

      if (memberError || !member) {
        console.error('Staff login failed:', memberError?.message, memberError?.code, memberError?.details);
        return { success: false, error: 'PINが正しくありません' };
      }

      // Create session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

      const { error: sessionError } = await supabase
        .from('staff_sessions')
        .insert({
          staff_id: member.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return { success: false, error: 'セッションの作成に失敗しました' };
      }

      // Store token and set state
      localStorage.setItem(STAFF_SESSION_KEY, sessionToken);
      setStaffMember(member as StaffMember);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(STAFF_SESSION_KEY);
    
    if (token) {
      await supabase
        .from('staff_sessions')
        .delete()
        .eq('session_token', token);
    }

    localStorage.removeItem(STAFF_SESSION_KEY);
    setStaffMember(null);
  }, []);

  return (
    <StaffAuthContext.Provider
      value={{
        staffMember,
        isLoading,
        isAuthenticated: !!staffMember,
        login,
        logout,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
