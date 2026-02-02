import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorkerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

export interface WorkerAssignment {
  id: string;
  worker_id: string;
  order_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  order?: {
    order_number: string;
  };
}

export interface WorkerOutput {
  id: string;
  worker_id: string;
  assignment_id: string | null;
  variant_id: string | null;
  quantity_produced: number;
  notes: string | null;
  recorded_at: string;
  created_at: string;
  variant?: {
    variant_name: string;
    product?: {
      name: string;
    };
  };
}

export interface WorkerWithStats extends WorkerProfile {
  assignments: WorkerAssignment[];
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  totalOutput: number;
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      // Get all users with worker role
      const { data: workerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'worker');

      if (rolesError) throw rolesError;

      const workerIds = workerRoles.map(r => r.user_id);

      if (workerIds.length === 0) return [];

      // Get worker profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, is_active')
        .in('id', workerIds);

      if (profilesError) throw profilesError;

      // Get assignments for all workers
      const { data: assignments, error: assignmentsError } = await supabase
        .from('worker_assignments')
        .select(`
          *,
          order:orders(order_number)
        `)
        .in('worker_id', workerIds)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get output records for all workers
      const { data: outputs, error: outputsError } = await supabase
        .from('worker_output')
        .select(`
          *,
          variant:product_variants(
            variant_name,
            product:products(name)
          )
        `)
        .in('worker_id', workerIds)
        .order('recorded_at', { ascending: false });

      if (outputsError) throw outputsError;

      // Combine data
      const workersWithStats: WorkerWithStats[] = profiles.map(profile => {
        const workerAssignments = (assignments || []).filter(a => a.worker_id === profile.id) as WorkerAssignment[];
        const workerOutputs = (outputs || []).filter(o => o.worker_id === profile.id) as WorkerOutput[];

        return {
          ...profile,
          assignments: workerAssignments,
          totalAssignments: workerAssignments.length,
          completedAssignments: workerAssignments.filter(a => a.status === 'completed').length,
          inProgressAssignments: workerAssignments.filter(a => a.status === 'in_progress').length,
          pendingAssignments: workerAssignments.filter(a => a.status === 'pending').length,
          totalOutput: workerOutputs.reduce((sum, o) => sum + o.quantity_produced, 0),
        };
      });

      return workersWithStats;
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: {
      worker_id: string;
      order_id?: string;
      title: string;
      description?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      due_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('worker_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<WorkerAssignment>) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'in_progress' && !updates.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('worker_assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('worker_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}
