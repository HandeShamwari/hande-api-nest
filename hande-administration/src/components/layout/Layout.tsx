import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Car,
  Headphones,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  MapPin,
  Truck,
  Star,
  AlertTriangle,
  Map,
  ScrollText,
  Tag,
  Bell,
  Layers,
  UserCog,
  FileBarChart,
  Download,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../lib/auth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Drivers', href: '/users', icon: Users },
  { name: 'Riders', href: '/riders', icon: UserCircle },
  { name: 'Trips', href: '/trips', icon: Car },
  { name: 'Zones', href: '/zones', icon: MapPin },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
  { name: 'Ratings', href: '/ratings', icon: Star },
  { name: 'Emergencies', href: '/emergencies', icon: AlertTriangle },
  { name: 'Live Map', href: '/live-map', icon: Map },
  { name: 'System Logs', href: '/logs', icon: ScrollText },
  { name: 'Promotions', href: '/promotions', icon: Tag },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Content', href: '/content', icon: Layers },
  { name: 'Support', href: '/support', icon: Headphones },
  { name: 'Financial', href: '/financial', icon: DollarSign },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Data Exports', href: '/exports', icon: Download },
  { name: 'Admin Users', href: '/admin-users', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 lg:translate-x-0 lg:static`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-bold">HANDEE Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-800 p-4">
            <button 
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />{user?.name || 'Admin User'}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin User</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
