-- Add image_url column to product_variants for variant-specific images
ALTER TABLE public.product_variants 
ADD COLUMN image_url text;

-- Add reorder_point column to product_variants (separate from low_stock_threshold which is alert point)
ALTER TABLE public.product_variants 
ADD COLUMN reorder_point integer DEFAULT 20;

-- Create worker_assignments table to track work assigned to workers
CREATE TABLE public.worker_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create worker_output table to track daily output/productivity
CREATE TABLE public.worker_output (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.worker_assignments(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity_produced integer NOT NULL DEFAULT 0,
  notes text,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_output ENABLE ROW LEVEL SECURITY;

-- RLS policies for worker_assignments
CREATE POLICY "Admins can manage all assignments"
ON public.worker_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can view their own assignments"
ON public.worker_assignments FOR SELECT
USING (worker_id = auth.uid());

CREATE POLICY "Workers can update their own assignments"
ON public.worker_assignments FOR UPDATE
USING (worker_id = auth.uid());

-- RLS policies for worker_output
CREATE POLICY "Admins can manage all output records"
ON public.worker_output FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workers can view their own output"
ON public.worker_output FOR SELECT
USING (worker_id = auth.uid());

CREATE POLICY "Workers can insert their own output"
ON public.worker_output FOR INSERT
WITH CHECK (worker_id = auth.uid());

-- Add trigger for updated_at on worker_assignments
CREATE TRIGGER update_worker_assignments_updated_at
BEFORE UPDATE ON public.worker_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();