import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured. Real-time features will be disabled.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    this.logger.log('Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Subscribe to driver location updates
   */
  subscribeToDriverLocation(driverId: string, callback: (data: any) => void): RealtimeChannel {
    const channelName = `driver:${driverId}:location`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'location' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    this.logger.log(`Subscribed to driver location: ${driverId}`);
    
    return channel;
  }

  /**
   * Broadcast driver location update
   */
  async broadcastDriverLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }) {
    const channel = this.supabase.channel(`driver:${driverId}:location`);
    
    await channel.send({
      type: 'broadcast',
      event: 'location',
      payload: {
        driverId,
        ...location,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.debug(`Broadcasted location for driver ${driverId}`);
  }

  /**
   * Subscribe to trip updates
   */
  subscribeToTrip(tripId: string, callback: (data: any) => void): RealtimeChannel {
    const channelName = `trip:${tripId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'status' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    this.logger.log(`Subscribed to trip: ${tripId}`);
    
    return channel;
  }

  /**
   * Broadcast trip status update
   */
  async broadcastTripStatus(tripId: string, status: string, data?: any) {
    const channel = this.supabase.channel(`trip:${tripId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'status',
      payload: {
        tripId,
        status,
        ...data,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.debug(`Broadcasted trip status for ${tripId}: ${status}`);
  }

  /**
   * Subscribe to rider notifications
   */
  subscribeToRiderNotifications(riderId: string, callback: (data: any) => void): RealtimeChannel {
    const channelName = `rider:${riderId}:notifications`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'notification' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    this.logger.log(`Subscribed to rider notifications: ${riderId}`);
    
    return channel;
  }

  /**
   * Send notification to rider
   */
  async notifyRider(riderId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const channel = this.supabase.channel(`rider:${riderId}:notifications`);
    
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        ...notification,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.debug(`Sent notification to rider ${riderId}: ${notification.type}`);
  }

  /**
   * Subscribe to driver notifications
   */
  subscribeToDriverNotifications(driverId: string, callback: (data: any) => void): RealtimeChannel {
    const channelName = `driver:${driverId}:notifications`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'notification' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    this.logger.log(`Subscribed to driver notifications: ${driverId}`);
    
    return channel;
  }

  /**
   * Send notification to driver
   */
  async notifyDriver(driverId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const channel = this.supabase.channel(`driver:${driverId}:notifications`);
    
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        ...notification,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.debug(`Sent notification to driver ${driverId}: ${notification.type}`);
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: publicUrl } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.logger.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Cleanup all channels
   */
  async cleanup() {
    for (const [name, channel] of this.channels.entries()) {
      await this.supabase.removeChannel(channel);
      this.logger.log(`Cleaned up channel: ${name}`);
    }
    this.channels.clear();
  }
}
