import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Search, Send, Edit2, Trash2, Bell, Users, CheckCircle } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'push' | 'sms' | 'email' | 'in_app';
  target_type: 'all' | 'riders' | 'drivers' | 'specific_users' | 'zone';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
}

interface NotificationStats {
  total_sent: number;
  scheduled: number;
  drafts: number;
  delivered: number;
  read: number;
  delivery_rate: number;
  read_rate: number;
}

export default function Notifications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/admin/notifications?${params}`);
      return response.json();
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await fetch('/admin/notifications/stats');
      return response.json();
    },
  });

  const stats: NotificationStats = statsData?.data || {
    total_sent: 0,
    scheduled: 0,
    drafts: 0,
    delivered: 0,
    read: 0,
    delivery_rate: 0,
    read_rate: 0,
  };

  const notifications: Notification[] = notificationsData?.data?.data || [];

  // Send notification
  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/notifications/${id}/send`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/notifications/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-200 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      push: 'bg-blue-100 text-blue-700',
      sms: 'bg-green-100 text-green-700',
      email: 'bg-purple-100 text-purple-700',
      in_app: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[type as keyof typeof styles] || ''}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Send and manage push notifications</p>
        </div>
        <Button
          onClick={() => {
            setSelectedNotif(null);
            setShowModal(true);
          }}
          className="bg-[#7ED957] hover:bg-[#6BC847] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-[#7ED957]">{stats.total_sent}</p>
            </div>
            <Send className="w-8 h-8 text-[#7ED957]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-[#4DA6FF]">{stats.scheduled}</p>
            </div>
            <Bell className="w-8 h-8 text-[#4DA6FF]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-[#7ED957]">{stats.delivery_rate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#7ED957]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Read Rate</p>
              <p className="text-2xl font-bold text-[#FFB800]">{stats.read_rate}%</p>
            </div>
            <Users className="w-8 h-8 text-[#FFB800]" />
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
                placeholder="Search notifications..."
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
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
          </select>
        </div>
      </Card>

      {/* Notifications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
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
              {notifications.map((notif) => (
                <tr key={notif.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{notif.title}</div>
                    <div className="mt-1">{getTypeBadge(notif.type)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{notif.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {notif.target_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">{notif.recipient_count} total</div>
                      {notif.status === 'sent' && (
                        <>
                          <div className="text-green-600 text-xs">{notif.delivered_count} delivered</div>
                          <div className="text-blue-600 text-xs">{notif.read_count} read</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(notif.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {notif.status === 'draft' || notif.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => sendMutation.mutate(notif.id)}
                            className="text-gray-600 hover:text-[#7ED957]"
                            title="Send Now"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedNotif(notif);
                              setShowModal(true);
                            }}
                            className="text-gray-600 hover:text-[#4DA6FF]"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this notification?')) {
                            deleteMutation.mutate(notif.id);
                          }
                        }}
                        className="text-gray-600 hover:text-[#FF4C4C]"
                        title="Delete"
                        disabled={notif.status === 'sent'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedNotif ? 'Edit Notification' : 'Create Notification'}
              </h2>
              <p className="text-gray-600 mb-4">Notification form will be implemented here</p>
              <Button onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
