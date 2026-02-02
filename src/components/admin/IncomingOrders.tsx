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

interface IncomingOrdersProps {
  orders: Order[];
}

function OrderDetailsDialog({ order }: { order: Order }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order {order.order_number}</DialogTitle>
          <DialogDescription>
            Placed on {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Customer Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {order.client?.full_name}</p>
                <p><span className="text-muted-foreground">Company:</span> {order.client?.company_name || '-'}</p>
                <p><span className="text-muted-foreground">Email:</span> {order.client?.email}</p>
                <p><span className="text-muted-foreground">Phone:</span> {order.client?.phone || '-'}</p>
              </div>
            </div>
            {order.notes && (
              <div>
                <h4 className="font-medium text-sm mb-2">Order Notes</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Order Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.variant?.product?.image_url ? (
                            <img
                              src={item.variant.product.image_url}
                              alt={item.variant.product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          {item.variant?.product?.name}
                        </div>
                      </TableCell>
                      <TableCell>{item.variant?.variant_name}</TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Import useWorkers
import { useWorkers } from '@/hooks/useWorkers';
import { useAssignOrder } from '@/hooks/useOrders';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

export function IncomingOrders({ orders }: IncomingOrdersProps) {
  const updateStatus = useUpdateOrderStatus();
  const assignOrder = useAssignOrder();
  const { data: workers } = useWorkers();

  const pendingOrders = orders.filter(order => order.status === 'pending');

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

  const handleAssign = async (orderId: string, workerId: string | null) => {
    try {
      await assignOrder.mutateAsync({ orderId, workerId });
      toast.success('Order assigned to worker');
    } catch (error) {
      toast.error('Failed to assign order');
    }
  };

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
              <TableHead>Assigned To</TableHead>
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
                <TableCell>
                  <div className="min-w-[140px]">
                    <Select
                      value={order.assigned_worker_id || "unassigned"}
                      onValueChange={(val) => handleAssign(order.id, val === "unassigned" ? null : val)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Assign Worker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-muted-foreground">Unassigned</SelectItem>
                        {workers?.map(worker => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
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
