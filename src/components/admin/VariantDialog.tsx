import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateVariant, useUpdateVariant, type ProductVariant } from '@/hooks/useProducts';

interface VariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant?: ProductVariant | null;
}

export function VariantDialog({ open, onOpenChange, productId, variant }: VariantDialogProps) {
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  
  const [formData, setFormData] = useState({
    variant_name: '',
    sku: '',
    stock_quantity: 0,
    low_stock_threshold: 10,
    is_active: true,
  });
  
  useEffect(() => {
    if (variant) {
      setFormData({
        variant_name: variant.variant_name,
        sku: variant.sku || '',
        stock_quantity: variant.stock_quantity ?? 0,
        low_stock_threshold: variant.low_stock_threshold ?? 10,
        is_active: variant.is_active ?? true,
      });
    } else {
      setFormData({
        variant_name: '',
        sku: '',
        stock_quantity: 0,
        low_stock_threshold: 10,
        is_active: true,
      });
    }
  }, [variant, open]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      product_id: productId,
      variant_name: formData.variant_name,
      sku: formData.sku || null,
      stock_quantity: formData.stock_quantity,
      low_stock_threshold: formData.low_stock_threshold,
      is_active: formData.is_active,
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{variant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variant_name">Variant Name *</Label>
            <Input
              id="variant_name"
              value={formData.variant_name}
              onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
              placeholder="e.g., 2 Step, Small, Red"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., MS-CS9-2S"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : variant ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
