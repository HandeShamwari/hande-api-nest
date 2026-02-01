# Pricing System Documentation

## Overview
Hande uses a comprehensive zone-based pricing system with platform-wide fallback pricing. The system supports:
- **Zone-specific pricing** for different service areas
- **Platform-wide default pricing** when no zone is specified
- **Minimum and maximum fare enforcement**
- **Surge pricing multipliers** (1.0x - 3.0x)
- **Promo code validation and application**
- **Cache-backed pricing configurations** for performance

## Architecture

### Core Components

1. **PricingService** (`/hande-api/app/Services/PricingService.php`)
   - Centralized service for all fare calculations
   - Used across all applications (admin, mobile driver, mobile rider)
   - Handles zone-based and platform-wide pricing logic

2. **PricingController** (`/hande-api/app/Http/Controllers/PricingController.php`)
   - REST API endpoints for pricing operations
   - Accessible to all authenticated users

3. **Database Tables**
   - `table_zones`: Zone-specific pricing configuration
   - `table_platform_settings`: Platform-wide default pricing
   - `table_promotions`: Promo codes for discounts

## Pricing Configuration

### Platform-Wide Settings (table_platform_settings)

```sql
-- Base fare calculations
base_fare: $2.50              -- Starting fare for every ride
per_mile_rate: $1.50          -- Cost per mile traveled
per_minute_rate: $0.25        -- Cost per minute of ride
minimum_fare: $5.00           -- Minimum charge for any ride
maximum_fare: $100.00         -- Maximum charge for any ride

-- Driver subscription
driver_subscription_daily: $1.00    -- Daily subscription fee

-- Cancellation fees
cancellation_fee_rider: $5.00       -- Fee when rider cancels
cancellation_fee_driver: $3.00      -- Fee when driver cancels

-- Platform commission
platform_commission_rate: 0.00      -- No commission ($1/day model)
```

### Zone-Specific Settings (table_zones)

Each zone can override platform defaults:
```php
- base_fare (decimal)
- per_mile_rate (decimal)
- per_minute_rate (decimal)
- minimum_fare (decimal)
- maximum_fare (decimal)
- surge_multiplier (decimal, 1.0-3.0)
```

## Fare Calculation Formula

```
Base Calculation:
fare = base_fare + (distance_miles * per_mile_rate) + (duration_minutes * per_minute_rate)

With Surge:
fare = fare * surge_multiplier

Enforcement:
if fare < minimum_fare then fare = minimum_fare
if fare > maximum_fare then fare = maximum_fare

With Promo:
if promo_type = 'percentage':
    discount = fare * (promo_discount / 100)
else if promo_type = 'fixed':
    discount = promo_discount

final_fare = fare - discount
```

## API Endpoints

### 1. Get Fare Estimate
**Endpoint:** `POST /api/pricing/estimate`

**Request:**
```json
{
  "pickup_lat": 40.7128,
  "pickup_lng": -74.0060,
  "dropoff_lat": 40.7614,
  "dropoff_lng": -73.9776,
  "zone_id": 1 // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distance_miles": 5.2,
    "duration_minutes": 18,
    "estimated_fare": 12.25,
    "base_fare": 2.50,
    "distance_fare": 7.80,
    "time_fare": 4.50,
    "surge_multiplier": 1.0,
    "minimum_fare": 5.00,
    "maximum_fare": 100.00
  }
}
```

### 2. Get Pricing Configuration
**Endpoint:** `GET /api/pricing/config/{zone_id?}`

**Response:**
```json
{
  "success": true,
  "data": {
    "base_fare": "2.50",
    "per_mile_rate": "1.50",
    "per_minute_rate": "0.25",
    "minimum_fare": "5.00",
    "maximum_fare": "100.00",
    "surge_multiplier": 1.0,
    "zone_id": 1 // null for platform-wide
  }
}
```

### 3. Validate Promo Code
**Endpoint:** `POST /api/pricing/validate-promo`

