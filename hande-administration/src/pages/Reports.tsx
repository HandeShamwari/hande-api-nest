import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FileText, Download, Calendar, Clock, Play, Pause, Trash2, Save } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  filters: string[];
}

interface SavedReport {
  id: number;
  name: string;
  template_id: string;
  configuration: Record<string, any>;
  created_at: string;
}

interface ScheduledReport {
  id: number;
  name: string;
  template_id: string;
  frequency: string;
  recipients: string[];
  is_active: boolean;
  next_run: string;
}

export default function Reports() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportFormat, setReportFormat] = useState('json');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [frequency, setFrequency] = useState('weekly');
  const [recipients, setRecipients] = useState('');

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      return result.data;
    }
  });

  // Fetch saved reports
  const { data: savedReports } = useQuery({
    queryKey: ['saved-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/saved', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      return result.data;
    }
  });

  // Fetch scheduled reports
  const { data: scheduledReports } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/scheduled', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      return result.data;
    }
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: selectedTemplate?.id,
          date_from: dateFrom,
          date_to: dateTo,
          format: reportFormat
        })
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      setGeneratedReport(result.data);
    }
  });

  // Save report mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reports/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: reportName,
          template_id: selectedTemplate?.id,
          configuration: { date_from: dateFrom, date_to: dateTo, format: reportFormat }
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      setShowSaveModal(false);
      setReportName('');
    }
  });

  // Schedule report mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reports/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: reportName,
          template_id: selectedTemplate?.id,
          configuration: { format: reportFormat },
          frequency,
          recipients: recipients.split(',').map(e => e.trim())
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setShowScheduleModal(false);
      setReportName('');
      setRecipients('');
    }
  });

  // Toggle schedule mutation
  const toggleScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/reports/scheduled/${id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    }
  });

  // Delete saved report
  const deleteSavedMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/reports/saved/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
    }
  });

  const downloadReport = () => {
    if (!generatedReport) return;
    
    const dataStr = JSON.stringify(generatedReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate?.id}_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const categoryGroups = templates?.reduce((acc: Record<string, ReportTemplate[]>, template: ReportTemplate) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Templates */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Templates
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryGroups && Object.entries(categoryGroups).map(([category, temps]: [string, any]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    {category}
                  </h3>
                  {temps.map((template: ReportTemplate) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
            </h2>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-4">
                <p className="text-gray-600">{selectedTemplate.description}</p>

                <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateMutation.mutate()}
                    disabled={!dateFrom || !dateTo || generateMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button 
                    onClick={() => setShowSaveModal(true)}
                    disabled={!dateFrom || !dateTo}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>

                {generatedReport && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Report Generated</h3>
                      <Button onClick={downloadReport} size="sm" className="bg-gray-600 hover:bg-gray-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <pre className="text-xs overflow-auto max-h-64 bg-white p-3 rounded border">
                      {JSON.stringify(generatedReport, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a report template to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Save className="w-5 h-5" />
            Saved Reports
          </h2>
        </CardHeader>
        <CardContent>
          {savedReports && savedReports.length > 0 ? (
            <div className="space-y-2">
              {savedReports.map((report: SavedReport) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-gray-600">
                      Template: {report.template_id} • Created: {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    onClick={() => deleteSavedMutation.mutate(report.id)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No saved reports yet</p>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Scheduled Reports
          </h2>
        </CardHeader>
        <CardContent>
          {scheduledReports && scheduledReports.length > 0 ? (
            <div className="space-y-2">
              {scheduledReports.map((report: ScheduledReport) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-gray-600">
                      {report.frequency} • {report.recipients.length} recipient(s) • 
                      Next: {new Date(report.next_run).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    onClick={() => toggleScheduleMutation.mutate(report.id)}
                    size="sm"
                    className={report.is_active ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                  >
                    {report.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No scheduled reports</p>
          )}
        </CardContent>
      </Card>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-xl font-semibold">Save Report</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Name</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="My Report"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    Save
                  </Button>
                  <Button onClick={() => setShowSaveModal(false)} className="bg-gray-600 hover:bg-gray-700 text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-xl font-semibold">Schedule Report</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Name</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Recipients (comma-separated emails)</label>
                  <input
                    type="text"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => scheduleMutation.mutate()} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    Schedule
                  </Button>
                  <Button onClick={() => setShowScheduleModal(false)} className="bg-gray-600 hover:bg-gray-700 text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
