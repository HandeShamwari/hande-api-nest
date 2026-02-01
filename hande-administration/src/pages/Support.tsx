import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Tag,
  Send,
} from 'lucide-react';

interface Ticket {
  id: number;
  ticket_number: string;
  user_name: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

interface TicketDetails {
  id: number;
  ticket_number: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: {
    id: number;
    name: string;
  };
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: number;
    user_id: number;
    user_name: string;
    message: string;
    is_internal: boolean;
    attachments?: string[];
    created_at: string;
  }>;
}

interface TicketStats {
  open: number;
  in_progress: number;
  waiting_customer: number;
  closed: number;
  high_priority: number;
  urgent: number;
}

export default function Support() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  
  // New ticket form
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('general');
  const [newTicketPriority, setNewTicketPriority] = useState('medium');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketUserId, setNewTicketUserId] = useState('');
  
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['support-tickets', filterCategory, filterPriority, filterStatus, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/support/tickets', {
        params: {
          category: filterCategory !== 'all' ? filterCategory : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
  });

  const { data: stats } = useQuery<TicketStats>({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/support/tickets/stats');
      return response.data;
    },
  });

  const { data: selectedTicket } = useQuery<TicketDetails>({
    queryKey: ['support-ticket', selectedTicketId],
    enabled: !!selectedTicketId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/support/tickets/${selectedTicketId}`);
      return response.data;
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/support/tickets', {
        user_id: parseInt(newTicketUserId),
        subject: newTicketSubject,
        category: newTicketCategory,
        priority: newTicketPriority,
        description: newTicketDescription,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      setShowNewTicket(false);
      setNewTicketSubject('');
      setNewTicketCategory('general');
      setNewTicketPriority('medium');
      setNewTicketDescription('');
      setNewTicketUserId('');
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/admin/support/tickets/${selectedTicketId}/messages`, {
        message: newMessage,
        is_internal: isInternalNote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedTicketId] });
      setNewMessage('');
      setIsInternalNote(false);
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      await apiClient.put(`/admin/support/tickets/${ticketId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    },
  });

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Low' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Medium' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' },
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: { bg: 'bg-green-100', text: 'text-green-800', label: 'Open' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
      waiting_customer: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Waiting Customer' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
    };
    return badges[status as keyof typeof badges] || badges.open;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      technical: 'Technical',
      billing: 'Billing',
      general: 'General',
      complaint: 'Complaint',
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="mt-1 text-sm text-gray-600">Manage customer support requests</p>
          </div>
          <Button variant="primary" onClick={() => setShowNewTicket(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.open || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.in_progress || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.waiting_customer || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.closed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.high_priority || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.urgent || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="general">General</option>
              <option value="complaint">Complaint</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Support Tickets</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : tickets && tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
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
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => {
                    const priorityBadge = getPriorityBadge(ticket.priority);
                    const statusBadge = getStatusBadge(ticket.status);
                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">#{ticket.ticket_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.user_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.subject}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityBadge.bg} ${priorityBadge.text}`}
                          >
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.assigned_to_name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="text-[#7ED957] hover:text-[#6BC845] mr-3"
                          >
                            <MessageSquare className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No tickets found</div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {selectedTicketId && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">#{selectedTicket.ticket_number}</h2>
                    {(() => {
                      const statusBadge = getStatusBadge(selectedTicket.status);
                      const priorityBadge = getPriorityBadge(selectedTicket.priority);
                      return (
                        <>
                          <span
                            className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </span>
                          <span
                            className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${priorityBadge.bg} ${priorityBadge.text}`}
                          >
                            {priorityBadge.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedTicket.user.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {getCategoryLabel(selectedTicket.category)}
                    </span>
                    <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((message) => (
                    <Card key={message.id} className={message.is_internal ? 'bg-yellow-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{message.user_name}</span>
                            {message.is_internal && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{message.message}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#7ED957] hover:text-[#6BC845]"
                              >
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No messages yet</p>
                )}
              </div>

              {/* Add Message */}
              {selectedTicket.status !== 'closed' && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent mb-3"
                      placeholder="Type your message..."
                    />
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                        />
                        Internal note (only visible to admins)
                      </label>
                      <Button
                        variant="primary"
                        onClick={() => addMessageMutation.mutate()}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                {selectedTicket.status !== 'closed' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (confirm('Are you sure you want to close this ticket?')) {
                        closeTicketMutation.mutate(selectedTicket.id);
                      }
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Ticket
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  value={newTicketUserId}
                  onChange={(e) => setNewTicketUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Enter user ID..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Enter subject..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  >
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="general">General</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewTicket(false);
                    setNewTicketSubject('');
                    setNewTicketCategory('general');
                    setNewTicketPriority('medium');
                    setNewTicketDescription('');
                    setNewTicketUserId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => createTicketMutation.mutate()}
                  disabled={!newTicketUserId || !newTicketSubject || !newTicketDescription}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
