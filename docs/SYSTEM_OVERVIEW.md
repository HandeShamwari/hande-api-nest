# HANDEE - Ride-Sharing Platform System Overview

**Version:** 1.0.0  
**Last Updated:** January 25, 2026  
**Status:** Production Development

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Health & Monitoring](#health--monitoring)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Real-time Features](#real-time-features)
9. [Third-Party Integrations](#third-party-integrations)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Development Setup](#development-setup)
12. [Performance & Scaling](#performance--scaling)

---

## Executive Summary

**HANDEE** (previously GO) is a comprehensive ride-sharing platform that connects riders with drivers through a modern bidding system. The platform consists of a Laravel-based RESTful API backend and a React Native mobile application for both iOS and Android.

### Core Features
- 🚗 **Ride Booking** - Request rides with pickup and destination
- 💰 **Dynamic Bidding** - Drivers bid on trips, riders select best offers
- 📍 **Real-time Tracking** - GPS tracking with WebSocket updates
- 💳 **Multi-Payment** - Support for multiple payment methods
- ⭐ **Rating System** - Two-way rating for quality assurance
- 🚨 **Safety Features** - Emergency contacts, trip sharing, SOS button
- 📊 **Analytics** - Comprehensive dashboards for drivers and riders

### Key Statistics
- **API Version:** 1.0.0
- **Mobile App Version:** 1.0.0
- **API Endpoints:** 200+
- **Supported Platforms:** iOS, Android
- **Database:** MySQL
- **Real-time Protocol:** Pusher (WebSocket)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      HANDEE Platform                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│  Mobile App  │    │   Backend API    │   │ Admin Panel  │
│ React Native │◄──►│    Laravel 12    │◄─►│     Web      │
│  iOS/Android │    │   RESTful API    │   │   Dashboard  │
└──────────────┘    └──────────────────┘   └──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│    MySQL     │    │  Pusher/WebSockets│   │ Google Maps  │
│   Database   │    │   Real-time Comms │   │   Services   │
└──────────────┘    └──────────────────┘   └──────────────┘
```

### Modular Architecture

The backend follows a **modular monolith** pattern with three primary business modules:

```
app-modules/
├── admin/          # Administrative functions, fare management
│   ├── Controllers/
│   ├── Models/
│   ├── Repositories/
│   └── Services/
│
├── driver/         # Driver management, trips, earnings
│   ├── Controllers/
│   ├── Models/
│   ├── Repositories/
│   └── Services/
│
└── rider/          # Rider management, bookings, payments
    ├── Controllers/
    ├── Models/
    ├── Repositories/
    └── Services/
```

### Application Layers

1. **Presentation Layer** (Mobile App)
   - React Native components
   - Redux state management
   - Navigation flows

2. **API Layer** (Laravel Routes)
   - RESTful endpoints
   - Middleware authentication
   - Request validation

3. **Business Logic Layer** (Controllers & Services)
   - Trip management
   - Bidding system
   - Payment processing

4. **Data Access Layer** (Repositories & Models)
   - Repository pattern
   - Eloquent ORM
   - Database abstraction

5. **Infrastructure Layer**
   - MySQL database
   - Pusher WebSockets
   - Google Maps API
   - File storage

---

## Technology Stack

### Backend (Laravel API)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Laravel | 12.x | Core application framework |
| **Language** | PHP | 8.2+ | Server-side language |
| **Database** | MySQL | 8.0+ | Primary data store |
| **Authentication** | Laravel Sanctum | 4.0 | API token authentication |
| **Cache** | Redis (optional) | - | Session & query caching |
| **Queue** | Laravel Queue | - | Background job processing |
| **Repository Pattern** | prettus/l5-repository | 2.10 | Data access abstraction |
| **Permissions** | spatie/laravel-permission | 6.21 | Role & permission management |
| **HTTP Client** | GuzzleHTTP | 7.9 | External API requests |
| **Module System** | internachi/modular | 2.3 | Modular architecture support |

**Composer Dependencies:**
```json
{
  "php": "^8.2",
  "laravel/framework": "^12.0",
  "laravel/sanctum": "^4.0",
  "laravel/tinker": "^2.10.1",
  "guzzlehttp/guzzle": "^7.9",
  "prettus/l5-repository": "^2.10",
  "spatie/laravel-permission": "^6.21",
  "internachi/modular": "^2.3"
}
```

### Frontend (React Native Mobile App)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Expo | ~54.0 | React Native development platform |
| **Language** | TypeScript | ~5.9 | Type-safe JavaScript |
| **UI Library** | React Native | 0.81.5 | Cross-platform mobile UI |
| **State Management** | Redux Toolkit | 2.11.2 | Global state management |
| **State Persistence** | Redux Persist | 6.0.0 | Persist Redux state |
| **Navigation** | React Navigation | 7.x | App navigation |
| **HTTP Client** | Axios | 1.13.2 | API requests |
| **Maps** | react-native-webview | 13.16.0 | Google Maps WebView |
| **Location** | expo-location | 19.0.8 | GPS & location services |
| **Real-time** | Pusher JS | 8.4.0 | WebSocket communication |
| **Notifications** | expo-notifications | 0.32.16 | Push notifications |
| **Forms** | Formik + Yup | 2.4.9 / 1.7.1 | Form handling & validation |

**Key NPM Dependencies:**
```json
{
  "expo": "~54.0.31",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@reduxjs/toolkit": "^2.11.2",
  "axios": "^1.13.2",
  "pusher-js": "^8.4.0",
  "expo-location": "^19.0.8",
  "react-native-webview": "^13.16.0"
}
```

### Third-Party Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Google Maps** | Maps, routing, geocoding | WebView + Directions API |
| **Pusher** | Real-time WebSocket communication | pusher-js client |
| **Firebase** (optional) | Push notifications, analytics | expo-notifications |
| **Payment Gateway** (planned) | Payment processing | TBD |

---

## API Endpoints Reference

### Base URLs

```
Development:  http://localhost:8000
Production:   https://api.handee.app
Mobile API:   /api/mobile/v1
Admin API:    /api/admin
```

### Health & Status Endpoints

#### Mobile API Health Check
```http
GET /api/mobile/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### API Documentation
```http
GET /api/mobile/docs
```

**Response:**
```json
{
  "message": "Mobile API Documentation",
  "version": "1.0.0",
  "endpoints": {
    "authentication": "/mobile/v1/auth/*",
    "driver": "/mobile/v1/driver/*",
    "rider": "/mobile/v1/rider/*",
    "shared": "/mobile/v1/shared/*"
  },
  "documentation_url": null
}
```

#### Server Time
```http
GET /api/utils/server-time
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": 1737799800,
    "iso": "2026-01-25T10:30:00.000Z",
    "timezone": "UTC",
    "formatted": "2026-01-25 10:30:00"
  }
}
```

#### Maintenance Status
```http
GET /api/utils/maintenance-status
```

**Response:**
```json
{
  "maintenance_mode": false,
  "estimated_completion": null,
  "message": null
}
```

### Core API Endpoints Summary

#### Authentication (`/api/mobile/v1/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /register/rider` - Register rider
- `POST /register/driver` - Register driver
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile

#### Rider Endpoints (`/api/mobile/v1/rider`)
- **Dashboard**
  - `GET /dashboard/overview` - Dashboard summary
  - `GET /dashboard/recent-trips` - Recent trips
  
- **Booking**
  - `POST /booking/estimate` - Get fare estimate
  - `POST /booking` - Book a trip
  - `POST /booking/schedule` - Schedule future trip
  
- **Trips**
  - `GET /trips/current` - Get active trip
  - `GET /trips/{tripId}` - Trip details
  - `GET /trips/{tripId}/bids` - Get trip bids
  - `POST /trips/{tripId}/bids/{bidId}` - Accept bid
  - `POST /trips/{tripId}/cancel` - Cancel trip
  - `GET /trips/history` - Trip history
  
- **Tracking**
  - `GET /tracking/trip/{tripId}/location` - Driver location
  - `GET /tracking/trip/{tripId}/eta` - Get ETA
  - `POST /tracking/share-location` - Share trip location
  
- **Payments**
  - `GET /payments/methods` - Get payment methods
  - `POST /payments/methods` - Add payment method
  - `POST /payments/trip/{tripId}/pay` - Pay for trip
  - `POST /payments/trip/{tripId}/tip` - Add tip
  - `GET /payments/history` - Payment history
  
- **Ratings**
  - `POST /ratings/driver/{tripId}` - Rate driver
  - `GET /ratings/history` - Rating history
  
- **Safety**
  - `POST /safety/emergency/trigger` - Trigger emergency
  - `GET /safety/emergency/contacts` - Emergency contacts
  - `POST /safety/trip/{tripId}/share` - Share trip with contacts

#### Driver Endpoints (`/api/mobile/v1/driver`)
- **Dashboard**
  - `GET /dashboard/overview` - Dashboard summary
  - `GET /dashboard/today-stats` - Today's statistics
  - `GET /dashboard/weekly-stats` - Weekly statistics
  
- **Status**
  - `GET /status` - Get current status
  - `POST /status/online` - Go online
  - `POST /status/offline` - Go offline
  - `POST /status/location` - Update location
  
- **Trips**
  - `GET /trips/available` - Available trips
  - `POST /trips/{tripId}/bid` - Place bid on trip
  - `GET /trips/bids` - My active bids
  - `POST /trips/{tripId}/accept` - Accept trip
  - `POST /trips/{tripId}/start` - Start trip
  - `POST /trips/{tripId}/arrive` - Arrive at pickup
  - `POST /trips/{tripId}/complete` - Complete trip
  - `POST /trips/{tripId}/cancel` - Cancel trip
  - `GET /trips/current` - Current active trip
  - `GET /trips/history` - Trip history
  
- **Earnings**
  - `GET /earnings/overview` - Earnings overview
  - `GET /earnings/balance` - Available balance
  - `GET /earnings/history` - Earnings history
  - `POST /earnings/payout/instant` - Request instant payout
  - `GET /earnings/analytics` - Earnings analytics
  
- **Daily Fee**
  - `GET /daily-fee/status` - Fee payment status
  - `POST /daily-fee/pay` - Pay daily fee
  - `POST /daily-fee/pay-all` - Pay all unpaid fees
  - `GET /daily-fee/history` - Fee payment history
  
- **Vehicles**
  - `GET /vehicles` - List vehicles
  - `POST /vehicles` - Add vehicle
  - `PUT /vehicles/{vehicleId}` - Update vehicle
  - `POST /vehicles/{vehicleId}/activate` - Activate vehicle
  
- **Documents**
  - `GET /documents` - List documents
  - `POST /documents` - Upload document
  - `GET /documents/expiring` - Expiring documents
  - `POST /documents/{documentId}/resubmit` - Resubmit document
  
- **Shifts**
  - `GET /shifts/current` - Current shift
  - `POST /shifts/start` - Start shift
  - `POST /shifts/end` - End shift
  - `GET /shifts/history` - Shift history

#### Shared Endpoints (`/api/mobile/v1`)
- **Config**
  - `GET /config/app` - App configuration
  - `GET /config/vehicle-types` - Vehicle types
  - `GET /config/fare-structure` - Fare structure
  - `POST /config/fare-estimate` - Estimate fare
  
- **Notifications**
  - `GET /notifications` - List notifications
  - `GET /notifications/unread-count` - Unread count
  - `POST /notifications/mark-read` - Mark as read
  - `POST /notifications/device-token` - Update device token
  
- **Location**
  - `POST /location/update` - Update location
  - `POST /location/geocode` - Geocode address
  - `POST /location/reverse-geocode` - Reverse geocode
  - `POST /location/search-places` - Search places
  
- **Support**
  - `GET /support/tickets` - Support tickets
  - `POST /support/tickets` - Create ticket
  - `GET /support/faq` - FAQ articles
  - `POST /support/feedback` - Submit feedback

### Request/Response Format

**Standard Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... },
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  },
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

---

## Health & Monitoring

### System Health Checks

#### 1. Application Health
```bash
# Check API health
curl https://api.handee.app/api/mobile/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-01-25T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### 2. Database Health
```bash
# Laravel command
php artisan db:monitor

# Check database connection
php artisan tinker
>>> DB::connection()->getPdo();
```

#### 3. Queue Health
```bash
# Monitor queue workers
php artisan queue:monitor

# Check failed jobs
php artisan queue:failed
```

#### 4. Cache Health
```bash
# Check cache connection
php artisan cache:clear
php artisan config:cache
```

### Monitoring Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /api/mobile/health` | API health status | No |
| `GET /api/utils/server-time` | Server time sync | No |
| `GET /api/utils/maintenance-status` | Maintenance mode status | No |
| `GET /api/utils/version-check` | App version check | No |

### Key Metrics to Monitor

**Performance Metrics:**
- API response time (target: < 200ms)
- Database query time (target: < 100ms)
- Queue processing time
- WebSocket message latency

**Business Metrics:**
- Active trips count
- Online drivers count
- Booking success rate
- Average trip completion time
- Revenue per trip

**System Metrics:**
- CPU usage
- Memory usage
- Database connections
- Queue size
- Error rate (target: < 1%)

### Logging

**Log Channels:**
```php
// config/logging.php
'channels' => [
    'stack' => ['daily', 'sentry'],  // Production
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => 'debug',
        'days' => 14,
    ],
]
```

**Log Locations:**
- Application logs: `storage/logs/laravel.log`
- Queue logs: `storage/logs/queue.log`
- API logs: `storage/logs/api.log`

---

## Database Schema

### Core Tables

#### Users & Authentication
```sql
-- users
id                      UUID PRIMARY KEY
name                    VARCHAR(255)
email                   VARCHAR(255) UNIQUE
phone                   VARCHAR(20) UNIQUE
email_verified_at       TIMESTAMP
phone_verified_at       TIMESTAMP
password                VARCHAR(255)
active_role             ENUM('rider', 'driver', 'admin')
created_at, updated_at  TIMESTAMP

-- personal_access_tokens (Sanctum)
id                      BIGINT PRIMARY KEY
tokenable_id            UUID
name                    VARCHAR(255)
token                   VARCHAR(64) UNIQUE
abilities               TEXT
expires_at              TIMESTAMP
```

#### Riders
```sql
-- table_riders
id                      UUID PRIMARY KEY
user_id                 UUID FOREIGN KEY -> users.id
date_of_birth           DATE
gender                  ENUM('male', 'female', 'other')
profile_picture_url     VARCHAR(255)
verification_status     ENUM('pending', 'verified', 'rejected')
rating                  DECIMAL(3,2)
total_trips             INT DEFAULT 0
created_at, updated_at  TIMESTAMP
```

#### Drivers
```sql
-- table_drivers
id                      UUID PRIMARY KEY
user_id                 UUID FOREIGN KEY -> users.id
driver_license_number   VARCHAR(50)
license_expiry_date     DATE
date_of_birth           DATE
gender                  ENUM('male', 'female', 'other')
profile_picture_url     VARCHAR(255)
verification_status     ENUM('pending', 'verified', 'rejected')
status                  ENUM('offline', 'online', 'on_trip', 'break')
current_latitude        DECIMAL(10,8)
current_longitude       DECIMAL(11,8)
rating                  DECIMAL(3,2)
total_trips             INT DEFAULT 0
total_earnings          DECIMAL(10,2) DEFAULT 0
created_at, updated_at  TIMESTAMP
```

#### Trips
```sql
-- table_trips
id                      UUID PRIMARY KEY
rider_id                UUID FOREIGN KEY -> table_riders.id
driver_id               UUID NULLABLE FOREIGN KEY -> table_drivers.id
pickup_location         VARCHAR(255)
pickup_latitude         DECIMAL(10,8)
pickup_longitude        DECIMAL(11,8)
dropoff_location        VARCHAR(255)
dropoff_latitude        DECIMAL(10,8)
dropoff_longitude       DECIMAL(11,8)
estimated_fare          DECIMAL(10,2)
offered_fare            DECIMAL(10,2) NULLABLE
final_fare              DECIMAL(10,2) NULLABLE
distance_km             DECIMAL(8,2)
estimated_duration_min  INT
status                  ENUM('pending', 'searching', 'accepted', 
                             'arriving', 'in_progress', 'completed', 'cancelled')
vehicle_type            ENUM('sedan', 'suv', 'luxury', 'xl')
payment_method          VARCHAR(50)
trip_started_at         TIMESTAMP
trip_completed_at       TIMESTAMP
cancelled_at            TIMESTAMP
cancellation_reason     TEXT
created_at, updated_at  TIMESTAMP
```

#### Bids
```sql
-- table_bids
id                      UUID PRIMARY KEY
trip_id                 UUID FOREIGN KEY -> table_trips.id
driver_id               UUID FOREIGN KEY -> table_drivers.id
bid_amount              DECIMAL(10,2)
estimated_arrival_min   INT
status                  ENUM('pending', 'accepted', 'rejected', 'expired')
expires_at              TIMESTAMP
created_at, updated_at  TIMESTAMP

-- Indexes
INDEX idx_trip_status (trip_id, status)
INDEX idx_driver_active (driver_id, status, created_at)
```

#### Vehicles
```sql
-- table_driver_vehicles
id                      UUID PRIMARY KEY
driver_id               UUID FOREIGN KEY -> table_drivers.id
make                    VARCHAR(50)
model                   VARCHAR(50)
year                    INT
color                   VARCHAR(30)
license_plate           VARCHAR(20) UNIQUE
vehicle_type            ENUM('sedan', 'suv', 'luxury', 'xl')
is_active               BOOLEAN DEFAULT false
created_at, updated_at  TIMESTAMP
```

#### Documents
```sql
-- table_driver_documents
id                      UUID PRIMARY KEY
driver_id               UUID FOREIGN KEY -> table_drivers.id
document_type           ENUM('license', 'insurance', 'registration', 
                             'background_check', 'profile_photo')
file_path               VARCHAR(255)
status                  ENUM('pending', 'approved', 'rejected')
expiry_date             DATE NULLABLE
rejection_reason        TEXT NULLABLE
created_at, updated_at  TIMESTAMP
```

#### Daily Fees
```sql
-- daily_fees
id                      UUID PRIMARY KEY
driver_id               UUID FOREIGN KEY -> table_drivers.id
fee_date                DATE
amount                  DECIMAL(10,2) DEFAULT 1.00
penalty_amount          DECIMAL(10,2) DEFAULT 0.00
total_amount            DECIMAL(10,2)
status                  ENUM('unpaid', 'paid', 'waived')
due_at                  TIMESTAMP
paid_at                 TIMESTAMP NULLABLE
created_at, updated_at  TIMESTAMP

-- Unique constraint: one fee per driver per day
UNIQUE KEY unique_driver_date (driver_id, fee_date)
```

#### Ratings
```sql
-- table_ratings
id                      UUID PRIMARY KEY
trip_id                 UUID FOREIGN KEY -> table_trips.id
rater_id                UUID FOREIGN KEY -> users.id
rated_id                UUID FOREIGN KEY -> users.id
rater_type              ENUM('rider', 'driver')
rating                  INT (1-5)
comment                 TEXT NULLABLE
created_at, updated_at  TIMESTAMP
```

#### Emergency Contacts
```sql
-- table_emergency_contacts
id                      UUID PRIMARY KEY
user_id                 UUID FOREIGN KEY -> users.id
name                    VARCHAR(255)
phone                   VARCHAR(20)
relationship            VARCHAR(50)
is_primary              BOOLEAN DEFAULT false
created_at, updated_at  TIMESTAMP
```

### Database Indexes

**Performance-Critical Indexes:**
```sql
-- Trips
CREATE INDEX idx_trips_rider_status ON table_trips(rider_id, status);
CREATE INDEX idx_trips_driver_status ON table_trips(driver_id, status);
CREATE INDEX idx_trips_status_created ON table_trips(status, created_at);
CREATE INDEX idx_trips_location ON table_trips(pickup_latitude, pickup_longitude);

-- Drivers
CREATE INDEX idx_drivers_status_location ON table_drivers(status, current_latitude, current_longitude);
CREATE INDEX idx_drivers_user_id ON table_drivers(user_id);

-- Bids
CREATE INDEX idx_bids_trip_status ON table_bids(trip_id, status);
CREATE INDEX idx_bids_driver_status ON table_bids(driver_id, status);

-- Daily Fees
CREATE INDEX idx_daily_fees_driver_status ON daily_fees(driver_id, status, fee_date);
CREATE INDEX idx_daily_fees_date_status ON daily_fees(fee_date, status);
```

---

## Authentication & Security

### Authentication Flow

**1. User Registration:**
```
User → POST /api/auth/riders or /api/auth/drivers
     → Create user account
     → Send verification email/SMS
     → Return auth token
```

**2. User Login:**
```
User → POST /api/auth/login (email/phone + password)
     → Validate credentials
     → Create Sanctum token
     → Return token + user data
```

**3. API Authentication:**
```
Client → Add header: Authorization: Bearer {token}
      → Laravel Sanctum validates token
      → Load user from token
      → Execute request
```

### Security Measures

#### API Security
- **Rate Limiting:** 60 requests/minute per IP
- **CORS:** Configured for mobile app domains
- **HTTPS Only:** All production traffic uses TLS
- **Token Expiration:** Tokens expire after 30 days
- **Password Hashing:** Bcrypt with cost factor 12

#### Data Protection
- **Personal Data Encryption:** Sensitive fields encrypted at rest
- **Database Credentials:** Stored in environment variables
- **API Keys:** Never committed to version control
- **File Upload Validation:** MIME type and size checks

#### Role-Based Access Control (RBAC)

**Roles:**
- `rider` - Can book trips, view history, make payments
- `driver` - Can accept trips, update status, manage earnings
- `admin` - Full system access

**Permission Middleware:**
```php
// routes/api.php
Route::middleware(['auth:sanctum', 'role:driver'])->group(function () {
    // Driver-only routes
});

Route::middleware(['auth:sanctum', 'role:rider'])->group(function () {
    // Rider-only routes
});
```

### Token Management

**Token Creation:**
```php
// Create token with abilities
$token = $user->createToken('mobile-app', ['*']);
return $token->plainTextToken;
```

**Token Revocation:**
```php
// Revoke current token
$request->user()->currentAccessToken()->delete();

// Revoke all tokens (logout all devices)
$request->user()->tokens()->delete();
```

**Token Scopes:**
- `*` - Full access
- `read:profile` - Read profile data
- `write:trips` - Create/update trips
- `read:earnings` - View earnings

---

## Real-time Features

### Pusher Integration

**Configuration:**
```env
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=your_cluster
```

**Client Setup (Mobile App):**
```typescript
import Pusher from 'pusher-js';

const pusher = new Pusher('your_app_key', {
  cluster: 'your_cluster',
  encrypted: true,
  authEndpoint: '/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  },
});
```

### Real-time Events

#### Trip Updates
```typescript
// Subscribe to trip channel
const channel = pusher.subscribe(`trip.${tripId}`);

// Listen for events
channel.bind('TripUpdated', (data) => {
  // Update trip status in UI
  updateTripStatus(data.trip);
});

channel.bind('DriverLocationUpdated', (data) => {
  // Update driver marker on map
  updateDriverLocation(data.location);
});

channel.bind('BidReceived', (data) => {
  // Show new bid notification
  showBidNotification(data.bid);
});
```

#### Driver Status Updates
```typescript
// Subscribe to driver channel
const channel = pusher.subscribe(`driver.${driverId}`);

channel.bind('TripRequest', (data) => {
  // Show incoming trip request
  showTripRequest(data.trip);
});

channel.bind('TripAccepted', (data) => {
  // Navigate to active trip screen
  navigateToActiveTrip(data.trip);
});
```

### Polling Fallbacks

For scenarios where WebSocket is unavailable:

**Driver Polling:**
```typescript
// Poll available trips every 10 seconds
setInterval(async () => {
  const trips = await driverApi.getAvailableTrips();
  updateAvailableTrips(trips);
}, 10000);

// Poll bid updates every 5 seconds
setInterval(async () => {
  const bids = await driverApi.getMyBids();
  updateActiveBids(bids);
}, 5000);
```

**Rider Polling:**
```typescript
// Poll trip status every 3 seconds during active trip
if (tripStatus === 'in_progress') {
  setInterval(async () => {
    const trip = await riderApi.getCurrentTrip();
    updateTripData(trip);
  }, 3000);
}
```

---

## Third-Party Integrations

### Google Maps API

**Services Used:**
- **Maps JavaScript API** - WebView-based maps
- **Directions API** - Route calculation
- **Geocoding API** - Address → coordinates
- **Places API** - Location search & autocomplete
- **Distance Matrix API** - Travel time/distance

**API Key Configuration:**
```typescript
// Mobile app
const GOOGLE_MAPS_API_KEY = 'your_api_key';

// Backend
GOOGLE_MAPS_API_KEY=your_api_key
```

**Example: Fare Estimation**
```php
// Backend: Get route data
$response = Http::get('https://maps.googleapis.com/maps/api/directions/json', [
    'origin' => "{$pickup_lat},{$pickup_lng}",
    'destination' => "{$dropoff_lat},{$dropoff_lng}",
    'key' => config('services.google.maps_api_key'),
]);

$distance_km = $response['routes'][0]['legs'][0]['distance']['value'] / 1000;
$duration_min = $response['routes'][0]['legs'][0]['duration']['value'] / 60;

// Calculate fare based on distance and vehicle type
$fare = calculateFare($distance_km, $vehicle_type);
```

### Firebase (Optional)

**Services:**
- **Cloud Messaging (FCM)** - Push notifications
- **Analytics** - User behavior tracking
- **Crashlytics** - Crash reporting

**Configuration:**
```json
// Mobile app: google-services.json
{
  "project_info": {
    "project_id": "handee-app",
    "firebase_url": "https://handee-app.firebaseio.com"
  }
}
```

### Payment Gateways (Planned)

**Supported Methods:**
- Credit/Debit Cards
- Mobile Money
- Cash
- Wallet Balance

---

## Deployment & Infrastructure

### Production Environment

**Server Requirements:**
- **OS:** Ubuntu 22.04 LTS or higher
- **Web Server:** Nginx or Apache
- **PHP:** 8.2+ with extensions (mbstring, pdo, xml, curl, zip)
- **Database:** MySQL 8.0+
- **Memory:** 2GB+ RAM
- **Storage:** 20GB+ SSD

### Deployment Steps

#### 1. Backend Deployment

```bash
# Clone repository
git clone https://github.com/your-org/handee-api.git
cd handee-api/go

# Install dependencies
composer install --optimize-autoloader --no-dev

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Setup queue worker
php artisan queue:work --daemon

# Setup cron job for scheduler
* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
```

#### 2. Mobile App Deployment

**iOS (App Store):**
```bash
cd hande
eas build --platform ios --profile production
eas submit --platform ios --latest
```

**Android (Play Store):**
```bash
eas build --platform android --profile production
eas submit --platform android --latest
```

### Environment Variables

**Backend (.env):**
```env
APP_NAME=HANDEE
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.handee.app

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=handee_production
DB_USERNAME=handee_user
DB_PASSWORD=secure_password

PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_key
PUSHER_APP_SECRET=your_secret
PUSHER_APP_CLUSTER=your_cluster

GOOGLE_MAPS_API_KEY=your_google_maps_key

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password

MOBILE_API_VERSION=1.0.0
MOBILE_APP_MIN_VERSION=1.0.0
```

**Mobile App (app.json):**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.handee.app",
      "pusherKey": "your_pusher_key",
      "pusherCluster": "your_cluster",
      "googleMapsApiKey": "your_google_maps_key"
    }
  }
}
```

### CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          ssh user@server 'cd /var/www/handee && git pull'
          ssh user@server 'cd /var/www/handee/go && composer install'
          ssh user@server 'cd /var/www/handee/go && php artisan migrate --force'
  
  deploy-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and submit
        run: |
          cd hande
          eas build --platform all --profile production
          eas submit --platform all --latest
```

