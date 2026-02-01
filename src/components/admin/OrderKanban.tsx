import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Package, User, Clock, Phone, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Order, OrderStatus } from '@/hooks/useOrders';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { toast } from 'sonner';

interface OrderKanbanProps {
  orders: Order[];
}

const KANBAN_STAGES: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { status: 'in_production', label: 'In Production', color: 'bg-purple-500' },
  { status: 'ready', label: 'Ready', color: 'bg-amber-500' },
  { status: 'dispatched', label: 'Dispatched', color: 'bg-cyan-500' },
  { status: 'delivered', label: 'Delivered', color: 'bg-green-500' },
];

function OrderCard({ order, onMoveNext }: { order: Order; onMoveNext?: () => void }) {
  const itemCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  return (
    <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-sm">{order.order_number}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {format(new Date(order.created_at), 'dd MMM, HH:mm')}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Package className="h-3 w-3 mr-1" />
            {itemCount} items
          </Badge>
        </div>
        
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium truncate">{order.client?.full_name}</span>
          </div>
          {order.client?.company_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{order.client.company_name}</span>
            </div>
          )}
          {order.client?.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{order.client.phone}</span>
            </div>
          )}
        </div>

        {order.notes && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded mb-3 line-clamp-2">
            {order.notes}
          </p>
        )}

        {onMoveNext && (
          <Button 
            size="sm" 
            className="w-full h-8 text-xs" 
            onClick={(e) => {
              e.stopPropagation();
              onMoveNext();
            }}
          >
            Move to Next Stage
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  stage, 
  orders, 
  nextStatus,
  onMoveOrder 
}: { 
  stage: typeof KANBAN_STAGES[0]; 
  orders: Order[];
  nextStatus?: OrderStatus;
  onMoveOrder: (orderId: string, newStatus: OrderStatus) => void;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-muted/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-muted/50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-muted/50');
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      onMoveOrder(orderId, stage.status);
    }
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  return (
    <div 
      className="flex-shrink-0 w-[280px] bg-muted/30 rounded-lg border transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 border-b flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
        <h3 className="font-semibold text-sm">{stage.label}</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          {orders.length}
        </Badge>
      </div>
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
        <div className="p-3">
          {orders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No orders in this stage
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                draggable
                onDragStart={(e) => handleDragStart(e, order.id)}
              >
                <OrderCard 
                  order={order} 
                  onMoveNext={nextStatus ? () => onMoveOrder(order.id, nextStatus) : undefined}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function OrderKanban({ orders }: OrderKanbanProps) {
  const updateStatus = useUpdateOrderStatus();

  const handleMoveOrder = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success(`Order moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => 
    orders.filter(order => order.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STAGES.map((stage, index) => (
        <KanbanColumn
          key={stage.status}
          stage={stage}
          orders={getOrdersByStatus(stage.status)}
          nextStatus={KANBAN_STAGES[index + 1]?.status}
          onMoveOrder={handleMoveOrder}
        />
      ))}
    </div>
  );
}
