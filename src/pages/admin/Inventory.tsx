import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package, AlertTriangle, Plus, Minus, Check, X, LayoutGrid, List, Eye } from 'lucide-react';
import { useProducts, useCategories, useUpdateVariant, type ProductVariant, type Product } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { toast } from 'sonner';
import { ProductDetailDialog } from '@/components/admin/ProductDetailDialog';

interface InventoryItemWithProduct extends ProductVariant {
  productName: string;
  productImage: string | null;
  categoryName: string;
  productId: string;
}

type ViewMode = 'grid' | 'list';

// Inline editable stock input component
function EditableStock({ 
  value, 
  onSave, 
  isUpdating 
}: { 
  value: number; 
  onSave: (newValue: number) => void; 
  isUpdating: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    const newValue = parseInt(editValue) || 0;
    onSave(newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 h-10 text-center"
          autoFocus
        />
        <Button size="icon" className="h-10 w-10" onClick={handleSave} disabled={isUpdating}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="h-10 w-10" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-2xl font-bold tabular-nums hover:bg-muted px-3 py-1 rounded-lg transition-colors cursor-pointer min-w-[60px] text-center"
    >
      {value}
    </button>
  );
}

// Stock editor for grid view with +/- buttons
function StockEditorGrid({ 
  item, 
  onUpdate, 
  isUpdating 
}: { 
  item: InventoryItemWithProduct; 
  onUpdate: (id: string, newStock: number) => void; 
  isUpdating: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [addQuantity, setAddQuantity] = useState(0);
  const currentStock = item.stock_quantity ?? 0;

  const handleQuickAdjust = (delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    onUpdate(item.id, newStock);
  };

  const handleAddQuantity = () => {
    if (addQuantity > 0) {
      onUpdate(item.id, currentStock + addQuantity);
      setAddQuantity(0);
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => handleQuickAdjust(-1)}
          disabled={currentStock === 0 || isUpdating}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <EditableStock 
          value={currentStock} 
          onSave={(newVal) => onUpdate(item.id, newVal)} 
          isUpdating={isUpdating}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-green-500/50 text-green-600 hover:bg-green-50"
          onClick={() => handleQuickAdjust(1)}
          disabled={isUpdating}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {!isAdding ? (
        <Button
          variant="outline"
          className="w-full h-11 text-green-600 border-green-500/50 hover:bg-green-50"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Quantity
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={addQuantity || ''}
            onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
            placeholder="Qty"
            className="h-11 w-24 text-center text-lg"
            autoFocus
          />
          <Button
            size="icon"
            className="h-11 w-11 bg-green-600 hover:bg-green-700"
            onClick={handleAddQuantity}
            disabled={addQuantity <= 0 || isUpdating}
          >
            <Check className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11"
            onClick={() => { setAddQuantity(0); setIsAdding(false); }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const updateVariant = useUpdateVariant();
  
  // Flatten products and variants for inventory view
  const inventoryItems: InventoryItemWithProduct[] = products?.flatMap((product) => 
    (product.variants || []).map((variant) => ({
      ...variant,
      productName: product.name,
      productImage: product.image_url,
      categoryName: product.category?.name || 'Uncategorized',
      productId: product.id,
    }))
  ) || [];
  
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const product = products?.find(p => p.id === item.productId);
    const matchesCategory = categoryFilter === 'all' || product?.category_id === categoryFilter;
    
    const status = getStockStatus(item.stock_quantity ?? 0, item.low_stock_threshold ?? 10);
    const matchesStock = stockFilter === 'all' || status === stockFilter;
    
    return matchesSearch && matchesCategory && matchesStock;
  });
  
  const getStockBadge = (variant: ProductVariant) => {
    const status = getStockStatus(variant.stock_quantity ?? 0, variant.low_stock_threshold ?? 10);
    const config = {
      in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
      out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    return <Badge className={config[status].className}>{config[status].label}</Badge>;
  };

  const handleStockUpdate = async (variantId: string, newStock: number) => {
    try {
      await updateVariant.mutateAsync({ id: variantId, stock_quantity: newStock });
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleOpenProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setDialogOpen(true);
    }
  };
  
  const totalItems = inventoryItems.length;
  const lowStockCount = inventoryItems.filter(
    (item) => getStockStatus(item.stock_quantity ?? 0, item.low_stock_threshold ?? 10) === 'low_stock'
  ).length;
  const outOfStockCount = inventoryItems.filter(
    (item) => getStockStatus(item.stock_quantity ?? 0, item.low_stock_threshold ?? 10) === 'out_of_stock'
  ).length;
  const totalStock = inventoryItems.reduce((acc, item) => acc + (item.stock_quantity ?? 0), 0);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Track stock levels and manage inventory.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="lg"
            className="h-12"
            onClick={() => setViewMode('list')}
          >
            <List className="h-5 w-5 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="lg"
            className="h-12"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-5 w-5 mr-2" />
            Grid
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Stock Overview</CardTitle>
              <CardDescription>Click on any stock number to edit it directly</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, variant, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-[180px] h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="sm:w-[180px] h-12">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading inventory...</p>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'No items match your filters.' 
                  : 'No inventory data yet.'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            /* List/Matrix View */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center w-[200px]">Stock (Click to Edit)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenProduct(item.productId)}>
                      <TableCell>
                        <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.productName}
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>{item.variant_name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{item.sku || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleStockUpdate(item.id, Math.max(0, (item.stock_quantity ?? 0) - 1))}
                            disabled={item.stock_quantity === 0 || updateVariant.isPending}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <EditableStock 
                            value={item.stock_quantity ?? 0} 
                            onSave={(newVal) => handleStockUpdate(item.id, newVal)} 
                            isUpdating={updateVariant.isPending}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleStockUpdate(item.id, (item.stock_quantity ?? 0) + 1)}
                            disabled={updateVariant.isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getStockBadge(item)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleOpenProduct(item.productId)}>
                  <div className="aspect-square bg-muted relative">
                    {item.productImage ? (
                      <img 
                        src={item.productImage} 
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStockBadge(item)}
                    </div>
                    <div className="absolute top-3 left-3">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenProduct(item.productId); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{item.productName}</h3>
                      <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{item.categoryName}</span>
                        {item.sku && (
                          <>
                            <span>•</span>
                            <span>{item.sku}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div onClick={(e) => e.stopPropagation()}>
                      <StockEditorGrid 
                        item={item} 
                        onUpdate={handleStockUpdate}
                        isUpdating={updateVariant.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      />
    </div>
  );
}
