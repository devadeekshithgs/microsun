import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function WorkerHome() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Hello, {profile?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here are today's orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="p-4 pb-2">
            <Package className="h-6 w-6 text-primary mx-auto" />
          </CardHeader>
          <CardContent className="p-4 pt-0 text-center">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <Truck className="h-6 w-6 text-warning mx-auto" />
          </CardHeader>
          <CardContent className="p-4 pt-0 text-center">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">To Dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CheckCircle className="h-6 w-6 text-success mx-auto" />
          </CardHeader>
          <CardContent className="p-4 pt-0 text-center">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Done Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orders to Dispatch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No orders ready for dispatch
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
