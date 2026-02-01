# Onboarding Implementation Guide

## Overview
Complete onboarding system for HANDEE mobile app including welcome tutorial, permissions onboarding, and feature discovery.

## Components Created

### 1. WelcomeScreen.tsx
**Location:** `hande/src/screens/onboarding/WelcomeScreen.tsx`

**Features:**
- 5-slide welcome tutorial
- Beautiful animated transitions
- Skip functionality
- Covers: Welcome, Request rides, Track driver, Payments, Safety
- Auto-saves completion to AsyncStorage

**Usage:**
```typescript
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen';

// In navigation stack
<Stack.Screen name="Welcome" component={WelcomeScreen} />
```

---

### 2. PermissionsOnboardingScreen.tsx
**Location:** `hande/src/screens/onboarding/PermissionsOnboardingScreen.tsx`

**Features:**
- Dedicated permissions flow
- Location permission (foreground + background)
- Push notifications permission
- Visual feedback (granted/pending states)
- Required vs optional badges
- Settings redirect for denied permissions
- Blocks continuation until required permissions granted

**Permissions Requested:**
- 📍 Location (Required) - For maps and driver tracking
- 🔔 Push Notifications (Required) - For trip updates

**Usage:**
```typescript
import { PermissionsOnboardingScreen } from './screens/onboarding/PermissionsOnboardingScreen';

<Stack.Screen 
  name="PermissionsOnboarding" 
  component={PermissionsOnboardingScreen} 
/>
```

---

### 3. FeatureDiscoveryTooltip.tsx
**Location:** `hande/src/components/FeatureDiscoveryTooltip.tsx`

**Features:**
- Interactive feature walkthroughs
- Highlights UI elements
- Step-by-step guidance
- Animated tooltips
- Auto-saves progress
- Skip functionality
- Pagination indicator

**Usage:**
```typescript
import { FeatureDiscoveryTooltip } from '../components/FeatureDiscoveryTooltip';

const steps = [
  {
    id: 'pickup',
    title: 'Set Your Pickup Location',
    description: 'Tap here to enter your pickup address',
    targetPosition: { x: 20, y: 100, width: 335, height: 50 },
    placement: 'bottom',
  },
  // ... more steps
];

<FeatureDiscoveryTooltip
  steps={steps}
  featureId="rider_map_tour"
  onComplete={() => setShowFeatureDiscovery(false)}
/>
```

---

### 4. onboardingSlice.ts
**Location:** `hande/src/store/slices/onboardingSlice.ts`

**State Management:**
```typescript
interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedPermissions: boolean;
  completedFeatureTours: string[];
  userType: 'rider' | 'driver' | null;
}
```

**Actions:**
- `setHasSeenWelcome(boolean)` - Mark welcome tour complete
- `setHasCompletedPermissions(boolean)` - Mark permissions granted
- `addCompletedFeatureTour(string)` - Track feature tours
- `setUserType('rider' | 'driver')` - Set user type
- `resetOnboarding()` - Clear all onboarding state

**Integration:**
```typescript
import { useAppDispatch } from '../store/hooks';
import { setHasSeenWelcome } from '../store/slices/onboardingSlice';

const dispatch = useAppDispatch();
dispatch(setHasSeenWelcome(true));
```

---

## Integration Steps

### Step 1: Update Navigation Types
```typescript
// src/types/navigation.ts
export type AuthStackParamList = {
  Welcome: undefined;
  PermissionsOnboarding: undefined;
  Login: undefined;
  // ... rest
};
```

### Step 2: Add to Redux Store
```typescript
// src/store/index.ts
import onboardingReducer from './slices/onboardingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer, // Add this
    // ... other reducers
  },
});
```

### Step 3: Update App.tsx
```typescript
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen';
import { PermissionsOnboardingScreen } from './screens/onboarding/PermissionsOnboardingScreen';

// Check onboarding status
useEffect(() => {
  const checkOnboarding = async () => {
    const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
    const hasCompletedPermissions = await AsyncStorage.getItem('hasCompletedPermissions');
    
    if (!hasSeenOnboarding) {
      setInitialRoute('Welcome');
    } else if (!hasCompletedPermissions) {
      setInitialRoute('PermissionsOnboarding');
    } else {
      setInitialRoute('Login');
    }
  };
  
  checkOnboarding();
}, []);

// In navigation stack
<Stack.Screen name="Welcome" component={WelcomeScreen} />
<Stack.Screen name="PermissionsOnboarding" component={PermissionsOnboardingScreen} />
```

### Step 4: Install Required Dependencies
```bash
cd hande
npm install @react-native-async-storage/async-storage
npm install expo-location
npm install expo-notifications
```

