-- Add confirmed_at column to orders table
-- This column tracks when an order was confirmed
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add index for faster queries on confirmed orders
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_at ON public.orders(confirmed_at);

-- Update existing orders to set confirmed_at for those with 'confirmed' status
UPDATE public.orders 
SET confirmed_at = created_at 
WHERE status = 'confirmed' AND confirmed_at IS NULL;

COMMENT ON COLUMN public.orders.confirmed_at IS 'Timestamp when the order was confirmed - set immediately upon creation for direct orders';
