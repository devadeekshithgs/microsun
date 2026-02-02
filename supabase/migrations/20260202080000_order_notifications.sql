-- Create a function to notify all admins when a new order is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Loop through all users with 'admin' role
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      link,
      is_read
    ) VALUES (
      admin_record.user_id,
      'New Order Received',
      'Order #' || NEW.order_number || ' has been placed by a client.',
      '/admin/orders',
      FALSE
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after a new order is inserted
DROP TRIGGER IF EXISTS on_new_order_notify_admin ON public.orders;
CREATE TRIGGER on_new_order_notify_admin
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_order();
