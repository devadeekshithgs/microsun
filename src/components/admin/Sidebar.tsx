import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Warehouse,
  HardHat,
  Menu,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import microsunLogo from '@/assets/microsun-logo.webp';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Clients', href: '/admin/clients' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Warehouse, label: 'Inventory', href: '/admin/inventory' },
  { icon: HardHat, label: 'Workers', href: '/admin/workers' },
];

export function AdminTabNav() {
  const location = useLocation();

  return (
    <nav className="hidden md:block w-full border-b bg-background">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));

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
interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return null;
}

export function AdminMobileNav({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>
            <div className="flex items-center gap-2">
              <img src={microsunLogo} alt="MicroSun" className="h-8 w-auto" />
              <span>Menu</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-4 px-6 py-4 text-base font-medium transition-colors border-l-4',
                  isActive
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
