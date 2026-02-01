import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, XCircle, FileText, User, Car, Calendar } from 'lucide-react';
import apiClient from '../../lib/api';
import Button from '../ui/Button';

interface Document {
  id: number;
  document_type: string;
  document_number: string | null;
  file_path: string;
  status: string;
  expiry_date: string | null;
  uploaded_at: string;
}

interface Vehicle {
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  license_plate: string | null;
}

interface DriverDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  status: string;
  verification_status: string;
  vehicle: Vehicle | null;
  documents: Document[];
}

interface DriverDetailModalProps {
  driverId: number;
  onClose: () => void;
}

export function DriverDetailModal({ driverId, onClose }: DriverDetailModalProps) {
  const queryClient = useQueryClient();
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch driver details
  const { data, isLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: DriverDetails }>(
        `/admin/drivers/${driverId}`
      );
      return response.data.data;
    },
  });

  // Approve document mutation
  const approveDocMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiClient.put(`/admin/drivers/documents/${documentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  // Reject document mutation
  const rejectDocMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      await apiClient.put(`/admin/drivers/documents/${documentId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setRejectingDocId(null);
      setRejectionReason('');
    },
  });

  // Verify driver mutation
  const verifyDriverMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/admin/drivers/${driverId}/verify`, { status: 'verified' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      onClose();
    },
  });

  const handleApproveDoc = (docId: number) => {
    approveDocMutation.mutate(docId);
  };

  const handleRejectDoc = (docId: number) => {
    if (rejectingDocId === docId) {
      if (!rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }
      rejectDocMutation.mutate({ documentId: docId, reason: rejectionReason });
    } else {
      setRejectingDocId(docId);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      verified: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const allDocsApproved = data.documents.every(doc => doc.status === 'approved');
  const hasPendingDocs = data.documents.some(doc => doc.status === 'pending');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Driver Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Driver Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-6">
              {data.profile_image ? (
                <img
                  src={data.profile_image}
                  alt={data.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={40} className="text-gray-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{data.name}</h3>
                  {getStatusBadge(data.verification_status)}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>📧 {data.email}</p>
                  <p>📱 {data.phone}</p>
                  <p className="capitalize">Status: {data.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          {data.vehicle && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Car size={20} className="text-[#7ED957]" />
                Vehicle Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Make:</span>{' '}
                    <span className="font-medium">{data.vehicle.make || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>{' '}
                    <span className="font-medium">{data.vehicle.model || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Year:</span>{' '}
                    <span className="font-medium">{data.vehicle.year || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>{' '}
                    <span className="font-medium">{data.vehicle.color || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">License Plate:</span>{' '}
                    <span className="font-medium text-lg">{data.vehicle.license_plate || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-[#7ED957]" />
              Documents
            </h3>

            {data.documents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                No documents uploaded yet
              </div>
            ) : (
              <div className="space-y-4">
                {data.documents.map((doc) => (
                  <div key={doc.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {formatDocumentType(doc.document_type)}
                          </h4>
                          {getStatusBadge(doc.status)}
                        </div>
                        {doc.document_number && (
                          <p className="text-sm text-gray-600">Number: {doc.document_number}</p>
                        )}
                        {doc.expiry_date && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Calendar size={14} />
                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Document Image */}
                    <div className="mb-3">
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={doc.file_path}
                          alt={doc.document_type}
                          className="max-w-full h-auto rounded border border-gray-300 hover:border-[#7ED957] transition-colors"
                        />
                      </a>
                    </div>

                    {/* Action Buttons */}
                    {doc.status === 'pending' && (
                      <div className="space-y-2">
                        {rejectingDocId === doc.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Enter rejection reason..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleRejectDoc(doc.id)}
                                variant="danger"
                                size="sm"
                                disabled={rejectDocMutation.isPending}
                              >
                                Confirm Reject
                              </Button>
                              <Button
                                onClick={() => {
                                  setRejectingDocId(null);
                                  setRejectionReason('');
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveDoc(doc.id)}
                              variant="primary"
                              size="sm"
                              disabled={approveDocMutation.isPending}
                            >
                              <CheckCircle size={16} />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleRejectDoc(doc.id)}
                              variant="danger"
                              size="sm"
                            >
                              <XCircle size={16} />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verify Driver Button */}
          {data.verification_status !== 'verified' && allDocsApproved && data.documents.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={() => verifyDriverMutation.mutate()}
                variant="primary"
                className="w-full"
                disabled={verifyDriverMutation.isPending}
              >
                <CheckCircle size={20} />
                Verify Driver & Activate Account
              </Button>
            </div>
          )}

          {hasPendingDocs && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Please review and approve all documents before verifying the driver
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
