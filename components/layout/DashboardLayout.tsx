'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/utils';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  portal: 'wholesaler' | 'retailer' | 'consumer' | 'admin';
}

export function DashboardLayout({ children, portal }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn('hidden lg:block', collapsed ? 'w-16' : 'w-64')}>
        <Sidebar portal={portal} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar */}
      <div className={cn('fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar portal={portal} collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 text-sm bg-muted rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-pharma-500/30 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l">
              <div className="w-8 h-8 rounded-full bg-pharma-500/20 flex items-center justify-center text-pharma-600 font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground capitalize">{(user?.role as string)?.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