**Request:**
```json
{
  "code": "SUMMER2024",
  "fare": 25.00,
  "user_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SUMMER2024",
    "discount_type": "percentage",
    "discount_value": 15.00,
    "discount_amount": 3.75,
    "final_fare": 21.25,
    "valid": true
  }
}
```

### 4. Calculate Final Fare
**Endpoint:** `POST /api/pricing/calculate`

**Request:**
```json
{
  "distance_miles": 5.2,
  "duration_minutes": 18,
  "zone_id": 1,
  "promo_code": "SUMMER2024" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original_fare": 12.25,
    "discount": 1.84,
    "final_fare": 10.41,
    "breakdown": {
      "base_fare": 2.50,
      "distance_fare": 7.80,
      "time_fare": 4.50,
      "surge_multiplier": 1.0
    }
  }
}
```

## Integration Guide

### Mobile Rider App Integration

```typescript
// Get real-time fare estimate
const estimateRideFare = async (
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
) => {
  const response = await api.post('/pricing/estimate', {
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    dropoff_lat: dropoffLat,
    dropoff_lng: dropoffLng
  });
  
  return response.data.data;
};

// Apply promo code
const applyPromoCode = async (code: string, fare: number, userId: number) => {
  const response = await api.post('/pricing/validate-promo', {
    code,
    fare,
    user_id: userId
  });
  
  return response.data.data;
};
```

### Mobile Driver App Integration

```typescript
// Get zone pricing configuration
const getZonePricing = async (zoneId: number) => {
  const response = await api.get(`/pricing/config/${zoneId}`);
  return response.data.data;
};
```

### Backend Trip Creation Integration

```php
use App\Services\PricingService;

class TripService
{
    protected PricingService $pricingService;

    public function __construct(PricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }

    public function createTrip(array $data)
    {
        // Calculate fare using PricingService
        $fareCalculation = $this->pricingService->calculateFare(
            distance: $data['distance_miles'],
            duration: $data['duration_minutes'],
            zoneId: $data['zone_id'] ?? null
        );

        // Validate promo code if provided
        if (!empty($data['promo_code'])) {
            $promoResult = $this->pricingService->validatePromoCode(
                code: $data['promo_code'],
                fare: $fareCalculation['final_fare'],
                userId: $data['user_id']
            );
            
            if ($promoResult['valid']) {
                $fareCalculation['final_fare'] = $promoResult['final_fare'];
                $fareCalculation['discount'] = $promoResult['discount_amount'];
            }
        }

        // Create trip with calculated fare
        $trip = Trip::create([
            'pickup_location' => $data['pickup_location'],
            'dropoff_location' => $data['dropoff_location'],
            'distance_miles' => $data['distance_miles'],
            'duration_minutes' => $data['duration_minutes'],
            'base_fare' => $fareCalculation['base_fare'],
            'distance_fare' => $fareCalculation['distance_fare'],
            'time_fare' => $fareCalculation['time_fare'],
            'surge_multiplier' => $fareCalculation['surge_multiplier'],
            'subtotal' => $fareCalculation['subtotal'],
            'discount' => $fareCalculation['discount'] ?? 0,
            'final_fare' => $fareCalculation['final_fare'],
            'promo_code' => $data['promo_code'] ?? null,
        ]);

        return $trip;
    }
}
```

## Surge Pricing

Surge pricing is controlled at the zone level:

```php
// Enable surge pricing for a zone
Zone::where('id', $zoneId)->update([
    'surge_multiplier' => 1.5  // 1.5x pricing
]);

// Disable surge pricing
Zone::where('id', $zoneId)->update([
    'surge_multiplier' => 1.0  // Normal pricing
]);
```

**Surge multiplier ranges:**
- 1.0 = Normal pricing (no surge)
- 1.5 = 50% increase
- 2.0 = 100% increase (double)
- 3.0 = 200% increase (triple) - maximum allowed

## Promo Codes

### Promo Code Structure (table_promotions)

