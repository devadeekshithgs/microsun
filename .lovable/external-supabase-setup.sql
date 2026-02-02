-- ============================================
-- COMPLETE DATABASE SETUP FOR EXTERNAL SUPABASE PROJECT
-- Run this SQL in your external Supabase dashboard (SQL Editor)
-- ============================================

-- ============================================
-- 1. CREATE ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'worker', 'client');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered');
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  approval_status approval_status DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product variants table
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  sku TEXT,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  reorder_point INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence for order numbers
CREATE SEQUENCE order_number_seq START 1;

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id),
  dispatched_at TIMESTAMPTZ,
  dispatched_by UUID REFERENCES public.profiles(id),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order status history table
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Worker assignments table
CREATE TABLE public.worker_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Worker output table
CREATE TABLE public.worker_output (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.worker_assignments(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity_produced INTEGER DEFAULT 0,
  notes TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. CREATE SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user is an approved client
CREATE OR REPLACE FUNCTION public.is_approved_client(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND approval_status = 'approved'
  )
$$;

-- Function to handle new user registration (with admin email check)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.order_number := 'MS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_assignments_updated_at
  BEFORE UPDATE ON public.worker_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Trigger for order status history
CREATE TRIGGER log_order_status_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_output ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES (WITH AUTH CHECK)
-- ============================================

-- PROFILES POLICIES
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

-- USER_ROLES POLICIES
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- CATEGORIES POLICIES
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active categories" ON public.categories
FOR SELECT USING (is_active = true);

-- PRODUCTS POLICIES
CREATE POLICY "Admins can manage products" ON public.products
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT USING (is_active = true);

-- PRODUCT_VARIANTS POLICIES (requires auth for stock info)
CREATE POLICY "Authenticated users can view active variants" ON public.product_variants
FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage variants" ON public.product_variants
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- ORDERS POLICIES
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

-- ORDER_ITEMS POLICIES
CREATE POLICY "Admins can manage order items" ON public.order_items
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order items" ON public.order_items
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

CREATE POLICY "Workers can view assigned order items" ON public.order_items
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'worker'::app_role) AND EXISTS (SELECT 1 FROM worker_assignments wa WHERE wa.order_id = order_items.order_id AND wa.worker_id = auth.uid()));

CREATE POLICY "Clients can insert order items" ON public.order_items
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

-- ORDER_STATUS_HISTORY POLICIES
CREATE POLICY "Admins can view all order history" ON public.order_status_history
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order history" ON public.order_status_history
FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.client_id = auth.uid()));

CREATE POLICY "Authenticated users can insert order history" ON public.order_status_history
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (changed_by = auth.uid() OR changed_by IS NULL));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid()));

-- WORKER_ASSIGNMENTS POLICIES
CREATE POLICY "Admins can manage all assignments" ON public.worker_assignments
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can view their own assignments" ON public.worker_assignments
FOR SELECT USING (auth.uid() IS NOT NULL AND worker_id = auth.uid());

CREATE POLICY "Workers can update their own assignments" ON public.worker_assignments
FOR UPDATE USING (auth.uid() IS NOT NULL AND worker_id = auth.uid());

-- WORKER_OUTPUT POLICIES
CREATE POLICY "Admins can manage all output records" ON public.worker_output
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can view their own output" ON public.worker_output
FOR SELECT USING (auth.uid() IS NOT NULL AND worker_id = auth.uid());

CREATE POLICY "Workers can insert their own output" ON public.worker_output
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND worker_id = auth.uid());

-- ============================================
-- 7. CREATE STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Enable email confirmation in Authentication settings
-- 2. Enable leaked password protection in Authentication settings
-- 3. Configure any OAuth providers (Google, etc.) if needed
-- 4. Register with microsun2013@gmail.com to get admin access
