
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, AlertTriangle, Plus, Minus, Check, X, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { useProducts, useCategories, useUpdateVariant, type ProductVariant, type Product, type Category } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Inline editable stock input - properly isolated per variant
function EditableStock({
  value,
  variantId,
  onSave
}: {
  value: number;
  variantId: string;
  onSave: (id: string, newValue: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  // Sync editValue when external value changes (e.g., from optimistic update)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  const handleSave = () => {
    const newValue = parseInt(editValue) || 0;
    if (newValue !== value) {
      onSave(variantId, newValue);
    }
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
          className="w-20 h-9 text-center"
          autoFocus
        />
        <Button size="icon" className="h-9 w-9" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="h-9 w-9" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-xl font-bold tabular-nums hover:bg-muted px-3 py-1 rounded transition-colors cursor-pointer min-w-[50px] text-center"
    >
      {value}
    </button>
  );
}

// Quick stock adjustment buttons
function StockAdjuster({
  variant,
  onUpdate
}: {
  variant: ProductVariant;
  onUpdate: (id: string, newStock: number) => void;
}) {
  const currentStock = variant.stock_quantity ?? 0;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 text-destructive hover:bg-destructive/10"
        onClick={() => onUpdate(variant.id, Math.max(0, currentStock - 1))}
        disabled={currentStock === 0}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <EditableStock
        value={currentStock}
        variantId={variant.id}
        onSave={onUpdate}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 text-green-600 hover:bg-green-50"
        onClick={() => onUpdate(variant.id, currentStock + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Variant row component
function VariantRow({
  variant,
  onUpdate
}: {
  variant: ProductVariant;
  onUpdate: (id: string, newStock: number) => void;
}) {
  const status = getStockStatus(variant.stock_quantity ?? 0, variant.low_stock_threshold ?? 10);
  const statusConfig = {
    in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800' },
    low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-800' },
    out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 hover:bg-muted/30">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
          {variant.image_url ? (
            <img
              src={variant.image_url}
              alt={variant.variant_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Package className={`h-5 w-5 text-muted-foreground ${variant.image_url ? 'hidden' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" title={variant.variant_name}>{variant.variant_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{variant.sku || 'No SKU'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <StockAdjuster variant={variant} onUpdate={onUpdate} />
        <Badge className={statusConfig[status].className + ' min-w-[80px] justify-center'}>
          {statusConfig[status].label}
        </Badge>
      </div>
    </div>
  );
}

// Product group component
function ProductGroup({
  product,
  onUpdate,
  defaultOpen = false
}: {
  product: Product;
  onUpdate: (id: string, newStock: number) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const variants = product.variants || [];
  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0);
  const lowStockCount = variants.filter(v => {
    const status = getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10);
    return status === 'low_stock' || status === 'out_of_stock';
  }).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg mb-2">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}

            {/* Product Image */}
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden border">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Package className={`h-4 w-4 text-muted-foreground ${product.image_url ? 'hidden' : ''}`} />
            </div>

            <span className="font-semibold">{product.name}</span>
            <Badge variant="outline">{variants.length} variant{variants.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Total: <span className="font-medium text-foreground">{totalStock}</span></span>
            {lowStockCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {lowStockCount} low
              </Badge>
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Category group component
function CategoryGroup({
  category,
  products,
  onUpdate,
  defaultOpen = false
}: {
  category: Category;
  products: Product[];
  onUpdate: (id: string, newStock: number) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const categoryProducts = products.filter(p => p.category_id === category.id);
  const totalVariants = categoryProducts.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
  const totalStock = categoryProducts.reduce((sum, p) =>
    sum + (p.variants?.reduce((vs, v) => vs + (v.stock_quantity ?? 0), 0) || 0), 0);

  if (categoryProducts.length === 0) return null;

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="py-4 hover:bg-muted/30 rounded-t-lg cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? <FolderOpen className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge variant="outline">
                  {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''} • {totalVariants} variants
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Total stock: <span className="font-semibold text-foreground">{totalStock.toLocaleString()}</span>
                </span>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {categoryProducts.map((product) => (
              <ProductGroup
                key={product.id}
                product={product}
                onUpdate={onUpdate}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const { data: allProducts = [], isLoading } = useProducts();
  const { data: allCategories = [] } = useCategories();
  const updateVariant = useUpdateVariant();

  // Handle stock update - variant specific
  const handleStockUpdate = (variantId: string, newStock: number) => {
    console.log(`[Inventory] Requesting update for Variant ID: ${variantId} -> New Stock: ${newStock}`);
    updateVariant.mutate({ id: variantId, stock_quantity: newStock });
  };

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;

      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.variants?.some(v =>
          v.variant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStock = stockFilter === 'all' || product.variants?.some(v => {
        const status = getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10);
        return status === stockFilter;
      });

      return matchesCategory && matchesSearch && matchesStock;
    }) || [];
  }, [allProducts, categoryFilter, searchQuery, stockFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const allVariants = allProducts.flatMap(p => p.variants || []);
    return {
      totalVariants: allVariants.length,
      totalStock: allVariants.reduce((acc, v) => acc + (v.stock_quantity ?? 0), 0),
      lowStockCount: allVariants.filter(v => getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10) === 'low_stock').length,
      outOfStockCount: allVariants.filter(v => getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10) === 'out_of_stock').length,
    };
  }, [allProducts]);

  // Get filtered categories that have products
  const activeCategories = useMemo(() => {
    return allCategories.filter(c =>
      filteredProducts.some(p => p.category_id === c.id)
    ) || [];
  }, [allCategories, filteredProducts]);

  // Products without category
  const uncategorizedProducts = useMemo(() => {
    return filteredProducts.filter(p => !p.category_id);
  }, [filteredProducts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Track stock levels by category, product, and variant.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVariants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Stock Overview</CardTitle>
          <CardDescription>Organized by Category → Product → Variant</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, variants, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="sm:w-[180px]">
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

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading inventory...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'No items match your filters.'
                  : 'No inventory data yet.'}
              </p>
            </div>
          ) : (
            <div>
              {/* Render categories with their products */}
              {activeCategories.map((category) => (
                <CategoryGroup
                  key={category.id}
                  category={category}
                  products={filteredProducts}
                  onUpdate={handleStockUpdate}
                />
              ))}

              {/* Uncategorized products */}
              {uncategorizedProducts.length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Uncategorized</CardTitle>
                      <Badge variant="outline">{uncategorizedProducts.length} products</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {uncategorizedProducts.map((product) => (
                      <ProductGroup
                        key={product.id}
                        product={product}
                        onUpdate={handleStockUpdate}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPageWrapper() {
  return (
    <ErrorBoundary>
      <InventoryPage />
    </ErrorBoundary>
  );
}
