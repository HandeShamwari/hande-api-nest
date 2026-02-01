import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { TrendingUp, Users, Eye, AlertTriangle } from 'lucide-react';

interface WeeklyTrend {
  week_start: string;
  week_end: string;
  total_trips: number;
  completed_trips: number;
  revenue: number;
  wow_trip_change?: number;
  wow_revenue_change?: number;
}

interface CancellationData {
  summary: {
    total_trips: number;
    total_cancelled: number;
    cancellation_rate: number;
    rider_cancelled: number;
    driver_cancelled: number;
    system_cancelled: number;
  };
  by_reason: Record<string, number>;
}

export default function Analytics() {
  const { data: trends, isLoading: trendsLoading } = useQuery<WeeklyTrend[]>({
    queryKey: ['analytics', 'trends'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/analytics/trends?weeks=4');
      return response.data.data;
    },
  });

  const { data: cancellations, isLoading: cancellationsLoading } = useQuery<CancellationData>({
    queryKey: ['analytics', 'cancellations'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/analytics/cancellations?days=30');
      return response.data.data;
    },
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/analytics/drivers/leaderboard?days=30&limit=10');
      return response.data.data;
    },
  });

  if (trendsLoading || cancellationsLoading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  const latestWeek = trends?.[trends.length - 1];
  const previousWeek = trends?.[trends.length - 2];

  const metrics = [
    { 
      label: 'Weekly Trips', 
      value: latestWeek?.total_trips || 0, 
      change: latestWeek?.wow_trip_change ? `${latestWeek.wow_trip_change > 0 ? '+' : ''}${latestWeek.wow_trip_change}%` : 'N/A', 
      icon: Eye 
    },
    { 
      label: 'Completed This Week', 
      value: latestWeek?.completed_trips || 0, 
      change: `${previousWeek ? Math.round((latestWeek?.completed_trips || 0) / previousWeek.completed_trips * 100) : 100}%`, 
      icon: Users 
    },
    { 
      label: 'Weekly Revenue', 
      value: `$${(latestWeek?.revenue || 0).toLocaleString()}`, 
      change: latestWeek?.wow_revenue_change ? `${latestWeek.wow_revenue_change > 0 ? '+' : ''}${latestWeek.wow_revenue_change}%` : 'N/A', 
      icon: TrendingUp 
    },
    { 
      label: 'Cancellation Rate', 
      value: `${cancellations?.summary.cancellation_rate.toFixed(1) || 0}%`, 
      change: `${cancellations?.summary.total_cancelled || 0} cancelled`, 
      icon: AlertTriangle 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">Track your platform performance</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="mt-1 text-sm text-gray-500">{metric.change}</p>
                  </div>
                  <div className="rounded-full bg-[#7ED957] bg-opacity-20 p-3">
                    <Icon className="h-5 w-5 text-[#7ED957]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Trends (Last 4 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Week</th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">Total Trips</th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">Completed</th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">Revenue</th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">Change</th>
                </tr>
              </thead>
              <tbody>
                {trends?.map((week) => (
                  <tr key={week.week_start} className="border-b last:border-0">
                    <td className="py-4 text-sm text-gray-900">{week.week_start}</td>
                    <td className="py-4 text-right text-sm font-medium">{week.total_trips}</td>
                    <td className="py-4 text-right text-sm text-green-600">{week.completed_trips}</td>
                    <td className="py-4 text-right text-sm font-medium">${week.revenue.toLocaleString()}</td>
                    <td className={`py-4 text-right text-sm font-medium ${week.wow_trip_change && week.wow_trip_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {week.wow_trip_change ? `${week.wow_trip_change > 0 ? '+' : ''}${week.wow_trip_change}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cancellation Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Analysis (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rider Cancelled</span>
                <span className="text-sm font-medium">{cancellations?.summary.rider_cancelled || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Driver Cancelled</span>
                <span className="text-sm font-medium">{cancellations?.summary.driver_cancelled || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Cancelled</span>
                <span className="text-sm font-medium">{cancellations?.summary.system_cancelled || 0}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-semibold text-gray-900">Total Cancellation Rate</span>
                <span className={`text-sm font-bold ${(cancellations?.summary.cancellation_rate || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {cancellations?.summary.cancellation_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Drivers (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard?.slice(0, 5).map((driver: any) => (
                <div key={driver.driver_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7ED957] bg-opacity-20 text-sm font-bold text-[#7ED957]">
                      {driver.rank}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.trips} trips • ⭐ {driver.rating}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">${driver.earnings.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
