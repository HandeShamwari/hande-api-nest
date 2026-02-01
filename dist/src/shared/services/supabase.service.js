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
var SupabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = SupabaseService_1 = class SupabaseService {
    configService;
    logger = new common_1.Logger(SupabaseService_1.name);
    supabase;
    channels = new Map();
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_ANON_KEY');
        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('Supabase credentials not configured. Real-time features will be disabled.');
            return;
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
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
    getClient() {
        return this.supabase;
    }
    subscribeToDriverLocation(driverId, callback) {
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
    async broadcastDriverLocation(driverId, location) {
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
    subscribeToTrip(tripId, callback) {
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
    async broadcastTripStatus(tripId, status, data) {
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
    subscribeToRiderNotifications(riderId, callback) {
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
    async notifyRider(riderId, notification) {
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
    subscribeToDriverNotifications(driverId, callback) {
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
    async notifyDriver(driverId, notification) {
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
    async uploadFile(bucket, path, file, contentType) {
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
    async deleteFile(bucket, path) {
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
    async unsubscribe(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            await this.supabase.removeChannel(channel);
            this.channels.delete(channelName);
            this.logger.log(`Unsubscribed from channel: ${channelName}`);
        }
    }
    async cleanup() {
        for (const [name, channel] of this.channels.entries()) {
            await this.supabase.removeChannel(channel);
            this.logger.log(`Cleaned up channel: ${name}`);
        }
        this.channels.clear();
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = SupabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map