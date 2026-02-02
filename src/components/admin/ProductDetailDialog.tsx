import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Trash2, Edit2, Save, X, Plus, Package, ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { useCategories, useUpdateProduct, useDeleteProduct, useCreateVariant, useUpdateVariant, useDeleteVariant, type Product, type ProductVariant } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange }: ProductDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [newVariant, setNewVariant] = useState({ 
    variant_name: '', 
    sku: '', 
    stock_quantity: 0, 
    low_stock_threshold: 10,
    reorder_point: 20 
  });
  const [showAddVariant, setShowAddVariant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVariantForUpload, setSelectedVariantForUpload] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  if (!product) return null;

  const variants = product.variants;

  const handleStartEdit = () => {
    setEditedProduct({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      is_active: product.is_active,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProduct.mutateAsync({ id: product.id, ...editedProduct });
      toast.success('Product updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleCancel = () => {
    setEditedProduct({});
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success('Product deleted');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${product.id}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      await updateProduct.mutateAsync({ id: product.id, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantId(variantId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `variant-${variantId}-${Date.now()}.${fileExt}`;
      const filePath = `variants/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      await updateVariant.mutateAsync({ id: variantId, image_url: publicUrl } as any);
      toast.success('Variant image uploaded');
    } catch (error) {
      toast.error('Failed to upload variant image');
    } finally {
      setUploadingVariantId(null);
      setSelectedVariantForUpload(null);
    }
  };

  const handleAddVariant = async () => {
    if (!newVariant.variant_name.trim()) {
      toast.error('Variant name is required');
      return;
    }

    try {
      await createVariant.mutateAsync({
        product_id: product.id,
        variant_name: newVariant.variant_name,
        sku: newVariant.sku || null,
        stock_quantity: newVariant.stock_quantity,
        low_stock_threshold: newVariant.low_stock_threshold,
        reorder_point: newVariant.reorder_point,
      } as any);
      toast.success('Variant added');
      setNewVariant({ variant_name: '', sku: '', stock_quantity: 0, low_stock_threshold: 10, reorder_point: 20 });
      setShowAddVariant(false);
    } catch (error) {
      toast.error('Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      await deleteVariant.mutateAsync(variantId);
      toast.success('Variant deleted');
    } catch (error) {
      toast.error('Failed to delete variant');
    }
  };

  const handleVariantStockUpdate = async (variant: ProductVariant, newStock: number) => {
    try {
      await updateVariant.mutateAsync({ id: variant.id, stock_quantity: newStock });
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleVariantThresholdUpdate = async (variantId: string, field: 'low_stock_threshold' | 'reorder_point', value: number) => {
    try {
      await updateVariant.mutateAsync({ id: variantId, [field]: value } as any);
      toast.success('Threshold updated');
    } catch (error) {
      toast.error('Failed to update threshold');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            {isEditing ? 'Edit Product' : product.name}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update product information and variants' : 'View and manage product details'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg border bg-muted overflow-hidden relative group">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-2" />
                  <p className="text-sm">No image</p>
                </div>
              )}
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {product.image_url ? 'Change' : 'Upload'}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Default product image (variants can have their own)
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input
                      value={editedProduct.name || ''}
                      onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editedProduct.description || ''}
                      onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={editedProduct.category_id || ''}
                        onValueChange={(value) => setEditedProduct({ ...editedProduct, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        checked={editedProduct.is_active ?? true}
                        onCheckedChange={(checked) => setEditedProduct({ ...editedProduct, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-muted-foreground mt-1">
                    {product.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Variants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Variants ({variants?.length || 0})</h4>
                <Button size="sm" variant="outline" onClick={() => setShowAddVariant(!showAddVariant)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              {showAddVariant && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Variant Name *</Label>
                      <Input
                        placeholder="e.g., Red, Large, 500ml"
                        value={newVariant.variant_name}
                        onChange={(e) => setNewVariant({ ...newVariant, variant_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SKU</Label>
                      <Input
                        placeholder="e.g., PROD-001-RED"
                        value={newVariant.sku}
                        onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Initial Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newVariant.stock_quantity}
                        onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Alert Point
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={newVariant.low_stock_threshold}
                        onChange={(e) => setNewVariant({ ...newVariant, low_stock_threshold: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Package className="h-3 w-3 text-blue-500" />
                        Reorder Point
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={newVariant.reorder_point}
                        onChange={(e) => setNewVariant({ ...newVariant, reorder_point: parseInt(e.target.value) || 20 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddVariant(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddVariant} disabled={createVariant.isPending}>
                      Add Variant
                    </Button>
                  </div>
                </div>
              )}

              {variants && variants.length > 0 ? (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-4">
                        {/* Variant Image */}
                        <div className="relative group">
                          <div className="h-20 w-20 rounded-lg border bg-muted overflow-hidden flex-shrink-0">
                            {variant.image_url ? (
                              <img 
                                src={variant.image_url} 
                                alt={variant.variant_name}
                                className="h-full w-full object-cover"
                              />
                            ) : product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={variant.variant_name}
                                className="h-full w-full object-cover opacity-50"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setSelectedVariantForUpload(variant.id);
                              variantFileInputRef.current?.click();
                            }}
                            disabled={uploadingVariantId === variant.id}
                          >
                            {uploadingVariantId === variant.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* Variant Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{variant.variant_name}</h5>
                            {variant.sku && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {variant.sku}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {/* Stock */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Stock</Label>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleVariantStockUpdate(variant, Math.max(0, (variant.stock_quantity ?? 0) - 1))}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  value={variant.stock_quantity ?? 0}
                                  onChange={(e) => handleVariantStockUpdate(variant, parseInt(e.target.value) || 0)}
                                  className="h-7 w-16 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleVariantStockUpdate(variant, (variant.stock_quantity ?? 0) + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Alert Point */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                                Alert
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={variant.low_stock_threshold ?? 10}
                                onChange={(e) => handleVariantThresholdUpdate(variant.id, 'low_stock_threshold', parseInt(e.target.value) || 0)}
                                className="h-7"
                              />
                            </div>

                            {/* Reorder Point */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3 text-blue-500" />
                                Reorder
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={variant.reorder_point ?? 20}
                                onChange={(e) => handleVariantThresholdUpdate(variant.id, 'reorder_point', parseInt(e.target.value) || 0)}
                                className="h-7"
                              />
                            </div>

                            {/* Delete */}
                            <div className="flex items-end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Variant</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{variant.variant_name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteVariant(variant.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No variants added yet. Add variants to track inventory.
                </p>
              )}

              {/* Hidden file input for variant images */}
              <input
                ref={variantFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (selectedVariantForUpload) {
                    handleVariantImageUpload(e, selectedVariantForUpload);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{product.name}"? This will also delete all variants.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateProduct.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
