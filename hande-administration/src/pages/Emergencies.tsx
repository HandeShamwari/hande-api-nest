import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, AlertTriangle, Clock, CheckCircle, Bell, User, Phone, MapPin } from 'lucide-react';

interface EmergencyAlert {
  id: number;
  trip_id: number;
  user_id: number;
  user_name: string;
  user_type: string;
  alert_type: string;
  priority: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  assigned_to: string | null;
  resolved_at: string | null;
  response_time: number | null;
  created_at: string;
}

interface EmergencyStats {
  total_alerts: number;
  pending_alerts: number;
  in_progress_alerts: number;
  avg_response_time: number;
}

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
}

export default function Emergencies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [assignResponder, setAssignResponder] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery<EmergencyAlert[]>({
    queryKey: ['emergency-alerts', filterStatus, filterPriority, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/emergencies', {
        params: {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const { data: stats } = useQuery<EmergencyStats>({
    queryKey: ['emergency-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/emergencies/stats');
      return response.data;
    },
    refetchInterval: 10000,
  });

  const { data: selectedAlert } = useQuery<EmergencyAlert>({
    queryKey: ['emergency-alert', selectedAlertId],
    enabled: !!selectedAlertId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/emergencies/${selectedAlertId}`);
      return response.data;
    },
  });

  const { data: emergencyContacts } = useQuery<EmergencyContact[]>({
    queryKey: ['emergency-contacts', selectedAlert?.user_id],
    enabled: !!selectedAlert?.user_id,
    queryFn: async () => {
      const response = await apiClient.get('/admin/emergencies/contacts', {
        params: { user_id: selectedAlert?.user_id },
      });
      return response.data.data || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ alertId, responder }: { alertId: number; responder: string }) => {
      await apiClient.post(`/admin/emergencies/${alertId}/assign`, {
        assigned_to: responder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-alert', selectedAlertId] });
      queryClient.invalidateQueries({ queryKey: ['emergency-stats'] });
      setAssignResponder('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ alertId, status, notes }: { alertId: number; status: string; notes?: string }) => {
      await apiClient.put(`/admin/emergencies/${alertId}/status`, {
        status,
        resolution_notes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-alert', selectedAlertId] });
      queryClient.invalidateQueries({ queryKey: ['emergency-stats'] });
      setResolutionNotes('');
      if (selectedAlert?.status === 'resolved') {
        setSelectedAlertId(null);
      }
    },
  });

  const notifyContactsMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiClient.post(`/admin/emergencies/${alertId}/notify-contacts`);
    },
    onSuccess: () => {
      alert('Emergency contacts have been notified');
    },
  });

  const getPriorityBadge = (priority: string) => {
    const badges = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical', icon: '🚨' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High', icon: '⚠️' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium', icon: '⚡' },
      low: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Low', icon: 'ℹ️' },
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress', icon: AlertTriangle },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved', icon: CheckCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled', icon: CheckCircle },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  // Sound alert for new critical emergencies
  useEffect(() => {
    const criticalPending = alerts?.filter(
      (a) => a.priority === 'critical' && a.status === 'pending'
    );
    if (criticalPending && criticalPending.length > 0) {
      // Visual notification (browser notification would require permission)
      document.title = `🚨 ${criticalPending.length} Critical Alert(s) - Hande Admin`;
    } else {
      document.title = 'Emergency Response - Hande Admin';
    }
  }, [alerts]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Response</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and respond to emergency alerts in real-time</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_alerts || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_alerts || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.in_progress_alerts || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-[#4DA6FF]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.avg_response_time ? `${stats.avg_response_time.toFixed(0)}m` : 'N/A'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {alerts && alerts.filter((a) => a.priority === 'critical' && a.status === 'pending').length > 0 && (
        <Card className="mb-6 border-l-4 border-red-500 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="font-bold text-red-900 text-lg">
                  🚨 {alerts.filter((a) => a.priority === 'critical' && a.status === 'pending').length} CRITICAL EMERGENCY ALERT(S)
                </h3>
                <p className="text-sm text-red-700">Immediate attention required - pending critical emergencies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by user name or alert type..."
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
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Emergency Alerts</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alert Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
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
                  {alerts.map((alert: EmergencyAlert) => {
                    const priorityBadge = getPriorityBadge(alert.priority);
                    const statusBadge = getStatusBadge(alert.status);

                    return (
                      <tr
                        key={alert.id}
                        className={`hover:bg-gray-50 ${
                          alert.priority === 'critical' && alert.status === 'pending' ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{alert.user_name}</div>
                              <div className="text-xs text-gray-500 capitalize">({alert.user_type})</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {alert.alert_type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-500">Trip #{alert.trip_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityBadge.bg} ${priorityBadge.text}`}
                          >
                            {priorityBadge.icon} {priorityBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alert.assigned_to || <span className="text-gray-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(alert.created_at).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="primary"
                            onClick={() => setSelectedAlertId(alert.id)}
                            size="sm"
                          >
                            Respond
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No emergency alerts</div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlertId && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Emergency Alert #{selectedAlert.id}</h2>
                  <p className="text-gray-600">Trip #{selectedAlert.trip_id}</p>
                </div>
                <button
                  onClick={() => setSelectedAlertId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Priority</p>
                    <span
                      className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                        getPriorityBadge(selectedAlert.priority).bg
                      } ${getPriorityBadge(selectedAlert.priority).text}`}
                    >
                      {getPriorityBadge(selectedAlert.priority).icon}{' '}
                      {getPriorityBadge(selectedAlert.priority).label}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Status</p>
                    <span
                      className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                        getStatusBadge(selectedAlert.status).bg
                      } ${getStatusBadge(selectedAlert.status).text}`}
                    >
                      {getStatusBadge(selectedAlert.status).label}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* User Information */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedAlert.user_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedAlert.user_type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alert Details */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Alert Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Alert Type</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {selectedAlert.alert_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-900">{selectedAlert.description || 'No description provided'}</p>
                    </div>
                    {selectedAlert.latitude && selectedAlert.longitude && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Location
                        </p>
                        <p className="text-sm font-mono text-gray-900">
                          {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7ED957] hover:text-[#6BC845] text-sm font-medium"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Time Reported</p>
                      <p className="text-gray-900">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                    </div>
                    {selectedAlert.assigned_to && (
                      <div>
                        <p className="text-sm text-gray-600">Assigned To</p>
                        <p className="text-gray-900">{selectedAlert.assigned_to}</p>
                      </div>
                    )}
                    {selectedAlert.resolved_at && (
                      <div>
                        <p className="text-sm text-gray-600">Resolved At</p>
                        <p className="text-gray-900">{new Date(selectedAlert.resolved_at).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedAlert.response_time && (
                      <div>
                        <p className="text-sm text-gray-600">Response Time</p>
                        <p className="text-gray-900 font-semibold">{selectedAlert.response_time} minutes</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              {emergencyContacts && emergencyContacts.length > 0 && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <Phone className="h-5 w-5 mr-2" />
                        Emergency Contacts
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => notifyContactsMutation.mutate(selectedAlert.id)}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notify All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {emergencyContacts.map((contact) => (
                        <div key={contact.id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-600">{contact.relationship}</p>
                          </div>
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-[#7ED957] hover:text-[#6BC845] font-medium"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {selectedAlert.status !== 'resolved' && selectedAlert.status !== 'cancelled' && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Response Actions</h3>
                    
                    {!selectedAlert.assigned_to && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Responder
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={assignResponder}
                            onChange={(e) => setAssignResponder(e.target.value)}
                            placeholder="Enter responder name..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                          />
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (assignResponder) {
                                assignMutation.mutate({
                                  alertId: selectedAlert.id,
                                  responder: assignResponder,
                                });
                              }
                            }}
                            disabled={!assignResponder}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedAlert.status === 'pending' && selectedAlert.assigned_to && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          updateStatusMutation.mutate({
                            alertId: selectedAlert.id,
                            status: 'in_progress',
                          });
                        }}
                        className="w-full mb-3"
                      >
                        Mark as In Progress
                      </Button>
                    )}

                    {selectedAlert.status === 'in_progress' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Resolution Notes
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent mb-3"
                          placeholder="Enter resolution notes..."
                        />
                        <Button
                          variant="primary"
                          onClick={() => {
                            updateStatusMutation.mutate({
                              alertId: selectedAlert.id,
                              status: 'resolved',
                              notes: resolutionNotes,
                            });
                          }}
                          disabled={!resolutionNotes}
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setSelectedAlertId(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
