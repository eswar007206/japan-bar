/**
 * Cast Authentication Context
 * Manages username + password authentication for cast members
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CastMember, CastSession } from '@/types/cast';

interface CastAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  castMember: CastMember | null;
  sessionToken: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const CastAuthContext = createContext<CastAuthContextType | undefined>(undefined);

const SESSION_KEY = 'cast_session_token';
const SESSION_DURATION_HOURS = 12;

function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

export function CastAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [castMember, setCastMember] = useState<CastMember | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(SESSION_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Validate session in database
        const { data: session, error } = await supabase
          .from('cast_sessions')
          .select(`
            *,
            cast_members (*)
          `)
          .eq('session_token', storedToken)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !session) {
          localStorage.removeItem(SESSION_KEY);
          setIsLoading(false);
          return;
        }

        const castData = session.cast_members as unknown as CastMember;
        setCastMember(castData);
        setSessionToken(storedToken);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try username + password login first
      let cast: CastMember | null = null;

      const { data: castByUsername, error: usernameError } = await supabase
        .from('cast_members')
        .select('*')
        .eq('username', username)
        .eq('pin_hash', password)
        .eq('is_active', true)
        .single();

      if (castByUsername && !usernameError) {
        cast = castByUsername as CastMember;
      } else if (usernameError?.message?.includes('column') || usernameError?.code === '42703') {
        // username column doesn't exist yet — fall back to name + pin_hash
        const { data: castByName, error: nameError } = await supabase
          .from('cast_members')
          .select('*')
          .eq('name', username)
          .eq('pin_hash', password)
          .eq('is_active', true)
          .single();

        if (castByName && !nameError) {
          cast = castByName as CastMember;
        }
      }

      if (!cast) {
        return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
      }

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

      const { error: sessionError } = await supabase
        .from('cast_sessions')
        .insert({
          cast_id: cast.id,
          session_token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return { success: false, error: 'ログインに失敗しました' };
      }

      // Store session
      localStorage.setItem(SESSION_KEY, token);
      setCastMember(cast as CastMember);
      setSessionToken(token);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (sessionToken) {
      await supabase
        .from('cast_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }

    localStorage.removeItem(SESSION_KEY);
    setCastMember(null);
    setSessionToken(null);
    setIsAuthenticated(false);
  }, [sessionToken]);

  return (
    <CastAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        castMember,
        sessionToken,
        login,
        logout,
      }}
    >
      {children}
    </CastAuthContext.Provider>
  );
}

export function useCastAuth() {
  const context = useContext(CastAuthContext);
  if (context === undefined) {
    throw new Error('useCastAuth must be used within a CastAuthProvider');
  }
  return context;
}
