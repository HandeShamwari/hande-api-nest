import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, FileText, Image, HelpCircle } from 'lucide-react';

interface Content {
  id: number;
  type: 'banner' | 'announcement' | 'faq' | 'terms' | 'help_article';
  title: string;
  content: string;
  image_url: string | null;
  action_url: string | null;
  action_label: string | null;
  sort_order: number;
  target_audience: 'all' | 'riders' | 'drivers';
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ContentStats {
  total: number;
  active: number;
  recent: number;
}

export default function Content() {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch content
  const { data: contentData } = useQuery({
    queryKey: ['app-content', typeFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/admin/content?${params}`);
      return response.json();
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['content-stats'],
    queryFn: async () => {
      const response = await fetch('/admin/content/stats');
      return response.json();
    },
  });

  const stats: ContentStats = statsData?.data || {
    total: 0,
    active: 0,
    recent: 0,
  };

  const content: Content[] = contentData?.data?.data || [];

  // Toggle content status
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/content/${id}/toggle`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-content'] });
      queryClient.invalidateQueries({ queryKey: ['content-stats'] });
    },
  });

  // Delete content
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/content/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-content'] });
      queryClient.invalidateQueries({ queryKey: ['content-stats'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner':
        return <Image className="w-5 h-5" />;
      case 'announcement':
        return <FileText className="w-5 h-5" />;
      case 'faq':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      banner: 'bg-purple-100 text-purple-700',
      announcement: 'bg-blue-100 text-blue-700',
      faq: 'bg-green-100 text-green-700',
      terms: 'bg-gray-100 text-gray-700',
      help_article: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage app content, banners, and FAQs</p>
        </div>
        <Button
          onClick={() => {
            setSelectedContent(null);
            setShowModal(true);
          }}
          className="bg-[#7ED957] hover:bg-[#6BC847] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-[#7ED957]">{stats.active}</p>
            </div>
            <ToggleRight className="w-8 h-8 text-[#7ED957]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Added This Week</p>
              <p className="text-2xl font-bold text-[#4DA6FF]">{stats.recent}</p>
            </div>
            <Plus className="w-8 h-8 text-[#4DA6FF]" />
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
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="banner">Banners</option>
            <option value="announcement">Announcements</option>
            <option value="faq">FAQs</option>
            <option value="terms">Terms & Conditions</option>
            <option value="help_article">Help Articles</option>
          </select>
        </div>
      </Card>

      {/* Content Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
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
              {content.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      {getTypeBadge(item.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    {item.image_url && (
                      <div className="text-xs text-gray-500 mt-1">📷 Has image</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{item.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {item.target_audience}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMutation.mutate(item.id)}
                        className="text-gray-600 hover:text-[#7ED957]"
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {item.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContent(item);
                          setShowModal(true);
                        }}
                        className="text-gray-600 hover:text-[#4DA6FF]"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this content?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-gray-600 hover:text-[#FF4C4C]"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {content.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No content found</p>
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
                {selectedContent ? 'Edit Content' : 'Add Content'}
              </h2>
              <p className="text-gray-600 mb-4">Content form will be implemented here</p>
              <Button onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
