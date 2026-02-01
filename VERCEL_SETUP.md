# Vercel Environment Variables Setup

## 🚨 CRITICAL: Database Connection Issue Fixed

The API was failing with `Can't reach database server at 127.0.0.1:5432` because Vercel doesn't have access to the environment variables.

## ✅ Required Environment Variables in Vercel

Go to: **Vercel Dashboard → handeshamwari-transport-hande-api → Settings → Environment Variables**

Add the following variables for **Production**, **Preview**, and **Development**:

### 1. DATABASE_URL (REQUIRED)
```
postgres://tsdbadmin:PASSWORD_HERE@qviwk2ldus.clb1ydj108.tsdb.cloud.timescale.com:38051/tsdb?sslmode=no-verify
```
**CRITICAL**: Use `sslmode=no-verify` (not `require`) to avoid SSL certificate validation errors with TimescaleDB Cloud.  
**Note**: Replace `PASSWORD_HERE` with actual TimescaleDB password

### 2. JWT_SECRET (REQUIRED)
```
hande-ride-service-jwt-secret-2026
```

### 3. PORT (Optional - Vercel sets this automatically)
```
3001
```

### 4. NODE_ENV (Optional)
```
production
```

### 5. DAILY_FEE_AMOUNT (Optional - has default)
```
1.00
```

### 6. DAILY_FEE_GRACE_HOURS (Optional - has default)
```
6
```

## 📝 Steps to Add Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project: `handeshamwari-transport-hande-api`
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. For each variable:
   - Click **Add New**
   - Enter **Key** (e.g., `DATABASE_URL`)
   - Enter **Value**
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

## 🔄 Redeploy After Adding Variables

After adding all environment variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots menu)
4. Click **Redeploy**
5. Wait for deployment to complete (~2 minutes)

## ✅ Verify Setup

Test registration after redeployment:

```bash
curl -X POST https://handeshamwari-transport-hande-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hande.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+263771234567",
    "userType": "driver"
  }'
```

Expected: `{"user": {...}, "token": "..."}`  
Not: `{"statusCode": 500, "message": "Internal server error"}`

## 🎯 Health Check Endpoint

After fixing environment variables, test:

```bash
curl https://handeshamwari-transport-hande-api.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-01T...",
  "env": {
    "nodeEnv": "production",
    "hasDatabase": true,
    "hasJwtSecret": true
  }
}
```

## 🔐 Security Note

- Never commit `.env` files to git
- Keep DATABASE_URL private
- Rotate JWT_SECRET regularly in production
- Use different secrets for dev/staging/production

---

Last Updated: February 1, 2026
