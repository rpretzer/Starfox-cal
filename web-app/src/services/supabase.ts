/**
 * Supabase client configuration
 * 
 * This service provides the Supabase client for authentication and database operations.
 * Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20);

// Create Supabase client with fallback placeholders
// The app will gracefully fall back to IndexedDB if Supabase is not configured
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  }
);

// Database types (match your Supabase schema)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          is_demo: boolean;
          demo_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          is_demo?: boolean;
          demo_expires_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          is_demo?: boolean;
          demo_expires_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          color_value: number;
        };
        Update: {
          name?: string;
          color_value?: number;
        };
      };
      meetings: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          category_id: string;
          days: string[];
          start_time: string;
          end_time: string;
          week_type: string;
          requires_attendance: string;
          notes: string;
          assigned_to: string;
          series_id: string | null;
          meeting_link: string | null;
          meeting_link_type: string | null;
          public_visibility: string;
          permalink: string | null;
          version: number;
          created_at: string;
          updated_at: string;
          last_synced_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          category_id: string;
          days: string[];
          start_time: string;
          end_time: string;
          week_type: string;
          requires_attendance: string;
          notes?: string;
          assigned_to?: string;
          series_id?: string | null;
          meeting_link?: string | null;
          meeting_link_type?: string | null;
          public_visibility?: string;
          permalink?: string | null;
          version?: number;
        };
        Update: {
          name?: string;
          category_id?: string;
          days?: string[];
          start_time?: string;
          end_time?: string;
          week_type?: string;
          requires_attendance?: string;
          notes?: string;
          assigned_to?: string;
          series_id?: string | null;
          meeting_link?: string | null;
          meeting_link_type?: string | null;
          public_visibility?: string;
          permalink?: string | null;
          version?: number;
        };
      };
      meeting_series: {
        Row: {
          series_id: string;
          user_id: string;
          name: string;
          category_id: string;
          start_time: string;
          end_time: string;
          week_type: string;
          days: string[];
          requires_attendance: string;
          notes: string;
          assigned_to: string;
          meeting_ids: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          series_id: string;
          user_id: string;
          name: string;
          category_id: string;
          start_time: string;
          end_time: string;
          week_type: string;
          days: string[];
          requires_attendance: string;
          notes?: string;
          assigned_to?: string;
          meeting_ids?: number[];
        };
        Update: {
          name?: string;
          category_id?: string;
          start_time?: string;
          end_time?: string;
          week_type?: string;
          days?: string[];
          requires_attendance?: string;
          notes?: string;
          assigned_to?: string;
          meeting_ids?: number[];
        };
      };
      calendar_sync_configs: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          name: string;
          enabled: boolean;
          last_sync: string | null;
          sync_interval: number | null;
          google_calendar_id: string | null;
          outlook_calendar_id: string | null;
          ics_url: string | null;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          provider: string;
          name: string;
          enabled?: boolean;
          last_sync?: string | null;
          sync_interval?: number | null;
          google_calendar_id?: string | null;
          outlook_calendar_id?: string | null;
          ics_url?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
        };
        Update: {
          name?: string;
          enabled?: boolean;
          last_sync?: string | null;
          sync_interval?: number | null;
          google_calendar_id?: string | null;
          outlook_calendar_id?: string | null;
          ics_url?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          monthly_view_enabled: boolean;
          timezone: string | null;
          time_format: string;
          default_public_visibility: string;
          permalink_base_url: string | null;
          oauth_client_ids: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          monthly_view_enabled?: boolean;
          timezone?: string | null;
          time_format?: string;
          default_public_visibility?: string;
          permalink_base_url?: string | null;
          oauth_client_ids?: Record<string, string> | null;
        };
        Update: {
          monthly_view_enabled?: boolean;
          timezone?: string | null;
          time_format?: string;
          default_public_visibility?: string;
          permalink_base_url?: string | null;
          oauth_client_ids?: Record<string, string> | null;
        };
      };
    };
  };
}

