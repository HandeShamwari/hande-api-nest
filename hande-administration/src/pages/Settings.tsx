import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Bell, Lock, Database, Mail } from 'lucide-react';

const settingsSections = [
  {
    title: 'Notifications',
    icon: Bell,
    description: 'Manage notification preferences',
    options: [
      { label: 'Email notifications', enabled: true },
      { label: 'Push notifications', enabled: false },
      { label: 'SMS alerts', enabled: true },
    ],
  },
  {
    title: 'Security',
    icon: Lock,
    description: 'Security and authentication settings',
    options: [
      { label: 'Two-factor authentication', enabled: true },
      { label: 'Session timeout', enabled: true },
      { label: 'IP whitelist', enabled: false },
    ],
  },
  {
    title: 'Database',
    icon: Database,
    description: 'Database configuration and backups',
    options: [
      { label: 'Automatic backups', enabled: true },
      { label: 'Real-time sync', enabled: true },
      { label: 'Archive old data', enabled: false },
    ],
  },
  {
    title: 'Email',
    icon: Mail,
    description: 'Email service configuration',
    options: [
      { label: 'SMTP enabled', enabled: true },
      { label: 'Email templates', enabled: true },
      { label: 'Bounce handling', enabled: true },
    ],
  },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your application settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.options.map((option) => (
                    <div key={option.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{option.label}</span>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          option.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            option.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <h4 className="font-medium text-red-900">Clear all cache</h4>
                <p className="text-sm text-red-700">This will clear all cached data</p>
              </div>
              <Button variant="outline" size="sm">
                Clear Cache
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <h4 className="font-medium text-red-900">Reset to defaults</h4>
                <p className="text-sm text-red-700">Restore all settings to default values</p>
              </div>
              <Button variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