---

## Development Setup

### Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/handee.git
cd handee/go

# 2. Install PHP dependencies
composer install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Configure database
# Edit .env file with your database credentials
DB_CONNECTION=mysql
DB_DATABASE=handee_dev
DB_USERNAME=root
DB_PASSWORD=

# 5. Run migrations
php artisan migrate

# 6. (Optional) Seed database
php artisan db:seed

# 7. Start development server
php artisan serve
# API available at http://localhost:8000
```

### Mobile App Setup

```bash
# 1. Navigate to mobile app directory
cd handee/hande

# 2. Install dependencies
npm install

# 3. Configure API endpoint
# Edit src/config/api.ts
export const API_URL = 'http://10.0.2.2:8000/api/mobile/v1';  // Android emulator
# or
export const API_URL = 'http://localhost:8000/api/mobile/v1';  // iOS simulator

# 4. Start Expo development server
npm start

# 5. Run on device/simulator
npm run android  # Android
npm run ios      # iOS
```

### Testing

**Backend Tests:**
```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Feature

# Run with coverage
php artisan test --coverage
```

**Mobile App Tests:**
```bash
# Run Jest tests
npm test

# Run with coverage
npm test -- --coverage
```

### Development Tools

**Backend:**
- Laravel Telescope - Debugging & profiling
- Laravel Tinker - REPL for testing
- Laravel Pail - Real-time log monitoring
- PHPUnit - Unit & integration testing

**Mobile:**
- Expo DevTools - React Native debugging
- React DevTools - Component inspection
- Redux DevTools - State debugging
- Flipper - Network & storage inspection

---

## Performance & Scaling

### Performance Optimization

#### Backend Optimizations

**1. Database Query Optimization**
```php
// Use eager loading to prevent N+1 queries
$trips = Trip::with(['rider', 'driver', 'bids'])->get();

