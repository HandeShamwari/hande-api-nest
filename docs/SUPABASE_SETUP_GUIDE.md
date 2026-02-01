# Supabase Setup Guide for Phase 4

## 🎯 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click "New Project"
4. Configure:
   - **Name**: `hande-realtime`
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users (e.g., `eu-central-1` for Europe, `us-east-1` for US)
   - **Pricing Plan**: Free tier is sufficient for development/testing

### 2. Get API Credentials
After project creation (takes ~2 minutes):

1. Go to **Settings** → **API** in sidebar
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Create Storage Buckets
1. Go to **Storage** in sidebar
2. Click **New bucket** (3 times for 3 buckets)

**Bucket 1: driver-documents**
- Name: `driver-documents`
- Public: ✅ Yes (for license images)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg,image/png,image/webp,application/pdf`

**Bucket 2: vehicle-images**
- Name: `vehicle-images`
- Public: ✅ Yes
- File size limit: 5MB
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**Bucket 3: profile-images**
- Name: `profile-images`
- Public: ✅ Yes
- File size limit: 2MB
- Allowed MIME types: `image/jpeg,image/png,image/webp`

### 4. Enable Realtime (Optional)
For database table subscriptions (currently we use Realtime channels only):

1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - `driver_location`
   - `trips`

*(Not required for Phase 4 as we use broadcast channels)*

### 5. Configure CORS (Optional)
If you face CORS issues from mobile apps:

1. Go to **Settings** → **API**
2. Scroll to **CORS Policy**
3. Add allowed origins:
   - `http://localhost:8081` (Expo dev)
   - `http://localhost:19006` (Expo web)
   - Your production mobile app domain

## 🔐 Add Environment Variables to Vercel

### Via Vercel Dashboard
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `hande-api-nest`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Production, ✅ Preview, ✅ Development |

5. Click **Save**
6. Go to **Deployments** tab
7. Click **⋯** on latest deployment → **Redeploy**

### Via Vercel CLI (Alternative)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd hande-api-nest
vercel link

# Add environment variables
vercel env add SUPABASE_URL
# Paste: https://xxxxx.supabase.co
# Select: Production, Preview, Development

vercel env add SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

## 🧪 Test Supabase Connection

### Test from Local Development
```bash
# Start NestJS server
cd hande-api-nest
npm run start:dev

# Check logs for Supabase initialization
# Should see: "Supabase client initialized"

# Test file upload
curl -X POST http://localhost:3000/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-image.jpg"

# Should return:
# {
#   "message": "Profile image uploaded successfully",
#   "url": "https://xxxxx.supabase.co/storage/v1/object/public/profile-images/..."
# }
```

### Test Realtime Channels
```typescript
// In browser console or Node.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xxxxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

// Test channel subscription
const channel = supabase.channel('test-channel')
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log('Received:', payload);
  })
  .subscribe();

// Send test message
channel.send({
  type: 'broadcast',
  event: 'test',
  payload: { message: 'Hello from Hande!' }
});
```

## 📊 Supabase Dashboard Overview

### Storage
View uploaded files:
1. Go to **Storage** → Select bucket
2. See all uploaded files with URLs
3. Download or delete files manually

### Realtime Inspector
Monitor real-time activity:
1. Go to **Realtime** in sidebar
2. See active channels
3. View broadcast events
4. Monitor presence state

### Logs
Debug issues:
1. Go to **Logs** → **Realtime**
2. See connection attempts
3. View broadcast events
4. Check errors

## 🔧 Troubleshooting

### "Supabase credentials not configured"
**Problem**: SupabaseService warns about missing credentials

**Solution**:
1. Check environment variables in Vercel
2. Redeploy after adding variables
3. Verify variable names match exactly: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### File Upload Returns 404
**Problem**: Storage buckets not found

**Solution**:
1. Create buckets in Supabase Dashboard (see step 3 above)
2. Ensure bucket names match exactly:
   - `driver-documents`
   - `vehicle-images`
   - `profile-images`
3. Make buckets public

### CORS Error from Mobile App
**Problem**: `Access-Control-Allow-Origin` error

**Solution**:
1. Add mobile app origin to Supabase CORS policy
2. Or use Supabase anon key (already configured for public access)

### WebSocket Connection Fails
**Problem**: Cannot connect to Socket.io server

**Solution**:
1. Ensure port 3001 is accessible
2. Check Vercel deployment supports WebSockets (may need serverless function)
3. Use polling fallback in Socket.io client:
   ```typescript
   const socket = io(URL, {
     transports: ['websocket', 'polling']
   });
   ```

## 💰 Supabase Pricing
**Free Tier Limits** (sufficient for Phase 4 testing):
- Storage: 1GB
- Bandwidth: 2GB/month
- Database: 500MB
- Realtime: 200 concurrent connections
- API requests: Unlimited

**Pro Tier** ($25/month):
- Storage: 100GB
- Bandwidth: 250GB/month
- Database: 8GB
- Realtime: 500 concurrent connections

## 🔗 Useful Links
- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## ✅ Verification Checklist
- [ ] Supabase project created
- [ ] API credentials copied
- [ ] 3 storage buckets created (driver-documents, vehicle-images, profile-images)
- [ ] Buckets set to public
- [ ] Environment variables added to Vercel
- [ ] Vercel redeployed with new variables
- [ ] Test file upload works
- [ ] Check Supabase logs for activity
- [ ] Test real-time channels (optional)

---

**Next Steps**: After Supabase setup, test Phase 4 features:
1. Upload driver license via POST /api/upload/license
2. Update driver location to test broadcasting
3. Create trip to test real-time notifications
4. Connect mobile app with Socket.io client

**Need Help?**
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/HandeShamwari/hande-api-nest/issues
