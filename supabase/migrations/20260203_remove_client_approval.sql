-- ============================================
-- REMOVE CLIENT APPROVAL REQUIREMENT
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the old restrictive order creation policy
DROP POLICY IF EXISTS "Approved clients can create orders" ON public.orders;

-- Create new policy allowing any authenticated client to create orders immediately
CREATE POLICY "Clients can create orders" ON public.orders
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND client_id = auth.uid() 
  AND has_role(auth.uid(), 'client'::app_role)
);

-- Update handle_new_user function to auto-approve all clients
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
    -- Normal user flow - create profile with APPROVED status (changed from pending)
    INSERT INTO public.profiles (id, email, full_name, approval_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'approved'  -- Auto-approve all new clients
    );
    
    -- Assign client role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update all existing pending clients to approved
UPDATE public.profiles
SET approval_status = 'approved'
WHERE approval_status = 'pending';

-- ============================================
-- CREATE ERROR LOGGING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_context JSONB,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  source TEXT, -- e.g., 'order_creation', 'product_fetch', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs" ON public.error_logs
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own error logs
CREATE POLICY "Users can view own error logs" ON public.error_logs
FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Authenticated users can insert error logs
CREATE POLICY "Authenticated users can insert error logs" ON public.error_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);

-- ============================================
-- REMOVE is_make_to_order COLUMN (if exists)
-- This simplifies the system - everything is treated as standard order
-- ============================================

-- Check if column exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'is_make_to_order'
  ) THEN
    ALTER TABLE public.order_items DROP COLUMN is_make_to_order;
  END IF;
END $$;

COMMENT ON TABLE public.error_logs IS 'Centralized error logging for debugging and monitoring';
COMMENT ON TABLE public.orders IS 'Orders table - clients can place orders immediately without approval';
