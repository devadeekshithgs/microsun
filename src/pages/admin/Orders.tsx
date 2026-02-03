import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Loader2, ClipboardList, BarChart3, KanbanSquare } from 'lucide-react';
import { useIncomingOrders, useKanbanOrders } from '@/hooks/useOrders';
import { IncomingOrders } from '@/components/admin/IncomingOrders';
import { OrderKanban } from '@/components/admin/OrderKanban';
import { AggregatedOrderView } from '@/components/admin/AggregatedOrderView';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('incoming');

  // Fetch orders separately to optimize performance
  const { data: incomingOrders, isLoading: isLoadingIncoming } = useIncomingOrders();
  const { data: kanbanOrders, isLoading: isLoadingKanban } = useKanbanOrders();

  const allIncoming = incomingOrders || [];
  const allKanban = kanbanOrders || [];
  const allOrders = [...allIncoming, ...allKanban];
  const hasOrders = allIncoming.length > 0 || allKanban.length > 0;

  if (isLoadingIncoming && isLoadingKanban) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track all client orders.</p>
      </div>

      {!hasOrders && !isLoadingIncoming && !isLoadingKanban ? (
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>View, approve, and update order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Orders will appear here once clients start placing them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Incoming
              {allIncoming.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {allIncoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <KanbanSquare className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
          </TabsList>

          {/* Incoming Orders Tab */}
          <TabsContent value="incoming" className="space-y-6">
            <IncomingOrders orders={allIncoming} isLoading={isLoadingIncoming} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AggregatedOrderView orders={allOrders} />
          </TabsContent>

          {/* Pipeline/Kanban Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Pipeline</CardTitle>
                <CardDescription>
                  Drag and drop orders between stages or click "Move to Next Stage"
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKanban ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <OrderKanban orders={allKanban} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
