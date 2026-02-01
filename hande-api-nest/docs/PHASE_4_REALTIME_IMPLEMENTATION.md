# Phase 4: Real-time Features Implementation

## Overview
Phase 4 adds real-time features using **Supabase Realtime** and **Socket.io WebSockets** for live location tracking, trip status updates, and push notifications.

## 🚀 Features Implemented

### 1. Real-time Location Tracking
- **Driver Location Broadcasting**: Drivers' locations broadcast via Supabase channels
- **Live Map Updates**: Riders see driver approaching in real-time
- **Active Trip Tracking**: Location updates sent to trip-specific Socket.io rooms
- **Efficient Updates**: Location stored in TimescaleDB time-series table

### 2. Real-time Trip Status Notifications
- **Trip Created**: Nearby drivers notified of new trip requests
- **Trip Accepted**: Rider notified when driver accepts their trip
- **Trip Started**: Both parties notified when trip begins
- **Trip Completed**: Final fare and rating prompt sent
- **Trip Cancelled**: Cancellation notifications with reason

### 3. File Upload System
- **Driver License Upload**: POST `/api/upload/license` (images/PDFs, 5MB max)
- **Vehicle Images**: POST `/api/upload/vehicle` (images only, 5MB max)
- **Profile Photos**: POST `/api/upload/profile` (images only, 2MB max)
- **Storage**: Supabase Storage buckets with public URLs

### 4. WebSocket Gateway
- **Port**: 3001 (separate from main API on 3000)
- **Authentication**: JWT validation on connection
- **Room Management**: Per-trip rooms for targeted broadcasts
- **Events**:
  - `join_trip_room` - Join trip-specific room
  - `leave_trip_room` - Leave trip room
  - `driver_location` - Driver location updates
  - `trip_status` - Trip status changes

## 📦 Dependencies Added

```json
{
  "@supabase/supabase-js": "^2.x",
  "@nestjs/websockets": "^11.0.1",
  "@nestjs/platform-socket.io": "^11.0.1",
  "socket.io": "^4.x",
  "multer": "^1.x",
  "@nestjs/platform-express": "^11.0.1",
  "@types/multer": "^1.x" (dev)
}
```

## 🏗️ Architecture

### SupabaseService
**Location**: `/src/shared/services/supabase.service.ts`

**Purpose**: Supabase Realtime client wrapper for pub/sub messaging

**Key Methods**:
```typescript
// Driver location
subscribeToDriverLocation(driverId: string, callback: Function)
broadcastDriverLocation(driverId: string, location: any)

// Trip updates
subscribeToTrip(tripId: string, callback: Function)
broadcastTripStatus(tripId: string, status: string, data?: any)

// Notifications
subscribeToRiderNotifications(riderId: string, callback: Function)
notifyRider(riderId: string, notification: any)
subscribeToDriverNotifications(driverId: string, callback: Function)
notifyDriver(driverId: string, notification: any)

// File storage
uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>
deleteFile(bucket: string, path: string): Promise<void>
```

### RealtimeGateway
**Location**: `/src/realtime/realtime.gateway.ts`

**Purpose**: Socket.io WebSocket gateway for client connections

**Configuration**:
```typescript
@WebSocketGateway(3001, {
  cors: { origin: '*' },
  namespace: '/',
})
```

**Event Handlers**:
- `connection` - Validates JWT, stores user data
- `disconnect` - Cleanup on disconnect
- `join_trip_room` - Joins trip-specific room
- `leave_trip_room` - Leaves trip room
- `driver_location_update` - Receives location from driver
- `trip_status_update` - Trip status changes

### UploadController
**Location**: `/src/shared/controllers/upload.controller.ts`

**Endpoints**:
1. **POST /api/upload/license**
   - Uploads driver license image/PDF
   - Max size: 5MB
   - Allowed: JPEG, PNG, WebP, PDF

2. **POST /api/upload/vehicle**
   - Uploads vehicle images
   - Max size: 5MB
   - Allowed: JPEG, PNG, WebP

3. **POST /api/upload/profile**
   - Uploads profile photo
   - Max size: 2MB
   - Allowed: JPEG, PNG, WebP

**Usage**:
```bash
curl -X POST https://hande-api-nest.vercel.app/api/upload/license \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@license.jpg"
```

## 🔧 Integration Points

### DriversService Updates
**Location**: `/src/drivers/services/drivers.service.ts`

**Changes**:
- Added `SupabaseService` injection
- Added `setRealtimeGateway()` method for gateway injection
- Updated `updateLocation()` to broadcast:
  - Via Supabase Realtime channels (for mobile subscriptions)
  - Via Socket.io to trip rooms (for active trips)
- Logs location broadcasts for debugging

**Real-time Location Flow**:
```
Driver App → POST /api/drivers/location
    ↓
DriversService.updateLocation()
    ↓
1. Save to TimescaleDB (driver_location table)
2. Update driver.currentLatitude/Longitude
3. Broadcast via Supabase Realtime
4. Emit to Socket.io trip room (if on active trip)
    ↓
Rider App receives real-time location update
```

### TripsService Updates
**Location**: `/src/trips/services/trips.service.ts`

**Changes**:
- Added `setRealtimeGateway()` method
- Broadcasts to Socket.io rooms on:
  - `createTrip()` → `trip_created` event
  - `acceptTrip()` → `trip_accepted` event
  - `startTrip()` → `trip_started` event
  - `completeTrip()` → `trip_completed` event
  - `cancelTrip()` → `trip_cancelled` event

**Trip Status Notification Flow**:
```
API Call → TripsService method
    ↓
1. Update trip in database
2. Emit to Socket.io room `trip_${tripId}`
3. All connected clients in room receive update
    ↓
Mobile apps show notification/update UI
```

