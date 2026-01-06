/**
 * Authentication Service
 * 
 * Handles user authentication using Supabase Auth
 */

import { supabase } from './supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  isDemo: boolean;
}

class AuthService {
  async signUp(email: string, password: string, displayName?: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    return { user: data.user, error };
  }

  async signIn(email: string, password: string): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { session: data.session, error };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return null;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, is_demo')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name || user.email?.split('@')[0],
        isDemo: profile?.is_demo || false,
      };
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return null;
      }
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.warn('Failed to get session:', error);
      return null;
    }
  }

  async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  }

  async signInWithMicrosoft(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  }

  async signInWithApple(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  }

  async createDemoAccount(): Promise<{ user: User | null; error: AuthError | null }> {
    // Create anonymous user with demo flag
    const demoEmail = `demo-${Date.now()}@demo.local`;
    const demoPassword = `demo-${Math.random().toString(36).slice(2)}`;

    const { data, error } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          display_name: 'Demo User',
          is_demo: true,
        },
      },
    });

    if (data.user) {
      // Set demo flag in profile
      await supabase
        .from('user_profiles')
        .update({
          is_demo: true,
          demo_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .eq('id', data.user.id);
    }

    return { user: data.user, error };
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();

