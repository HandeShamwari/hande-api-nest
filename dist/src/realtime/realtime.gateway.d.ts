import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../shared/services/supabase.service';
import { JwtService } from '@nestjs/jwt';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private supabaseService;
    private jwtService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(supabaseService: SupabaseService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleDriverLocation(client: Socket, data: {
        latitude: number;
        longitude: number;
        heading?: number;
        speed?: number;
        tripId?: string;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTripSubscribe(client: Socket, data: {
        tripId: string;
    }): Promise<{
        error: string;
        success?: undefined;
        tripId?: undefined;
    } | {
        success: boolean;
        tripId: string;
        error?: undefined;
    }>;
    handleTripUnsubscribe(client: Socket, data: {
        tripId: string;
    }): Promise<{
        success: boolean;
        tripId: string;
        error?: undefined;
    } | {
        error: string;
        success?: undefined;
        tripId?: undefined;
    }>;
    broadcastTripStatus(tripId: string, status: string, data?: any): Promise<void>;
    notifyUser(userId: string, userType: string, notification: any): Promise<void>;
    broadcastToDrivers(event: string, data: any): Promise<void>;
    broadcastToRiders(event: string, data: any): Promise<void>;
}
