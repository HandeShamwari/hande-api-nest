import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, FileText, Image, Video } from 'lucide-react';

const contentItems = [
  { id: 1, title: 'Getting Started Guide', type: 'Document', icon: FileText, status: 'Published', date: '2026-01-28' },
  { id: 2, title: 'Product Banner', type: 'Image', icon: Image, status: 'Draft', date: '2026-01-30' },
  { id: 3, title: 'Tutorial Video', type: 'Video', icon: Video, status: 'Published', date: '2026-01-25' },
  { id: 4, title: 'API Documentation', type: 'Document', icon: FileText, status: 'Published', date: '2026-01-20' },
];

export default function Content() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content</h1>
          <p className="mt-2 text-gray-600">Manage your content library</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Content
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contentItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.type}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      item.status === 'Published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>{item.date}</span>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
