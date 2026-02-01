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
import { Upload, Trash2, Edit2, Save, X, Plus, Package, ImageIcon, Loader2 } from 'lucide-react';
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
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [newVariant, setNewVariant] = useState({ variant_name: '', sku: '', stock_quantity: 0, low_stock_threshold: 10 });
  const [showAddVariant, setShowAddVariant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  if (!product) return null;

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
      });
      toast.success('Variant added');
      setNewVariant({ variant_name: '', sku: '', stock_quantity: 0, low_stock_threshold: 10 });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            {isEditing ? 'Edit Product' : product.name}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update product information and variants' : 'View and manage product details'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
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
                  {product.image_url ? 'Change Image' : 'Upload Image'}
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

            <div className="flex items-center gap-2">
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
                <>
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-muted-foreground mt-1">
                      {product.description || 'No description provided'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Variants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Variants ({product.variants?.length || 0})</h4>
                <Button size="sm" variant="outline" onClick={() => setShowAddVariant(!showAddVariant)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              {showAddVariant && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
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
                      <Label className="text-xs">Low Stock Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newVariant.low_stock_threshold}
                        onChange={(e) => setNewVariant({ ...newVariant, low_stock_threshold: parseInt(e.target.value) || 10 })}
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

              {product.variants && product.variants.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">{variant.variant_name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {variant.sku || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleVariantStockUpdate(variant, Math.max(0, (variant.stock_quantity ?? 0) - 1))}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-medium">{variant.stock_quantity ?? 0}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleVariantStockUpdate(variant, (variant.stock_quantity ?? 0) + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Variant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{variant.variant_name}"? This action cannot be undone.
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No variants added yet. Add variants to track inventory.
                </p>
              )}
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
                  Are you sure you want to delete "{product.name}"? This will also delete all variants. This action cannot be undone.
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
