# Unified Map Screen Enhancement - Implementation Guide

> **Created:** January 25, 2026  
> **Status:** Ready for Integration  
> **Purpose:** Guide for implementing gesture-enabled panels, state machines, and UX improvements

---

## Table of Contents

1. [Overview](#overview)
2. [Components Created](#components-created)
3. [Redux State Slices](#redux-state-slices)
4. [Integration Steps](#integration-steps)
5. [Usage Examples](#usage-examples)
6. [Migration Guide](#migration-guide)
7. [Performance Optimizations](#performance-optimizations)
8. [Accessibility Features](#accessibility-features)
9. [Testing Checklist](#testing-checklist)

---

## Overview

This implementation addresses key UX concerns for the unified single-screen map experience:

### Problems Solved

1. **Screen Real Estate**: Adaptive bottom panels based on device size
2. **State Management**: Centralized phase/status state machines with validation
3. **Gesture Interactions**: Swipeable, draggable panels with spring animations
4. **Progressive Disclosure**: Peekable panels showing minimal → full details
5. **Bid Management**: Carousel-based bid selection with snap scrolling
6. **Accessibility**: Screen reader support, semantic roles, announcements

### Architecture Improvements

- **Before**: 25+ useState hooks per screen, manual state synchronization
- **After**: Centralized Redux state machines, validated transitions, phase history

- **Before**: Fixed-height panels blocking map view
- **After**: Adaptive snap points (15%, 40%, 85%), gesture-driven resizing

- **Before**: Fullscreen bid overlay covering entire map
- **After**: Horizontal carousel with minimize, non-blocking UI

---

## Components Created

### 1. DraggableBottomSheet

**Location:** `hande/src/components/map/DraggableBottomSheet.tsx`

**Features:**
- Three snap points: minimized (15%), default (40%), expanded (85%)
- Adaptive heights for compact/average/large phones
- PanResponder gesture handling with velocity prediction
- Spring animations (friction: 9, tension: 50)
- Accessibility: announcements, drag handle with hints

**Props:**
```typescript
interface DraggableBottomSheetProps {
  children: ReactNode;
  snapPoints?: { minimized: number; default: number; expanded: number };
  initialSnapPoint?: 'minimized' | 'default' | 'expanded';
  onSnapPointChange?: (snapPoint: string) => void;
  showHandle?: boolean;
  backgroundColor?: string;
  handleColor?: string;
  enablePanDown?: boolean;
  enableContentPanning?: boolean;
}
```

**Usage:**
```tsx
<DraggableBottomSheet
  initialSnapPoint="default"
  onSnapPointChange={(point) => console.log('Snapped to:', point)}
>
  <YourPanelContent />
</DraggableBottomSheet>
```

---

### 2. PeekablePanel

**Location:** `hande/src/components/map/PeekablePanel.tsx`

**Features:**
- Peek mode: Shows minimal info (60-80px)
- Expanded mode: Shows full content (200-400px)
- Animated transitions with chevron rotation
- Tap to toggle or controlled via props
- Accessibility: role="adjustable", state announcements

**Props:**
```typescript
interface PeekablePanelProps {
  children: ReactNode;
  peekContent?: ReactNode;
  isPeeking?: boolean;
  onPeekChange?: (isPeeking: boolean) => void;
  peekHeight?: number; // default: 80
  fullHeight?: number; // default: 300
  backgroundColor?: string;
  showToggle?: boolean;
  disabled?: boolean;
}
```

**Usage:**
```tsx
<PeekablePanel
  peekContent={
    <View>
      <Text>Driver arriving in 5 min</Text>
    </View>
  }
  peekHeight={80}
  fullHeight={250}
>
  <DriverDetailsContent />
</PeekablePanel>
```

---

### 3. BidsCarouselPanel

**Location:** `hande/src/components/rider/BidsCarouselPanel.tsx`

**Features:**
- Horizontal ScrollView with snap-to-card (85% screen width)
- Sorting: price, ETA, rating, time
- Card-based UI with driver photo, rating, vehicle, fare, ETA
- Minimize button to collapse overlay
- Pagination dots with tap-to-scroll
- Empty state with loading message

**Props:**
```typescript
interface BidsCarouselPanelProps {
  bids: Bid[];
  onSelectBid: (bid: Bid) => void;
  onViewProfile: (driverId: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  sortBy?: 'price' | 'eta' | 'rating' | 'time';
  showMinimizeButton?: boolean;
}
```

**Usage:**
```tsx
<BidsCarouselPanel
  bids={bids}
  onSelectBid={handleAcceptBid}
  onViewProfile={(id) => navigation.navigate('DriverProfile', { driverId: id })}
  sortBy="price"
  isMinimized={bidsMinimized}
  onMinimize={() => setBidsMinimized(true)}
/>
```

---

## Redux State Slices

### 1. Rider Phase Slice

**Location:** `hande/src/store/slices/riderPhaseSlice.ts`

**States:**
```typescript
type RiderPhase =
  | 'idle'
  | 'entering_destination'
  | 'viewing_fare'
  | 'negotiating'
  | 'searching'
  | 'selecting'
  | 'driver_assigned'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'rating';
```

**Valid Transitions:**
- `idle` → `entering_destination`
- `entering_destination` → `idle`, `viewing_fare`
- `viewing_fare` → `idle`, `negotiating`, `searching`
- `searching` → `idle`, `selecting`, `driver_assigned`
- `selecting` → `searching`, `driver_assigned`, `idle`
- `driver_assigned` → `driver_arrived`, `idle`
- `driver_arrived` → `in_progress`, `idle`
- `in_progress` → `completed`, `idle`
- `completed` → `rating`
- `rating` → `idle`

**Actions:**
- `setPhase(phase)` - Direct set (no validation)
- `transitionToPhase(phase)` - Validated transition
- `startTransition()` - Mark as transitioning
- `goBackPhase()` - Return to previous phase
- `resetPhase()` - Reset to idle
- `clearPhaseHistory()` - Clear history for memory

**Selectors:**
```typescript
const currentPhase = useSelector(selectCurrentPhase);
const previousPhase = useSelector(selectPreviousPhase);
const isTransitioning = useSelector(selectIsTransitioning);
const phaseHistory = useSelector(selectPhaseHistory);
```

---

### 2. Driver Status Slice

**Location:** `hande/src/store/slices/driverStatusSlice.ts`

**States:**
```typescript
type DriverStatus =
  | 'offline'
  | 'going_online'
  | 'online_available'
  | 'viewing_request'
  | 'bidding'
  | 'bid_pending'
  | 'accepted'
  | 'arriving'
  | 'arrived_at_pickup'
  | 'in_progress'
  | 'arriving_at_destination'
  | 'completing'
  | 'settlement';

type TripStatus =
  | 'none'
  | 'request'
  | 'accepted'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completing';
```

**Actions:**
- `setStatus(status)` - Direct set
- `transitionToStatus(status)` - Validated transition
- `setTripStatus(status)` - Set trip sub-state
- `goOnline()` - Convenience action
- `goOffline()` - Convenience action with cleanup
- `setActiveTripId(id)` - Set active trip
- `addPendingBid(bidId)` - Track pending bid
- `removePendingBid(bidId)` - Remove bid
- `resetStatus()` - Reset to offline

**Selectors:**
```typescript
const currentStatus = useSelector(selectCurrentStatus);
const tripStatus = useSelector(selectTripStatus);
const isOnline = useSelector(selectIsOnline);
const hasActiveTrip = useSelector(selectHasActiveTrip);
const activeTripId = useSelector(selectActiveTripId);
const pendingBidIds = useSelector(selectPendingBidIds);
```

---

## Integration Steps

### Step 1: Add Slices to Redux Store

**File:** `hande/src/store/index.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tripReducer from './slices/tripSlice';
import locationReducer from './slices/locationSlice';
import notificationReducer from './slices/notificationSlice';
import onboardingReducer from './slices/onboardingSlice';
import riderPhaseReducer from './slices/riderPhaseSlice'; // NEW
import driverStatusReducer from './slices/driverStatusSlice'; // NEW

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trip: tripReducer,
    location: locationReducer,
    notification: notificationReducer,
    onboarding: onboardingReducer,
    riderPhase: riderPhaseReducer, // NEW
    driverStatus: driverStatusReducer, // NEW
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

### Step 2: Refactor RiderMapScreen

**Before (excerpt):**
```typescript
// OLD: 25+ local state variables
const [phase, setPhase] = useState<string>('idle');
const [trip, setTrip] = useState<Trip | null>(null);
const [bids, setBids] = useState<Bid[]>([]);
const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
// ... 20+ more useState hooks
```

**After:**
```typescript
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentPhase,
  transitionToPhase,
  resetPhase,
} from '../store/slices/riderPhaseSlice';
import DraggableBottomSheet from '../components/map/DraggableBottomSheet';
import PeekablePanel from '../components/map/PeekablePanel';
import BidsCarouselPanel from '../components/rider/BidsCarouselPanel';

export const RiderMapScreen = () => {
  const dispatch = useDispatch();
  const currentPhase = useSelector(selectCurrentPhase);
  const activeTrip = useSelector((state) => state.trip.activeTrip);
  const bids = useSelector((state) => state.trip.bids);

  // Transition to new phase
  const handleDestinationSelected = (location: Location) => {
    dispatch(transitionToPhase('viewing_fare'));
  };

  const handleBookRide = () => {
    dispatch(transitionToPhase('searching'));
    // API call...
  };

  const handleBidReceived = (bid: Bid) => {
    // Automatically transition to selecting phase on first bid
    if (currentPhase === 'searching') {
      dispatch(transitionToPhase('selecting'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Map (always visible) */}
      <GoogleMapView ref={mapRef} />

      {/* Dynamic Bottom Panel */}
      <DraggableBottomSheet
        initialSnapPoint="default"
        onSnapPointChange={(point) => console.log('Panel:', point)}
      >
        {currentPhase === 'idle' && <IdlePanel />}
        {currentPhase === 'viewing_fare' && <FarePanel />}
        {currentPhase === 'searching' && <SearchingPanel />}
        {currentPhase === 'selecting' && (
          <BidsCarouselPanel
            bids={bids}
            onSelectBid={handleAcceptBid}
            sortBy="price"
          />
        )}
        {currentPhase === 'driver_assigned' && (
          <PeekablePanel
            peekContent={
              <View style={styles.peekRow}>
                <Text>Driver arriving in {eta} min</Text>
              </View>
            }
            peekHeight={80}
            fullHeight={300}
          >
            <DriverAssignedPanel trip={activeTrip} />
          </PeekablePanel>
        )}
        {currentPhase === 'in_progress' && (
          <PeekablePanel
            peekContent={<Text>ETA: {eta} min</Text>}
            peekHeight={60}
            fullHeight={200}
          >
            <TripProgressPanel trip={activeTrip} />
          </PeekablePanel>
        )}
      </DraggableBottomSheet>
    </View>
  );
};
```

---

### Step 3: Refactor DriverMapScreen

**Integration pattern:**
```typescript
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentStatus,
  selectIsOnline,
  transitionToStatus,
  goOnline,
  goOffline,
} from '../store/slices/driverStatusSlice';

export const DriverMapScreen = () => {
  const dispatch = useDispatch();
  const currentStatus = useSelector(selectCurrentStatus);
  const isOnline = useSelector(selectIsOnline);
  const activeTripId = useSelector(selectActiveTripId);

  const handleGoOnline = async () => {
    dispatch(transitionToStatus('going_online'));
    // Perform checks...
    await driverApi.goOnline({ latitude, longitude, vehicle_id });
    dispatch(goOnline());
  };

  const handleGoOffline = () => {
    dispatch(goOffline());
  };

  return (
    <View style={styles.container}>
      <GoogleMapView ref={mapRef} />

      <DraggableBottomSheet initialSnapPoint="default">
        {currentStatus === 'offline' && (
          <OfflinePanel onGoOnline={handleGoOnline} />
        )}
        {currentStatus === 'online_available' && (
          <OnlinePanel />
        )}
        {currentStatus === 'accepted' && (
          <PeekablePanel
            peekContent={<Text>Navigating to pickup</Text>}
            peekHeight={70}
            fullHeight={280}
          >
            <ArrivingPanel trip={activeTrip} />
          </PeekablePanel>
        )}
      </DraggableBottomSheet>
    </View>
  );
};
```

---

## Usage Examples

### Example 1: Adaptive Bottom Sheet for Trip Details

```tsx
import DraggableBottomSheet from '../components/map/DraggableBottomSheet';

<DraggableBottomSheet
  snapPoints={{
    minimized: 0.15, // 15% screen height
    default: 0.40,   // 40% screen height
    expanded: 0.85,  // 85% screen height
  }}
  initialSnapPoint="default"
  onSnapPointChange={(point) => {
    if (point === 'expanded') {
      // Pause map updates when panel is expanded
      pauseMapTracking();
    } else {
      resumeMapTracking();
    }
  }}
  showHandle={true}
  enableContentPanning={false} // Only handle can drag
>
  <ScrollView>
    <TripDetails />
  </ScrollView>
</DraggableBottomSheet>
```

---

### Example 2: Peekable Driver Info Panel

```tsx
import PeekablePanel from '../components/map/PeekablePanel';

const [isPeeking, setIsPeeking] = useState(true);

<PeekablePanel
  peekContent={
    <View style={styles.peek}>
      <Image source={{ uri: driver.photo }} style={styles.avatar} />
      <View style={styles.peekInfo}>
        <Text style={styles.name}>{driver.name}</Text>
        <Text style={styles.eta}>Arriving in {eta} min</Text>
      </View>
    </View>
  }
  isPeeking={isPeeking}
  onPeekChange={setIsPeeking}
  peekHeight={80}
  fullHeight={300}
>
  <View>
    <Text style={styles.sectionTitle}>Driver Details</Text>
    <Text>Rating: {driver.rating} ⭐</Text>
    <Text>Total Trips: {driver.total_trips}</Text>
    <Text>Vehicle: {vehicle.make} {vehicle.model}</Text>
    <Text>License: {vehicle.license_plate}</Text>
    
    <View style={styles.actions}>
      <Button title="Call" onPress={handleCall} />
      <Button title="Chat" onPress={handleChat} />
      <Button title="Share" onPress={handleShare} />
    </View>
  </View>
</PeekablePanel>
```

---

### Example 3: Bids Carousel with Sorting

```tsx
import BidsCarouselPanel from '../components/rider/BidsCarouselPanel';

const [sortBy, setSortBy] = useState<'price' | 'eta' | 'rating'>('price');
const [bidsMinimized, setBidsMinimized] = useState(false);

<View>
  {/* Sort Controls */}
  <View style={styles.sortControls}>
    <Button
      title="Price"
      onPress={() => setSortBy('price')}
      variant={sortBy === 'price' ? 'primary' : 'secondary'}
    />
    <Button
      title="ETA"
      onPress={() => setSortBy('eta')}
      variant={sortBy === 'eta' ? 'primary' : 'secondary'}
    />
    <Button
      title="Rating"
      onPress={() => setSortBy('rating')}
      variant={sortBy === 'rating' ? 'primary' : 'secondary'}
    />
  </View>

  {/* Bids Carousel */}
  {!bidsMinimized && (
    <BidsCarouselPanel
      bids={bids}
      onSelectBid={async (bid) => {
        try {
          await tripsApi.acceptBid(tripId, bid.id);
          dispatch(transitionToPhase('driver_assigned'));
        } catch (error) {
          Alert.alert('Error', 'Failed to accept bid');
        }
      }}
      onViewProfile={(driverId) => {
        navigation.navigate('DriverProfile', { driverId });
      }}
      onMinimize={() => setBidsMinimized(true)}
      sortBy={sortBy}
      showMinimizeButton={true}
    />
  )}

  {/* Minimized Bids Button */}
  {bidsMinimized && (
    <TouchableOpacity
      style={styles.expandBidsButton}
      onPress={() => setBidsMinimized(false)}
    >
      <Text>View {bids.length} Bids</Text>
    </TouchableOpacity>
  )}
</View>
```

---

### Example 4: Phase-Based Map Rendering

```tsx
import { useSelector } from 'react-redux';
import { selectCurrentPhase } from '../store/slices/riderPhaseSlice';

const RiderMapScreen = () => {
  const currentPhase = useSelector(selectCurrentPhase);

  // Conditional marker rendering
  const markers = useMemo(() => {
    const result = [];

    // User location (always visible)
    result.push({
      id: 'user',
      type: 'user_location',
      coordinate: userLocation,
    });

    // Nearby drivers (only in idle/searching phases)
    if (currentPhase === 'idle' || currentPhase === 'searching') {
      nearbyDrivers.forEach((driver) => {
        result.push({
          id: driver.id,
          type: 'driver_available',
          coordinate: driver.location,
        });
      });
    }

    // Pickup/dropoff markers (viewing_fare onwards)
    if (currentPhase !== 'idle' && pickupLocation) {
      result.push({
        id: 'pickup',
        type: 'pickup',
        coordinate: pickupLocation,
      });
    }

    if (currentPhase !== 'idle' && dropoffLocation) {
      result.push({
        id: 'dropoff',
        type: 'dropoff',
        coordinate: dropoffLocation,
      });
    }

    // Driver marker (after assignment)
    if (
      (currentPhase === 'driver_assigned' ||
        currentPhase === 'driver_arrived' ||
        currentPhase === 'in_progress') &&
      driverLocation
    ) {
      result.push({
        id: 'active_driver',
        type: 'driver_active',
        coordinate: driverLocation,
        rotation: driverHeading,
      });
    }

    return result;
  }, [
    currentPhase,
    userLocation,
    nearbyDrivers,
    pickupLocation,
    dropoffLocation,
    driverLocation,
    driverHeading,
  ]);

  // Conditional polyline rendering
  const polyline = useMemo(() => {
    if (currentPhase === 'viewing_fare' && estimatedRoute) {
      return {
        coordinates: estimatedRoute,
        color: '#34A853', // Green dashed
        width: 4,
        dashed: true,
      };
    }

    if (currentPhase === 'driver_assigned' && routeToPickup) {
      return {
        coordinates: routeToPickup,
        color: '#1E88E5', // Blue solid
        width: 5,
        dashed: false,
      };
    }

    if (currentPhase === 'in_progress' && routeToDestination) {
      return {
        coordinates: routeToDestination,
        color: '#000000', // Black solid
        width: 6,
        dashed: false,
      };
    }

    return null;
  }, [currentPhase, estimatedRoute, routeToPickup, routeToDestination]);

  return (
    <GoogleMapView
      markers={markers}
      polyline={polyline}
      onMarkerPress={handleMarkerPress}
    />
  );
};
```

---

## Migration Guide

### Phase 1: Add Redux Slices (No Breaking Changes)

1. Add imports to `store/index.ts`
2. Add reducers to store configuration
3. Test store hydration

### Phase 2: Dual State Management (Transition Period)

Keep existing local state while adding Redux state:

```typescript
// Keep existing
const [phase, setPhase] = useState('idle');

// Add Redux
const currentPhase = useSelector(selectCurrentPhase);

// Sync both during transition
useEffect(() => {
  if (phase !== currentPhase) {
    dispatch(setPhase(phase));
  }
}, [phase]);
```

### Phase 3: Migrate Screen-by-Screen

**Priority Order:**
1. **RiderMapScreen** - Most complex, highest impact
2. **DriverMapScreen** - Similar pattern to Rider
3. **TripDetailsScreen** - Uses phase state
4. **BidSelectionScreen** - Can be removed (replaced by carousel)

### Phase 4: Remove Local State

Once Redux state is verified working:
1. Remove `useState` hooks
2. Replace `setPhase` with `dispatch(transitionToPhase())`
3. Update tests to use Redux state

### Phase 5: Add New Components

Replace existing panels with new components:
1. Wrap bottom content in `DraggableBottomSheet`
2. Replace driver/trip panels with `PeekablePanel`
3. Replace fullscreen bid view with `BidsCarouselPanel`

---

## Performance Optimizations

### 1. Memoize Map Markers

```typescript
const markers = useMemo(() => {
  return buildMapMarkers(currentPhase, locations);
}, [currentPhase, locations]); // Only recompute when phase or locations change
```

### 2. Debounce Camera Adjustments

```typescript
const debouncedFitToCoordinates = useMemo(
  () =>
    debounce((coordinates: Coordinate[]) => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }, 500),
  []
);
```

### 3. Lazy Load Panel Content

```typescript
{currentPhase === 'driver_assigned' && (
  <React.Suspense fallback={<LoadingSpinner />}>
    <DriverAssignedPanel trip={activeTrip} />
  </React.Suspense>
)}
```

### 4. Virtualize Bid List (if needed)

If 20+ bids, use FlatList instead of ScrollView:

```typescript
<FlatList
  horizontal
  data={sortedBids}
  renderItem={({ item }) => <BidCard bid={item} />}
  keyExtractor={(item) => item.id}
  snapToInterval={CARD_WIDTH + CARD_SPACING}
  decelerationRate="fast"
  showsHorizontalScrollIndicator={false}
/>
```

---

## Accessibility Features

### Screen Reader Support

All components include:
- `accessibilityRole` (button, adjustable, list)
- `accessibilityLabel` (descriptive labels)
- `accessibilityHint` (usage hints)
- `AccessibilityInfo.announceForAccessibilityWithOptions()` for state changes

### Minimum Touch Targets

All interactive elements meet 44pt minimum:
- Drag handle: 32px (but has padding)
- Chevron button: 32px in 44pt container
- Accept bid button: 44pt height
- Pagination dots: 8px but 16px spacing

### High Contrast Support

Use theme variants for high contrast mode:

```typescript
const styles = StyleSheet.create({
  text: {
    color: useColorScheme() === 'dark' ? '#FFFFFF' : '#111827',
  },
});
```

### Keyboard Navigation

Support external keyboard:
- Tab to navigate between interactive elements
- Enter to activate buttons
- Arrow keys for carousel navigation

---

## Testing Checklist

### Unit Tests

- [ ] Phase transitions validate correctly
- [ ] Invalid transitions are rejected
- [ ] Phase history is tracked
- [ ] Snap point calculations work for all screen sizes
- [ ] Gesture thresholds detect swipes correctly

### Integration Tests

- [ ] Redux store persists phase state
- [ ] Phase changes trigger map updates
- [ ] Bid carousel syncs with Redux bids
- [ ] Panel snap points adapt to screen size
- [ ] Accessibility announcements fire on transitions

### E2E Tests

- [ ] Complete booking flow (idle → completed)
- [ ] Bid selection and acceptance
- [ ] Driver assignment and tracking
- [ ] Panel gestures (swipe, tap, drag)
- [ ] Screen rotation maintains state

### Performance Tests

- [ ] 60 FPS during panel animations
- [ ] Map rendering doesn't block UI
- [ ] Memory usage stays under 100MB
- [ ] No memory leaks in phase transitions

### Accessibility Tests

- [ ] VoiceOver/TalkBack can navigate all elements
- [ ] State changes are announced
- [ ] All buttons have labels
- [ ] Minimum touch targets met
- [ ] High contrast mode works

---

## Troubleshooting

### Issue: Panel doesn't snap correctly

**Solution:** Check screen height calculation:
```typescript
import { Dimensions } from 'react-native';
const { height } = Dimensions.get('window'); // Not 'screen'
```

### Issue: Phase transitions fail silently

**Solution:** Enable console logging:
```typescript
// In slice, transitions log to console
// Check for "Invalid transition" errors
```

### Issue: Bids carousel doesn't scroll smoothly

**Solution:** Adjust snap interval:
```typescript
snapToInterval={CARD_WIDTH + CARD_SPACING}
decelerationRate="fast"
```

### Issue: Accessibility announcements don't work

**Solution:** Check iOS/Android permissions:
```typescript
import { AccessibilityInfo } from 'react-native';
AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
  console.log('Screen reader:', enabled);
});
```

---

## Next Steps

1. **Integrate slices into store** (`store/index.ts`)
2. **Refactor RiderMapScreen** (replace local state with Redux)
3. **Add DraggableBottomSheet** to RiderMapScreen
4. **Replace bid overlay** with BidsCarouselPanel
5. **Add PeekablePanel** to driver assigned/in progress phases
6. **Test on physical devices** (iPhone SE, Android small/large)
7. **Measure performance** (FPS, memory, battery)
8. **Gather user feedback** (beta test group)

---

## Resources

- [React Native Animated API](https://reactnative.dev/docs/animated)
- [PanResponder Guide](https://reactnative.dev/docs/panresponder)
- [Redux Toolkit State Machines](https://redux-toolkit.js.org/usage/usage-guide#managing-normalized-data)
- [Accessibility Best Practices](https://reactnative.dev/docs/accessibility)

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Maintained By:** Hande Development Team
