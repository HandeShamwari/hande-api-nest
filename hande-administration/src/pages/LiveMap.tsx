import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { MapPin, Users, Car, AlertTriangle, Activity, TrendingUp, RefreshCw } from 'lucide-react';

interface Driver {
  id: number;
  name: string;
  driver_status: string;
  latitude: number;
  longitude: number;
  zone_name: string | null;
  rating: number;
  total_trips: number;
  vehicle_type: string | null;
  license_plate: string | null;
  last_location_update: string;
}

interface Trip {
  id: number;
  status: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_address: string;
  rider_name: string;
  driver_name: string;
  driver_latitude: number | null;
  driver_longitude: number | null;
  license_plate: string;
  vehicle_type: string;
}

interface Zone {
  id: number;
  name: string;
  city: string;
  state: string;
  boundaries: Array<{ latitude: number; longitude: number; sequence: number }>;
}

interface Emergency {
  id: number;
  trip_id: number;
  alert_type: string;
  priority: string;
  latitude: number;
  longitude: number;
  status: string;
  user_name: string;
}

interface MapStats {
  active_drivers: number;
  busy_drivers: number;
  active_trips: number;
  pending_requests: number;
  active_emergencies: number;
  critical_emergencies: number;
  avg_response_time_seconds: number | null;
  trips_by_zone: Array<{ zone_id: number; zone_name: string; active_trips: number }>;
}

