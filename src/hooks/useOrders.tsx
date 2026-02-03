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

interface UseOrdersOptions {
  status?: OrderStatus;
  excludeStatus?: OrderStatus;
}

export function useOrders(options: UseOrdersOptions = {}) {
  return useQuery({
    queryKey: ['orders', options],
    queryFn: async () => {
      let query = supabase
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

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.excludeStatus) {
        query = query.neq('status', options.excludeStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
      }

      console.log('Orders fetched:', data?.length || 0, 'orders with options:', options);
      return data as unknown as Order[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook for admin incoming orders (pending status)
export function useIncomingOrders() {
  return useQuery({
    queryKey: ['adminIncomingOrders'],
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch incoming orders:', error);
        throw error;
      }

      console.log('Incoming orders fetched:', data?.length || 0, 'orders');
      return data as unknown as Order[];
    },
    staleTime: 1000 * 30,
  });
}

// Hook for admin kanban orders (all except pending)
export function useKanbanOrders() {
  return useQuery({
    queryKey: ['adminKanbanOrders'],
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
        .neq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch kanban orders:', error);
        throw error;
      }

      console.log('Kanban orders fetched:', data?.length || 0, 'orders');
      return data as unknown as Order[];
    },
    staleTime: 1000 * 30,
  });
}

// Hook specifically for client's "My Orders" page - explicitly filters by client_id
export function useClientOrders() {
  return useQuery({
    queryKey: ['clientOrders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
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
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch client orders:', error);
        throw error;
      }
      return data as unknown as Order[];
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
      // Invalidate all order-related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['adminIncomingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminKanbanOrders'] });
      queryClient.invalidateQueries({ queryKey: ['clientOrders'] });
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
      // Invalidate all order-related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['adminIncomingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminKanbanOrders'] });
      queryClient.invalidateQueries({ queryKey: ['clientOrders'] });
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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch profile:', profileError);
        throw new Error('Profile not found');
      }

      if (!profile) throw new Error('Profile not found');

      // 3. Create order (order_number is auto-generated by database trigger)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: profile.id,
          status: 'pending',
          notes: notes
        } as any)
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', order);

      // 4. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        variant_id: item.variant_id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to create order items:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');
      return order;
    },
    onSuccess: () => {
      // Invalidate all order-related queries to refresh all order lists
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['adminIncomingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminKanbanOrders'] });
      queryClient.invalidateQueries({ queryKey: ['clientOrders'] });
    },
  });
}
