import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/external-client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

export function usePendingClients() {
  return useQuery({
    queryKey: ['pending-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useAllClients() {
  return useQuery({
    queryKey: ['all-clients'],
    queryFn: async () => {
      // Get all profiles that have client role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');
      
      if (roleError) throw roleError;
      
      const clientIds = roleData.map(r => r.user_id);
      
      if (clientIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', clientIds)
        .order('company_name');
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useApproveClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-clients'] });
      queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      toast.success('Client approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve client: ' + error.message);
    },
  });
}

export function useRejectClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-clients'] });
      queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      toast.success('Client rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject client: ' + error.message);
    },
  });
}
