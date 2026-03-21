'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn, initials } from '@/utils';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, CreditCard,
  Truck, FileText, Pill, Stethoscope, ScanLine, Activity, Bell,
  Settings, LogOut, ChevronLeft, ChevronRight, Store, Factory,
  User, Heart, Map, History, Building2, Shield, Database
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
};

const NAV_ITEMS: Record<string, NavItem[]> = {
  wholesaler: [
    { href: '/wholesaler/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/wholesaler/inventory', label: 'Inventory', icon: Package },
    { href: '/wholesaler/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/wholesaler/retailers', label: 'Retailers', icon: Store },
    { href: '/wholesaler/accounting', label: 'Accounting', icon: CreditCard },
    { href: '/wholesaler/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  retailer: [
    { href: '/retailer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/retailer/pos', label: 'Point of Sale', icon: ShoppingCart },
    { href: '/retailer/stock', label: 'Stock', icon: Package },
    { href: '/retailer/prescriptions', label: 'Prescriptions', icon: FileText },
    { href: '/retailer/orders', label: 'Orders', icon: Truck },
    { href: '/retailer/staff', label: 'Staff', icon: Users },
    { href: '/retailer/accounting', label: 'Accounting', icon: CreditCard },
    { href: '/retailer/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  consumer: [
    { href: '/consumer/home', label: 'Home', icon: LayoutDashboard },
    { href: '/consumer/body-map', label: '3D Body Map', icon: Map },
    { href: '/consumer/symptoms', label: 'Symptoms', icon: Stethoscope },
    { href: '/consumer/scanner', label: 'Drug Scanner', icon: ScanLine },
    { href: '/consumer/pharmacy', label: 'Find Pharmacy', icon: Store },
    { href: '/consumer/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/consumer/orders', label: 'My Orders', icon: Truck },
    { href: '/consumer/health-history', label: 'Health History', icon: Heart },
  ],
  admin: [
    { href: '/admin/platform', label: 'Platform', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
    { href: '/admin/drugs', label: 'Drug Database', icon: Database },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/security', label: 'Security', icon: Shield },
  ],
};

const PORTAL_COLORS: Record<string, string> = {
  wholesaler: 'from-blue-600 to-cyan-500',
  retailer: 'from-emerald-600 to-teal-500',
  consumer: 'from-purple-600 to-pink-500',
  admin: 'from-red-600 to-orange-500',
};

interface SidebarProps {
  portal: 'wholesaler' | 'retailer' | 'consumer' | 'admin';
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ portal, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = NAV_ITEMS[portal] || [];
  const user = session?.user as any;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-card border-r border-border z-50 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b', collapsed && 'justify-center px-2')}>
        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-lg flex-shrink-0', PORTAL_COLORS[portal])}>
          <Pill className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-display font-bold text-base leading-tight">PharmaConnect</div>
            <div className="text-xs text-muted-foreground capitalize">{portal} Portal</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'nav-link',
                    isActive && 'active',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-pharma-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className={cn('p-3 border-t space-y-1', collapsed && 'px-2')}>
        <Link
          href={`/${portal}/settings`}
          className={cn('nav-link', collapsed && 'justify-center px-2')}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* User */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-pharma-500/20 flex items-center justify-center text-pharma-600 text-xs font-bold flex-shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                initials(user.name || 'U')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate capitalize">{user.role?.replace('_', ' ')}</div>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className={cn('nav-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20', collapsed && 'justify-center px-2')}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </aside>
  );
}