```php
- code: Unique promo code (e.g., "SUMMER2024")
- discount_type: "percentage" or "fixed"
- discount_value: Percentage (15) or fixed amount (5.00)
- max_uses: Maximum total uses (null = unlimited)
- max_uses_per_user: Maximum uses per user
- min_trip_amount: Minimum fare to apply promo
- start_date: When promo becomes active
- end_date: When promo expires
- is_active: Enable/disable promo
```

### Creating Promo Codes

```php
Promotion::create([
    'code' => 'NEWUSER25',
    'discount_type' => 'percentage',
    'discount_value' => 25.00,
    'max_uses' => 1000,
    'max_uses_per_user' => 1,
    'min_trip_amount' => 10.00,
    'start_date' => now(),
    'end_date' => now()->addDays(30),
    'is_active' => true,
]);
```

## Caching Strategy

Pricing configurations are cached to reduce database queries:

```php
// Cache key format
"pricing_config_zone_{$zoneId}"  // Zone-specific
"pricing_config_platform"        // Platform-wide

// Cache TTL
1 hour (3600 seconds)

// Cache clearing (when pricing changes)
Cache::forget("pricing_config_zone_{$zoneId}");
Cache::forget("pricing_config_platform");
```

## Admin Dashboard Integration

The admin dashboard can manage pricing through the **Platform Settings** page:

1. Navigate to **Settings** > **Platform Settings**
2. Find **Pricing** category settings
3. Update values (base_fare, per_mile_rate, etc.)
4. Changes apply immediately (cache clears automatically)

For zone-specific pricing:
1. Navigate to **Operations** > **Zones**
2. Edit a zone
3. Set custom pricing for that zone
4. Leave blank to use platform defaults

## Testing

### Test Fare Calculation

```bash
# Using curl
curl -X POST http://localhost:8000/api/pricing/estimate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pickup_lat": 40.7128,
    "pickup_lng": -74.0060,
    "dropoff_lat": 40.7614,
    "dropoff_lng": -73.9776
  }'
```

### Test Promo Code

```bash
curl -X POST http://localhost:8000/api/pricing/validate-promo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "SUMMER2024",
    "fare": 25.00,
    "user_id": 123
  }'
```

## Error Handling

The pricing system returns standardized error responses:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "pickup_lat": ["The pickup lat field is required."],
    "dropoff_lng": ["The dropoff lng field is required."]
  }
}
```

**Common error codes:**
- 422: Validation error (missing/invalid parameters)
- 404: Zone not found
- 400: Invalid promo code
- 500: Server error (calculation failure)

## Performance Considerations

1. **Caching**: Pricing configs are cached for 1 hour
2. **Database Queries**: Optimized with proper indexing
3. **API Response**: Typical response time < 100ms
4. **Distance Calculation**: Uses Haversine formula for accuracy

## Security

1. All pricing endpoints require authentication (`auth:sanctum`)
2. Pricing calculations are server-side only (never trust client)
3. Promo codes validated against database (no client-side discounts)
4. Rate limiting applied to prevent abuse

## Future Enhancements

- **Time-based pricing**: Different rates for peak/off-peak hours
- **Vehicle type pricing**: Different rates for standard/premium vehicles
- **Distance-based tiers**: Progressive rates for longer trips
- **Loyalty discounts**: Automatic discounts for frequent riders
- **Dynamic surge**: Automatic surge based on supply/demand
- **Multi-zone trips**: Pricing across multiple zones
- **Subscription pricing**: Discounted rates for subscribers

## Summary

The Hande pricing system provides:
✅ Centralized fare calculation for all applications
✅ Zone-based pricing with platform-wide fallback
✅ Real-time fare estimates for riders
✅ Promo code support with validation
✅ Surge pricing capabilities
✅ Minimum/maximum fare enforcement
✅ Cache-backed performance optimization
✅ RESTful API for easy integration
✅ Transparent pricing structure (no hidden fees)
✅ Consistent pricing across all apps

All applications (admin dashboard, mobile rider app, mobile driver app) use the same PricingService to ensure consistent pricing calculations throughout the platform.
