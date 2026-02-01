import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Search,
  MapPin,
  Car,
  Clock,
  DollarSign,
  XCircle,
  AlertCircle,
  Navigation,
  Eye,
} from 'lucide-react';

interface Trip {
  id: number;
  trip_id: string;
  rider_name: string;
  driver_name: string;
  pickup_location: string;
  dropoff_location: string;
  fare: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface TripDetails {
  id: number;
  trip_id: string;
  rider: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  driver: {
    id: number;
    name: string;
    email: string;
    phone: string;
    license_plate: string;
  };
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance: number;
  duration: number;
  fare: number;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  route_polyline?: string;
}

export default function Trips() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'live' | 'history'>('live');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeResolution, setDisputeResolution] = useState('');
  const [adjustedFare, setAdjustedFare] = useState('');
  const queryClient = useQueryClient();

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['trips', viewMode, filterStatus, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/trips', {
        params: {
          type: viewMode,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
    refetchInterval: viewMode === 'live' ? 5000 : false, // Refresh live trips every 5 seconds
  });

  const { data: selectedTrip } = useQuery<TripDetails>({
    queryKey: ['trip', selectedTripId],
    enabled: !!selectedTripId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/trips/${selectedTripId}`);
      return response.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/admin/trips/${selectedTripId}/cancel`, {
        reason: cancelReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', selectedTripId] });
      setShowCancelModal(false);
      setCancelReason('');
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (tripId: number) => {
      await apiClient.post(`/admin/trips/${tripId}/refund`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', selectedTripId] });
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/admin/trips/${selectedTripId}/dispute`, {
        resolution: disputeResolution,
        adjusted_fare: adjustedFare ? parseFloat(adjustedFare) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', selectedTripId] });
      setShowDisputeModal(false);
      setDisputeResolution('');
      setAdjustedFare('');
    },
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Car, label: 'Accepted' },
      started: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Navigation, label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: MapPin, label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Cancelled' },
      disputed: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle, label: 'Disputed' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor live trips and manage trip history</p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex space-x-2">
        <Button
          variant={viewMode === 'live' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('live')}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Live Trips
        </Button>
        <Button
          variant={viewMode === 'history' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('history')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Trip History
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by trip ID, rider, or driver..."
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
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="started">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            {viewMode === 'live' ? 'Active Trips' : 'Trip History'}
          </h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : trips && trips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fare
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => {
                    const statusBadge = getStatusBadge(trip.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">#{trip.trip_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trip.rider_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trip.driver_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {trip.pickup_location} → {trip.dropoff_location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${trip.fare.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trip.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedTripId(trip.id)}
                            className="text-[#7ED957] hover:text-[#6BC845] mr-3"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {viewMode === 'live' ? 'No active trips' : 'No trip history found'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Detail Modal */}
      {selectedTripId && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Trip #{selectedTrip.trip_id}</h2>
                  {(() => {
                    const statusBadge = getStatusBadge(selectedTrip.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <span
                        className={`mt-2 px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {statusBadge.label}
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedTripId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Trip Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Rider Info */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Rider Information</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-gray-900">{selectedTrip.rider.name}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.rider.email}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.rider.phone}</p>
                  </CardContent>
                </Card>

                {/* Driver Info */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Driver Information</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-gray-900">{selectedTrip.driver.name}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.driver.email}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.driver.phone}</p>
                    <p className="text-sm text-gray-600">License: {selectedTrip.driver.license_plate}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Route Info */}
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Route Details</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="font-medium text-gray-900">{selectedTrip.pickup_location}</p>
                      <p className="text-xs text-gray-500">
                        ({selectedTrip.pickup_lat.toFixed(6)}, {selectedTrip.pickup_lng.toFixed(6)})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dropoff Location</p>
                      <p className="font-medium text-gray-900">{selectedTrip.dropoff_location}</p>
                      <p className="text-xs text-gray-500">
                        ({selectedTrip.dropoff_lat.toFixed(6)}, {selectedTrip.dropoff_lng.toFixed(6)})
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-gray-600">Distance</p>
                        <p className="font-medium text-gray-900">{selectedTrip.distance.toFixed(2)} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium text-gray-900">{selectedTrip.duration} min</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fare</p>
                        <p className="font-medium text-gray-900">${selectedTrip.fare.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Timeline</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedTrip.created_at).toLocaleString()}
                      </span>
                    </div>
                    {selectedTrip.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedTrip.completed_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedTrip.cancelled_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cancelled:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedTrip.cancelled_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedTrip.cancellation_reason && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Cancellation Reason:</span>
                        <p className="text-sm font-medium text-red-600 mt-1">
                          {selectedTrip.cancellation_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                {(selectedTrip.status === 'pending' || selectedTrip.status === 'accepted') && (
                  <Button variant="danger" onClick={() => setShowCancelModal(true)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Trip
                  </Button>
                )}
                {selectedTrip.status === 'completed' && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (confirm('Are you sure you want to refund this trip?')) {
                        refundMutation.mutate(selectedTrip.id);
                      }
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Issue Refund
                  </Button>
                )}
                {selectedTrip.status === 'disputed' && (
                  <Button variant="primary" onClick={() => setShowDisputeModal(true)}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Resolve Dispute
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Trip Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Cancel Trip</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Enter cancellation reason..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="danger"
                  onClick={() => cancelMutation.mutate()}
                  disabled={!cancelReason}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Trip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Resolve Dispute</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <textarea
                  value={disputeResolution}
                  onChange={(e) => setDisputeResolution(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Describe the resolution..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjusted Fare (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustedFare}
                  onChange={(e) => setAdjustedFare(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Enter adjusted fare..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeResolution('');
                    setAdjustedFare('');
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => disputeMutation.mutate()}
                  disabled={!disputeResolution}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
