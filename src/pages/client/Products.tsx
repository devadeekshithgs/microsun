import { useState, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ClientProductCard from '@/components/client/ClientProductCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, Package, Plus, Minus, LayoutGrid, List } from 'lucide-react';
import { useProducts, useCategories, type Product, type ProductVariant } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { getStockStatus } from '@/lib/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type ViewMode = 'grid' | 'bulk';

interface GridItem {
  product: Product;
  variant: ProductVariant;
}

interface VirtualizedClientGridProps {
  items: GridItem[];
  cart: Map<string, { quantity: number }>;
  activeInputs: Set<string>;
  onUpdateCart: (productName: string, productImage: string | null, variant: ProductVariant, delta: number, forceRemove?: boolean) => void;
  onSetQuantity: (productName: string, productImage: string | null, variant: ProductVariant, newQty: number) => void;
  onInputBlur: (variantId: string) => void;
  onActivateInput: (variantId: string) => void;
}

function VirtualizedClientGrid({
  items,
  cart,
  activeInputs,
  onUpdateCart,
  onSetQuantity,
  onInputBlur,
  onActivateInput
}: VirtualizedClientGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const getColumnCount = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2; // sm to lg
    if (width < 1280) return 3; // lg to xl
    if (width < 1536) return 4; // xl to 2xl
    return 5; // 2xl+
  };

  const [columnCount, setColumnCount] = useState(getColumnCount);

  // Update column count on resize
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rows = useMemo(() => {
    const result: GridItem[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
      result.push(items.slice(i, i + columnCount));
    }
    return result;
  }, [items, columnCount]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500, // Approximate card height
    overscan: 2,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="h-[calc(100vh-250px)] overflow-auto" style={{ contain: 'strict' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4 px-1">
                {row.map((item) => (
                  <ClientProductCard
                    key={item.variant.id}
                    product={item.product}
                    variant={item.variant}
                    cartQuantity={cart.get(item.variant.id)?.quantity || 0}
                    isActiveInput={activeInputs.has(item.variant.id)}
                    onUpdateCart={onUpdateCart}
                    onSetQuantity={onSetQuantity}
                    onInputBlur={onInputBlur}
                    onActivateInput={onActivateInput}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());

  const { cart, itemCount, addToCart, updateQuantity, removeFromCart } = useCart();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  // Filter only active products and variants
  const activeProducts = products?.filter((product) => product.is_active) || [];

  const filteredProducts = activeProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Flatten for bulk view
  const allVariants = filteredProducts.flatMap((product) =>
    (product.variants?.filter(v => v.is_active) || []).map((variant) => ({
      ...variant,
      productName: product.name,
      productImage: product.image_url,
      categoryName: product.category?.name || 'Uncategorized',
    }))
  );

  // Flatten for grid view virtualization
  const gridItems = useMemo(() => {
    return filteredProducts.flatMap((product) =>
      (product.variants?.filter(v => v.is_active) || []).map((variant) => ({
        product,
        variant
      }))
    );
  }, [filteredProducts]);

  const handleUpdateCart = useCallback((productName: string, productImage: string | null, variant: ProductVariant, delta: number, forceRemove = false) => {
    const currentQty = cart.get(variant.id)?.quantity || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0 && forceRemove) {
      removeFromCart(variant.id);
      setActiveInputs(prev => {
        const newSet = new Set(prev);
        newSet.delete(variant.id);
        return newSet;
      });
    } else {
      addToCart(productName, productImage, variant, delta);
      if (delta > 0) {
        toast.success(`Added to cart`);
      }
    }
  }, [cart, addToCart, removeFromCart]);

  const handleSetQuantity = useCallback((productName: string, productImage: string | null, variant: ProductVariant, newQty: number) => {
    updateQuantity(variant.id, Math.max(0, newQty));
  }, [updateQuantity]);

  const handleInputBlur = useCallback((variantId: string) => {
    const qty = cart.get(variantId)?.quantity || 0;
    if (qty <= 0) {
      removeFromCart(variantId);
      setActiveInputs(prev => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
      });
    }
  }, [cart, removeFromCart]);

  const activateInput = useCallback((variantId: string) => {
    setActiveInputs(prev => new Set(prev).add(variantId));
  }, []);

  const getStockBadge = (variant: ProductVariant) => {
    const status = getStockStatus(variant.stock_quantity ?? 0, variant.low_stock_threshold ?? 10);
    if (status === 'out_of_stock') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
    }
    if (status === 'low_stock') {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
  };

  const isInStock = (variant: ProductVariant) => {
    return (variant.stock_quantity ?? 0) > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground">Browse and order products</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={viewMode === 'bulk' ? 'default' : 'outline'}
            size="lg"
            className="h-12 px-6"
            onClick={() => setViewMode(viewMode === 'grid' ? 'bulk' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <>
                <List className="mr-2 h-5 w-5" />
                Bulk Order
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 h-5 w-5" />
                Exit Bulk Mode
              </>
            )}
          </Button>
          {itemCount > 0 && (
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/client/cart">
                <ShoppingCart className="mr-2 h-5 w-5" />
                View Cart ({itemCount})
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  className="h-12 px-6"
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </Button>
                {categories?.filter(c => c.is_active).slice(0, 4).map((category) => (
                  <Button
                    key={category.id}
                    variant={categoryFilter === category.id ? 'default' : 'outline'}
                    className="h-12 px-6"
                    onClick={() => setCategoryFilter(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
                {categories && categories.filter(c => c.is_active).length > 4 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-12 w-[140px]">
                      <SelectValue placeholder="More..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.is_active).slice(4).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery || categoryFilter !== 'all'
                  ? 'No products match your search.'
                  : 'Products will appear here once the catalog is set up.'}
              </p>
            </div>
          ) : viewMode === 'bulk' ? (
            /* Bulk Order View */
            <Card>
              <CardHeader>
                <CardTitle>Bulk Order</CardTitle>
                <CardDescription>Quickly add quantities for multiple products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Image</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center w-[200px]">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allVariants.map((variant) => {
                        const inStock = isInStock(variant);
                        const cartQty = cart.get(variant.id)?.quantity || 0;

                        return (
                          <TableRow key={variant.id} className="h-[120px]">
                            <TableCell className="py-2">
                              <div className="h-24 w-28 rounded-lg bg-muted overflow-hidden">
                                {variant.productImage ? (
                                  <img
                                    src={variant.productImage}
                                    alt={variant.productName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-10 w-10 text-muted-foreground/50" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {variant.sku || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{variant.productName}</div>
                              <div className="text-sm text-muted-foreground">{variant.variant_name}</div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {variant.categoryName}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={inStock ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                                {variant.stock_quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => handleUpdateCart(variant.productName, variant.productImage, variant, -1)}
                                  disabled={cartQty === 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={cartQty}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 0;
                                    const delta = newQty - cartQty;
                                    if (delta !== 0) {
                                      handleUpdateCart(variant.productName, variant.productImage, variant, delta);
                                    }
                                  }}
                                  className="w-16 h-10 text-center"
                                  disabled={!inStock}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => handleUpdateCart(variant.productName, variant.productImage, variant, 1)}
                                  disabled={!inStock}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Grid View */
            /* Virtualized Grid View */
            <VirtualizedClientGrid
              items={gridItems}
              cart={cart}
              activeInputs={activeInputs}
              onUpdateCart={handleUpdateCart}
              onSetQuantity={handleSetQuantity}
              onInputBlur={handleInputBlur}
              onActivateInput={activateInput}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