### Step 5: Add Feature Discovery to Screens
Example for RiderMapScreen:
```typescript
// RiderMapScreen.tsx
import { FeatureDiscoveryTooltip } from '../../components/FeatureDiscoveryTooltip';

const [showFeatureTour, setShowFeatureTour] = useState(false);

useEffect(() => {
  // Show feature tour after first successful login
  const checkFirstUse = async () => {
    const hasSeenTour = await AsyncStorage.getItem('rider_map_tour_seen');
    if (!hasSeenTour) {
      setShowFeatureTour(true);
    }
  };
  checkFirstUse();
}, []);

// Define tour steps (measure actual component positions)
const tourSteps = [
  {
    id: 'pickup',
    title: 'Set Pickup Location',
    description: 'Enter your pickup address here',
    targetPosition: { x: 20, y: 100, width: 335, height: 50 },
    placement: 'bottom',
  },
  // ... more steps
];

return (
  <>
    {/* Your screen UI */}
    
    {showFeatureTour && (
      <FeatureDiscoveryTooltip
        steps={tourSteps}
        featureId="rider_map_tour"
        onComplete={() => setShowFeatureTour(false)}
      />
    )}
  </>
);
```

---

## Flow Diagram

```
App Launch
    ↓
Check hasSeenOnboarding?
    ├─ NO → WelcomeScreen (5 slides)
    │         ↓
    │   Save to AsyncStorage
    │         ↓
    └─ YES → Check hasCompletedPermissions?
                ├─ NO → PermissionsOnboardingScreen
                │         ↓
                │   Request Location & Notifications
                │         ↓
                │   Save to AsyncStorage
                │         ↓
                └─ YES → Check authToken?
                            ├─ NO → LoginScreen
                            └─ YES → Main App
                                      ↓
                                Check feature tours
                                      ↓
                                Show FeatureDiscoveryTooltip
                                (if not seen before)
```

---

## Customization

### Change Welcome Slides
Edit `WelcomeScreen.tsx`:
```typescript
const slides = [
  {
    id: '1',
    title: 'Your Custom Title',
    description: 'Your custom description',
    image: '🚗', // Any emoji
    backgroundColor: '#FF6B35',
  },
  // Add more slides
];
```

### Add More Permissions
Edit `PermissionsOnboardingScreen.tsx`:
```typescript
{
  id: 'camera',
  title: 'Camera Access',
  description: 'For profile photos and document uploads',
  icon: '📷',
  required: false,
  granted: false,
  requestFunction: async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  },
}
```

### Change Colors
Update styles in each component:
```typescript
backgroundColor: '#YOUR_COLOR',
```

---

## Testing Checklist

- [ ] Welcome screen shows on first launch
- [ ] Can skip welcome tutorial
- [ ] All 5 slides display correctly
- [ ] Permissions screen shows after welcome
- [ ] Location permission requested
- [ ] Push notification permission requested
- [ ] Cannot continue without required permissions
- [ ] "Grant Permission" buttons work
- [ ] AsyncStorage saves completion state
- [ ] Second launch skips onboarding
- [ ] Feature discovery tooltip highlights elements
- [ ] Tooltip navigation works (Next/Skip)
- [ ] Tooltip saves completion state
- [ ] No crashes on permission denial

---

## Reset Onboarding (For Testing)

```typescript
// In your dev menu or settings screen
import AsyncStorage from '@react-native-async-storage/async-storage';

const resetOnboarding = async () => {
  await AsyncStorage.removeItem('hasSeenOnboarding');
  await AsyncStorage.removeItem('hasCompletedPermissions');
  await AsyncStorage.removeItem('rider_map_tour_seen');
  await AsyncStorage.removeItem('driver_map_tour_seen');
  // Add any other feature tour keys
  
  // Optionally clear Redux state
  dispatch(resetOnboarding());
  
  // Restart app or navigate to Welcome
};
```

---

## Production Considerations

1. **Analytics:** Track onboarding completion rates
   ```typescript
   Analytics.logEvent('onboarding_completed', {
     step: 'welcome_tutorial',
     timestamp: new Date().toISOString(),
   });
   ```

2. **A/B Testing:** Test different onboarding flows
3. **Localization:** Translate all text strings
4. **Accessibility:** Add screen reader labels
5. **Error Handling:** Handle permission failures gracefully

---

## Files Created Summary

✅ `hande/src/screens/onboarding/WelcomeScreen.tsx` - Welcome tutorial
✅ `hande/src/screens/onboarding/PermissionsOnboardingScreen.tsx` - Permissions flow
✅ `hande/src/components/FeatureDiscoveryTooltip.tsx` - Feature tooltips
✅ `hande/src/store/slices/onboardingSlice.ts` - State management
✅ `hande/src/examples/FeatureDiscoveryExample.tsx` - Usage example
✅ `hande/src/examples/AppIntegrationExample.tsx` - App.tsx integration

---

## Next Steps

1. Integrate onboarding screens into App.tsx navigation
2. Add Redux onboarding slice to store
3. Install required dependencies
4. Update navigation types
5. Test onboarding flow end-to-end
6. Add feature discovery to key screens (RiderMap, DriverMap)
7. Measure component positions for tooltips
8. Add analytics tracking
9. Translate to multiple languages (if needed)
10. Deploy and monitor completion rates
