import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Users, Car, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { DocumentExpiryAlerts } from '../components/dashboard/DocumentExpiryAlerts';

interface RealtimeMetrics {
  trips: {
    active: number;
    searching: number;
    hourly_requests: number;
    hourly_completed: number;
  };
  drivers: {
    online: number;
    available: number;
    busy: number;
    utilization_percent: number;
  };
  marketplace: {
    liquidity_ratio: number;
    liquidity_status: string;
    hourly_gmv: number;
  };
}

interface DailyKPIs {
  trips: {
    total_requests: number;
    completed: number;
    cancelled: number;
    completion_rate: number;
  };
  revenue: {
    gross_gmv: number;
    platform_revenue: number;
    avg_fare: number;
  };
  quality: {
    avg_rider_rating: number;
    avg_driver_rating: number;
  };
  users: {
    active_riders: number;
    active_drivers: number;
  };
}

export default function Dashboard() {
  const { data: realtimeData, isLoading: realtimeLoading } = useQuery<RealtimeMetrics>({
    queryKey: ['analytics', 'realtime'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/analytics/realtime');
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery<DailyKPIs>({
    queryKey: ['analytics', 'daily'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/analytics/daily');
      return response.data.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (realtimeLoading || dailyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    { 
      name: 'Active Trips', 
      value: realtimeData?.trips.active || 0, 
      icon: Car, 
      change: `${realtimeData?.trips.hourly_requests || 0} requests/hr`, 
      positive: true 
    },
    { 
      name: 'Online Drivers', 
      value: realtimeData?.drivers.online || 0, 
      icon: Users, 
      change: `${realtimeData?.drivers.utilization_percent || 0}% utilization`, 
      positive: true 
    },
    { 
      name: 'Today\'s Revenue', 
      value: `$${dailyData?.revenue.gross_gmv.toLocaleString() || 0}`, 
      icon: DollarSign, 
      change: `${dailyData?.trips.completed || 0} trips`, 
      positive: true 
    },
    { 
      name: 'Completion Rate', 
      value: `${dailyData?.trips.completion_rate || 0}%`, 
      icon: TrendingUp, 
      change: `${dailyData?.trips.cancelled || 0} cancelled`, 
      positive: (dailyData?.trips.completion_rate || 0) > 90 
    },
  ];

  const getLiquidityBadge = (status: string) => {
    const badges = {
      'oversupply': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Oversupply' },
      'balanced': { bg: 'bg-green-100', text: 'text-green-800', label: 'Balanced' },
      'high_demand': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'High Demand' },
      'critical_shortage': { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical Shortage' },
    };
    return badges[status as keyof typeof badges] || badges.balanced;
  };

  const liquidityBadge = getLiquidityBadge(realtimeData?.marketplace.liquidity_status || 'balanced');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Real-time overview of your Hande platform</p>
      </div>

      {/* Document Expiry Alerts */}
      <DocumentExpiryAlerts />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`mt-2 text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className="rounded-full bg-[#7ED957] bg-opacity-20 p-3">
                  <Icon className="h-6 w-6 text-[#7ED957]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Marketplace Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Marketplace Status</CardTitle>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${liquidityBadge.bg} ${liquidityBadge.text}`}>
              <AlertCircle className="h-4 w-4" />
              {liquidityBadge.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600">Searching for Rides</p>
              <p className="mt-1 text-2xl font-bold">{realtimeData?.trips.searching || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Drivers</p>
              <p className="mt-1 text-2xl font-bold">{realtimeData?.drivers.available || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hourly GMV</p>
              <p className="mt-1 text-2xl font-bold">${realtimeData?.marketplace.hourly_gmv.toFixed(2) || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trip Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Requests</span>
                <span className="text-sm font-medium">{dailyData?.trips.total_requests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium text-green-600">{dailyData?.trips.completed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelled</span>
                <span className="text-sm font-medium text-red-600">{dailyData?.trips.cancelled || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className={`text-sm font-medium ${(dailyData?.trips.completion_rate || 0) > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {dailyData?.trips.completion_rate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rider Rating</span>
                <span className="text-sm font-medium">⭐ {dailyData?.quality.avg_rider_rating.toFixed(2) || 5.0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Driver Rating</span>
                <span className="text-sm font-medium">⭐ {dailyData?.quality.avg_driver_rating.toFixed(2) || 5.0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Riders Today</span>
                <span className="text-sm font-medium">{dailyData?.users.active_riders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Drivers Today</span>
                <span className="text-sm font-medium">{dailyData?.users.active_drivers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
