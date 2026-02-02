-- Drop the overly permissive worker policy on order_items
DROP POLICY IF EXISTS "Workers can view order items" ON public.order_items;

-- Create a more restrictive policy that only allows workers to see order items for orders they're assigned to
CREATE POLICY "Workers can view assigned order items" 
ON public.order_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'worker'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.worker_assignments wa
    WHERE wa.order_id = order_items.order_id
      AND wa.worker_id = auth.uid()
  )
);