import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useCreateVariant, useUpdateVariant, type ProductVariant } from '@/hooks/useProducts';
import { variantSchema, type VariantFormValues } from '@/lib/validations';

interface VariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant?: ProductVariant | null;
}

export function VariantDialog({ open, onOpenChange, productId, variant }: VariantDialogProps) {
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      variantName: '',
      sku: '',
      stockQuantity: 0,
      lowStockThreshold: 10,
      reorderPoint: 20,
      imageUrl: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (variant) {
        form.reset({
          variantName: variant.variant_name,
          sku: variant.sku || '',
          stockQuantity: variant.stock_quantity ?? 0,
          lowStockThreshold: variant.low_stock_threshold ?? 10,
          reorderPoint: variant.reorder_point ?? 20,
          imageUrl: variant.image_url || '',
          isActive: variant.is_active ?? true,
        });
      } else {
        form.reset({
          variantName: '',
          sku: '',
          stockQuantity: 0,
          lowStockThreshold: 10,
          reorderPoint: 20,
          imageUrl: '',
          isActive: true,
        });
      }
    }
  }, [variant, open, form]);

  const onSubmit = async (values: VariantFormValues) => {
    const data = {
      product_id: productId,
      variant_name: values.variantName.trim(),
      sku: values.sku?.trim() || null,
      stock_quantity: values.stockQuantity,
      low_stock_threshold: values.lowStockThreshold,
      reorder_point: values.reorderPoint,
      image_url: values.imageUrl?.trim() || null,
      is_active: values.isActive,
    };

    if (variant) {
      await updateVariant.mutateAsync({ id: variant.id, ...data });
    } else {
      await createVariant.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isLoading = createVariant.isPending || updateVariant.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{variant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="variantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2 Step, Small, Red" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., MS-CS9-2S" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Letters, numbers, hyphens, underscores only</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Alert</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder At</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : variant ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