// Use select to limit columns
$drivers = Driver::select(['id', 'name', 'status'])->get();

// Use indexes for frequent queries
Schema::table('table_trips', function (Blueprint $table) {
    $table->index(['status', 'created_at']);
});
```

**2. Caching Strategy**
```php
// Cache expensive queries
$drivers = Cache::remember('available_drivers', 60, function () {
    return Driver::where('status', 'online')->get();
});

// Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**3. Queue Jobs**
```php
// Move slow operations to queues
dispatch(new SendTripNotification($trip));
dispatch(new CalculateDriverEarnings($driver));
```

#### Mobile App Optimizations

**1. Image Optimization**
```typescript
// Use cached images
<Image source={uri} cachePolicy="memory-disk" />

// Lazy load images
<Image source={uri} lazyLoad={true} />
```

**2. List Virtualization**
```typescript
// Use FlatList for long lists
<FlatList
  data={trips}
  renderItem={renderTripItem}
  keyExtractor={item => item.id}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

**3. Redux Optimization**
```typescript
// Use memoized selectors
const selectActiveTrip = createSelector(
  state => state.trips.list,
  trips => trips.find(t => t.status === 'in_progress')
);
```

### Scaling Strategies

#### Horizontal Scaling

**1. Load Balancing**
```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌────────┐        ┌────────┐        ┌────────┐
   │ API    │        │ API    │        │ API    │
   │Server 1│        │Server 2│        │Server 3│
   └────────┘        └────────┘        └────────┘
