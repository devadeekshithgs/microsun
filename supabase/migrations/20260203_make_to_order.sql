-- Migration: Add Make-to-Order Support and Inventory Auto-Deduction
-- Run this in Supabase SQL Editor

-- 1. Add is_make_to_order column to order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS is_make_to_order BOOLEAN DEFAULT FALSE;

-- 2. Create function to deduct inventory when order is confirmed
-- Only deducts for items that are NOT make-to-order (in-stock items)
CREATE OR REPLACE FUNCTION deduct_inventory_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes from pending to confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Deduct stock for non-make-to-order items
    UPDATE product_variants pv
    SET stock_quantity = GREATEST(0, pv.stock_quantity - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id 
      AND pv.id = oi.variant_id
      AND (oi.is_make_to_order = FALSE OR oi.is_make_to_order IS NULL);
    
    -- Log the inventory deduction
    RAISE NOTICE 'Inventory deducted for order %', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for inventory deduction
DROP TRIGGER IF EXISTS on_order_confirm_deduct_inventory ON orders;
CREATE TRIGGER on_order_confirm_deduct_inventory
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_confirm();

-- 4. Function to determine if order should go to ready or production
-- Orders with only in-stock items go straight to ready
-- Orders with MTO items go to in_production
CREATE OR REPLACE FUNCTION get_next_order_status_after_confirm(order_id UUID)
RETURNS TEXT AS $$
DECLARE
  has_mto_items BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM order_items 
    WHERE order_items.order_id = get_next_order_status_after_confirm.order_id 
    AND is_make_to_order = TRUE
  ) INTO has_mto_items;
  
  IF has_mto_items THEN
    RETURN 'in_production';
  ELSE
    RETURN 'ready';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Add index for faster MTO queries
CREATE INDEX IF NOT EXISTS idx_order_items_make_to_order 
ON order_items(is_make_to_order) 
WHERE is_make_to_order = TRUE;

-- 6. Update TypeScript types will be needed after this migration
-- Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
