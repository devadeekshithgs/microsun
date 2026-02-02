import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OrderStatus = Database['public']['Enums']['order_status'];

export interface OrderItem {
  id: string;
  variant_id: string;
  quantity: number;
  variant?: {
    id: string;
    variant_name: string;
    product?: {
      id: string;
      name: string;
      image_url: string | null;
    };
  };
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  client_id: string;
  client?: {
    id: string;
    full_name: string;
    company_name: string | null;
    email: string;
    phone: string | null;
  };
  assigned_worker_id?: string;
  items?: OrderItem[];
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          assigned_worker_id,
          client:profiles!orders_client_id_fkey(id, full_name, company_name, email, phone),
          items:order_items(
            id,
            variant_id,
            quantity,
            variant:product_variants(
              id,
              variant_name,
              product:products(id, name, image_url)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Order[]; // Fixed duplicate error check and cast
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string }) => {
      const updateData: Record<string, unknown> = { status };

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'dispatched') {
        updateData.dispatched_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Re-export hook
export function useAssignOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, workerId }: { orderId: string; workerId: string | null }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ assigned_worker_id: workerId } as any)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      items,
      notes
    }: {
      items: { variant_id: string; quantity: number }[];
      notes?: string
    }) => {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 2. Get client profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // 3. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: profile.id,
          status: 'pending',
          notes: notes
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        variant_id: item.variant_id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
