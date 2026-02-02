// Type definitions for MicroSun OMS

export type AppRole = 'admin' | 'worker' | 'client';
export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'dispatched' | 'delivered';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  approval_status: ApprovalStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  status: OrderStatus;
  notes?: string;
  admin_notes?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  dispatched_at?: string;
  dispatched_by?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  client?: Profile;
  assigned_worker_id?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  variant?: ProductVariant;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

// Cart item for order creation
export interface CartItem {
  variant: ProductVariant;
  quantity: number;
}

// Order status display config
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'warning', icon: 'Clock' },
  confirmed: { label: 'Confirmed', color: 'primary', icon: 'CheckCircle' },
  in_production: { label: 'In Production', color: 'secondary', icon: 'Factory' },
  ready: { label: 'Ready', color: 'success', icon: 'Package' },
  dispatched: { label: 'Dispatched', color: 'primary', icon: 'Truck' },
  delivered: { label: 'Delivered', color: 'success', icon: 'CheckCircle2' },
};

// Stock status helper
export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= threshold) return 'low_stock';
  return 'in_stock';
}