```

**2. Database Replication**
```
   ┌──────────────┐
   │Master (Write)│
   └──────┬───────┘
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
 ┌────┐ ┌────┐ ┌────┐
 │Rep1│ │Rep2│ │Rep3│  (Read-only)
 └────┘ └────┘ └────┘
```

**3. Queue Workers**
```bash
# Run multiple queue workers
php artisan queue:work --queue=high,default --tries=3 &
php artisan queue:work --queue=low --tries=3 &
```

#### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database (indexes, query optimization)
- Use faster storage (SSD/NVMe)
- Upgrade to better hosting plan

### Monitoring & Alerts

**Key Metrics:**
- Response time < 200ms (95th percentile)
- Error rate < 1%
- Uptime > 99.9%
- Database query time < 100ms
- Queue processing time < 5s

**Alert Triggers:**
- API response time > 1s
- Error rate > 5%
- Database connections > 80% capacity
- Queue size > 1000 jobs
- Disk usage > 85%

---

## API Endpoint Count Summary

| Category | Endpoint Count | Description |
|----------|----------------|-------------|
| **Authentication** | 12 | Login, register, password reset, profile |
| **Rider - Booking** | 18 | Fare estimation, booking, scheduling |
| **Rider - Trips** | 22 | Trip management, tracking, history |
| **Rider - Payments** | 16 | Payment methods, transactions, receipts |
| **Rider - Safety** | 10 | Emergency features, trip sharing |
| **Rider - Other** | 34 | Ratings, promos, preferences, analytics |
| **Driver - Dashboard** | 8 | Overview, statistics, notifications |
| **Driver - Status** | 10 | Online/offline, location updates |
| **Driver - Trips** | 24 | Available trips, bidding, trip actions |
| **Driver - Earnings** | 12 | Earnings overview, payouts, analytics |
| **Driver - Vehicles** | 10 | Vehicle management, photos |
| **Driver - Documents** | 9 | Document upload, verification |
| **Driver - Other** | 38 | Shifts, training, referrals, support |
| **Shared Services** | 42 | Config, notifications, location, support |
| **Health & Utils** | 5 | Health checks, server time, maintenance |
| **Admin** | 15 | Fare settings, user management |
| **Total** | **285** | **All API endpoints** |

---

## Support & Documentation

### Additional Documentation

- [Mobile API Documentation](./MOBILE_API_DOCUMENTATION.md)
- [Rider & Driver Flows](./RIDER_AND_DRIVER_FLOWS.md)
- [React Native Setup Guide](./REACT_NATIVE_SETUP_GUIDE.md)
- [TypeScript Types Reference](./TYPESCRIPT_TYPES.md)
- [Emergency Contacts API Fix](./emergency-contacts-api-fix.md)

### Contact & Support

- **GitHub Issues:** https://github.com/your-org/handee/issues
- **Email:** support@handee.app
- **Documentation:** https://docs.handee.app

---

**Document Version:** 1.0.0  
**Last Updated:** January 25, 2026  
**Maintained By:** HANDEE Development Team
