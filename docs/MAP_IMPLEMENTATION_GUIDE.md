# Map Implementation Guide - Uniform Components & Styling

> **Purpose:** Define uniform map markers, polylines, and behaviors across all HANDEE screens  
> **Last Updated:** 2026-01-25  
> **Status:** Standard Reference

---

## Table of Contents

1. [Map Component Standards](#map-component-standards)
2. [Marker Types & Icons](#marker-types--icons)
3. [Polyline Styles](#polyline-styles)
4. [Camera Behaviors](#camera-behaviors)
5. [Reusable Components](#reusable-components)
6. [Implementation Examples](#implementation-examples)
7. [Screen-Specific Usage](#screen-specific-usage)

---

## Map Component Standards

### Base Map Configuration

**Map Provider:** Google Maps (via WebView) or React Native Maps  
**Default Settings:**
```typescript
const MAP_CONFIG = {
  style: 'standard', // Standard Google Maps style
  showsUserLocation: true,
  showsMyLocationButton: false, // Custom location button
  showsCompass: true,
  showsScale: false,
  showsTraffic: false, // Enable for in-progress trips
  showsBuildings: true,
  showsIndoors: false,
  rotateEnabled: true,
  scrollEnabled: true,
  zoomEnabled: true,
  pitchEnabled: false, // Keep 2D view
  toolbarEnabled: false, // Android
  
  // Camera defaults
  initialCamera: {
    zoom: 15,
    pitch: 0,
    heading: 0,
  },
}
```

---

## Marker Types & Icons

### 1. User Location Marker
**Usage:** Current location of authenticated user (rider or driver)

```typescript
const USER_LOCATION_MARKER = {
  type: 'user_location',
  icon: {
    type: 'custom',
    source: require('../assets/markers/user-location.png'),
    size: { width: 32, height: 32 },
  },
  anchor: { x: 0.5, y: 0.5 },
  zIndex: 100,
  showCallout: false,
}

// Visual: Blue circle with white border and pulsing animation
```

**PNG Asset Specs:**
- Size: 64x64px @2x, 96x96px @3x
- Blue circle (#4285F4) with white border
- Center blue dot
- Shadow/glow effect

---

### 2. Pickup Location Marker
**Usage:** Rider's pickup location

```typescript
const PICKUP_MARKER = {
  type: 'pickup',
  icon: {
    type: 'custom',
    source: require('../assets/markers/pickup-pin.png'),
    size: { width: 40, height: 56 },
  },
  anchor: { x: 0.5, y: 1.0 }, // Bottom center
  zIndex: 90,
  callout: {
    title: 'Pickup Location',
    description: pickupAddress,
  },
  draggable: false,
}

// Visual: Green map pin with "P" or pickup icon
```

**PNG Asset Specs:**
- Size: 80x112px @2x, 120x168px @3x
- Color: Green (#34A853)
- Shape: Teardrop pin
- Icon: "P" or person icon inside
- White icon on green background
- Drop shadow

---

### 3. Dropoff Location Marker
**Usage:** Destination location

```typescript
const DROPOFF_MARKER = {
  type: 'dropoff',
  icon: {
    type: 'custom',
    source: require('../assets/markers/dropoff-pin.png'),
    size: { width: 40, height: 56 },
  },
  anchor: { x: 0.5, y: 1.0 },
  zIndex: 90,
  callout: {
    title: 'Destination',
    description: dropoffAddress,
  },
  draggable: false,
}

// Visual: Red map pin with "D" or flag icon
```

**PNG Asset Specs:**
- Size: 80x112px @2x, 120x168px @3x
- Color: Red (#EA4335)
- Shape: Teardrop pin
- Icon: "D" or flag icon inside
- White icon on red background
- Drop shadow

---

### 4. Driver Marker (Available)
**Usage:** Nearby drivers not on a trip

```typescript
const DRIVER_AVAILABLE_MARKER = {
  type: 'driver_available',
  icon: {
    type: 'custom',
    source: require('../assets/markers/car-available.png'),
    size: { width: 48, height: 48 },
  },
  anchor: { x: 0.5, y: 0.5 },
  rotation: 0, // Heading angle
  flat: true, // Rotates with map
  zIndex: 80,
  showCallout: false,
}

// Visual: Small car icon (top view), gray/neutral color
```

**PNG Asset Specs:**
- Size: 96x96px @2x, 144x144px @3x
- Car icon (top-down view)
- Color: Gray (#9E9E9E) or light blue
- Arrow/triangle indicating front of car
- Subtle shadow

---

### 5. Driver Marker (Active - Assigned to Rider)
**Usage:** Driver assigned to current trip, en route to pickup or destination

```typescript
const DRIVER_ACTIVE_MARKER = {
  type: 'driver_active',
  icon: {
    type: 'custom',
    source: require('../assets/markers/car-active.png'),
    size: { width: 56, height: 56 },
  },
  anchor: { x: 0.5, y: 0.5 },
  rotation: driverHeading, // 0-360 degrees
  flat: true,
  zIndex: 95,
  callout: {
    title: driverName,
    description: `${vehicleMake} ${vehicleModel} - ${vehicleColor}`,
  },
}

// Visual: Larger car icon, black/primary color with highlight
```

**PNG Asset Specs:**
- Size: 112x112px @2x, 168x168px @3x
- Car icon (top-down view)
- Color: Black (#1A1A1A) or brand color (#FF6B35)
- Clear directional arrow
- Glow/highlight effect
- Shadow

---

### 6. Driver Marker (Self - Driver App)
**Usage:** Driver's own location in driver app

```typescript
const DRIVER_SELF_MARKER = {
  type: 'driver_self',
  icon: {
    type: 'custom',
    source: require('../assets/markers/car-self.png'),
    size: { width: 64, height: 64 },
  },
  anchor: { x: 0.5, y: 0.5 },
  rotation: currentHeading,
  flat: true,
  zIndex: 100,
  showCallout: false,
}

// Visual: Large car icon with pulse animation, brand color
```

**PNG Asset Specs:**
- Size: 128x128px @2x, 192x192px @3x
- Car icon with chevron/arrow pointing forward
- Color: Brand orange (#FF6B35)
- Pulsing ring animation
- Strong shadow

---

### 7. Waypoint Markers
**Usage:** Multiple stops on a trip

```typescript
const WAYPOINT_MARKER = {
  type: 'waypoint',
  icon: {
    type: 'custom',
    source: require('../assets/markers/waypoint-pin.png'),
    size: { width: 36, height: 50 },
  },
  anchor: { x: 0.5, y: 1.0 },
  zIndex: 85,
  label: {
    text: `${stopNumber}`,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}

// Visual: Blue pin with number inside (1, 2, 3...)
```

---

## Polyline Styles

### 1. Route to Pickup (Driver → Pickup)
**Usage:** Driver en route to pickup location

```typescript
const ROUTE_TO_PICKUP_POLYLINE = {
  coordinates: routeCoordinates,
  strokeColor: '#1E88E5', // Blue
  strokeWidth: 5,
  lineCap: 'round',
  lineJoin: 'round',
  geodesic: true,
  zIndex: 50,
}
```

**Visual:**
- Color: Blue (#1E88E5)
- Width: 5px
- Style: Solid line
- Animated: Optional dashed animation

---

### 2. Route to Destination (In Progress)
**Usage:** Driver with rider en route to destination

```typescript
const ROUTE_TO_DESTINATION_POLYLINE = {
  coordinates: routeCoordinates,
  strokeColor: '#000000', // Black
  strokeWidth: 6,
  lineCap: 'round',
  lineJoin: 'round',
  geodesic: true,
  zIndex: 60,
}
```

**Visual:**
- Color: Black (#000000)
- Width: 6px
- Style: Solid line
- Animated: Optional progress animation

---

### 3. Estimated Route (Fare Preview)
**Usage:** Route shown during fare estimation

```typescript
const ESTIMATED_ROUTE_POLYLINE = {
  coordinates: routeCoordinates,
  strokeColor: '#34A853', // Green
  strokeWidth: 5,
  strokePattern: [20, 10], // Dashed: 20px line, 10px gap
  lineCap: 'round',
  lineJoin: 'round',
  geodesic: true,
  zIndex: 40,
}
```

**Visual:**
- Color: Green (#34A853)
- Width: 5px
- Style: Dashed line
- Indicates estimated/preview route

---

### 4. Completed Route (Trip History)
**Usage:** Past trip route visualization

```typescript
const COMPLETED_ROUTE_POLYLINE = {
  coordinates: routeCoordinates,
  strokeColor: '#9E9E9E', // Gray
  strokeWidth: 4,
  lineCap: 'round',
  lineJoin: 'round',
  geodesic: true,
  zIndex: 30,
}
```

**Visual:**
- Color: Gray (#9E9E9E)
- Width: 4px
- Style: Solid line
- Muted color for historical data

---

### 5. Alternate Routes
**Usage:** Showing multiple route options

```typescript
const ALTERNATE_ROUTE_POLYLINE = {
  coordinates: routeCoordinates,
  strokeColor: '#BDBDBD', // Light gray
  strokeWidth: 4,
  strokePattern: [15, 8],
  lineCap: 'round',
  lineJoin: 'round',
  geodesic: true,
  zIndex: 35,
}
```

---

## Camera Behaviors

### Auto-fit to Show Multiple Markers

```typescript
const fitToMarkers = (markers: LatLng[], mapRef: MapRef) => {
  if (markers.length === 0) return
  
  if (markers.length === 1) {
    // Single marker - zoom to it
    mapRef.current?.animateCamera({
      center: markers[0],
      zoom: 16,
      duration: 1000,
    })
    return
  }
  
  // Multiple markers - fit bounds
  const padding = {
    top: 100,
    right: 50,
    bottom: 350, // Extra space for bottom panel
    left: 50,
  }
  
  mapRef.current?.fitToCoordinates(markers, {
    edgePadding: padding,
    animated: true,
  })
}
```

---

### Camera Tracking (Follow Driver)

```typescript
const enableDriverTracking = (
  driverLocation: LatLng,
  heading: number,
  mapRef: MapRef
) => {
  mapRef.current?.animateCamera({
    center: driverLocation,
    zoom: 17,
    heading: heading, // Rotate map to match driver direction
    pitch: 0,
    duration: 500,
  })
}
```

---

### Camera States per Screen Phase

```typescript
const CAMERA_CONFIGS = {
  // Idle - show user location
  idle: {
    zoom: 15,
    pitch: 0,
    heading: 0,
  },
  
  // Viewing fare - show entire route
  viewingFare: {
    fitToCoordinates: [pickup, dropoff],
    padding: { top: 100, right: 50, bottom: 350, left: 50 },
  },
  
  // Driver assigned - show driver and pickup
  driverAssigned: {
    fitToCoordinates: [driverLocation, pickupLocation],
    padding: { top: 100, right: 50, bottom: 350, left: 50 },
    followDriver: true, // Update as driver moves
  },
  
  // In progress - show driver and destination
  inProgress: {
    fitToCoordinates: [driverLocation, dropoffLocation],
    padding: { top: 100, right: 50, bottom: 350, left: 50 },
    followDriver: true,
  },
}
```

---

## Reusable Components

### 1. MapMarker Component

```typescript
// hande/src/components/map/MapMarker.tsx

import React from 'react';
import { Marker } from 'react-native-maps';

export type MarkerType = 
  | 'user_location'
  | 'pickup'
  | 'dropoff'
  | 'driver_available'
  | 'driver_active'
  | 'driver_self'
  | 'waypoint';

interface MapMarkerProps {
  type: MarkerType;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rotation?: number;
  label?: string;
  title?: string;
  description?: string;
  onPress?: () => void;
}

const MARKER_ICONS = {
  user_location: require('../../assets/markers/user-location.png'),
  pickup: require('../../assets/markers/pickup-pin.png'),
  dropoff: require('../../assets/markers/dropoff-pin.png'),
  driver_available: require('../../assets/markers/car-available.png'),
  driver_active: require('../../assets/markers/car-active.png'),
  driver_self: require('../../assets/markers/car-self.png'),
  waypoint: require('../../assets/markers/waypoint-pin.png'),
};

const MARKER_SIZES = {
  user_location: { width: 32, height: 32 },
  pickup: { width: 40, height: 56 },
  dropoff: { width: 40, height: 56 },
  driver_available: { width: 48, height: 48 },
  driver_active: { width: 56, height: 56 },
  driver_self: { width: 64, height: 64 },
  waypoint: { width: 36, height: 50 },
};

const MARKER_ANCHORS = {
  user_location: { x: 0.5, y: 0.5 },
  pickup: { x: 0.5, y: 1.0 },
  dropoff: { x: 0.5, y: 1.0 },
  driver_available: { x: 0.5, y: 0.5 },
  driver_active: { x: 0.5, y: 0.5 },
  driver_self: { x: 0.5, y: 0.5 },
  waypoint: { x: 0.5, y: 1.0 },
};

const MARKER_Z_INDEX = {
  user_location: 100,
  pickup: 90,
  dropoff: 90,
  driver_available: 80,
  driver_active: 95,
  driver_self: 100,
  waypoint: 85,
};

export const MapMarker: React.FC<MapMarkerProps> = ({
  type,
  coordinate,
  rotation = 0,
  label,
  title,
  description,
  onPress,
}) => {
  const icon = MARKER_ICONS[type];
  const size = MARKER_SIZES[type];
  const anchor = MARKER_ANCHORS[type];
  const zIndex = MARKER_Z_INDEX[type];
  
  const needsRotation = [
    'driver_available',
    'driver_active',
    'driver_self',
  ].includes(type);

  return (
    <Marker
      coordinate={coordinate}
      icon={icon}
      anchor={anchor}
      rotation={needsRotation ? rotation : 0}
      flat={needsRotation}
      zIndex={zIndex}
      title={title}
      description={description}
      onPress={onPress}
    >
      {label && type === 'waypoint' && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
```

---

### 2. MapPolyline Component

```typescript
// hande/src/components/map/MapPolyline.tsx

import React from 'react';
import { Polyline } from 'react-native-maps';

export type PolylineType =
  | 'to_pickup'
  | 'to_destination'
  | 'estimated'
  | 'completed'
  | 'alternate';

interface MapPolylineProps {
  type: PolylineType;
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  animated?: boolean;
}

const POLYLINE_STYLES = {
  to_pickup: {
    strokeColor: '#1E88E5', // Blue
    strokeWidth: 5,
    zIndex: 50,
    lineDashPattern: undefined,
  },
  to_destination: {
    strokeColor: '#000000', // Black
    strokeWidth: 6,
    zIndex: 60,
    lineDashPattern: undefined,
  },
  estimated: {
    strokeColor: '#34A853', // Green
    strokeWidth: 5,
    zIndex: 40,
    lineDashPattern: [20, 10], // Dashed
  },
  completed: {
    strokeColor: '#9E9E9E', // Gray
    strokeWidth: 4,
    zIndex: 30,
    lineDashPattern: undefined,
  },
  alternate: {
    strokeColor: '#BDBDBD', // Light gray
    strokeWidth: 4,
    zIndex: 35,
    lineDashPattern: [15, 8],
  },
};

export const MapPolyline: React.FC<MapPolylineProps> = ({
  type,
  coordinates,
  animated = true,
}) => {
  const style = POLYLINE_STYLES[type];

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={style.strokeColor}
      strokeWidth={style.strokeWidth}
      lineDashPattern={style.lineDashPattern}
      lineCap="round"
      lineJoin="round"
      geodesic={true}
      zIndex={style.zIndex}
    />
  );
};
```

---

### 3. MapController Hook

```typescript
// hande/src/hooks/useMapController.ts

import { useRef, useCallback } from 'react';
import { LatLng } from '../types';

export const useMapController = () => {
  const mapRef = useRef<any>(null);

  const fitToCoordinates = useCallback((
    coordinates: LatLng[],
    options?: {
      edgePadding?: { top: number; right: number; bottom: number; left: number };
      animated?: boolean;
    }
  ) => {
    if (!mapRef.current || coordinates.length === 0) return;

    const defaultPadding = {
      top: 100,
      right: 50,
      bottom: 350,
      left: 50,
    };

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: options?.edgePadding || defaultPadding,
      animated: options?.animated !== false,
    });
  }, []);

  const animateToRegion = useCallback((
    center: LatLng,
    zoom: number = 15,
    duration: number = 1000
  ) => {
    if (!mapRef.current) return;

    mapRef.current.animateCamera({
      center,
      zoom,
      duration,
    });
  }, []);

  const animateToFollowDriver = useCallback((
    driverLocation: LatLng,
    heading: number,
    zoom: number = 17
  ) => {
    if (!mapRef.current) return;

    mapRef.current.animateCamera({
      center: driverLocation,
      zoom,
      heading,
      pitch: 0,
      duration: 500,
    });
  }, []);

  return {
    mapRef,
    fitToCoordinates,
    animateToRegion,
    animateToFollowDriver,
  };
};
```

---

## Implementation Examples

### RiderMapScreen - Driver Assigned Phase

```typescript
// hande/src/screens/rider/RiderMapScreen.tsx

import React, { useEffect } from 'react';
import MapView from 'react-native-maps';
import { MapMarker } from '../../components/map/MapMarker';
import { MapPolyline } from '../../components/map/MapPolyline';
import { useMapController } from '../../hooks/useMapController';

export const RiderMapScreen = () => {
  const { mapRef, fitToCoordinates, animateToFollowDriver } = useMapController();
  
  const [phase, setPhase] = useState<Phase>('driver_assigned');
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [driverHeading, setDriverHeading] = useState<number>(0);
  const [pickupLocation, setPickupLocation] = useState<LatLng | null>(null);
  const [routeToPickup, setRouteToPickup] = useState<LatLng[]>([]);

  // Fit camera when driver assigned
  useEffect(() => {
    if (phase === 'driver_assigned' && driverLocation && pickupLocation) {
      fitToCoordinates([driverLocation, pickupLocation]);
    }
  }, [phase, driverLocation, pickupLocation]);

  // Update driver location in real-time
  useEffect(() => {
    if (!trip?.id) return;
    
    const interval = setInterval(async () => {
      const response = await trackingApi.getDriverLocation(trip.id);
      if (response.success && response.data) {
        setDriverLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
        setDriverHeading(response.data.heading);
        
        // Optional: Follow driver with camera
        // animateToFollowDriver(response.data, response.data.heading);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [trip?.id]);

  // Fetch route from driver to pickup
  useEffect(() => {
    if (phase === 'driver_assigned' && driverLocation && pickupLocation) {
      fetchRoute(driverLocation, pickupLocation);
    }
  }, [phase, driverLocation, pickupLocation]);

  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    const route = await googleMapsService.getDirections(origin, destination);
    if (route?.coordinates) {
      setRouteToPickup(route.coordinates);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={false}
      >
        {/* Pickup marker */}
        {pickupLocation && (
          <MapMarker
            type="pickup"
            coordinate={pickupLocation}
            title="Pickup Location"
            description={pickupAddress}
          />
        )}

        {/* Driver marker */}
        {driverLocation && (
          <MapMarker
            type="driver_active"
            coordinate={driverLocation}
            rotation={driverHeading}
            title={driver?.name}
            description={`${driver?.vehicle?.make} ${driver?.vehicle?.model}`}
          />
        )}

        {/* Route polyline from driver to pickup */}
        {routeToPickup.length > 0 && (
          <MapPolyline
            type="to_pickup"
            coordinates={routeToPickup}
          />
        )}
      </MapView>

      {/* Bottom panel UI */}
      <View style={styles.bottomPanel}>
        {/* Driver info, ETA, actions */}
      </View>
    </View>
  );
};
```

---

### DriverMapScreen - En Route to Pickup

```typescript
// hande/src/screens/driver/DriverMapScreen.tsx

import React, { useEffect } from 'react';
import MapView from 'react-native-maps';
import { MapMarker } from '../../components/map/MapMarker';
import { MapPolyline } from '../../components/map/MapPolyline';
import { useMapController } from '../../hooks/useMapController';

export const DriverMapScreen = () => {
  const { mapRef, fitToCoordinates } = useMapController();
  
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [pickupLocation, setPickupLocation] = useState<LatLng | null>(null);
  const [routeToPickup, setRouteToPickup] = useState<LatLng[]>([]);

  // Track driver's location
  useEffect(() => {
    const watchId = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      },
      (location) => {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setHeading(location.coords.heading || 0);
      }
    );

    return () => {
      watchId.then((id) => id.remove());
    };
  }, []);

  // Fit camera to show driver and pickup
  useEffect(() => {
    if (currentLocation && pickupLocation) {
      fitToCoordinates([currentLocation, pickupLocation]);
    }
  }, [currentLocation, pickupLocation]);

  // Fetch route to pickup
  useEffect(() => {
    if (currentLocation && pickupLocation) {
      fetchRoute(currentLocation, pickupLocation);
    }
  }, [currentLocation, pickupLocation]);

  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    const route = await googleMapsService.getDirections(origin, destination);
    if (route?.coordinates) {
      setRouteToPickup(route.coordinates);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={false}
      >
        {/* Driver's own location */}
        {currentLocation && (
          <MapMarker
            type="driver_self"
            coordinate={currentLocation}
            rotation={heading}
          />
        )}

        {/* Rider's pickup location */}
        {pickupLocation && (
          <MapMarker
            type="pickup"
            coordinate={pickupLocation}
            title="Pickup Location"
            description={trip?.pickup_address}
          />
        )}

        {/* Route polyline */}
        {routeToPickup.length > 0 && (
          <MapPolyline
            type="to_pickup"
            coordinates={routeToPickup}
          />
        )}
      </MapView>

      {/* Bottom panel UI */}
      <View style={styles.bottomPanel}>
        {/* Trip info, navigation, actions */}
      </View>
    </View>
  );
};
```

---

### Fare Estimation Screen

```typescript
// Viewing fare estimate with route preview

<MapView ref={mapRef} style={styles.map}>
  {/* Pickup marker */}
  <MapMarker
    type="pickup"
    coordinate={pickupLocation}
    title="Pickup"
  />

  {/* Dropoff marker */}
  <MapMarker
    type="dropoff"
    coordinate={dropoffLocation}
    title="Destination"
  />

  {/* Estimated route (dashed green line) */}
  <MapPolyline
    type="estimated"
    coordinates={estimatedRoute}
  />
</MapView>
```

---

## Screen-Specific Usage

### 1. RiderMapScreen

| Phase | Markers | Polyline | Camera Behavior |
|-------|---------|----------|-----------------|
| **Idle** | User location | None | Center on user, zoom 15 |
| **Entering Destination** | User location | None | Center on user |
| **Viewing Fare** | Pickup, Dropoff | Estimated (green dashed) | Fit both markers |
| **Searching** | Pickup, Dropoff | Estimated (green dashed) | Fit both markers |
| **Viewing Bids** | Pickup, Dropoff | Estimated (green dashed) | Fit both markers |
| **Driver Assigned** | Driver (active), Pickup | To Pickup (blue solid) | Fit both, update driver |
| **Driver Arrived** | Driver (active), Pickup | None | Fit both |
| **In Progress** | Driver (active), Dropoff | To Destination (black solid) | Fit both, follow driver |
| **Completed** | Dropoff | Completed route (gray) | Center on dropoff |

---

### 2. DriverMapScreen

| Phase | Markers | Polyline | Camera Behavior |
|-------|---------|----------|-----------------|
| **Offline** | None | None | Static |
| **Online Available** | Driver (self), Nearby drivers | None | Center on driver |
| **Viewing Request** | Driver (self), Pickup preview | Preview route | Fit both |
| **Accepted** | Driver (self), Pickup | To Pickup (blue solid) | Fit both |
| **Arriving** | Driver (self), Pickup | To Pickup (blue solid) | Follow driver |
| **Arrived at Pickup** | Driver (self), Pickup | None | Center on both |
| **In Progress** | Driver (self), Dropoff | To Destination (black solid) | Follow driver |
| **Completing** | Driver (self), Dropoff | None | Center on both |

---

### 3. Trip History Screen

```typescript
// Show completed trip route

<MapView style={styles.map}>
  {/* Pickup marker */}
  <MapMarker
    type="pickup"
    coordinate={trip.pickup_location}
  />

  {/* Dropoff marker */}
  <MapMarker
    type="dropoff"
    coordinate={trip.dropoff_location}
  />

  {/* Completed route (gray) */}
  <MapPolyline
    type="completed"
    coordinates={trip.route_coordinates}
  />
</MapView>
```

---

## Asset Creation Checklist

### Required Marker Assets

Create these PNG files in `hande/assets/markers/`:

- [ ] `user-location.png` - Blue circle (64x64px @2x)
- [ ] `pickup-pin.png` - Green pin with "P" (80x112px @2x)
- [ ] `dropoff-pin.png` - Red pin with "D" (80x112px @2x)
- [ ] `car-available.png` - Gray car top-view (96x96px @2x)
- [ ] `car-active.png` - Black/orange car (112x112px @2x)
- [ ] `car-self.png` - Orange car with pulse (128x128px @2x)
- [ ] `waypoint-pin.png` - Blue pin (72x100px @2x)

### @3x versions (iOS Retina)
All assets should have @3x versions (1.5x the @2x size)

---

## Color Palette Reference

```typescript
export const MAP_COLORS = {
  // Markers
  pickup: '#34A853',        // Green
  dropoff: '#EA4335',       // Red
  userLocation: '#4285F4',  // Blue
  driverAvailable: '#9E9E9E', // Gray
  driverActive: '#1A1A1A',  // Black
  driverSelf: '#FF6B35',    // Brand Orange
  waypoint: '#1E88E5',      // Blue
  
  // Polylines
  toPickup: '#1E88E5',      // Blue
  toDestination: '#000000', // Black
  estimated: '#34A853',     // Green
  completed: '#9E9E9E',     // Gray
  alternate: '#BDBDBD',     // Light Gray
  
  // Map elements
  background: '#F5F5F5',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.2)',
}
```

---

## Testing Checklist

- [ ] All marker types display correctly
- [ ] Markers have correct sizes and anchors
- [ ] Polylines render with correct colors/widths
- [ ] Driver marker rotates with heading
- [ ] Camera fits markers properly with padding
- [ ] Real-time location updates smoothly
- [ ] Route polylines update when driver moves
- [ ] Multiple screens use consistent styling
- [ ] Assets load on both iOS and Android
- [ ] Performance is acceptable (60fps)
- [ ] Map zoom levels are appropriate
- [ ] Markers are tappable with callouts

---

## Performance Optimization

### 1. Debounce Location Updates
```typescript
const debouncedLocationUpdate = useCallback(
  debounce((location: LatLng) => {
    setDriverLocation(location);
  }, 1000),
  []
);
```

### 2. Reduce Polyline Complexity
```typescript
// Simplify polyline coordinates
const simplifyPolyline = (coords: LatLng[], tolerance: number = 0.0001) => {
  // Use Douglas-Peucker algorithm
  return simplify(coords, tolerance);
};
```

### 3. Batch Map Updates
```typescript
// Update multiple markers at once instead of individually
const updateAllMarkers = useCallback(() => {
  setMapState((prev) => ({
    ...prev,
    driverLocation: newDriverLocation,
    routePolyline: newRoute,
  }));
}, []);
```

---

## Troubleshooting

### Issue: Markers not showing
- Check image paths in `require()`
- Verify asset files exist in `/assets/markers/`
- Check marker coordinates are valid
- Ensure zIndex is set

### Issue: Polyline not rendering
- Verify coordinates array has at least 2 points
- Check strokeColor and strokeWidth are set
- Ensure coordinates are valid lat/lng

### Issue: Camera not fitting markers
- Check edgePadding values (especially bottom for panel)
- Verify mapRef.current exists before calling
- Use setTimeout if calling immediately after mount

### Issue: Driver marker not rotating
- Set `flat: true` on marker
- Pass heading angle (0-360) to `rotation` prop
- Ensure `rotateEnabled: true` on MapView

---

**Next Steps:**
1. Create marker PNG assets
2. Implement MapMarker and MapPolyline components
3. Add useMapController hook to project
4. Update RiderMapScreen to use uniform components
5. Update DriverMapScreen to use uniform components
6. Test across all screen phases

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-25  
**Status:** Implementation Ready
