# Pusher Implementation Notes

## Current Implementation

We're using `pusher-js` (v8.4.0) with React Native support via `pusher-js/react-native`.

## Official Pusher React Native Library

Pusher offers an official React Native library: `@pusher/pusher-websocket-react-native`

**Official Docs:** https://pusher.com/docs/channels/getting_started/react-native/

### Key Differences

1. **Installation**
   - Current: `pusher-js`
   - Official: `@pusher/pusher-websocket-react-native`

2. **API Pattern**
   - Current: `new Pusher(key, options)` - synchronous
   - Official: `Pusher.getInstance()` then `await pusher.init()` - async

3. **Subscription**
   - Current: `pusher.subscribe(channelName)`
   - Official: `await pusher.subscribe({ channelName, onEvent })`

### Migration Considerations

If experiencing connection issues, consider migrating to the official library:

```bash
# Remove current package
npm uninstall pusher-js @types/pusher-js

# Install official library
npm install @pusher/pusher-websocket-react-native
```

## Current Improvements (2026-01-26)

### 1. Enhanced Error Logging
- Added detailed subscription error logs with JSON output
- Added connection state logging on failures
- Added checkmarks (✓/✗) for better visual feedback

### 2. Connection Timeout Settings
- `activityTimeout: 120000` (2 minutes) - detects stale connections
- `pongTimeout: 30000` (30 seconds) - pong response timeout

### 3. Improved Initialization Flow in DriverMapScreen

**Before:**
```typescript
pusherService.initialize(token).catch(console.error);
// Subscription 1 second later
```

**After:**
```typescript
// 1. Initialize Pusher
await pusherService.initialize(token);

// 2. Listen for connection state changes
pusherService.onConnectionStateChange((state) => {
  if (state === 'connected') {
    subscribeToDriverChannel();
  }
});

// 3. Initial subscription attempt after 1.5s
// 4. Auto-subscribe when connection is established
```

### 4. New Helper Methods
- `pusherService.isInitialized()` - Check if Pusher instance exists
- Better logging with connection state context

## Debugging Pusher Connection

### Check Connection Status
```typescript
console.log('Initialized:', pusherService.isInitialized());
console.log('Connected:', pusherService.isCurrentlyConnected());
console.log('State:', pusherService.getConnectionState());
```

### Expected Connection Flow
1. `connecting` - Initial connection attempt
2. `connected` - Successfully connected
3. Subscribe to channels
4. `pusher:subscription_succeeded` - Channel subscription confirmed

### Common Issues

#### 1. "Failed to subscribe to driver channel"
**Cause:** Pusher not initialized or not connected yet
**Solution:** 
- Check `isInitialized()` before subscribing
- Wait for `connected` state
- Listen to connection state changes

#### 2. Authentication Errors
**Cause:** Invalid or expired auth token
**Solution:**
- Verify token is passed to `initialize(token)`
- Check authEndpoint is correct
- Verify backend broadcasting auth route

#### 3. Subscription Errors
**Cause:** Invalid channel name or permissions
**Solution:**
- Private channels must start with `private-`
- Presence channels must start with `presence-`
- Verify backend channel authorization

## Testing Pusher Connection

### 1. Enable Debug Mode
Already enabled in development:
```typescript
Pusher.logToConsole = __DEV__;
```

### 2. Monitor Connection Events
```typescript
pusherService.onConnectionStateChange((state) => {
  console.log('Connection:', state);
});

pusherService.onError((error) => {
  console.error('Pusher Error:', error);
});
```

### 3. Test Channel Subscription
```typescript
const channel = pusherService.subscribeToDriverChannel(driverId);
if (channel) {
  channel.bind('pusher:subscription_succeeded', () => {
    console.log('✓ Subscribed successfully');
  });
  
  channel.bind('pusher:subscription_error', (error) => {
    console.error('✗ Subscription failed:', error);
  });
}
```

## Backend Requirements

### Laravel Broadcasting Setup
```php
// config/broadcasting.php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'encrypted' => true,
    ],
],
```

### Authentication Endpoint
```php
// routes/api.php
Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])
    ->middleware('auth:sanctum');
```

### Broadcasting Event Example
```php
broadcast(new TripCancelled($trip))->toOthers();
```

## Next Steps

1. **Monitor Production**: Watch for subscription errors in production logs
2. **Consider Migration**: If persistent issues, evaluate migrating to official library
3. **Add Metrics**: Track connection success rate and subscription failures
4. **Fallback Strategy**: Consider WebSocket fallback for poor network conditions

## References

- [Pusher JS Docs](https://pusher.com/docs/channels/using_channels/client-api?lang=js)
- [Pusher React Native Official Docs](https://pusher.com/docs/channels/getting_started/react-native/)
- [Laravel Broadcasting Docs](https://laravel.com/docs/broadcasting)
