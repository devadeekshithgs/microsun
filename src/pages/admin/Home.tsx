import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Users, AlertTriangle, CheckCircle, XCircle, Building2, Phone, Mail } from 'lucide-react';
import { usePendingClients, useApproveClient, useRejectClient } from '@/hooks/usePendingClients';
import { useProducts } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminHome() {
  const { data: pendingClients, isLoading: pendingLoading } = usePendingClients();
  const { data: products } = useProducts();
  const approveClient = useApproveClient();
  const rejectClient = useRejectClient();

  // Calculate low stock items
  const lowStockCount = products?.reduce((count, product) => {
    return count + (product.variants?.filter(v => 
      getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10) === 'low_stock'
    ).length ?? 0);
  }, 0) ?? 0;

  const outOfStockCount = products?.reduce((count, product) => {
    return count + (product.variants?.filter(v => 
      getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10) === 'out_of_stock'
    ).length ?? 0);
  }, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{pendingClients?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">New registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Client Approvals - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Client Approvals
            </CardTitle>
            <CardDescription>New B2B customer registrations awaiting your approval</CardDescription>
          </div>
          {(pendingClients?.length ?? 0) > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pendingClients?.length}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </div>
          ) : !pendingClients || pendingClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm">New registrations will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClients.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate">{client.company_name || client.full_name}</div>
                    <div className="text-sm text-muted-foreground">{client.full_name}</div>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {client.email}
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="flex-1 sm:flex-none min-h-[48px] px-6"
                      onClick={() => approveClient.mutate(client.id)}
                      disabled={approveClient.isPending}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 sm:flex-none min-h-[48px] px-6 text-destructive hover:text-destructive"
                      onClick={() => rejectClient.mutate(client.id)}
                      disabled={rejectClient.isPending}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/inventory">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manage Inventory
              </CardTitle>
              <CardDescription>Update stock levels and track inventory</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/admin/products">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
              <CardDescription>Add or edit products and variants</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/admin/clients">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Clients
              </CardTitle>
              <CardDescription>View and manage client accounts</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
