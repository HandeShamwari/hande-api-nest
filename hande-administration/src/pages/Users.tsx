import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, CheckCircle, XCircle, Clock, Eye, CheckSquare } from 'lucide-react';
import { DriverDetailModal } from '../components/driver/DriverDetailModal';
import { BulkApprovalPanel } from '../components/driver/BulkApprovalPanel';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  license_plate?: string;
  status: string;
  verification_status: string;
  total_trips: number;
  rating: number;
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [showBulkApproval, setShowBulkApproval] = useState(false);
  const queryClient = useQueryClient();

  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ['drivers', filterStatus],
    queryFn: async () => {
      const response = await apiClient.get('/admin/drivers', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined },
      });
      return response.data.data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (driverId: number) => {
      await apiClient.put(`/admin/drivers/${driverId}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (driverId: number) => {
      await apiClient.put(`/admin/drivers/${driverId}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (driverId: number) => {
      await apiClient.put(`/admin/drivers/${driverId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const filteredDrivers = drivers?.filter(
    (driver) =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  const getVerificationBadge = (status: string) => {
    const badges = {
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: XCircle },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-gray-600">Manage drivers and subscriptions</p>
        </div>
        <Button
          onClick={() => setShowBulkApproval(true)}
          variant="primary"
        >
          <CheckSquare size={20} />
          Bulk Approve Documents
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-[#7ED957] focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-[#7ED957] focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Driver</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Contact</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Trips</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Rating</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">Verification</th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  const statusBadge = getStatusBadge(driver.status);
                  const verificationBadge = getVerificationBadge(driver.verification_status);
                  const VerificationIcon = verificationBadge.icon;
                  
                  return (
                    <tr key={driver.id} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                        <p className="text-xs text-gray-500">ID: {driver.id}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-600">{driver.email}</p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-600">{driver.license_plate || 'N/A'}</td>
                      <td className="py-4 text-sm font-medium text-gray-900">{driver.total_trips || 0}</td>
                      <td className="py-4 text-sm text-gray-600">⭐ {driver.rating?.toFixed(2) || '5.00'}</td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${verificationBadge.bg} ${verificationBadge.text}`}>
                          {VerificationIcon && <VerificationIcon className="h-3 w-3" />}
                          {verificationBadge.label}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedDriverId(driver.id)}
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            {driver.verification_status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => verifyMutation.mutate(driver.id)}
                                disabled={verifyMutation.isPending}
                                title="Quick Verify"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            {driver.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => suspendMutation.mutate(driver.id)}
                                disabled={suspendMutation.isPending}
                                title="Suspend Driver"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            {driver.status === 'suspended' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => activateMutation.mutate(driver.id)}
                                disabled={activateMutation.isPending}
                                title="Activate Driver"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDrivers.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No drivers found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Driver Detail Modal */}
      {selectedDriverId && (
        <DriverDetailModal
          driverId={selectedDriverId}
          onClose={() => setSelectedDriverId(null)}
        />
      )}
      
      {/* Bulk Approval Panel */}
      {showBulkApproval && (
        <BulkApprovalPanel
          onClose={() => setShowBulkApproval(false)}
        />
      )}
    </div>
  );
}
