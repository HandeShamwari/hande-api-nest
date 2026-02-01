import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Download, FileText, Users, DollarSign, TrendingUp, Calendar, Trash2 } from 'lucide-react';

interface ExportStats {
  total_exports: number;
  exports_today: number;
  exports_this_week: number;
  total_size: number;
}

interface ExportRecord {
  id: number;
  entity_type: string;
  format: string;
  record_count: number;
  file_size: number;
  status: string;
  created_at: string;
}

export default function DataExports() {
  const queryClient = useQueryClient();
  const [exportType, setExportType] = useState('drivers');
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch export history
  const { data: exportsData } = useQuery({
    queryKey: ['exports-history'],
    queryFn: async () => {
      const response = await fetch('/api/admin/exports/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 10000
  });

  const exports: ExportRecord[] = exportsData?.exports || [];
  const stats: ExportStats = exportsData?.stats || { total_exports: 0, exports_today: 0, exports_this_week: 0, total_size: 0 };

  // Export mutations
  const exportDriversMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/exports/drivers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: exportFormat,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          filters: filterStatus !== 'all' ? { is_active: filterStatus === 'active' } : undefined
        })
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exports-history'] });
      downloadExportData(result.data, exportFormat, 'drivers');
    }
  });

  const exportRidersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/exports/riders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: exportFormat,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          filters: filterStatus !== 'all' ? { is_active: filterStatus === 'active' } : undefined
        })
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exports-history'] });
      downloadExportData(result.data, exportFormat, 'riders');
    }
  });

  const exportTripsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/exports/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: exportFormat,
          date_from: dateFrom,
          date_to: dateTo
        })
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exports-history'] });
      downloadExportData(result.data, exportFormat, 'trips');
    }
  });

  const exportFinancialMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const response = await fetch('/api/admin/exports/financial', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: exportFormat,
          date_from: dateFrom,
          date_to: dateTo,
          report_type: reportType
        })
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exports-history'] });
      downloadExportData(result.data, exportFormat, 'financial');
    }
  });

  // Delete export
  const deleteExportMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/exports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports-history'] });
    }
  });

  const downloadExportData = (data: any[], format: string, type: string) => {
    if (format === 'csv') {
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleExport = () => {
    switch (exportType) {
      case 'drivers':
        exportDriversMutation.mutate();
        break;
      case 'riders':
        exportRidersMutation.mutate();
        break;
      case 'trips':
        exportTripsMutation.mutate();
        break;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isExporting = exportDriversMutation.isPending || exportRidersMutation.isPending || 
                      exportTripsMutation.isPending || exportFinancialMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Exports</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Exports</p>
                <p className="text-2xl font-bold">{stats.total_exports}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.exports_today}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{stats.exports_this_week}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.total_size)}</p>
              </div>
              <Download className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Create New Export</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Export Type</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="drivers">Drivers</option>
                  <option value="riders">Riders</option>
                  <option value="trips">Trips</option>
                  <option value="financial">Financial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {(exportType === 'drivers' || exportType === 'riders') && (
              <div>
                <label className="block text-sm font-medium mb-2">Status Filter</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg max-w-xs"
                >
                  <option value="all">All</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleExport}
                disabled={isExporting || (exportType === 'trips' && (!dateFrom || !dateTo))}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>

              {exportType === 'financial' && (
                <>
                  <Button 
                    onClick={() => exportFinancialMutation.mutate('revenue')}
                    disabled={!dateFrom || !dateTo || isExporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Export Revenue
                  </Button>
                  <Button 
                    onClick={() => exportFinancialMutation.mutate('subscriptions')}
                    disabled={!dateFrom || !dateTo || isExporting}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Export Subscriptions
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Export History</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Format</th>
                  <th className="text-left py-3 px-4">Records</th>
                  <th className="text-left py-3 px-4">Size</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((exp) => (
                  <tr key={exp.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium capitalize">{exp.entity_type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-sm">{exp.format}</span>
                    </td>
                    <td className="py-3 px-4">{exp.record_count.toLocaleString()}</td>
                    <td className="py-3 px-4">{formatFileSize(exp.file_size)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        exp.status === 'completed' ? 'bg-green-100 text-green-800' :
                        exp.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(exp.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => deleteExportMutation.mutate(exp.id)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exports.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Download className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No exports yet. Create your first export above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
