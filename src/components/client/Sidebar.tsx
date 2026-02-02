import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/client' },
  { icon: Package, label: 'Products', href: '/client/products' },
  { icon: ShoppingCart, label: 'Cart', href: '/client/cart' },
  { icon: ClipboardList, label: 'My Orders', href: '/client/orders' },
];

export function ClientTabNav() {
  const location = useLocation();

  return (
    <nav className="w-full border-b bg-background">
      <div className="flex items-center justify-center overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/client' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-[48px]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Keep the old sidebar for backwards compatibility if needed
interface ClientSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ClientSidebar({ open, onClose }: ClientSidebarProps) {
  // This is now deprecated - using ClientTabNav instead
  return null;
}
