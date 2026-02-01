# Hande - Production Deployments

## 🌐 Live URLs

### API (Backend)
- **URL**: https://handeshamwari-transport-hande-api.vercel.app
- **Tech**: NestJS + Prisma + TimescaleDB
- **Endpoints**: `/api/auth/*`, `/api/*`
- **Region**: Washington DC (iad1)

### Landing Page (Public)
- **URL**: https://handeshamwari-transport-hande-6664.vercel.app
- **Tech**: Vite + React
- **Purpose**: Marketing landing page for riders/drivers

### Admin Dashboard
- **URL**: https://handeshamwari-transport-hande-bwgf.vercel.app
- **Tech**: Vite + React + TypeScript + TanStack Query
- **Purpose**: Admin panel for managing users, trips, payments

### Mobile App (React Native)
- **Platform**: iOS + Android
- **Tech**: Expo + React Native
- **API**: Configured to use production API
- **Status**: Development (not deployed to stores yet)

---

## 🔧 Configuration

### Environment Variables

#### API (`hande-api-nest/.env`)
```env
DATABASE_URL=postgres://tsdbadmin:***@qviwk2ldus.clb1ydj108.tsdb.cloud.timescale.com:38051/tsdb?sslmode=require
JWT_SECRET=hande-ride-service-jwt-secret-2026
PORT=3001
NODE_ENV=production
DAILY_FEE_AMOUNT=1.00
DAILY_FEE_GRACE_HOURS=6
```

#### Mobile App (`hande-app/.env`)
```env
EXPO_PUBLIC_API_URL=https://handeshamwari-transport-hande-api.vercel.app/api
EXPO_PUBLIC_PUSHER_APP_KEY=86eb2370aaced33a801d
EXPO_PUBLIC_PUSHER_CLUSTER=us2
EXPO_PUBLIC_GOOGLE_API_KEY=AIzaSyDjpjf5fKbdac_VvA3n05YrWoPnEnm8OrQ
```

#### Landing Page (`hande-landing/.env`)
```env
VITE_API_URL=https://handeshamwari-transport-hande-api.vercel.app/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDjpjf5fKbdac_VvA3n05YrWoPnEnm8OrQ
```

#### Admin Dashboard (`hande-administration/.env`)
```env
VITE_API_BASE_URL=https://handeshamwari-transport-hande-api.vercel.app/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDjpjf5fKbdac_VvA3n05YrWoPnEnm8OrQ
```

---

## 📊 Deployment Status

| Service | Status | Last Deploy | Commit |
|---------|--------|-------------|--------|
| API | ✅ Live | 2026-02-01 | 905982b |
| Landing | ✅ Live | 2026-02-01 | - |
| Admin | ✅ Live | 2026-02-01 | 6117d61 |
| Mobile App | 🟡 Dev | - | - |

---

## 🧪 API Testing

### Health Check
```bash
curl https://handeshamwari-transport-hande-api.vercel.app/api
# Response: "Hello World!"
```

### Auth Endpoints
```bash
# Test unauthorized access
curl https://handeshamwari-transport-hande-api.vercel.app/api/auth/me
# Response: {"message":"Unauthorized","statusCode":401}

# Register a new user
curl -X POST https://handeshamwari-transport-hande-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Driver",
    "phone": "+263771234567",
    "userType": "driver"
  }'
```

---

## 🔐 Database

### TimescaleDB
- **Host**: qviwk2ldus.clb1ydj108.tsdb.cloud.timescale.com
- **Port**: 38051
- **Database**: tsdb
- **Extension**: PostGIS 3.6.1
- **ORM**: Prisma 7.3.0 with PostgreSQL adapter

### Schema Status
- ✅ 25+ models defined (Users, Drivers, Riders, Trips, Bids, etc.)
- ✅ Prisma client generated
- ⚠️ Migrations pending (run `npx prisma db push` if needed)

---

## 🚀 Deployment Commands

### Redeploy API
```bash
cd hande-api-nest
git add .
git commit -m "update: API changes"
git push origin main
# Vercel auto-deploys on push
```

### Redeploy Admin Dashboard
```bash
cd hande-administration
git add .
git commit -m "update: admin changes"
git push origin main
# Vercel auto-deploys on push
```

### Build Mobile App
```bash
cd hande-app
npm run build:android  # Android APK
npm run build:ios      # iOS IPA
```

---

## 📝 Next Steps

### Phase 2: Complete Driver/Rider Modules
- [ ] Driver subscription management (`POST /api/drivers/subscribe`)
- [ ] Rider trip requests (`POST /api/trips/request`)
- [ ] Driver trip acceptance (`POST /api/trips/{id}/accept`)
- [ ] Real-time location tracking

### Phase 3: Payment Integration
- [ ] EcoCash Mobile Money integration
- [ ] Daily driver subscription fees ($1/day)
- [ ] Automatic payment processing

### Phase 4: Real-time Features
- [ ] Pusher integration for live updates
- [ ] Driver location tracking
- [ ] Trip status notifications
- [ ] In-app messaging

### Phase 5: Mobile App Release
- [ ] TestFlight (iOS) deployment
- [ ] Google Play Internal Testing
- [ ] Beta testing with real users
- [ ] Production release

---

## 🐛 Known Issues

1. **API Registration Error (500)**
   - Status: Under investigation
   - Likely cause: Database connection or Prisma adapter issue
   - Next step: Check Vercel function logs

2. **Admin Dashboard Login**
   - Status: Not implemented yet
   - Next: Create admin auth endpoints

---

## 📞 Support

- **GitHub**: https://github.com/handeshamwari-transport/hande
- **Organization**: HandeShamwari
- **Repository**: Monorepo structure with all projects

---

Last Updated: February 1, 2026
