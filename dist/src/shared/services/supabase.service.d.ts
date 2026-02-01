import { ConfigService } from '@nestjs/config';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
export declare class SupabaseService {
    private configService;
    private readonly logger;
    private supabase;
    private channels;
    constructor(configService: ConfigService);
    getClient(): SupabaseClient;
    subscribeToDriverLocation(driverId: string, callback: (data: any) => void): RealtimeChannel;
    broadcastDriverLocation(driverId: string, location: {
        latitude: number;
        longitude: number;
        heading?: number;
        speed?: number;
    }): Promise<void>;
    subscribeToTrip(tripId: string, callback: (data: any) => void): RealtimeChannel;
    broadcastTripStatus(tripId: string, status: string, data?: any): Promise<void>;
    subscribeToRiderNotifications(riderId: string, callback: (data: any) => void): RealtimeChannel;
    notifyRider(riderId: string, notification: {
        type: string;
        title: string;
        message: string;
        data?: any;
    }): Promise<void>;
    subscribeToDriverNotifications(driverId: string, callback: (data: any) => void): RealtimeChannel;
    notifyDriver(driverId: string, notification: {
        type: string;
        title: string;
        message: string;
        data?: any;
    }): Promise<void>;
    uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
    deleteFile(bucket: string, path: string): Promise<void>;
    unsubscribe(channelName: string): Promise<void>;
    cleanup(): Promise<void>;
}
