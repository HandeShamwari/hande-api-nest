import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SupabaseService } from '../shared/services/supabase.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients: Map<string, { socket: Socket; userId: string; userType: string }> = new Map();

  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const userType = payload.userType;

      this.connectedClients.set(client.id, { socket: client, userId, userType });
      
      // Join user-specific room
      client.join(`user:${userId}`);
      if (userType === 'driver') {
        client.join(`drivers`);
      } else if (userType === 'rider') {
        client.join(`riders`);
      }

      this.logger.log(`Client connected: ${client.id} (${userType}: ${userId})`);
      
      client.emit('connected', {
        message: 'Connected to Hande real-time server',
        userId,
        userType,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.logger.log(`Client disconnected: ${client.id} (${clientInfo.userType}: ${clientInfo.userId})`);
      this.connectedClients.delete(client.id);
    }
  }

  /**
   * Driver broadcasts location update
   */
  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { latitude: number; longitude: number; heading?: number; speed?: number; tripId?: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (!clientInfo || clientInfo.userType !== 'driver') {
      return { error: 'Unauthorized' };
    }

    try {
      // Broadcast to Supabase
      await this.supabaseService.broadcastDriverLocation(clientInfo.userId, data);

      // If driver is on a trip, notify the rider
      if (data.tripId) {
        this.server.to(`trip:${data.tripId}`).emit('driver:location:update', {
          driverId: clientInfo.userId,
          ...data,
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to broadcast driver location: ${error.message}`);
      return { error: 'Failed to broadcast location' };
    }
  }

  /**
   * Subscribe to trip updates
   */
  @SubscribeMessage('trip:subscribe')
  async handleTripSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (!clientInfo) {
      return { error: 'Unauthorized' };
    }

    try {
      client.join(`trip:${data.tripId}`);
      this.logger.log(`Client ${client.id} subscribed to trip ${data.tripId}`);
      
      return { success: true, tripId: data.tripId };
    } catch (error) {
      this.logger.error(`Failed to subscribe to trip: ${error.message}`);
      return { error: 'Failed to subscribe to trip' };
    }
  }

  /**
   * Unsubscribe from trip updates
   */
  @SubscribeMessage('trip:unsubscribe')
  async handleTripUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    try {
      client.leave(`trip:${data.tripId}`);
      this.logger.log(`Client ${client.id} unsubscribed from trip ${data.tripId}`);
      
      return { success: true, tripId: data.tripId };
    } catch (error) {
      return { error: 'Failed to unsubscribe from trip' };
    }
  }

  /**
   * Broadcast trip status update to all subscribers
   */
  async broadcastTripStatus(tripId: string, status: string, data?: any) {
    try {
      // Broadcast via Socket.IO
      this.server.to(`trip:${tripId}`).emit('trip:status:update', {
        tripId,
        status,
        ...data,
        timestamp: new Date().toISOString(),
      });

      // Also broadcast via Supabase for mobile apps
      await this.supabaseService.broadcastTripStatus(tripId, status, data);

      this.logger.log(`Broadcasted trip status update: ${tripId} -> ${status}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast trip status: ${error.message}`);
    }
  }

  /**
   * Send notification to specific user
   */
  async notifyUser(userId: string, userType: string, notification: any) {
    try {
      this.server.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });

      // Also send via Supabase
      if (userType === 'driver') {
        await this.supabaseService.notifyDriver(userId, notification);
      } else if (userType === 'rider') {
        await this.supabaseService.notifyRider(userId, notification);
      }

      this.logger.log(`Sent notification to ${userType} ${userId}: ${notification.type}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Broadcast to all drivers
   */
  async broadcastToDrivers(event: string, data: any) {
    this.server.to('drivers').emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast to all riders
   */
  async broadcastToRiders(event: string, data: any) {
    this.server.to('riders').emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
