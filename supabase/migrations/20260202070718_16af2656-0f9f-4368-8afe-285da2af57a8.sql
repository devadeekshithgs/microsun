-- ============================================
-- SECURITY FIXES: Add authentication requirement to all sensitive tables
-- ============================================

-- 1. PROFILES TABLE - Ensure only authenticated users can access
-- Drop existing policies that don't check auth
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Recreate with auth.uid() IS NOT NULL check
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- 2. ORDERS TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Workers can view confirmed+ orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Workers can update dispatch status" ON public.orders;
DROP POLICY IF EXISTS "Approved clients can create orders" ON public.orders;

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view own orders" ON public.orders
FOR SELECT USING (auth.uid() IS NOT NULL AND client_id = auth.uid());

CREATE POLICY "Workers can view confirmed+ orders" ON public.orders
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'worker'::app_role) AND status <> 'pending'::order_status);

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can update dispatch status" ON public.orders
FOR UPDATE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'worker'::app_role) AND status = ANY (ARRAY['ready'::order_status, 'dispatched'::order_status]));

CREATE POLICY "Approved clients can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND client_id = auth.uid() AND has_role(auth.uid(), 'client'::app_role) AND is_approved_client(auth.uid()));

-- 3. ORDER_ITEMS TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Workers can view assigned order items" ON public.order_items;
DROP POLICY IF EXISTS "Clients can insert order items" ON public.order_items;

CREATE POLICY "Admins can manage order items" ON public.order_items
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order items" ON public.order_items
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

CREATE POLICY "Workers can view assigned order items" ON public.order_items
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'worker'::app_role) AND EXISTS (SELECT 1 FROM worker_assignments wa WHERE wa.order_id = order_items.order_id AND wa.worker_id = auth.uid()));

CREATE POLICY "Clients can insert order items" ON public.order_items
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

-- 4. ORDER_STATUS_HISTORY TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Admins can view all order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Users can view own order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Authenticated users can insert order history" ON public.order_status_history;

CREATE POLICY "Admins can view all order history" ON public.order_status_history
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order history" ON public.order_status_history
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.client_id = auth.uid()));

CREATE POLICY "Authenticated users can insert order history" ON public.order_status_history
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (changed_by = auth.uid() OR changed_by IS NULL));

-- 5. NOTIFICATIONS TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid()));

-- 6. WORKER_ASSIGNMENTS TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.worker_assignments;
DROP POLICY IF EXISTS "Workers can view their own assignments" ON public.worker_assignments;
DROP POLICY IF EXISTS "Workers can update their own assignments" ON public.worker_assignments;

CREATE POLICY "Admins can manage all assignments" ON public.worker_assignments
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can view their own assignments" ON public.worker_assignments
FOR SELECT USING (auth.uid() IS NOT NULL AND worker_id = auth.uid());

CREATE POLICY "Workers can update their own assignments" ON public.worker_assignments
FOR UPDATE USING (auth.uid() IS NOT NULL AND worker_id = auth.uid());

-- 7. WORKER_OUTPUT TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Admins can manage all output records" ON public.worker_output;
DROP POLICY IF EXISTS "Workers can view their own output" ON public.worker_output;
DROP POLICY IF EXISTS "Workers can insert their own output" ON public.worker_output;

CREATE POLICY "Admins can manage all output records" ON public.worker_output
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can view their own output" ON public.worker_output
FOR SELECT USING (auth.uid() IS NOT NULL AND worker_id = auth.uid());

CREATE POLICY "Workers can insert their own output" ON public.worker_output
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND worker_id = auth.uid());

-- 8. USER_ROLES TABLE - Ensure authentication required
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 9. PRODUCT_VARIANTS - Restrict stock info to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;

-- Only authenticated users can see all variant details
CREATE POLICY "Authenticated users can view active variants" ON public.product_variants
FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage variants" ON public.product_variants
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- 10. Update handle_new_user() to grant admin to microsun2013@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'microsun2013@gmail.com' THEN
    -- Create admin profile (auto-approved)
    INSERT INTO public.profiles (id, email, full_name, approval_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'approved'
    );
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Normal user flow - create profile with pending status
    INSERT INTO public.profiles (id, email, full_name, approval_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'pending'
    );
    
    -- Assign client role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  END IF;
  
  RETURN NEW;
END;
$function$;