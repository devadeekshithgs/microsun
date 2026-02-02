
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Product = Tables<'products'> & {
  category?: Tables<'categories'> | null;
  variants?: Tables<'product_variants'>[];
};

export type ProductVariant = Tables<'product_variants'>;
export type Category = Tables<'categories'>;

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as Category[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `)
        .order('name');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort variants to ensure stable order
      const products = data as Product[];
      return products.map(product => ({
        ...product,
        variants: product.variants?.sort((a, b) => {
          // Sort logic: 2 Step, 3 Step, 4 Step, etc.
          const aName = a.variant_name || '';
          const bName = b.variant_name || '';

          // numeric sort if starts with digit
          const aMatch = aName.match(/^(\d+)/);
          const bMatch = bName.match(/^(\d+)/);

          if (aMatch && bMatch) {
            return parseInt(aMatch[1]) - parseInt(bMatch[1]);
          }

          return aName.localeCompare(bName);
        })
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useProductsPaginated(params: {
  page: number;
  pageSize: number;
  categoryId?: string;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: ['products', 'paginated', params],
    queryFn: async () => {
      const { page, pageSize, categoryId, searchQuery } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `, { count: 'exact' });

      // Apply Search
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply Filter
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      // Apply Pagination
      query = query
        .order('created_at', { ascending: false }) // Newest first
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Sort variants just like in the main hook
      const products = (data as Product[]).map(product => ({
        ...product,
        variants: product.variants?.sort((a, b) => {
          const aName = a.variant_name || '';
          const bName = b.variant_name || '';
          const aMatch = aName.match(/^(\d+)/);
          const bMatch = bName.match(/^(\d+)/);
          if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
          return aName.localeCompare(bName);
        })
      }));

      return {
        data: products,
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 1000 * 60, // 1 minute
    placeholderData: (keepPreviousData) => keepPreviousData, // Keep UI stable while fetching next page
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: TablesInsert<'products'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: TablesUpdate<'products'> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    },
  });
}

// Variant mutations
export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variant: TablesInsert<'product_variants'>) => {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Variant created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create variant: ' + error.message);
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...variant }: TablesUpdate<'product_variants'> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .update(variant)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Stock updated: ${data.stock_quantity ?? '0'} units`);
    },
    onError: (error) => {
      console.error('Stock update failed:', error);
      toast.error('Failed to update: ' + error.message);
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Variant deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete variant: ' + error.message);
    },
  });
}

// Category mutations
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: TablesInsert<'categories'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...category }: TablesUpdate<'categories'> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: ['product-stats'],
    queryFn: async () => {
      // Fetch all variants but ONLY columns needed for stats (very lightweight)
      const { data: variants, error } = await supabase
        .from('product_variants')
        .select('stock_quantity, low_stock_threshold');

      if (error) throw error;

      const totalVariants = variants.length;
      const lowStockCount = variants.filter(v =>
        (v.stock_quantity ?? 0) <= (v.low_stock_threshold ?? 10) || (v.stock_quantity ?? 0) === 0
      ).length;

      return {
        totalVariants,
        lowStockCount
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
