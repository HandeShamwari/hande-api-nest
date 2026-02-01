import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar } from 'lucide-react';
import apiClient from '../../lib/api';
import { Card } from '../ui/Card';

interface ExpiringDocument {
  id: number;
  driver_id: number;
  driver_name: string;
  driver_email: string;
  document_type: string;
  document_number: string | null;
  expiry_date: string;
  days_until_expiry: number;
}

export function DocumentExpiryAlerts() {
  const { data: expiringDocs } = useQuery({
    queryKey: ['expiring-documents'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ExpiringDocument[] }>(
        '/admin/drivers/documents/expiring'
      );
      return response.data.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (!expiringDocs || expiringDocs.length === 0) {
    return null;
  }

  const criticalDocs = expiringDocs.filter(doc => doc.days_until_expiry <= 7);
  const warningDocs = expiringDocs.filter(doc => doc.days_until_expiry > 7 && doc.days_until_expiry <= 30);

  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      {criticalDocs.length > 0 && (
        <Card className="border-l-4 border-l-[#FF4C4C] bg-red-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-[#FF4C4C]" size={20} />
              <h3 className="font-semibold text-gray-900">
                Critical: {criticalDocs.length} Document{criticalDocs.length !== 1 ? 's' : ''} Expiring Within 7 Days
              </h3>
            </div>
            <div className="space-y-2">
              {criticalDocs.map((doc) => (
                <div key={doc.id} className="bg-white rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.driver_name}</p>
                      <p className="text-gray-600">{formatDocumentType(doc.document_type)}</p>
                      {doc.document_number && (
                        <p className="text-xs text-gray-500">#{doc.document_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#FF4C4C] font-bold">
                        {doc.days_until_expiry === 0 ? 'Expires Today!' : `${doc.days_until_expiry} day${doc.days_until_expiry !== 1 ? 's' : ''}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {warningDocs.length > 0 && (
        <Card className="border-l-4 border-l-[#FFB800] bg-yellow-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-[#FFB800]" size={20} />
              <h3 className="font-semibold text-gray-900">
                Warning: {warningDocs.length} Document{warningDocs.length !== 1 ? 's' : ''} Expiring Within 30 Days
              </h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {warningDocs.map((doc) => (
                <div key={doc.id} className="bg-white rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.driver_name}</p>
                      <p className="text-gray-600">{formatDocumentType(doc.document_type)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FFB800] font-bold">{doc.days_until_expiry} days</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
