import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, FileText, X } from 'lucide-react';
import apiClient from '../../lib/api';
import Button from '../ui/Button';

interface PendingDocument {
  id: number;
  driver_id: number;
  driver_name: string;
  driver_email: string;
  document_type: string;
  document_number: string | null;
  file_path: string;
  expiry_date: string | null;
  uploaded_at: string;
}

interface BulkApprovalPanelProps {
  onClose: () => void;
}

export function BulkApprovalPanel({ onClose }: BulkApprovalPanelProps) {
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());

  const { data: pendingDocs, isLoading } = useQuery({
    queryKey: ['pending-documents-bulk'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: PendingDocument[] }>(
        '/admin/drivers/documents/pending'
      );
      return response.data.data;
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (documentIds: number[]) => {
      await apiClient.post('/admin/drivers/documents/bulk-approve', {
        document_ids: documentIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-documents-bulk'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setSelectedDocs(new Set());
    },
  });

  const handleSelectAll = () => {
    if (pendingDocs) {
      if (selectedDocs.size === pendingDocs.length) {
        setSelectedDocs(new Set());
      } else {
        setSelectedDocs(new Set(pendingDocs.map(doc => doc.id)));
      }
    }
  };

  const handleToggleDoc = (docId: number) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedDocs.size === 0) {
      alert('Please select at least one document');
      return;
    }
    if (confirm(`Approve ${selectedDocs.size} document(s)?`)) {
      bulkApproveMutation.mutate(Array.from(selectedDocs));
    }
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
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Document Approval</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pendingDocs && selectedDocs.size === pendingDocs.length && pendingDocs.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-[#7ED957] border-gray-300 rounded focus:ring-[#7ED957]"
                />
                <span className="text-sm font-medium">Select All ({pendingDocs?.length || 0})</span>
              </label>
              <span className="text-sm text-gray-600">
                {selectedDocs.size} selected
              </span>
            </div>
            
            {selectedDocs.size > 0 && (
              <Button
                onClick={handleBulkApprove}
                variant="primary"
                disabled={bulkApproveMutation.isPending}
              >
                <CheckCircle size={16} />
                Approve {selectedDocs.size} Document{selectedDocs.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>

        {/* Document Grid */}
        <div className="p-6">
          {!pendingDocs || pendingDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No pending documents to approve</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDocs.has(doc.id)
                      ? 'border-[#7ED957] bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleToggleDoc(doc.id)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={() => handleToggleDoc(doc.id)}
                      className="mt-1 w-4 h-4 text-[#7ED957] border-gray-300 rounded focus:ring-[#7ED957]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {doc.driver_name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">{doc.driver_email}</p>
                      <p className="text-sm font-medium text-[#7ED957] mt-1">
                        {formatDocumentType(doc.document_type)}
                      </p>
                      {doc.document_number && (
                        <p className="text-xs text-gray-500">#{doc.document_number}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Document Preview */}
                  <div className="relative">
                    <img
                      src={doc.file_path}
                      alt={doc.document_type}
                      className="w-full h-40 object-cover rounded border border-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(doc.file_path, '_blank');
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(doc.file_path, '_blank');
                        }}
                        className="bg-white rounded px-2 py-1 text-xs font-medium shadow hover:bg-gray-50"
                      >
                        View Full
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {pendingDocs && pendingDocs.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Review each document carefully before approving
              </p>
              <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">
                  Cancel
                </Button>
                {selectedDocs.size > 0 && (
                  <Button
                    onClick={handleBulkApprove}
                    variant="primary"
                    disabled={bulkApproveMutation.isPending}
                  >
                    <CheckCircle size={16} />
                    Approve {selectedDocs.size} Document{selectedDocs.size !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
