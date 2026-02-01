import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  CheckCircle, 
  XCircle,
  Users,
  Clock
} from 'lucide-react';
import { 
  usePendingClients, 
  useAllClients, 
  useApproveClient, 
  useRejectClient 
} from '@/hooks/usePendingClients';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: pendingClients, isLoading: pendingLoading } = usePendingClients();
  const { data: allClients, isLoading: clientsLoading } = useAllClients();
  const approveClient = useApproveClient();
  const rejectClient = useRejectClient();

  const filteredClients = allClients?.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.full_name.toLowerCase().includes(query) ||
      client.company_name?.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone?.includes(query)
    );
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Manage B2B customers and approvals.</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingClients?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>New registrations awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
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
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm">No pending approvals at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-6 border rounded-xl bg-card"
                    >
                      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 shrink-0">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="font-semibold text-xl">{client.company_name || 'No Company'}</div>
                        <div className="text-base text-muted-foreground">{client.full_name}</div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </span>
                          {client.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4" />
                              {client.phone}
                            </span>
                          )}
                          {client.city && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {client.city}, {client.state}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 w-full lg:w-auto">
                        <Button
                          size="lg"
                          className="flex-1 lg:flex-none min-h-[52px] px-8 text-base"
                          onClick={() => approveClient.mutate(client.id)}
                          disabled={approveClient.isPending}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="flex-1 lg:flex-none min-h-[52px] px-8 text-base text-destructive hover:text-destructive"
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
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>All Clients</CardTitle>
                  <CardDescription>View and manage all client accounts</CardDescription>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:w-[280px] h-12"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !filteredClients || filteredClients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No clients found</p>
                  <p className="text-sm">
                    {searchQuery ? 'Try a different search term' : 'Clients will appear here once registered'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 border rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{client.company_name || client.full_name}</span>
                          {getStatusBadge(client.approval_status)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{client.full_name}</div>
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