export default function LiveMap() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showTrips, setShowTrips] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Fetch data with auto-refresh
  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ['live-map-drivers', selectedZone],
    queryFn: async () => {
      const response = await apiClient.get('/admin/live-map/drivers', {
        params: selectedZone !== 'all' ? { zone_id: selectedZone } : undefined,
      });
      return response.data.data || [];
    },
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  const { data: trips } = useQuery<Trip[]>({
    queryKey: ['live-map-trips', selectedZone],
    queryFn: async () => {
      const response = await apiClient.get('/admin/live-map/trips', {
        params: selectedZone !== 'all' ? { zone_id: selectedZone } : undefined,
      });
      return response.data.data || [];
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ['live-map-zones'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/live-map/zones');
      return response.data.data || [];
    },
  });

  const { data: emergencies } = useQuery<Emergency[]>({
    queryKey: ['live-map-emergencies'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/live-map/emergencies');
      return response.data.data || [];
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: stats } = useQuery<MapStats>({
    queryKey: ['live-map-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/live-map/stats');
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const getDriverStatusColor = (status: string) => {
    return status === 'available' ? '#7ED957' : status === 'busy' ? '#FFB800' : '#FF4C4C';
  };

  const getTripStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FFB800',
      accepted: '#4DA6FF',
      arrived: '#7ED957',
      started: '#7ED957',
    };
    return colors[status] || '#333333';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: '#FF4C4C',
      high: '#FF8C00',
      medium: '#FFB800',
      low: '#4DA6FF',
    };
    return colors[priority] || '#FFB800';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Map Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Real-time monitoring of drivers, trips, and emergencies</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              autoRefresh
                ? 'bg-[#7ED957] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Drivers</p>
                <p className="text-xl font-bold text-[#7ED957]">{stats?.active_drivers || 0}</p>
              </div>
              <Users className="h-6 w-6 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Busy Drivers</p>
                <p className="text-xl font-bold text-[#FFB800]">{stats?.busy_drivers || 0}</p>
              </div>
              <Users className="h-6 w-6 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Trips</p>
                <p className="text-xl font-bold text-[#4DA6FF]">{stats?.active_trips || 0}</p>
              </div>
              <Car className="h-6 w-6 text-[#4DA6FF]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-[#FFB800]">{stats?.pending_requests || 0}</p>
              </div>
              <Activity className="h-6 w-6 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Emergencies</p>
                <p className="text-xl font-bold text-red-600">{stats?.active_emergencies || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Avg Response</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.avg_response_time_seconds ? `${Math.floor(stats.avg_response_time_seconds / 60)}m` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Zone</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              >
                <option value="all">All Zones</option>
                {zones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDrivers}
                  onChange={(e) => setShowDrivers(e.target.checked)}
                  className="rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                />
                <span className="text-sm font-medium text-gray-700">Show Drivers</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrips}
                  onChange={(e) => setShowTrips(e.target.checked)}
                  className="rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                />
                <span className="text-sm font-medium text-gray-700">Show Trips</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={(e) => setShowZones(e.target.checked)}
                  className="rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                />
                <span className="text-sm font-medium text-gray-700">Show Zones</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEmergencies}
                  onChange={(e) => setShowEmergencies(e.target.checked)}
                  className="rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                />
                <span className="text-sm font-medium text-gray-700">Show Emergencies</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder and Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization (Placeholder) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Map Visualization</h2>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ minHeight: '600px' }}>
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Google Maps Integration</h3>
                <p className="text-gray-600 mb-4">
                  Install <code className="bg-white px-2 py-1 rounded">@react-google-maps/api</code> or{' '}
                  <code className="bg-white px-2 py-1 rounded">react-leaflet</code> for map visualization
                </p>
                <p className="text-sm text-gray-500">
                  Map will display:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  {showDrivers && <li>• {drivers?.length || 0} Active Drivers (green/yellow markers)</li>}
                  {showTrips && <li>• {trips?.length || 0} Active Trips (blue routes)</li>}
                  {showZones && <li>• {zones?.length || 0} Service Zones (polygon boundaries)</li>}
                  {showEmergencies && <li>• {emergencies?.length || 0} Emergency Alerts (red markers)</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* Active Drivers List */}
          {showDrivers && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold flex items-center">
                  <Users className="h-4 w-4 mr-2 text-[#7ED957]" />
                  Active Drivers ({drivers?.length || 0})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {drivers && drivers.length > 0 ? (
                    drivers.slice(0, 10).map((driver) => (
                      <div key={driver.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{driver.name}</p>
                            <p className="text-gray-600">{driver.zone_name || 'No Zone'}</p>
                            {driver.vehicle_type && (
                              <p className="text-gray-500">{driver.vehicle_type} • {driver.license_plate}</p>
                            )}
                          </div>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getDriverStatusColor(driver.driver_status) + '20',
                              color: getDriverStatusColor(driver.driver_status),
                            }}
                          >
                            {driver.driver_status}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-500">
                          ⭐ {driver.rating.toFixed(1)} • {driver.total_trips} trips
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No active drivers</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Trips List */}
          {showTrips && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold flex items-center">
                  <Car className="h-4 w-4 mr-2 text-[#4DA6FF]" />
                  Active Trips ({trips?.length || 0})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trips && trips.length > 0 ? (
                    trips.slice(0, 10).map((trip) => (
                      <div key={trip.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-gray-900">Trip #{trip.id}</p>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getTripStatusColor(trip.status) + '20',
                              color: getTripStatusColor(trip.status),
                            }}
                          >
                            {trip.status}
                          </span>
                        </div>
                        <p className="text-gray-700">{trip.rider_name}</p>
                        <p className="text-gray-600">Driver: {trip.driver_name}</p>
                        <p className="text-gray-500 mt-1 truncate">
                          {trip.pickup_address} → {trip.dropoff_address}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No active trips</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Alerts */}
          {showEmergencies && emergencies && emergencies.length > 0 && (
            <Card className="border-l-4 border-red-500">
              <CardHeader>
                <h3 className="text-sm font-semibold flex items-center text-red-900">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                  Emergency Alerts ({emergencies.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {emergencies.map((emergency) => (
                    <div key={emergency.id} className="p-2 bg-red-50 rounded text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-red-900 capitalize">
                          {emergency.alert_type.replace('_', ' ')}
                        </p>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getPriorityColor(emergency.priority) + '20',
                            color: getPriorityColor(emergency.priority),
                          }}
                        >
                          {emergency.priority}
                        </span>
                      </div>
                      <p className="text-gray-700">{emergency.user_name}</p>
                      <p className="text-gray-600">Trip #{emergency.trip_id}</p>
                      <p className="text-gray-500 capitalize">{emergency.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trips by Zone */}
          {stats?.trips_by_zone && stats.trips_by_zone.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Trips by Zone</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.trips_by_zone.map((zone) => (
                    <div key={zone.zone_id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">{zone.zone_name}</span>
                      <span className="font-bold text-[#7ED957]">{zone.active_trips}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Implementation Note */}
      <Card className="mt-6 border-l-4 border-[#4DA6FF]">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📍 Map Integration Required</h3>
          <p className="text-sm text-gray-700 mb-3">
            To display the interactive map, install a map library:
          </p>
          <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
            npm install @react-google-maps/api
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Or use React Leaflet (free, no API key required):
          </p>
          <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm mt-2">
            npm install react-leaflet leaflet
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Data is ready - all drivers, trips, zones, and emergencies are being fetched and updated every 5 seconds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
