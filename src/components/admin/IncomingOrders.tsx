import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Clock, Package, User, Building2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@/hooks/useOrders';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface IncomingOrdersProps {
  orders: Order[];
  isLoading?: boolean;
}

export function IncomingOrders({ orders, isLoading }: IncomingOrdersProps) {
  const updateStatus = useUpdateOrderStatus();

  // Orders are already filtered by the hook
  const pendingOrders = orders;

  const handleApprove = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: 'confirmed' });
      toast.success('Order confirmed and moved to production queue');
    } catch (error) {
      toast.error('Failed to confirm order');
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: 'pending', notes: 'Order rejected by admin' });
      toast.info('Order marked for review');
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Incoming Orders
          </CardTitle>
          <CardDescription>Checking for new orders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Incoming Orders
          </CardTitle>
          <CardDescription>New orders awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pending orders</p>
            <p className="text-sm text-muted-foreground mt-1">New orders will appear here for approval</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Incoming Orders
          <Badge variant="destructive" className="ml-2">{pendingOrders.length} new</Badge>
        </CardTitle>
        <CardDescription>New orders awaiting your approval</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.order_number}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{order.client?.full_name}</span>
                    </div>
                    {order.client?.company_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {order.client.company_name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0} items
                  </Badge>
                </TableCell>
                {/* Worker assignment disabled - assigned_worker_id column not in database */}
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <OrderDetailsDialog order={order} />
                    <Button
                      size="sm"
                      className="h-9 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(order.id)}
                      disabled={updateStatus.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-destructive hover:text-destructive"
                      onClick={() => handleReject(order.id)}
                      disabled={updateStatus.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Order Details Dialog Component
function OrderDetailsDialog({ order }: { order: Order }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-9">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order {order.order_number}</DialogTitle>
          <DialogDescription>Order details and items</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Customer:</span>
              <p>{order.client?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium">Company:</span>
              <p>{order.client?.company_name || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <p className="capitalize">{order.status}</p>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <p>{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          </div>
          {order.notes && (
            <div>
              <span className="font-medium">Notes:</span>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
          <div>
            <span className="font-medium">Items:</span>
            <ul className="mt-2 space-y-2">
              {order.items?.map(item => (
                <li key={item.id} className="flex justify-between text-sm border-b pb-2">
                  <span>{item.variant?.product?.name} - {item.variant?.variant_name}</span>
                  <span className="font-medium">x{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
