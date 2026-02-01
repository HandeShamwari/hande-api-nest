import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Settings as SettingsIcon, Save, RotateCcw, Info } from 'lucide-react';
import apiClient from '../lib/api';

interface Setting {
  id: number;
  category: string;
  key: string;
  value: string;
  default_value: string;
  type: string;
  description: string | null;
  is_public: boolean;
}

export default function PlatformSettings() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();

  // Fetch settings by category
  const { data: settingsData } = useQuery({
    queryKey: ['platform-settings', selectedCategory],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/settings/category/${selectedCategory}`);
      console.log('Settings API Response:', response.data);
      return response.data;
    },
  });

  // Fetch app info
  const { data: appInfoData } = useQuery({
    queryKey: ['app-info'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings/app-info');
      return response.data;
    },
  });

  const settings: Setting[] = settingsData?.data || [];
  const appInfo = appInfoData?.data || {};
  
  console.log('settingsData:', settingsData);
  console.log('settings array:', settings);
  console.log('selectedCategory:', selectedCategory);

  // Batch update settings
  const updateMutation = useMutation({
    mutationFn: async (settingsToUpdate: Array<{ key: string; value: string }>) => {
      const response = await apiClient.post('/admin/settings/batch-update', { 
        settings: settingsToUpdate 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setEditedSettings({});
      alert('Settings updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      alert(`Failed to update settings: ${error.response?.data?.message || error.message}`);
    },
  });

  // Reset single setting
  const resetMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiClient.post(`/admin/settings/${key}/reset`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });

  const handleValueChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const settingsToUpdate = Object.entries(editedSettings).map(([key, value]) => ({
      key,
      value,
    }));
    
    if (settingsToUpdate.length > 0) {
      updateMutation.mutate(settingsToUpdate);
    }
  };

  const handleReset = (key: string) => {
    if (confirm('Reset this setting to default value?')) {
      resetMutation.mutate(key);
      // Remove from edited settings
      setEditedSettings((prev) => {
        const newSettings = { ...prev };
        delete newSettings[key];
        return newSettings;
      });
    }
  };

  const getCurrentValue = (setting: Setting) => {
    return editedSettings[setting.key] !== undefined
      ? editedSettings[setting.key]
      : setting.value;
  };

  const renderSettingInput = (setting: Setting) => {
    const currentValue = getCurrentValue(setting);

    switch (setting.type) {
      case 'boolean':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={currentValue}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
          />
        );
    }
  };

  const categories = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'pricing', name: 'Pricing', icon: SettingsIcon },
    { id: 'features', name: 'Features', icon: SettingsIcon },
    { id: 'notifications', name: 'Notifications', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: SettingsIcon },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          {Object.keys(editedSettings).length > 0 && (
            <>
              <Button
                onClick={() => setEditedSettings({})}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-[#7ED957] hover:bg-[#6BC847] text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : `Save Changes (${Object.keys(editedSettings).length})`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* App Info Card */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Application Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Version:</span>{' '}
                <span className="font-medium">{appInfo.api_version || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Environment:</span>{' '}
                <span className="font-medium">{appInfo.environment || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Timezone:</span>{' '}
                <span className="font-medium">{appInfo.timezone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Cache:</span>{' '}
                <span className="font-medium">{appInfo.cache?.driver || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-2">
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[#7ED957] text-black'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <category.icon className="w-5 h-5" />
                  {category.name}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {selectedCategory} Settings
            </h2>
            
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.key} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label className="block text-sm font-medium text-gray-900">
                          {setting.key.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </label>
                        {setting.is_public && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                            Public
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleReset(setting.key)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Reset to default"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2">
                    {renderSettingInput(setting)}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Default: {setting.default_value}
                  </div>
                </div>
              ))}
            </div>

            {settings.length === 0 && (
              <div className="text-center py-12">
                <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No settings found in this category</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
