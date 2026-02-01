# Redis Setup with Upstash

**Date**: February 2, 2026
**Status**: Ready for deployment

---

## 🎯 Overview

Hande uses Redis for background job processing with Bull queues. This guide shows how to configure your Upstash Redis database for production.

---

## 📋 Your Upstash Redis Details

**Endpoint**: `solid-osprey-44789.upstash.io`
**Port**: `6379`
**Region**: N. Virginia, USA (us-east-1)
**TLS**: Enabled
**Plan**: Free Tier (10k commands/sec, 256 MB storage)

---

## 🚀 Step 1: Get Your Redis Password

1. Go to [Upstash Console](https://console.upstash.io/redis/d41d8cd9-8f00-3204-a980-0998ecf8427e)
2. Under **Details** tab, find **Token / Readonly Token**
3. Click the 👁️ (eye icon) next to **TOKEN** to reveal the password
4. Copy the password value (starts with `A...`)

---

## 🔧 Step 2: Add Environment Variables to Vercel

Go to your Vercel project: https://vercel.com/[your-team]/hande-api-nest

Navigate to: **Settings** → **Environment Variables**

Add these 4 variables:

```
REDIS_HOST=solid-osprey-44789.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=[paste the Token you copied from Upstash]
REDIS_TLS=true
```

**Important**: Set environment for **Production**, **Preview**, and **Development**

---

## 🧪 Step 3: Test Redis Connection Locally (Optional)

### Option A: Test with redis-cli
```bash
redis-cli --tls -u redis://default:[YOUR-PASSWORD]@solid-osprey-44789.upstash.io:6379

# Once connected, try:
> PING
PONG
> SET test "Hello Hande"
OK
> GET test
"Hello Hande"
> DEL test
(integer) 1
> QUIT
```

### Option B: Test with Node.js
Create `test-redis.js`:
```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: 'solid-osprey-44789.upstash.io',
  port: 6379,
  password: 'YOUR-PASSWORD-HERE',
  tls: {
    rejectUnauthorized: false,
  },
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis!');
  redis.ping((err, result) => {
    console.log('PING:', result);
    redis.quit();
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});
```

Run: `node test-redis.js`

---

## 📦 Step 4: Deploy to Vercel

After adding environment variables:

```bash
cd hande-api-nest
git add -A
git commit -m "feat: Add Redis TLS support for Upstash"
git push origin main
```

Vercel will auto-deploy with Redis configured.

---

## ✅ Step 5: Verify Jobs are Running

After deployment, check Vercel logs for these messages:

```
[JobsService] Checking for expiring subscriptions...
[JobsService] Processing expired subscriptions...
[SubscriptionProcessor] Processing job 123: check-expiring
[SubscriptionProcessor] Found 0 drivers with subscriptions expiring soon
```

### Check Upstash Dashboard

Go to **Monitor** tab in Upstash:
- You should see **COMMANDS** count increasing
- **BANDWIDTH** will show data transfer
- **STORAGE** shows keys stored in Redis

---

## 🔍 Troubleshooting

### Issue: "Connection refused" or "Connection timeout"

**Cause**: REDIS_TLS not set or incorrect credentials

**Fix**: 
1. Verify REDIS_TLS=true in Vercel
2. Double-check password copied correctly
3. Ensure no extra spaces in env vars

### Issue: "NOAUTH Authentication required"

**Cause**: Wrong password

**Fix**: 
1. Go back to Upstash dashboard
2. Click **Reset Credentials** (this generates new password)
3. Copy new password to Vercel
4. Redeploy

### Issue: Jobs not executing

**Cause**: Redis connection works but queues not processing

**Fix**:
1. Check Vercel logs for Bull connection messages
2. Verify JobsModule is imported in AppModule
3. Check cron schedule (may need to wait for next trigger)
4. Manually trigger a job to test:
   ```bash
   curl -X POST https://hande-api-nest.vercel.app/api/drivers/subscribe \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"amount": 1.00}'
   ```

### Issue: "Max retries reached"

**Cause**: Redis instance unreachable or overloaded

**Fix**:
1. Check Upstash dashboard for outages
2. Verify your free tier limits aren't exceeded
3. Consider upgrading to Pay-as-you-go plan

---

## 📊 Monitor Your Redis Usage

### Upstash Dashboard Metrics

- **Commands**: Track job processing rate
- **Bandwidth**: Monitor data transfer
- **Storage**: Check queue size

### Free Tier Limits

| Metric | Limit | Current |
|--------|-------|---------|
| Commands | 10,000/sec | Monitor in dashboard |
| Storage | 256 MB | Monitor in dashboard |
| Bandwidth | 50 GB/month | Monitor in dashboard |

**Warning**: If you exceed limits, upgrade to **Pay as You Go** ($0.20 per 100K commands).

---

## 🎯 What Jobs Will Run

Once Redis is configured, these automated tasks start:

### Scheduled Jobs (Cron)

| Schedule | Job | Action |
|----------|-----|--------|
| Every 5 min | Check expiring subscriptions | Find drivers expiring in 2h, send warning |
| Every hour | Process expired subscriptions | Set drivers to off_duty after grace period |
| Daily 11 PM | Daily earnings reports | Send trip count & earnings to drivers |
| Sunday 2 AM | Location cleanup | Delete location records > 90 days |
| 1st @ 3 AM | Archive trips | Move old completed trips to archive |
| 1st @ 9 AM | Monthly reports | Send monthly performance stats |

### On-Demand Jobs

| Trigger | Job | Delay | Action |
|---------|-----|-------|--------|
| Driver subscribes | Expiry warning | T+22h | Warn 2h before expiry |
| Trip completes | Rating reminder | T+24h | Ask rider to rate driver |

---

## 🔒 Security Best Practices

1. **Never commit Redis password to Git**
   - Already in `.gitignore`: `.env`, `.env.local`
   - Use Vercel environment variables only

2. **Enable Protect Credentials** (Prod Pack)
   - Prevents password display in Upstash console
   - Recommended for production

3. **Monitor suspicious activity**
   - Check Upstash **Monitor** tab regularly
   - Set up alerts for unusual traffic

4. **Rotate credentials periodically**
   - Use **Reset Credentials** in Upstash
   - Update Vercel env vars immediately

---

## 🚀 Ready to Go Live

Once Redis is configured and deployed:

1. ✅ Background jobs will start automatically
2. ✅ Subscription expiry warnings sent 2h before
3. ✅ Rating reminders sent 24h after trip completion
4. ✅ Daily earnings reports sent at 11 PM
5. ✅ Data cleanup runs weekly/monthly

---

## 📚 Resources

- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Bull Queue Docs](https://github.com/OptimalBits/bull)
- [NestJS Bull Guide](https://docs.nestjs.com/techniques/queues)
- [Phase 5 Documentation](./PHASE_5_BACKGROUND_JOBS.md)

---

**Next Step**: Add the 4 environment variables to Vercel and deploy! 🚀
