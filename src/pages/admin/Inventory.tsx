import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, AlertTriangle, Plus, Minus, Check, X } from 'lucide-react';
import { useProducts, useCategories, useUpdateVariant, type ProductVariant } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { toast } from 'sonner';

interface InventoryItemWithProduct extends ProductVariant {
  productName: string;
  productImage: string | null;
  categoryName: string;
  productId: string;
}

interface StockEditorProps {
  item: InventoryItemWithProduct;
  onUpdate: (id: string, newStock: number) => void;
  isUpdating: boolean;
}

function StockEditor({ item, onUpdate, isUpdating }: StockEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setAddQuantity(0);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      {/* Quick +/- Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => handleQuickAdjust(-1)}
          disabled={currentStock === 0 || isUpdating}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="min-w-[80px] text-center">
          <span className="text-2xl font-bold tabular-nums">{currentStock}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-green-500/50 text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => handleQuickAdjust(1)}
          disabled={isUpdating}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Add Quantity Section */}
      {!isEditing ? (
        <Button
          variant="outline"
          className="w-full h-11 text-green-600 border-green-500/50 hover:bg-green-50 hover:text-green-700"
          onClick={() => setIsEditing(true)}
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
            onClick={cancelEdit}
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Track stock levels and manage inventory.</p>
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
              <CardDescription>Update inventory levels directly</CardDescription>
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
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {/* Product Image */}
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
                  </div>
                  
                  {/* Product Info */}
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
                    
                    {/* Stock Editor */}
                    <StockEditor 
                      item={item} 
                      onUpdate={handleStockUpdate}
                      isUpdating={updateVariant.isPending}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
