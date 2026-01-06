/**
 * Supabase Storage Service
 * 
 * This service provides cloud persistence using Supabase PostgreSQL database.
 * It replaces IndexedDB for cross-device synchronization.
 */

import { supabase } from './supabase';
import { Meeting, Category, AppSettings, MeetingSeries, CalendarSyncConfig } from '../types';

class SupabaseStorageService {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated. Please sign in.');
    }

    this.initialized = true;
  }

  // ==================== Meetings ====================

  async getAllMeetings(): Promise<Meeting[]> {
    await this.init();
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapMeetingFromDB);
  }

  async getMeeting(id: number): Promise<Meeting | null> {
    await this.init();
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data ? this.mapMeetingFromDB(data) : null;
  }

  async saveMeeting(meeting: Meeting): Promise<void> {
    await this.init();
    const dbMeeting = this.mapMeetingToDB(meeting);

    if (meeting.id > 0) {
      // Update existing
      const { error } = await supabase
        .from('meetings')
        .update({ ...dbMeeting, version: dbMeeting.version + 1 })
        .eq('id', meeting.id);

      if (error) throw error;
    } else {
      // Insert new (id will be auto-generated)
      const { error } = await supabase
        .from('meetings')
        .insert(dbMeeting);

      if (error) throw error;
      // Note: The returned ID will be used by the store
    }
  }

  async deleteMeeting(id: number): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getNextMeetingId(): Promise<number> {
    // For Supabase, we'll let the database auto-generate IDs
    // This is a placeholder - actual ID will come from insert
    const { data } = await supabase
      .from('meetings')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    return data ? data.id + 1 : 1;
  }

  // ==================== Categories ====================

  async getAllCategories(): Promise<Category[]> {
    await this.init();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapCategoryFromDB);
  }

  async saveCategory(category: Category): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('categories')
      .upsert({
        id: category.id,
        name: category.name,
        color_value: category.colorValue,
      }, {
        onConflict: 'id,user_id'
      });

    if (error) throw error;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== Meeting Series ====================

  async getAllMeetingSeries(): Promise<MeetingSeries[]> {
    await this.init();
    const { data, error } = await supabase
      .from('meeting_series')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapSeriesFromDB);
  }

  async saveMeetingSeries(series: MeetingSeries): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('meeting_series')
      .upsert({
        series_id: series.seriesId,
        name: series.name,
        category_id: series.categoryId,
        start_time: series.startTime,
        end_time: series.endTime,
        week_type: series.weekType,
        days: series.days,
        requires_attendance: series.requiresAttendance,
        notes: series.notes,
        assigned_to: series.assignedTo,
        meeting_ids: series.meetingIds,
      }, {
        onConflict: 'series_id,user_id'
      });

    if (error) throw error;
  }

  async deleteMeetingSeries(seriesId: string): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('meeting_series')
      .delete()
      .eq('series_id', seriesId);

    if (error) throw error;
  }

  async getMeetingsInSeries(seriesId: string): Promise<Meeting[]> {
    await this.init();
    const { data: series } = await supabase
      .from('meeting_series')
      .select('meeting_ids')
      .eq('series_id', seriesId)
      .single();

    if (!series || !series.meeting_ids || series.meeting_ids.length === 0) {
      return [];
    }

    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .in('id', series.meeting_ids);

    if (error) throw error;
    return (meetings || []).map(this.mapMeetingFromDB);
  }

  async updateMeetingSeries(seriesId: string, updates: Partial<MeetingSeries>): Promise<void> {
    await this.init();
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.weekType !== undefined) updateData.week_type = updates.weekType;
    if (updates.days !== undefined) updateData.days = updates.days;
    if (updates.requiresAttendance !== undefined) updateData.requires_attendance = updates.requiresAttendance;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
    if (updates.meetingIds !== undefined) updateData.meeting_ids = updates.meetingIds;

    const { error } = await supabase
      .from('meeting_series')
      .update(updateData)
      .eq('series_id', seriesId);

    if (error) throw error;
  }

  // ==================== Settings ====================

  async getSettings(): Promise<AppSettings> {
    await this.init();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return { monthlyViewEnabled: false, timeFormat: '12h' };
      }
      throw error;
    }

    return {
      monthlyViewEnabled: data.monthly_view_enabled ?? false,
      timezone: data.timezone ?? undefined,
      timeFormat: (data.time_format as '12h' | '24h') || '12h',
      defaultPublicVisibility: (data.default_public_visibility as any) || 'private',
      permalinkBaseUrl: data.permalink_base_url ?? undefined,
      oauthClientIds: data.oauth_client_ids as any,
    };
  }

  async setMonthlyViewEnabled(enabled: boolean): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ monthly_view_enabled: enabled }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async setTimezone(timezone: string | undefined): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ timezone }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async setTimeFormat(format: '12h' | '24h'): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ time_format: format }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async setDefaultPublicVisibility(visibility: 'private' | 'busy' | 'titles' | 'full'): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ default_public_visibility: visibility }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async setPermalinkBaseUrl(url: string | undefined): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ permalink_base_url: url }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async setOAuthClientIds(clientIds: { google?: string; microsoft?: string; apple?: string }): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ oauth_client_ids: clientIds }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  // ==================== Calendar Sync Configs ====================

  async getAllSyncConfigs(): Promise<CalendarSyncConfig[]> {
    await this.init();
    const { data, error } = await supabase
      .from('calendar_sync_configs')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapSyncConfigFromDB);
  }

  async saveSyncConfig(config: CalendarSyncConfig & { id: string }): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('calendar_sync_configs')
      .upsert({
        id: config.id,
        provider: config.provider,
        name: config.name,
        enabled: config.enabled,
        last_sync: config.lastSync ? new Date(config.lastSync).toISOString() : null,
        sync_interval: config.syncInterval,
        google_calendar_id: config.googleCalendarId,
        outlook_calendar_id: config.outlookCalendarId,
        ics_url: config.icsUrl,
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
        expires_at: config.expiresAt ? new Date(config.expiresAt).toISOString() : null,
      }, {
        onConflict: 'id,user_id'
      });

    if (error) throw error;
  }

  async deleteSyncConfig(configId: string): Promise<void> {
    await this.init();
    const { error } = await supabase
      .from('calendar_sync_configs')
      .delete()
      .eq('id', configId);

    if (error) throw error;
  }

  // ==================== Real-time Subscriptions ====================

  subscribeToMeetings(callback: (meeting: Meeting, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    return supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(payload.old as any, 'DELETE');
          } else {
            callback(this.mapMeetingFromDB(payload.new as any), payload.eventType as 'INSERT' | 'UPDATE');
          }
        }
      )
      .subscribe();
  }

  subscribeToCategories(callback: (category: Category, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    return supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(payload.old as any, 'DELETE');
          } else {
            callback(this.mapCategoryFromDB(payload.new as any), payload.eventType as 'INSERT' | 'UPDATE');
          }
        }
      )
      .subscribe();
  }

  // ==================== Helper Methods ====================

  private mapMeetingFromDB(db: any): Meeting {
    return {
      id: db.id,
      name: db.name,
      categoryId: db.category_id,
      days: db.days,
      startTime: db.start_time,
      endTime: db.end_time,
      weekType: db.week_type as any,
      requiresAttendance: db.requires_attendance,
      notes: db.notes || '',
      assignedTo: db.assigned_to || '',
      seriesId: db.series_id || undefined,
      meetingLink: db.meeting_link || undefined,
      meetingLinkType: db.meeting_link_type as any,
      publicVisibility: db.public_visibility as any,
      permalink: db.permalink || undefined,
    };
  }

  private mapMeetingToDB(meeting: Meeting): any {
    return {
      name: meeting.name,
      category_id: meeting.categoryId,
      days: meeting.days,
      start_time: meeting.startTime,
      end_time: meeting.endTime,
      week_type: meeting.weekType,
      requires_attendance: meeting.requiresAttendance,
      notes: meeting.notes,
      assigned_to: meeting.assignedTo,
      series_id: meeting.seriesId || null,
      meeting_link: meeting.meetingLink || null,
      meeting_link_type: meeting.meetingLinkType || null,
      public_visibility: meeting.publicVisibility || 'private',
      permalink: meeting.permalink || null,
    };
  }

  private mapCategoryFromDB(db: any): Category {
    return {
      id: db.id,
      name: db.name,
      colorValue: db.color_value,
    };
  }

  private mapSeriesFromDB(db: any): MeetingSeries {
    return {
      seriesId: db.series_id,
      name: db.name,
      categoryId: db.category_id,
      startTime: db.start_time,
      endTime: db.end_time,
      weekType: db.week_type as any,
      requiresAttendance: db.requires_attendance,
      notes: db.notes || '',
      assignedTo: db.assigned_to || '',
      meetingIds: db.meeting_ids || [],
      days: db.days,
    };
  }

  private mapSyncConfigFromDB(db: any): CalendarSyncConfig {
    return {
      provider: db.provider as any,
      enabled: db.enabled,
      name: db.name,
      lastSync: db.last_sync ? new Date(db.last_sync) : undefined,
      syncInterval: db.sync_interval,
      googleCalendarId: db.google_calendar_id,
      outlookCalendarId: db.outlook_calendar_id,
      icsUrl: db.ics_url,
      accessToken: db.access_token,
      refreshToken: db.refresh_token,
      expiresAt: db.expires_at ? new Date(db.expires_at) : undefined,
    };
  }
}

export const supabaseStorageService = new SupabaseStorageService();

