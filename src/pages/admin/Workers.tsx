import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, CheckCircle, Clock, AlertCircle, Loader2, Eye, Trash2, Play, Package } from 'lucide-react';
import { useWorkers, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, type WorkerWithStats, type WorkerAssignment } from '@/hooks/useWorkers';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', className: 'bg-amber-100 text-amber-800' },
  urgent: { label: 'Urgent', className: 'bg-destructive/20 text-destructive' },
};

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800', icon: Play },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800', icon: CheckCircle },
};

function AssignTaskDialog({ worker, onSuccess }: { worker: WorkerWithStats; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [orderId, setOrderId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  // Optimize: exclude pending orders since we filter them out anyway
  const { data: orders } = useOrders({ excludeStatus: 'pending' });
  const createAssignment = useCreateAssignment();

  const activeOrders = orders?.filter(o => o.status !== 'delivered' && o.status !== 'pending') || [];

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await createAssignment.mutateAsync({
        worker_id: worker.id,
        title,
        description: description || undefined,
        priority,
        order_id: (orderId && orderId !== 'unassigned') ? orderId : undefined,
        due_date: dueDate || undefined,
      });
      toast.success('Task assigned successfully');
      setOpen(false);
      setTitle('');
      setDescription('');
      setPriority('normal');
      setOrderId('');
      setDueDate('');
      onSuccess();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Assign Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task to {worker.full_name}</DialogTitle>
          <DialogDescription>Create a new task assignment for this worker</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Assemble Order #MS-123"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link to Order (optional)</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No order</SelectItem>
                {activeOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - {order.client?.company_name || order.client?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createAssignment.isPending}>
            {createAssignment.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Assign Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkerDetailDialog({ worker }: { worker: WorkerWithStats }) {
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const completionRate = worker.totalAssignments > 0
    ? Math.round((worker.completedAssignments / worker.totalAssignments) * 100)
    : 0;

  const handleStatusChange = async (assignment: WorkerAssignment, newStatus: string) => {
    try {
      await updateAssignment.mutateAsync({
        id: assignment.id,
        status: newStatus as WorkerAssignment['status']
      });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success('Assignment deleted');
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {worker.full_name}
          </DialogTitle>
          <DialogDescription>{worker.email} • {worker.phone || 'No phone'}</DialogDescription>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{worker.totalAssignments}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{worker.inProgressAssignments}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{worker.completedAssignments}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{worker.totalOutput}</p>
              <p className="text-xs text-muted-foreground">Units Produced</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Assignments Table */}
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Assigned Tasks</h4>
          {worker.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worker.assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        {assignment.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{assignment.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.order?.order_number || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityConfig[assignment.priority].className}>
                        {priorityConfig[assignment.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={assignment.status}
                        onValueChange={(v) => handleStatusChange(assignment, v)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this assignment?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(assignment.id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkersPage() {
  const { data: workers, isLoading, refetch } = useWorkers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalWorkers = workers?.length || 0;
  const activeWorkers = workers?.filter(w => w.inProgressAssignments > 0).length || 0;
  const totalPending = workers?.reduce((sum, w) => sum + w.pendingAssignments, 0) || 0;
  const totalCompleted = workers?.reduce((sum, w) => sum + w.completedAssignments, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
        <p className="text-muted-foreground">Manage worker assignments and track productivity.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeWorkers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Overview</CardTitle>
          <CardDescription>View worker assignments, output, and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {totalWorkers === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No workers found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Workers will appear here once they register with a worker role
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Output</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers?.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {worker.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{worker.full_name}</p>
                          <Badge variant={worker.is_active ? 'default' : 'secondary'} className="text-xs">
                            {worker.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{worker.email}</p>
                        <p className="text-muted-foreground">{worker.phone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{worker.pendingAssignments}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-800">{worker.inProgressAssignments}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-800">{worker.completedAssignments}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {worker.totalOutput} units
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <WorkerDetailDialog worker={worker} />
                        <AssignTaskDialog worker={worker} onSuccess={() => refetch()} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
