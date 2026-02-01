# Hande - Dollar-A-Day Ride Service 🚗

> **Empowering drivers, protecting riders** - A transparent ride-sharing platform where drivers pay $1/day instead of commission.

## 🌟 Overview

Hande (means "daily ride") is a revolutionary ride-sharing service that disrupts the traditional commission model. Instead of taking 20-30% from each trip, drivers subscribe for just **$1 per day** to access the platform.

### Core Features
- 🎯 **$1/Day Subscription** - Drivers pay a fixed daily fee instead of per-ride commission
- 🗺️ **Zone-Based Operations** - Local focus for better service
- 💰 **No Surge Pricing** - Transparent, fair pricing for riders
- 🔥 **Real-Time Bidding** - Drivers bid on trips, riders choose best offer
- 📍 **Live Tracking** - Real-time location updates with PostGIS
- 🔔 **Push Notifications** - Firebase Cloud Messaging
- 🛡️ **Safety First** - Emergency contacts, trip sharing

## 📂 Project Structure

```
HANDEE/
├── hande-api/           # Laravel 11 API (Legacy - being migrated)
├── hande-api-nest/      # NestJS API (New - Production)
├── hande-app/           # React Native Mobile App (iOS & Android)
├── hande-administration/# Admin Dashboard (React + Vite)
├── hande-landing/       # Marketing Website
└── docs/                # Documentation
```

## 🛠️ Tech Stack

### Backend (NestJS)
- **Framework**: NestJS (Node.js)
- **Database**: TimescaleDB (PostgreSQL with time-series)
- **ORM**: Prisma 7
- **Authentication**: JWT + Passport
- **Real-time**: Supabase Realtime
- **Queues**: Bull (Redis)
- **Payments**: Integration ready
- **Maps**: Google Maps API
- **Push**: Firebase Cloud Messaging

### Mobile App (React Native)
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Maps**: Google Maps
- **State Management**: React Query
- **Navigation**: Expo Router
- **Storage**: AsyncStorage

### Admin Dashboard
- **Framework**: React + Vite
- **Language**: TypeScript
- **UI**: Tailwind CSS
- **API Client**: Axios

### Legacy API (Laravel)
- **Framework**: Laravel 11
- **Database**: MySQL/PostgreSQL
- **Authentication**: Sanctum
- **Real-time**: Pusher

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or TimescaleDB)
- Redis
- PHP 8.2+ (for Laravel API)
- Expo CLI (for mobile app)

### 1. NestJS API Setup

```bash
cd hande-api-nest

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
npx prisma db push

# Start development server
npx nest start --watch
```

API runs on `http://localhost:3001/api`

### 2. React Native App Setup

```bash
cd hande-app

# Install dependencies
npm install

# Start Expo
npx expo start

# Run on device
# iOS: Press 'i'
# Android: Press 'a'
```

### 3. Admin Dashboard Setup

```bash
cd hande-administration

# Install dependencies
npm install

# Start dev server
npm run dev
```

Dashboard runs on `http://localhost:5173`

## 📊 Database Schema

### Core Tables
- **users** - User accounts (UUID-based)
- **table_drivers** - Driver profiles, licenses, daily fees
- **table_riders** - Rider profiles, payment preferences
- **table_trips** - Trip requests with bidding
- **table_bids** - Driver bids on trips
- **table_daily_fees** - $1/day subscription tracking
- **driver_locations** - Real-time GPS tracking
- **table_driver_vehicles** - Vehicle registration

## 🎨 Brand Colors

```css
--primary-green: #7ED957    /* CTAs, success states */
--accent-gold: #FFB800      /* $1 pricing highlight */
--black: #000000            /* Primary text */
--white: #FFFFFF            /* Backgrounds */
--neutral-gray: #F5F5F5     /* Secondary backgrounds */
--dark-gray: #333333        /* Secondary text */
--danger-red: #FF4C4C       /* Errors only */
--info-blue: #4DA6FF        /* Informational states */
```

## 📱 API Endpoints

### Authentication
```
POST /api/auth/register  - Register new user (driver/rider/admin)
POST /api/auth/login     - Login with email/password
GET  /api/auth/me        - Get current user profile
```

### Drivers (Coming in Phase 2)
```
GET  /api/drivers/profile
PUT  /api/drivers/profile
POST /api/drivers/daily-fee/pay
GET  /api/drivers/earnings
```

### Trips (Coming in Phase 3)
```
POST /api/trips/request
POST /api/trips/:id/bid
PUT  /api/trips/:id/accept-bid
PUT  /api/trips/:id/status
```

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:pass@host:port/db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Google Maps
GOOGLE_MAPS_API_KEY=

# Supabase (for Realtime)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Application
NODE_ENV=development
PORT=3001
DAILY_FEE_AMOUNT=1.00
DAILY_FEE_GRACE_HOURS=6
```

## 📖 Documentation

- [API Documentation](docs/REACT_NATIVE_API_SPEC.md)
- [Mobile API Spec](docs/MOBILE_API_DOCUMENTATION.md)
- [System Overview](docs/SYSTEM_OVERVIEW.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
- [Rider & Driver Flows](docs/RIDER_AND_DRIVER_FLOWS.md)

## 🗺️ Development Roadmap

### ✅ Phase 1: Infrastructure & Database (Complete)
- [x] Prisma schema with 25+ models
- [x] TimescaleDB connection with PostGIS
- [x] Authentication module (JWT)
- [x] User registration (Driver/Rider)

### 🚧 Phase 2: Core Modules (Next)
- [ ] Drivers module (profile, vehicles, documents)
- [ ] Riders module (favorites, emergency contacts)
- [ ] Daily fee payment system
- [ ] Background job queues

### 📅 Phase 3: Trip System
- [ ] Trip requests
- [ ] Bidding system
- [ ] Real-time location tracking
- [ ] Trip status management

### 📅 Phase 4: Real-time Features
- [ ] Supabase Realtime subscriptions
- [ ] Live location updates
- [ ] Push notifications
- [ ] In-app messaging

### 📅 Phase 5: Payments & Earnings
- [ ] Payment gateway integration
- [ ] Driver earnings tracking
- [ ] Payout system
- [ ] Transaction history

### 📅 Phase 6: Admin Features
- [ ] Live driver map
- [ ] Trip monitoring
- [ ] User management
- [ ] Analytics dashboard

### 📅 Phase 7: Production Readiness
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Load testing

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved © 2026 Hande

## 👥 Team

- **Development Team**: Building the future of ride-sharing in Zimbabwe
- **Business Model**: $1/day driver subscription
- **Mission**: Empower drivers, protect riders, transparent pricing

---

**🚗 Hande - Your daily ride, simplified.**
