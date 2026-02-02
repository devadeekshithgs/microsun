-- Add assigned_worker_id to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS for this column implicitly by existing policies, but we might need specific policies for workers to see their assigned orders.
-- Update 'Workers can view confirmed+ orders' policy?
-- Actually, the existing policy is:
-- USING (public.has_role(auth.uid(), 'worker') AND status != 'pending');
-- This allows workers to see ALL confirmed orders.
-- We might want to restrict it to assigned orders only, or keep it open. 
-- For now, open is fine, but let's allow them to see PENDING orders if assigned to them (though pending usually implies unassigned).

-- Let's create an index for performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_worker_id ON public.orders(assigned_worker_id);
