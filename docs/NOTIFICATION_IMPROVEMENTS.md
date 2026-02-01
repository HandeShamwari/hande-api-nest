# Notification System Improvements

> **Issue:** Two critical notification behaviors are missing  
> **Date:** January 25, 2026

---

## Issues Identified

### 1. ❌ Bid Notifications Are NOT Stacked
**Problem:** When drivers receive multiple trip requests, each appears as a separate notification instead of being grouped.

**Current Behavior:**
```
🔔 New Trip Request - $15.50
🔔 New Trip Request - $22.00
🔔 New Trip Request - $18.75
```

**Expected Behavior:**
```
🔔 3 New Trip Requests
   Tap to view available trips
```

### 2. ⚠️ Cancelled Trips During Searching Still Notify Drivers
**Problem:** When a rider cancels a trip during the "searching" phase, drivers who were notified BEFORE cancellation may still see the trip as available, even though it's redundant.

**Current Behavior:**
1. Rider creates trip → API broadcasts to nearby drivers
2. Driver 1 receives push notification "New Trip Request"
3. Rider cancels trip (before any bids)
4. Driver 1 still sees the notification and can try to bid
5. Bid fails with error (trip already cancelled)

**Expected Behavior:**
1. Rider creates trip → API broadcasts to nearby drivers
2. Driver 1 receives push notification "New Trip Request"
3. Rider cancels trip
4. **Cancellation notification sent to Driver 1**: "Trip Cancelled"
5. **Driver 1's notification is removed/updated**
6. Trip does NOT appear in available trips list

---

## Current Implementation Status

### ✅ What Works
1. **Backend cancels all pending bids** when rider cancels during searching:
   ```php
   // TripController.php - cancelTrip()
   TripNegotiation::where('trip_id', $trip->id)
       ->where('status', 'pending')
       ->update(['status' => 'cancelled']);
   ```

2. **Trip status changes to 'cancelled'** properly:
   ```php
   $trip->update([
       'status' => 'cancelled',
       'cancelled_at' => now(),
   ]);
   ```

### ❌ What's Missing

1. **No notification stacking** in push notification service or UI
2. **No cancellation broadcast** to drivers who received the original notification
3. **No notification revocation** mechanism

---

## Implementation Plan

## Issue 1: Notification Stacking

### Backend Changes

**File: `go/app/Services/NotificationService.php`** (create if doesn't exist)

```php
<?php

namespace App\Services;

class NotificationService
{
    /**
     * Stack notifications by type for a user
     * Groups multiple trip notifications into one
     */
    public static function stackNotifications(
        string $userId,
        string $type,
        array $data
    ): void {
        // Get pending trip notifications for this driver
        $pendingNotifications = Notification::where('user_id', $userId)
            ->where('type', 'new_trip_request')
            ->where('read_at', null)
            ->count();

        if ($pendingNotifications >= 2) {
            // Stack notifications
            self::sendStackedNotification(
                $userId,
                'new_trip_requests',
                [
                    'title' => "{$pendingNotifications} New Trip Requests",
                    'body' => "You have {$pendingNotifications} available trips nearby",
                    'data' => [
                        'type' => 'new_trip_requests',
                        'count' => $pendingNotifications,
                        'action' => 'open_trips_list',
                    ],
                ]
            );
        } else {
            // Send individual notification
            self::sendIndividualNotification($userId, $type, $data);
        }
    }
}
```

### Frontend Changes

**File: `hande/src/services/pushNotifications.ts`**

Add notification grouping:

```typescript
// Group notifications by type
export const groupNotifications = async () => {
  const allNotifications = await Notifications.getPresentedNotificationsAsync();
  
  const tripRequests = allNotifications.filter(
    (n) => n.request.content.data?.type === 'new_trip_request'
  );

  if (tripRequests.length >= 2) {
    // Dismiss individual notifications
    await Notifications.dismissAllNotificationsAsync();
    
    // Show stacked notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${tripRequests.length} New Trip Requests`,
        body: 'Tap to view available trips',
        data: {
          type: 'new_trip_requests_stacked',
          count: tripRequests.length,
        },
      },
      trigger: null, // Show immediately
    });
  }
};

// Call this when app receives notification
Notifications.addNotificationReceivedListener(async (notification) => {
  if (notification.request.content.data?.type === 'new_trip_request') {
    // Debounce to allow multiple notifications to arrive
    setTimeout(() => groupNotifications(), 500);
  }
});
```

---

## Issue 2: Cancel Notification During Searching

### Backend Changes

**File: `go/app-modules/rider/src/Http/Controllers/TripController.php`**

Update `cancelTrip()` method:

```php
public function cancelTrip(Request $request, $tripId)
{
    try {
        $user = auth()->user();
        $rider = Rider::where('user_id', $user->id)->first();
        $trip = Trip::where('rider_id', $rider->id)->findOrFail($tripId);

        if (in_array($trip->status, ['completed', 'cancelled'])) {
            return $this->error('Trip cannot be cancelled in its current state', 
                Response::HTTP_BAD_REQUEST);
        }

        $validated = $request->validate([
            'cancellation_reason' => 'sometimes|string|max:500',
        ]);

        DB::transaction(function () use ($trip, $validated) {
            // ✅ Get all drivers who were notified about this trip
            $notifiedDrivers = $this->getNotifiedDrivers($trip->id);

            // Cancel all pending bids
            TripNegotiation::where('trip_id', $trip->id)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            // Update trip status
            $trip->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $validated['cancellation_reason'] ?? 
                    'Cancelled by rider',
            ]);

            // 🆕 NEW: Broadcast cancellation to all notified drivers
            if ($trip->status === 'searching' || $trip->status === 'pending') {
                event(new TripCancelled($trip, $notifiedDrivers));
            }

            // 🆕 NEW: Send cancellation push notifications
            foreach ($notifiedDrivers as $driverId) {
                NotificationService::sendCancellationNotification(
                    $driverId,
                    $trip->id
                );
            }
        });

        return $this->success([
            'trip' => $trip->fresh(),
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return $this->error('Failed to cancel trip: '.$e->getMessage(), 500);
    }
}

