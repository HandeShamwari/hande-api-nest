import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, Activity, User, Download, Calendar, Filter } from 'lucide-react';

interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  action: string;
  metadata: any;
  ip_address: string;
  created_at: string;
}

interface ActivityStats {
  total_actions: number;
  actions_by_type: Array<{ action: string; count: number }>;
  active_admins: Array<{ admin_id: number; admin_name: string; action_count: number }>;
  actions_over_time: Array<{ hour: string; count: number }>;
  time_range_hours: number;
}

interface SystemLog {
  type: string;
  entity_id: number;
  description: string;
  primary_user: string;
  secondary_user: string | null;
  status: string;
  timestamp: string;
}

interface ActivityFeed {
  activity_type: string;
  title: string;
  description: string;
  timestamp: string;
}

export default function SystemLogs() {
  const [activeTab, setActiveTab] = useState<'audit' | 'system' | 'activity'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(24);
  const [page, setPage] = useState(1);
  const perPage = 50;

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLoading } = useQuery<{
    data: AuditLog[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  }>({
    queryKey: ['audit-logs', searchTerm, page],
    queryFn: async () => {
      const response = await apiClient.get('/admin/logs/audit', {
        params: {
          search: searchTerm || undefined,
          page,
          per_page: perPage,
        },
      });
      return response.data;
    },
    enabled: activeTab === 'audit',
  });

  // Fetch activity stats
  const { data: stats } = useQuery<ActivityStats>({
    queryKey: ['activity-stats', timeRange],
    queryFn: async () => {
      const response = await apiClient.get('/admin/logs/stats', {
        params: { hours: timeRange },
      });
      return response.data.data;
    },
  });

  // Fetch system logs
  const { data: systemLogs, isLoading: systemLoading } = useQuery<{
    data: SystemLog[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  }>({
    queryKey: ['system-logs', filterType, page],
    queryFn: async () => {
      const response = await apiClient.get('/admin/logs/system', {
        params: {
          type: filterType !== 'all' ? filterType : undefined,
          page,
          per_page: perPage,
        },
      });
      return response.data;
    },
    enabled: activeTab === 'system',
  });

  // Fetch activity feed
  const { data: activityFeed } = useQuery<ActivityFeed[]>({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/logs/activity-feed', {
        params: { minutes: 15 },
      });
      return response.data.data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: activeTab === 'activity',
  });

  const handleExport = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    try {
      const response = await apiClient.get('/admin/logs/export', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });

      // Convert to CSV
      const data = response.data.data;
      if (data && data.length > 0) {
        const csv = [
          ['ID', 'Admin', 'Email', 'Action', 'IP Address', 'Date'],
          ...data.map((log: AuditLog) => [
            log.id,
            log.admin_name,
            log.admin_email,
            log.action,
            log.ip_address,
            new Date(log.created_at).toLocaleString(),
          ]),
        ]
          .map((row) => row.map((cell: any) => `"${cell}"`).join(','))
          .join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return '🚗';
      case 'admin_action':
        return '⚙️';
      case 'emergency':
        return '🚨';
      case 'user':
        return '👤';
      default:
        return '📌';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="mt-1 text-sm text-gray-600">Monitor admin actions and system activity</p>
        </div>
        <Button variant="primary" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_actions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Last {timeRange}h</p>
              </div>
              <Activity className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_admins?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Taking actions</p>
              </div>
              <User className="h-8 w-8 text-[#4DA6FF]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Top Action</p>
              {stats?.actions_by_type && stats.actions_by_type.length > 0 ? (
                <>
                  <p className="text-sm font-bold text-gray-900 truncate">{stats.actions_by_type[0].action}</p>
                  <p className="text-xs text-gray-500">{stats.actions_by_type[0].count} times</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Time Range</p>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              >
                <option value={1}>Last Hour</option>
                <option value={6}>Last 6 Hours</option>
                <option value={24}>Last 24 Hours</option>
                <option value={168}>Last Week</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              onClick={() => {
                setActiveTab('audit');
                setPage(1);
              }}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'border-b-2 border-[#7ED957] text-[#7ED957]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Audit Logs
            </button>
            <button
              onClick={() => {
                setActiveTab('system');
                setPage(1);
              }}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'system'
                  ? 'border-b-2 border-[#7ED957] text-[#7ED957]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Filter className="h-4 w-4 inline mr-2" />
              System Logs
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'border-b-2 border-[#7ED957] text-[#7ED957]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Live Activity Feed
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by action, admin name, or IP..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Admin Audit Trail</h2>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
                </div>
              ) : auditLogs && auditLogs.data.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Admin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            IP Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date/Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.data.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900">{log.admin_name}</div>
                                <div className="text-sm text-gray-500">{log.admin_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{log.action}</div>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {JSON.stringify(log.metadata).slice(0, 100)}...
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                              {log.ip_address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {auditLogs.pagination.last_page > 1 && (
                    <div className="flex justify-between items-center mt-4 px-6">
                      <div className="text-sm text-gray-600">
                        Showing page {auditLogs.pagination.current_page} of {auditLogs.pagination.last_page}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setPage(page + 1)}
                          disabled={page === auditLogs.pagination.last_page}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No audit logs found</div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* System Logs Tab */}
      {activeTab === 'system' && (
        <>
          {/* Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="trips">Trips</option>
                  <option value="users">Users</option>
                  <option value="payments">Payments</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* System Logs Table */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">System Activity</h2>
            </CardHeader>
            <CardContent>
              {systemLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
                </div>
              ) : systemLogs && systemLogs.data.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {systemLogs.data.map((log, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs px-2 py-1 bg-[#7ED957] bg-opacity-20 text-[#7ED957] rounded-full font-medium uppercase">
                                {log.type}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">
                                {log.status}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">{log.description}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.primary_user}
                              {log.secondary_user && ` → ${log.secondary_user}`}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {systemLogs.pagination.last_page > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600">
                        Showing page {systemLogs.pagination.current_page} of {systemLogs.pagination.last_page}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setPage(page + 1)}
                          disabled={page === systemLogs.pagination.last_page}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No system logs found</div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Activity Feed Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Real-Time Activity Feed</h2>
              <span className="text-xs text-gray-500">Auto-refreshing every 10 seconds</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activityFeed && activityFeed.length > 0 ? (
                activityFeed.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
