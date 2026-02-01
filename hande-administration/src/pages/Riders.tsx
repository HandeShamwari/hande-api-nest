import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, User, Ban, CheckCircle, DollarSign, Eye, AlertTriangle } from 'lucide-react';

interface Rider {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_banned: boolean;
  total_trips: number;
  total_spent: number;
  rating: number;
  created_at: string;
}

interface RiderDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_banned: boolean;
  total_trips: number;
  total_spent: number;
  rating: number;
  created_at: string;
  trip_history: Array<{
    id: number;
    pickup_location: string;
    dropoff_location: string;
    fare: number;
    status: string;
    created_at: string;
  }>;
  payment_methods: Array<{
    id: number;
    type: string;
    last_four: string;
    is_default: boolean;
  }>;
}

interface RiderStats {
  total_riders: number;
  active_today: number;
  banned: number;
  total_spent: number;
}

export default function Riders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTripId, setRefundTripId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: riders, isLoading } = useQuery<Rider[]>({
    queryKey: ['riders', filterStatus, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/riders', {
        params: {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
  });

  const { data: stats } = useQuery<RiderStats>({
    queryKey: ['rider-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/riders/stats');
      return response.data;
    },
  });

  const { data: selectedRider } = useQuery<RiderDetails>({
    queryKey: ['rider', selectedRiderId],
    enabled: !!selectedRiderId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/riders/${selectedRiderId}`);
      return response.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (riderId: number) => {
      await apiClient.put(`/admin/riders/${riderId}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (riderId: number) => {
      await apiClient.put(`/admin/riders/${riderId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
      setSelectedRiderId(null);
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (riderId: number) => {
      await apiClient.put(`/admin/riders/${riderId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
      setSelectedRiderId(null);
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/riders/refund', {
        trip_id: refundTripId,
        amount: parseFloat(refundAmount),
        reason: refundReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider', selectedRiderId] });
      setShowRefundModal(false);
      setRefundTripId(null);
      setRefundAmount('');
      setRefundReason('');
    },
  });

  const getStatusBadge = (status: string, isBanned: boolean) => {
    if (isBanned) {
      return { bg: 'bg-red-100', text: 'text-red-800', label: 'Banned' };
    }
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      suspended: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspended' },
    };
    return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rider Management</h1>
        <p className="mt-1 text-sm text-gray-600">Manage riders, view trip history, and handle refunds</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Riders</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_riders || 0}</p>
              </div>
              <User className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_today || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Banned</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.banned || 0}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(stats?.total_spent || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#FFB800]" />
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
                placeholder="Search by name, email, or phone..."
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
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Riders Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Riders List</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : riders && riders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trips
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
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
                  {riders.map((rider: Rider) => {
                    const statusBadge = getStatusBadge(rider.status, rider.is_banned);
                    return (
                      <tr key={rider.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{rider.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{rider.email}</div>
                          <div className="text-sm text-gray-500">{rider.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rider.total_trips}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${rider.total_spent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ⭐ {rider.rating.toFixed(1)}
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
                            onClick={() => setSelectedRiderId(rider.id)}
                            className="text-[#7ED957] hover:text-[#6BC845] font-medium"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {!rider.is_banned && rider.status === 'active' && (
                            <button
                              onClick={() => suspendMutation.mutate(rider.id)}
                              className="text-yellow-600 hover:text-yellow-700 font-medium"
                            >
                              Suspend
                            </button>
                          )}
                          {!rider.is_banned && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to ban this rider?')) {
                                  banMutation.mutate(rider.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Ban
                            </button>
                          )}
                          {rider.is_banned && (
                            <button
                              onClick={() => unbanMutation.mutate(rider.id)}
                              className="text-[#7ED957] hover:text-[#6BC845] font-medium"
                            >
                              Unban
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No riders found</div>
          )}
        </CardContent>
      </Card>

      {/* Rider Detail Modal */}
      {selectedRiderId && selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRider.name}</h2>
                  <p className="text-gray-600">{selectedRider.email}</p>
                  <p className="text-gray-600">{selectedRider.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedRiderId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Rider Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedRider.total_trips}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${selectedRider.total_spent.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">⭐ {selectedRider.rating.toFixed(1)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Trip History */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Trip History</h3>
                <div className="space-y-3">
                  {selectedRider.trip_history && selectedRider.trip_history.length > 0 ? (
                    selectedRider.trip_history.map((trip: { id: number; pickup_location: string; dropoff_location: string; fare: number; status: string; created_at: string }) => (
                      <Card key={trip.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {trip.pickup_location} → {trip.dropoff_location}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(trip.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">${trip.fare.toFixed(2)}</p>
                              <p className="text-sm text-gray-600">{trip.status}</p>
                              <button
                                onClick={() => {
                                  setRefundTripId(trip.id);
                                  setRefundAmount(trip.fare.toString());
                                  setShowRefundModal(true);
                                }}
                                className="text-[#7ED957] hover:text-[#6BC845] text-sm font-medium mt-1"
                              >
                                Issue Refund
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No trip history</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                {!selectedRider.is_banned && selectedRider.status === 'active' && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      suspendMutation.mutate(selectedRider.id);
                      setSelectedRiderId(null);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Suspend Rider
                  </Button>
                )}
                {!selectedRider.is_banned && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Are you sure you want to ban this rider? This action is serious.')) {
                        banMutation.mutate(selectedRider.id);
                      }
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban Rider
                  </Button>
                )}
                {selectedRider.is_banned && (
                  <Button
                    variant="primary"
                    onClick={() => unbanMutation.mutate(selectedRider.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unban Rider
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Issue Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Enter refund reason..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundTripId(null);
                    setRefundAmount('');
                    setRefundReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => refundMutation.mutate()}
                  disabled={!refundAmount || !refundReason}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Issue Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