/**
 * Get drivers who were notified about this trip
 * (either via push notification or who saw it in available trips)
 */
private function getNotifiedDrivers($tripId): array
{
    // Option 1: Track notifications in database
    return Notification::where('data->trip_id', $tripId)
        ->where('type', 'new_trip_request')
        ->pluck('user_id')
        ->toArray();

    // Option 2: Use trip location to find nearby drivers who were online
    // (more robust if notification tracking isn't implemented)
}
```

**Create Event: `go/app/Events/TripCancelled.php`**

```php
<?php

namespace App\Events;

use GO\Rider\Models\Trip;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TripCancelled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $trip;
    public $notifiedDriverIds;

    public function __construct(Trip $trip, array $notifiedDriverIds)
    {
        $this->trip = $trip;
        $this->notifiedDriverIds = $notifiedDriverIds;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [];
        
        // Broadcast to each driver's personal channel
        foreach ($this->notifiedDriverIds as $driverId) {
            $channels[] = new Channel("driver.{$driverId}");
        }
        
        return $channels;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'trip_id' => $this->trip->id,
            'status' => 'cancelled',
            'message' => 'This trip has been cancelled by the rider',
        ];
    }

    public function broadcastAs(): string
    {
        return 'trip.cancelled';
    }
}
```

### Frontend Changes

**File: `hande/src/services/pusher.ts`**

Add trip cancellation listener:

```typescript
/**
 * Listen for trip cancellations
 */
onTripCancelled(driverId: string, callback: EventCallback<any>): void {
  const channelName = `private-driver.${driverId}`;
  this.bind(channelName, 'trip.cancelled', callback);
}
```

**File: `hande/src/screens/driver/DriverMapScreen.tsx`**

Handle cancellation events:

```typescript
useEffect(() => {
  if (!driver?.id) return;

  // Subscribe to driver's private channel
  pusherService.subscribeToDriverChannel(driver.id);

  // Listen for trip cancellations
  pusherService.onTripCancelled(driver.id, (data) => {
    const { trip_id, message } = data;
    
    // Remove cancelled trip from available trips list
    setAvailableTrips((prev) => 
      prev.filter((trip) => trip.id !== trip_id)
    );
    
    // Dismiss notification if still visible
    dismissNotificationForTrip(trip_id);
    
    // Show alert if user was viewing this trip
    if (selectedTripId === trip_id) {
      Alert.alert('Trip Cancelled', message);
      setSelectedTripId(null);
    }
  });

  return () => {
    pusherService.unsubscribe(`private-driver.${driver.id}`);
  };
}, [driver?.id]);
```

**File: `hande/src/services/pushNotifications.ts`**

Add notification dismissal:

```typescript
/**
 * Dismiss notification for a specific trip
 */
export const dismissNotificationForTrip = async (tripId: string) => {
  const allNotifications = await Notifications.getPresentedNotificationsAsync();
  
  const tripNotification = allNotifications.find(
    (n) => n.request.content.data?.tripId === tripId
  );
  
  if (tripNotification) {
    await Notifications.dismissNotificationAsync(
      tripNotification.request.identifier
    );
  }
};
```

---

## Database Changes (Optional but Recommended)

Create notifications tracking table:

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSON,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_type (user_id, type),
    INDEX idx_read_at (read_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

This allows tracking which drivers received notifications for which trips.

---

## Testing Checklist

### Notification Stacking
- [ ] Driver receives 1 trip notification → Shows individual notification
- [ ] Driver receives 2 trip notifications → Shows "2 New Trip Requests"
- [ ] Driver receives 5 trip notifications → Shows "5 New Trip Requests"
- [ ] Tapping stacked notification opens trips list
- [ ] Individual notifications are dismissed when stacked notification is shown

### Trip Cancellation During Searching
- [ ] Rider cancels during searching → All drivers receive cancellation event
- [ ] Driver's notification is dismissed automatically
- [ ] Cancelled trip removed from driver's available trips list
- [ ] Driver attempting to bid on cancelled trip gets proper error
- [ ] Driver viewing cancelled trip details sees "Trip Cancelled" message
- [ ] New drivers going online after cancellation do NOT see the trip

---

## Priority

**HIGH PRIORITY** - Both issues affect user experience:
1. **Notification spam** frustrates drivers with multiple pings
2. **Redundant trips** waste drivers' time bidding on cancelled trips

---

## Estimated Effort

- **Notification Stacking:** 4-6 hours (backend + frontend + testing)
- **Cancellation Broadcast:** 6-8 hours (event system + WebSocket + notification dismissal + testing)
- **Total:** 10-14 hours

---

## Dependencies

1. **Pusher/WebSocket** configured and working (appears to be in place)
2. **Push notifications** enabled (already implemented)
3. **Notification permissions** granted by users
4. **Database migration** for notifications table (optional but recommended)

---

## Next Steps

1. Implement notification stacking (easier, immediate impact)
2. Add notifications tracking table
3. Implement cancellation broadcast system
4. Test thoroughly with multiple drivers
5. Monitor error rates for "bid on cancelled trip" scenarios
