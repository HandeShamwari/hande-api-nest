"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../shared/services/supabase.service");
const jwt_1 = require("@nestjs/jwt");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    supabaseService;
    jwtService;
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    connectedClients = new Map();
    constructor(supabaseService, jwtService) {
        this.supabaseService = supabaseService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
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
            client.join(`user:${userId}`);
            if (userType === 'driver') {
                client.join(`drivers`);
            }
            else if (userType === 'rider') {
                client.join(`riders`);
            }
            this.logger.log(`Client connected: ${client.id} (${userType}: ${userId})`);
            client.emit('connected', {
                message: 'Connected to Hande real-time server',
                userId,
                userType,
            });
        }
        catch (error) {
            this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            this.logger.log(`Client disconnected: ${client.id} (${clientInfo.userType}: ${clientInfo.userId})`);
            this.connectedClients.delete(client.id);
        }
    }
    async handleDriverLocation(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo || clientInfo.userType !== 'driver') {
            return { error: 'Unauthorized' };
        }
        try {
            await this.supabaseService.broadcastDriverLocation(clientInfo.userId, data);
            if (data.tripId) {
                this.server.to(`trip:${data.tripId}`).emit('driver:location:update', {
                    driverId: clientInfo.userId,
                    ...data,
                    timestamp: new Date().toISOString(),
                });
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to broadcast driver location: ${error.message}`);
            return { error: 'Failed to broadcast location' };
        }
    }
    async handleTripSubscribe(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo) {
            return { error: 'Unauthorized' };
        }
        try {
            client.join(`trip:${data.tripId}`);
            this.logger.log(`Client ${client.id} subscribed to trip ${data.tripId}`);
            return { success: true, tripId: data.tripId };
        }
        catch (error) {
            this.logger.error(`Failed to subscribe to trip: ${error.message}`);
            return { error: 'Failed to subscribe to trip' };
        }
    }
    async handleTripUnsubscribe(client, data) {
        try {
            client.leave(`trip:${data.tripId}`);
            this.logger.log(`Client ${client.id} unsubscribed from trip ${data.tripId}`);
            return { success: true, tripId: data.tripId };
        }
        catch (error) {
            return { error: 'Failed to unsubscribe from trip' };
        }
    }
    async broadcastTripStatus(tripId, status, data) {
        try {
            this.server.to(`trip:${tripId}`).emit('trip:status:update', {
                tripId,
                status,
                ...data,
                timestamp: new Date().toISOString(),
            });
            await this.supabaseService.broadcastTripStatus(tripId, status, data);
            this.logger.log(`Broadcasted trip status update: ${tripId} -> ${status}`);
        }
        catch (error) {
            this.logger.error(`Failed to broadcast trip status: ${error.message}`);
        }
    }
    async notifyUser(userId, userType, notification) {
        try {
            this.server.to(`user:${userId}`).emit('notification', {
                ...notification,
                timestamp: new Date().toISOString(),
            });
            if (userType === 'driver') {
                await this.supabaseService.notifyDriver(userId, notification);
            }
            else if (userType === 'rider') {
                await this.supabaseService.notifyRider(userId, notification);
            }
            this.logger.log(`Sent notification to ${userType} ${userId}: ${notification.type}`);
        }
        catch (error) {
            this.logger.error(`Failed to send notification: ${error.message}`);
        }
    }
    async broadcastToDrivers(event, data) {
        this.server.to('drivers').emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    async broadcastToRiders(event, data) {
        this.server.to('riders').emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('driver:location'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleDriverLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('trip:subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleTripSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('trip:unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleTripUnsubscribe", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/realtime',
    }),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        jwt_1.JwtService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map