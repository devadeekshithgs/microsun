import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientOrders } from '@/hooks/useOrders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  in_production: { label: 'In Production', className: 'bg-purple-100 text-purple-800', icon: Package },
  ready: { label: 'Ready for Dispatch', className: 'bg-indigo-100 text-indigo-800', icon: Package },
  dispatched: { label: 'Dispatched', className: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useClientOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground">Track the status of your orders.</p>
      </div>

      {!hasOrders ? (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>View all your orders and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your orders will appear here once you place them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Recent orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusConfig[order.status]?.className || ''} flex w-fit items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <span key={idx} className="text-sm text-muted-foreground">
                              {item.quantity}x {item.variant?.product?.name} ({item.variant?.variant_name})
                            </span>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <span className="text-xs text-muted-foreground">
                              + {(order.items?.length || 0) - 2} more items
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
