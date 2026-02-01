import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';

interface Promotion {
  id: number;
  name: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'free_ride';
  discount_value: number;
  max_discount: number | null;
  min_trip_amount: number | null;
  usage_limit: number | null;
  per_user_limit: number;
  current_usage: number;
  start_date: string;
  end_date: string;
  target_user_type: 'rider' | 'driver' | 'all';
  is_active: boolean;
  usage_count: number;
  total_discount_given: number;
  created_at: string;
}

interface PromoStats {
  active_promos: number;
  total_promos: number;
  total_usage: number;
  total_discount_given: number;
}

export default function Promotions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch promotions
  const { data: promotionsData } = useQuery({
    queryKey: ['promotions', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/admin/promotions?${params}`);
      return response.json();
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['promotion-stats'],
    queryFn: async () => {
      const response = await fetch('/admin/promotions/stats');
      return response.json();
    },
  });

  const stats: PromoStats = statsData?.data || {
    active_promos: 0,
    total_promos: 0,
    total_usage: 0,
    total_discount_given: 0,
  };

  const promotions: Promotion[] = promotionsData?.data?.data || [];

  // Toggle promotion status
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/promotions/${id}/toggle`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
    },
  });

  // Delete promotion
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/promotions/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
    },
  });

  const getStatusBadge = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);

    if (!promo.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Inactive</span>;
    }
    if (now < start) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Scheduled</span>;
    }
    if (now > end) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
  };

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% off`;
    } else if (promo.discount_type === 'fixed') {
      return `$${promo.discount_value} off`;
    } else {
      return 'Free Ride';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Manage promo codes and discount campaigns</p>
        </div>
        <Button
          onClick={() => {
            setSelectedPromo(null);
            setShowModal(true);
          }}
          className="bg-[#7ED957] hover:bg-[#6BC847] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Promos</p>
              <p className="text-2xl font-bold text-[#7ED957]">{stats.active_promos}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#7ED957]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Promos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_promos}</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-[#4DA6FF]">{stats.total_usage}</p>
            </div>
            <Users className="w-8 h-8 text-[#4DA6FF]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discounts Given</p>
              <p className="text-2xl font-bold text-[#FFB800]">${stats.total_discount_given.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-[#FFB800]" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </Card>

      {/* Promotions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name & Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
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
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-[#7ED957]">{promo.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{promo.name}</div>
                    <div className="text-sm text-[#FFB800] font-semibold">{getDiscountDisplay(promo)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{promo.usage_count} / {promo.usage_limit || '∞'}</div>
                    <div className="text-xs text-gray-500">${promo.total_discount_given?.toFixed(2) || '0.00'} saved</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {new Date(promo.start_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">to {new Date(promo.end_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {promo.target_user_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(promo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMutation.mutate(promo.id)}
                        className="text-gray-600 hover:text-[#7ED957]"
                        title={promo.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {promo.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPromo(promo);
                          setShowModal(true);
                        }}
                        className="text-gray-600 hover:text-[#4DA6FF]"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this promotion?')) {
                            deleteMutation.mutate(promo.id);
                          }
                        }}
                        className="text-gray-600 hover:text-[#FF4C4C]"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {promotions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No promotions found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal placeholder - implement form in future */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedPromo ? 'Edit Promotion' : 'Create Promotion'}
              </h2>
              <p className="text-gray-600 mb-4">Promotion form will be implemented here</p>
              <Button onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
