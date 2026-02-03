import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Loader2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/hooks/useOrders';
import { OrderCard } from './OrderCard';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface IncomingOrdersProps {
  orders: Order[];
  isLoading?: boolean;
}

export function IncomingOrders({ orders, isLoading }: IncomingOrdersProps) {
  const [showMTOOnly, setShowMTOOnly] = useState(false);

  // Filter orders based on MTO toggle
  const pendingOrders = showMTOOnly
    ? orders.filter(order => order.items?.some(item => (item as any).is_make_to_order))
    : orders;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>Loading order history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>All client orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">Orders from clients will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mtoCount = orders.filter(order =>
    order.items?.some(item => (item as any).is_make_to_order)
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            All Orders
            <Badge variant="secondary" className="ml-2">{orders.length} total</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Click on a card to view details and manage status</p>
        </div>
        <div className="flex items-center gap-2">
          {mtoCount > 0 && (
            <Button
              variant={showMTOOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMTOOnly(!showMTOOnly)}
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-1" />
              Make to Order ({mtoCount})
            </Button>
          )}
        </div>
      </div>

      {/* Card Grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
        layout
      >
        <AnimatePresence mode="popLayout">
          {pendingOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state when filtering */}
      {showMTOOnly && pendingOrders.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No Make to Order items in pending orders</p>
            <Button
              variant="link"
              onClick={() => setShowMTOOnly(false)}
              className="mt-2"
            >
              Show all orders
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
