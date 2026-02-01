import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, MapPin, DollarSign, TrendingUp, Eye, Edit, Trash2, Plus } from 'lucide-react';

interface Zone {
  id: number;
  name: string;
  city: string;
  state: string;
  is_active: boolean;
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  minimum_fare: number;
  maximum_fare: number | null;
  cancellation_fee: number;
  total_drivers: number;
  total_trips: number;
  created_at: string;
}

interface ZoneGeofence {
  id: number;
  latitude: number;
  longitude: number;
  sequence: number;
}

interface ZoneDetails extends Zone {
  geofence: ZoneGeofence[];
  analytics: {
    daily_trips: number;
    daily_revenue: number;
    active_drivers: number;
    average_fare: number;
    peak_hours: Array<{ hour: number; trip_count: number }>;
  };
}

interface ZoneStats {
  total_zones: number;
  active_zones: number;
  total_drivers: number;
  total_trips_today: number;
}

interface ZoneFormData {
  name: string;
  city: string;
  state: string;
  is_active: boolean;
  base_fare: string;
  per_km_rate: string;
  per_minute_rate: string;
  minimum_fare: string;
  maximum_fare: string;
  cancellation_fee: string;
  geofence_points: string;
}

export default function Zones() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    city: '',
    state: '',
    is_active: true,
    base_fare: '',
    per_km_rate: '',
    per_minute_rate: '',
    minimum_fare: '',
    maximum_fare: '',
    cancellation_fee: '',
    geofence_points: '',
  });

  const { data: zones, isLoading } = useQuery<Zone[]>({
    queryKey: ['zones', filterStatus, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/zones', {
        params: {
          status: filterStatus !== 'all' ? (filterStatus === 'active' ? 'true' : 'false') : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
  });

  const { data: stats } = useQuery<ZoneStats>({
    queryKey: ['zone-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/zones/stats');
      return response.data;
    },
  });

  const { data: selectedZone } = useQuery<ZoneDetails>({
    queryKey: ['zone', selectedZoneId],
    enabled: !!selectedZoneId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/zones/${selectedZoneId}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ZoneFormData) => {
      const geofencePoints = data.geofence_points
        .split('\n')
        .filter(line => line.trim())
        .map((line, index) => {
          const [lat, lng] = line.split(',').map(s => parseFloat(s.trim()));
          return { latitude: lat, longitude: lng, sequence: index + 1 };
        });

      await apiClient.post('/admin/zones', {
        name: data.name,
        city: data.city,
        state: data.state,
        is_active: data.is_active,
        base_fare: parseFloat(data.base_fare),
        per_km_rate: parseFloat(data.per_km_rate),
        per_minute_rate: parseFloat(data.per_minute_rate),
        minimum_fare: parseFloat(data.minimum_fare),
        maximum_fare: data.maximum_fare ? parseFloat(data.maximum_fare) : null,
        cancellation_fee: parseFloat(data.cancellation_fee),
        geofence_points: geofencePoints,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zone-stats'] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ZoneFormData }) => {
      const geofencePoints = data.geofence_points
        ? data.geofence_points
            .split('\n')
            .filter(line => line.trim())
            .map((line, index) => {
              const [lat, lng] = line.split(',').map(s => parseFloat(s.trim()));
              return { latitude: lat, longitude: lng, sequence: index + 1 };
            })
        : undefined;

      await apiClient.put(`/admin/zones/${id}`, {
        name: data.name,
        city: data.city,
        state: data.state,
        is_active: data.is_active,
        base_fare: parseFloat(data.base_fare),
        per_km_rate: parseFloat(data.per_km_rate),
        per_minute_rate: parseFloat(data.per_minute_rate),
        minimum_fare: parseFloat(data.minimum_fare),
        maximum_fare: data.maximum_fare ? parseFloat(data.maximum_fare) : null,
        cancellation_fee: parseFloat(data.cancellation_fee),
        geofence_points: geofencePoints,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zone', editingZone?.id] });
      setShowEditModal(false);
      setEditingZone(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      await apiClient.delete(`/admin/zones/${zoneId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zone-stats'] });
      setSelectedZoneId(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      state: '',
      is_active: true,
      base_fare: '',
      per_km_rate: '',
      per_minute_rate: '',
      minimum_fare: '',
      maximum_fare: '',
      cancellation_fee: '',
      geofence_points: '',
    });
  };

  const openEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      city: zone.city,
      state: zone.state,
      is_active: zone.is_active,
      base_fare: zone.base_fare.toString(),
      per_km_rate: zone.per_km_rate.toString(),
      per_minute_rate: zone.per_minute_rate.toString(),
      minimum_fare: zone.minimum_fare.toString(),
      maximum_fare: zone.maximum_fare?.toString() || '',
      cancellation_fee: zone.cancellation_fee.toString(),
      geofence_points: '',
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' }
      : { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' };
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zone Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage service zones, geofencing, and dynamic pricing</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Create Zone
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Zones</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_zones || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Zones</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_zones || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_drivers || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trips Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_trips_today || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by zone name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Zones List</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : zones && zones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drivers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trips
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {zones.map((zone: Zone) => {
                    const statusBadge = getStatusBadge(zone.is_active);
                    return (
                      <tr key={zone.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{zone.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{zone.city}, {zone.state}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="text-[#FFB800] font-bold">${zone.base_fare}</span> base
                          </div>
                          <div className="text-xs text-gray-500">
                            ${zone.per_km_rate}/km, ${zone.per_minute_rate}/min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.total_drivers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.total_trips}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedZoneId(zone.id)}
                            className="text-[#7ED957] hover:text-[#6BC845]"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(zone)}
                            className="text-[#4DA6FF] hover:text-blue-700"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this zone? This action cannot be undone.')) {
                                deleteMutation.mutate(zone.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No zones found</div>
          )}
        </CardContent>
      </Card>

      {/* Zone Detail Modal */}
      {selectedZoneId && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedZone.name}</h2>
                  <p className="text-gray-600">{selectedZone.city}, {selectedZone.state}</p>
                </div>
                <button
                  onClick={() => setSelectedZoneId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Zone Analytics */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Daily Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedZone.analytics?.daily_trips || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Daily Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(selectedZone.analytics?.daily_revenue || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Active Drivers</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedZone.analytics?.active_drivers || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Avg Fare</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(selectedZone.analytics?.average_fare || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pricing Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Pricing Structure</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Base Fare</p>
                        <p className="text-lg font-bold text-[#FFB800]">${selectedZone.base_fare.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Per KM Rate</p>
                        <p className="text-lg font-bold text-gray-900">${selectedZone.per_km_rate.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Per Minute Rate</p>
                        <p className="text-lg font-bold text-gray-900">${selectedZone.per_minute_rate.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Minimum Fare</p>
                        <p className="text-lg font-bold text-gray-900">${selectedZone.minimum_fare.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Maximum Fare</p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedZone.maximum_fare ? `$${selectedZone.maximum_fare.toFixed(2)}` : 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cancellation Fee</p>
                        <p className="text-lg font-bold text-gray-900">${selectedZone.cancellation_fee.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Geofence Points */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Geofence Coordinates ({selectedZone.geofence?.length || 0} points)</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="max-h-40 overflow-y-auto">
                      {selectedZone.geofence && selectedZone.geofence.length > 0 ? (
                        <div className="space-y-1 text-sm font-mono">
                          {selectedZone.geofence
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((point) => (
                              <div key={point.id} className="text-gray-700">
                                {point.sequence}. {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No geofence defined</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Peak Hours */}
              {selectedZone.analytics?.peak_hours && selectedZone.analytics.peak_hours.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {selectedZone.analytics.peak_hours.slice(0, 5).map((peak) => (
                          <div key={peak.hour} className="flex justify-between items-center">
                            <span className="text-gray-700">
                              {peak.hour.toString().padStart(2, '0')}:00 - {(peak.hour + 1).toString().padStart(2, '0')}:00
                            </span>
                            <span className="font-semibold text-gray-900">{peak.trip_count} trips</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => openEditModal(selectedZone)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Zone
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this zone? This action cannot be undone.')) {
                      deleteMutation.mutate(selectedZone.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Zone
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Zone Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {showCreateModal ? 'Create New Zone' : 'Edit Zone'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                      placeholder="Downtown Area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                      placeholder="New York"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                      placeholder="NY"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                      />
                      <span className="text-sm font-medium text-gray-700">Active Zone</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Structure</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.base_fare}
                        onChange={(e) => setFormData({ ...formData, base_fare: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                        placeholder="5.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Per KM Rate ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.per_km_rate}
                        onChange={(e) => setFormData({ ...formData, per_km_rate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                        placeholder="1.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Per Minute Rate ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.per_minute_rate}
                        onChange={(e) => setFormData({ ...formData, per_minute_rate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                        placeholder="0.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Fare ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.minimum_fare}
                        onChange={(e) => setFormData({ ...formData, minimum_fare: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                        placeholder="8.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Fare ($) <span className="text-gray-500">(optional)</span></label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maximum_fare}
                        onChange={(e) => setFormData({ ...formData, maximum_fare: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                        placeholder="100.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cancellation_fee}
                        onChange={(e) => setFormData({ ...formData, cancellation_fee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                        placeholder="3.00"
                      />
                    </div>
                  </div>
                </div>

                {showCreateModal && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Geofence Coordinates</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Enter coordinates as latitude, longitude pairs (one per line):
                    </p>
                    <textarea
                      value={formData.geofence_points}
                      onChange={(e) => setFormData({ ...formData, geofence_points: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent font-mono text-sm"
                      placeholder="40.748817, -73.985428&#10;40.749017, -73.984628&#10;40.748217, -73.984028&#10;40.747817, -73.985228"
                    />
                  </div>
                )}

                {showEditModal && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Update Geofence</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Leave empty to keep existing geofence, or enter new coordinates:
                    </p>
                    <textarea
                      value={formData.geofence_points}
                      onChange={(e) => setFormData({ ...formData, geofence_points: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent font-mono text-sm"
                      placeholder="Optional: Enter new coordinates..."
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEditingZone(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (showCreateModal) {
                        createMutation.mutate(formData);
                      } else if (editingZone) {
                        updateMutation.mutate({ id: editingZone.id, data: formData });
                      }
                    }}
                    disabled={
                      !formData.name ||
                      !formData.city ||
                      !formData.state ||
                      !formData.base_fare ||
                      !formData.per_km_rate ||
                      !formData.per_minute_rate ||
                      !formData.minimum_fare ||
                      !formData.cancellation_fee ||
                      (showCreateModal && !formData.geofence_points)
                    }
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {showCreateModal ? 'Create Zone' : 'Update Zone'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