## 🌐 Environment Variables

Add to Vercel (all environments):

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Existing variables (already configured)
DATABASE_URL=...
JWT_SECRET=...
JWT_EXPIRY=1d
DAILY_FEE_AMOUNT=1.00
DAILY_FEE_GRACE_HOURS=6
```

## 📱 Mobile Client Integration

### Socket.io Client Setup
```typescript
import io from 'socket.io-client';

const socket = io('https://hande-api-nest.vercel.app:3001', {
  auth: {
    token: JWT_TOKEN,
  },
  reconnection: true,
  reconnectionDelay: 1000,
});

// Join trip room
socket.emit('join_trip_room', { tripId: 'trip-uuid' });

// Listen for driver location
socket.on('driver_location', (data) => {
  console.log('Driver location:', data);
  // Update map marker
  updateDriverMarker(data.latitude, data.longitude);
});

// Listen for trip status updates
socket.on('trip_status', (data) => {
  console.log('Trip status:', data);
  // Show notification
  showNotification(data.status, data.message);
});
```

### Supabase Realtime Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to driver location
const channel = supabase.channel(`driver:${driverId}:location`)
  .on('broadcast', { event: 'location' }, (payload) => {
    console.log('Driver moved:', payload);
    updateDriverMarker(payload.latitude, payload.longitude);
  })
  .subscribe();

// Subscribe to trip updates
const tripChannel = supabase.channel(`trip:${tripId}`)
  .on('broadcast', { event: 'status' }, (payload) => {
    console.log('Trip status changed:', payload);
    updateTripUI(payload.status);
  })
  .subscribe();
```

## 🧪 Testing

### Test WebSocket Connection
```bash
# Install wscat globally
npm install -g wscat

# Connect to WebSocket server
wscat -c "ws://localhost:3001" \
  -H "Authorization: Bearer JWT_TOKEN"

# Send events
> {"event": "join_trip_room", "data": {"tripId": "trip-uuid"}}
> {"event": "driver_location_update", "data": {"latitude": -17.8252, "longitude": 31.0335}}
```

### Test File Upload
```bash
# Upload license
curl -X POST http://localhost:3000/api/upload/license \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@license.jpg"

# Upload vehicle image
curl -X POST http://localhost:3000/api/upload/vehicle \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@car.jpg"

# Upload profile photo
curl -X POST http://localhost:3000/api/upload/profile \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@profile.jpg"
```

### Test Driver Location Broadcasting
```bash
# Update driver location (should broadcast to Supabase + Socket.io)
curl -X PUT http://localhost:3000/api/drivers/location \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -17.8252,
    "longitude": 31.0335,
    "heading": 180,
    "speed": 40
  }'
```

## 🔍 Debugging

### Enable WebSocket Logs
```typescript
// In realtime.gateway.ts
private readonly logger = new Logger(RealtimeGateway.name);

handleConnection(client: Socket) {
  this.logger.log(`Client connected: ${client.id}`);
}

handleDisconnect(client: Socket) {
  this.logger.log(`Client disconnected: ${client.id}`);
}
```

### Check Supabase Connection
```typescript
// Add to supabase.service.ts constructor
this.logger.log(`Supabase client initialized for ${supabaseUrl}`);
```

### Monitor Location Broadcasts
```typescript
// In drivers.service.ts updateLocation()
this.logger.debug(`Broadcasted location for driver ${driver.id}`);
this.logger.debug(`Broadcasted location to trip room: trip_${activeTrip.id}`);
```

## 📊 Database Schema (No Changes)
Phase 4 uses existing tables:
- `driver_location` - Time-series location data (already exists)
- `trips` - Trip records (already exists)
- `drivers` - Driver profiles with `currentLatitude`, `currentLongitude` (already exists)

No migrations needed.

## 🚧 Known Limitations

1. **WebSocket Port**: Socket.io runs on port 3001. Vercel may require serverless function deployment for WebSockets.
2. **Supabase Storage**: Requires Supabase project with storage buckets:
   - `driver-documents`
   - `vehicle-images`
   - `profile-images`
3. **Socket.io Scaling**: For multiple server instances, need Redis adapter for Socket.io (Phase 5).
4. **Location Accuracy**: GPS accuracy depends on mobile device capabilities.

## 🎯 Next Steps (Phase 5)

1. **Background Jobs**: Bull/Redis for automated tasks
   - Auto-expire subscriptions
   - Daily earnings reports
   - Rating reminders
2. **Payment Integration**: EcoCash API for $1 subscription payments
3. **Analytics**: Trip metrics, driver performance tracking
4. **Redis Caching**: Cache nearby drivers, active trips
5. **Socket.io Scaling**: Redis adapter for multi-instance deployments

## 📝 Deployment Checklist

- [x] Install dependencies (`npm install`)
- [x] Create Supabase project
- [ ] Add environment variables to Vercel
- [ ] Create Supabase storage buckets
- [ ] Enable Supabase Realtime for tables (if needed)
- [ ] Deploy to production
- [ ] Test WebSocket connections
- [ ] Test file uploads
- [ ] Test real-time location broadcasting
- [ ] Update mobile app with Socket.io client

## 🔗 Related Documentation
- [Phase 3: Trip Requests & Bidding](./PHASE_3_TRIP_SYSTEM.md)
- [API Documentation](./MOBILE_API_DOCUMENTATION.md)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Socket.io Documentation](https://socket.io/docs/v4/)

---

**Status**: ✅ Complete - Ready for deployment
**Production URL**: https://hande-api-nest.vercel.app/api
**WebSocket URL**: wss://hande-api-nest.vercel.app:3001 (after deployment)
