import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, Car, CheckCircle, XCircle, Clock, AlertTriangle, Eye, FileText } from 'lucide-react';

interface Vehicle {
  id: number;
  driver_name: string;
  driver_id: number;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  registration_status: string;
  last_inspection_date: string | null;
  last_inspection_status: string | null;
  insurance_expiry: string | null;
  registration_expiry: string | null;
  created_at: string;
}

interface VehicleDetails extends Vehicle {
  vin: string;
  seat_capacity: number;
  inspections: Array<{
    id: number;
    inspection_date: string;
    inspection_type: string;
    inspector_name: string;
    status: string;
    notes: string;
    next_inspection_date: string;
  }>;
  documents: Array<{
    id: number;
    document_type: string;
    document_url: string;
    expiry_date: string | null;
    verified_at: string | null;
    uploaded_at: string;
  }>;
}

interface VehicleStats {
  total_vehicles: number;
  pending_approval: number;
  active_vehicles: number;
  expiring_soon: number;
}

interface InspectionFormData {
  inspection_type: string;
  inspector_name: string;
  status: string;
  notes: string;
  next_inspection_date: string;
}

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectingVehicleId, setInspectingVehicleId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const [inspectionForm, setInspectionForm] = useState<InspectionFormData>({
    inspection_type: 'safety',
    inspector_name: '',
    status: 'passed',
    notes: '',
    next_inspection_date: '',
  });

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', filterStatus, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/vehicles', {
        params: {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
  });

  const { data: stats } = useQuery<VehicleStats>({
    queryKey: ['vehicle-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/vehicles/stats');
      return response.data;
    },
  });

  const { data: expiringVehicles } = useQuery<Vehicle[]>({
    queryKey: ['expiring-vehicles'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/vehicles/expiring', {
        params: { days: 30 },
      });
      return response.data.data || [];
    },
  });

  const { data: selectedVehicle } = useQuery<VehicleDetails>({
    queryKey: ['vehicle', selectedVehicleId],
    enabled: !!selectedVehicleId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/vehicles/${selectedVehicleId}`);
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      await apiClient.put(`/admin/vehicles/${vehicleId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-stats'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', selectedVehicleId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: number; reason: string }) => {
      await apiClient.put(`/admin/vehicles/${vehicleId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-stats'] });
      setSelectedVehicleId(null);
    },
  });

  const addInspectionMutation = useMutation({
    mutationFn: async ({ vehicleId, data }: { vehicleId: number; data: InspectionFormData }) => {
      await apiClient.post(`/admin/vehicles/${vehicleId}/inspection`, {
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_type: data.inspection_type,
        inspector_name: data.inspector_name,
        status: data.status,
        notes: data.notes,
        next_inspection_date: data.next_inspection_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', inspectingVehicleId] });
      queryClient.invalidateQueries({ queryKey: ['expiring-vehicles'] });
      setShowInspectionModal(false);
      setInspectingVehicleId(null);
      resetInspectionForm();
    },
  });

  const resetInspectionForm = () => {
    setInspectionForm({
      inspection_type: 'safety',
      inspector_name: '',
      status: 'passed',
      notes: '',
      next_inspection_date: '',
    });
  };

  const openInspectionModal = (vehicleId: number) => {
    setInspectingVehicleId(vehicleId);
    setShowInspectionModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: XCircle },
      suspended: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Suspended', icon: AlertTriangle },
    };
    return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: Car };
  };

  const getInspectionStatusBadge = (status: string) => {
    const badges = {
      passed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Passed' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      conditional: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Conditional' },
    };
    return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
        <p className="mt-1 text-sm text-gray-600">Manage vehicle registrations, inspections, and compliance</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_vehicles || 0}</p>
              </div>
              <Car className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_approval || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_vehicles || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.expiring_soon || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {expiringVehicles && expiringVehicles.length > 0 && (
        <Card className="mb-6 border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {expiringVehicles.length} Vehicle(s) with Expiring Documents
                </h3>
                <div className="space-y-1">
                  {expiringVehicles.slice(0, 3).map((vehicle) => (
                    <p key={vehicle.id} className="text-sm text-gray-700">
                      <span className="font-medium">{vehicle.license_plate}</span> - {vehicle.make} {vehicle.model}
                      {vehicle.insurance_expiry && isExpiringSoon(vehicle.insurance_expiry) && ' (Insurance)'}
                      {vehicle.registration_expiry && isExpiringSoon(vehicle.registration_expiry) && ' (Registration)'}
                    </p>
                  ))}
                  {expiringVehicles.length > 3 && (
                    <p className="text-sm text-gray-600 italic">...and {expiringVehicles.length - 3} more</p>
                  )}
                </div>
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
                placeholder="Search by license plate, make, model, or driver..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Vehicles List</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Inspection
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Status
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
                  {vehicles.map((vehicle: Vehicle) => {
                    const statusBadge = getStatusBadge(vehicle.registration_status);
                    const hasExpiringDocs = 
                      isExpiringSoon(vehicle.insurance_expiry) || isExpiringSoon(vehicle.registration_expiry);
                    
                    return (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Car className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {vehicle.make} {vehicle.model}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehicle.year} • {vehicle.color}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.driver_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-bold text-gray-900">
                            {vehicle.license_plate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vehicle.last_inspection_date ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(vehicle.last_inspection_date).toLocaleDateString()}
                              </div>
                              {vehicle.last_inspection_status && (
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    getInspectionStatusBadge(vehicle.last_inspection_status).bg
                                  } ${getInspectionStatusBadge(vehicle.last_inspection_status).text}`}
                                >
                                  {getInspectionStatusBadge(vehicle.last_inspection_status).label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No inspection</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasExpiringDocs ? (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-xs font-medium">Expiring</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">OK</span>
                          )}
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
                            onClick={() => setSelectedVehicleId(vehicle.id)}
                            className="text-[#7ED957] hover:text-[#6BC845]"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {vehicle.registration_status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveMutation.mutate(vehicle.id)}
                                className="text-[#7ED957] hover:text-[#6BC845] font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Enter rejection reason:');
                                  if (reason) {
                                    rejectMutation.mutate({ vehicleId: vehicle.id, reason });
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openInspectionModal(vehicle.id)}
                            className="text-[#4DA6FF] hover:text-blue-700 font-medium"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No vehicles found</div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Detail Modal */}
      {selectedVehicleId && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                  </h2>
                  <p className="text-gray-600">License: {selectedVehicle.license_plate}</p>
                  <p className="text-gray-600">Driver: {selectedVehicle.driver_name}</p>
                </div>
                <button
                  onClick={() => setSelectedVehicleId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">VIN</p>
                    <p className="font-mono font-bold text-gray-900">{selectedVehicle.vin}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Type / Capacity</p>
                    <p className="font-bold text-gray-900">
                      {selectedVehicle.vehicle_type} ({selectedVehicle.seat_capacity} seats)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-bold text-gray-900">{selectedVehicle.color}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Registration Status</p>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatusBadge(selectedVehicle.registration_status).bg
                      } ${getStatusBadge(selectedVehicle.registration_status).text}`}
                    >
                      {getStatusBadge(selectedVehicle.registration_status).label}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                {selectedVehicle.documents && selectedVehicle.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedVehicle.documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900 capitalize">
                                  {doc.document_type.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                                {doc.expiry_date && (
                                  <p className={`text-sm ${isExpiringSoon(doc.expiry_date) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                    Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                    {isExpiringSoon(doc.expiry_date) && ' ⚠️'}
                                  </p>
                                )}
                                {doc.verified_at && (
                                  <p className="text-sm text-green-600">
                                    ✓ Verified: {new Date(doc.verified_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={doc.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7ED957] hover:text-[#6BC845] font-medium text-sm"
                            >
                              View
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                )}
              </div>

              {/* Inspection History */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Inspection History</h3>
                {selectedVehicle.inspections && selectedVehicle.inspections.length > 0 ? (
                  <div className="space-y-3">
                    {selectedVehicle.inspections.map((inspection) => {
                      const statusBadge = getInspectionStatusBadge(inspection.status);
                      return (
                        <Card key={inspection.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-gray-900 capitalize">
                                  {inspection.inspection_type} Inspection
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(inspection.inspection_date).toLocaleDateString()} by {inspection.inspector_name}
                                </p>
                              </div>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                              >
                                {statusBadge.label}
                              </span>
                            </div>
                            {inspection.notes && (
                              <p className="text-sm text-gray-700 mt-2">{inspection.notes}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-2">
                              Next inspection: {new Date(inspection.next_inspection_date).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No inspection history</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                {selectedVehicle.registration_status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        approveMutation.mutate(selectedVehicle.id);
                        setSelectedVehicleId(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Vehicle
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          rejectMutation.mutate({ vehicleId: selectedVehicle.id, reason });
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Vehicle
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => openInspectionModal(selectedVehicle.id)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Add Inspection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Vehicle Inspection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                <select
                  value={inspectionForm.inspection_type}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, inspection_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                >
                  <option value="safety">Safety</option>
                  <option value="emissions">Emissions</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name</label>
                <input
                  type="text"
                  value={inspectionForm.inspector_name}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, inspector_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={inspectionForm.status}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                >
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="conditional">Conditional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Inspection Date</label>
                <input
                  type="date"
                  value={inspectionForm.next_inspection_date}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, next_inspection_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholder="Inspection notes..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowInspectionModal(false);
                    setInspectingVehicleId(null);
                    resetInspectionForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (inspectingVehicleId) {
                      addInspectionMutation.mutate({
                        vehicleId: inspectingVehicleId,
                        data: inspectionForm,
                      });
                    }
                  }}
                  disabled={
                    !inspectionForm.inspector_name || !inspectionForm.next_inspection_date
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Inspection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
