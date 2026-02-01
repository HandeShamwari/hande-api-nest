# Quick Start Guide - HANDE Administration Panel

## ⚡ Get Started in 3 Minutes

### 1. Install Dependencies

```bash
cd hande-administration
npm install
```

### 2. Configure Environment

The `.env` file is already created with default settings:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

If your API is running on a different port, update this file.

### 3. Start the Application

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### 4. Login

Use your admin credentials created in the Hande API:

```bash
# If you haven't created an admin user yet, run this in hande-api directory:
php artisan admin:create
```

## 🎯 What You Can Do

### Dashboard (`/`)
- View real-time platform metrics
- Monitor active trips and online drivers
- Track daily revenue and performance
- Check marketplace liquidity status

### Drivers (`/users`)
- View all registered drivers
- Verify pending driver documents (click ✓)
- Suspend problematic drivers (click ✗)
- Activate suspended drivers
- Search and filter drivers

### Analytics (`/analytics`)
- View weekly trends (last 4 weeks)
- Analyze cancellation rates
- See top-performing drivers
- Track revenue growth

### Content (`/content`)
- Manage platform content (coming soon)
- Documentation library
- Media assets

### Settings (`/settings`)
- Configure notification preferences
- Manage security settings
- System maintenance tools

## 🔧 Key Features

### Real-time Updates
- Dashboard refreshes every minute
- Analytics data cached for 5 minutes
- Instant feedback on driver actions

### Driver Management Actions

```typescript
// Verify a driver
Click the green checkmark (✓) button next to pending drivers

// Suspend a driver
Click the red X (✗) button next to active drivers

// Activate a suspended driver
Click the green checkmark (✓) button next to suspended drivers
```

### Search & Filter
- Search drivers by name, email, or license plate
- Filter by status: All, Active, Pending, Suspended
- Results update instantly as you type

## 🎨 UI Components

The admin panel uses HANDE brand colors:

- **Green (#7ED957)**: Primary actions, success states
- **Gold (#FFB800)**: Highlights (used for $1 pricing in the main app)
- **Red (#FF4C4C)**: Danger actions, errors only
- **Blue (#4DA6FF)**: Informational states

## 📊 Understanding the Data

### Dashboard Metrics

**Active Trips**: Rides currently in progress
**Online Drivers**: Drivers available right now (last 5 min)
**Utilization**: Percentage of online drivers on trips
**Completion Rate**: Successfully completed vs cancelled trips

### Marketplace Status

- **Oversupply**: Too many drivers, not enough riders
- **Balanced**: Healthy supply/demand ratio
- **High Demand**: More riders than available drivers
- **Critical Shortage**: Severe driver shortage

### Analytics

**Weekly Trends**: Shows trip volume and revenue changes
**Cancellation Analysis**: Breaks down who cancelled (rider/driver/system)
**Driver Leaderboard**: Top performers by trip count and earnings

## 🚨 Common Issues

### "Loading dashboard..."
- Check if the Hande API is running (`php artisan serve` in hande-api)
- Verify `.env` has correct API URL
- Check browser console for errors

### Authentication Failed
- Verify admin user exists in database
- Check credentials are correct
- Clear localStorage: `localStorage.clear()` in browser console

### No Data Showing
- Ensure database has trip data
- Check API logs for errors
- Verify API routes are registered

## 🎓 Next Steps

1. **Explore the Dashboard**: Get familiar with real-time metrics
2. **Manage Drivers**: Practice verifying and suspending drivers
3. **Review Analytics**: Check weekly trends and patterns
4. **Customize Settings**: Configure notifications and preferences

## 💡 Pro Tips

- Use search to quickly find specific drivers
- Watch the marketplace status for supply/demand issues
- Check the leaderboard to identify top performers
- Monitor cancellation rates to spot problems
- Keep an eye on completion rates (>90% is healthy)

## 📚 Further Reading

- [Full README](./README.md) - Detailed documentation
- [API Documentation](../hande-api/docs/) - Backend API reference
- [Project Overview](../.github/copilot-instructions.md) - HANDE platform guide

---

**Ready to manage your HANDE platform!** 🚗💚
