import React, { useState } from 'react';
import { 
  Home, 
  Building2, 
  Package, 
  TrendingUp, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  User,
  Box
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: Home, color: 'text-blue-400' },
    { name: 'Negocios', href: 'negocios', icon: Building2, color: 'text-green-400' },
    { name: 'Ítems', href: 'items', icon: Box, color: 'text-purple-400' },
    { name: 'Ventas', href: 'ventas', icon: TrendingUp, color: 'text-yellow-400' },
    { name: 'Configuración', href: 'configuracion', icon: Settings, color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900/95 to-black/95">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-black shadow-2xl border-r border-white/10">
          <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OneWay Business
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={`#${item.href}`}
                  className={`flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    currentPage === item.href
                      ? 'bg-white/10 text-white shadow-lg border border-white/20'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 ${currentPage === item.href ? 'text-white' : item.color}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-900 to-black shadow-2xl border-r border-white/10">
          <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-white/10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OneWay Business
            </h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={`#${item.href}`}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentPage === item.href
                        ? 'bg-white/10 text-white shadow-lg border border-white/20'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${currentPage === item.href ? 'text-white' : item.color}`} />
                    {item.name}
                  </a>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center bg-white/5 rounded-xl p-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.permisos}</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-white lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                {navigation.find(item => item.href === currentPage)?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
