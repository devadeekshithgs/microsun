-- Fix 1: Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix 2: Replace overly permissive RLS policy for order_status_history
DROP POLICY IF EXISTS "System can insert order history" ON public.order_status_history;

CREATE POLICY "Authenticated users can insert order history"
  ON public.order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid() OR changed_by IS NULL
  );