import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ClientProductCard from '@/components/client/ClientProductCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, Package, Plus, Minus, LayoutGrid, List, ChevronDown, ChevronRight, Folder, FolderOpen, AlertTriangle } from 'lucide-react';
import { useProducts, useCategories, type Product, type ProductVariant, type Category } from '@/hooks/useProducts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

// Client Variant Row - shows individual variant with quantity controls
// All products are make-to-order - no stock restrictions
function ClientVariantRow({
  variant,
  productName,
  productImage,
  cart,
  onUpdateCart
}: {
  variant: ProductVariant;
  productName: string;
  productImage: string | null;
  cart: Map<string, { quantity: number }>;
  onUpdateCart: (productName: string, productImage: string | null, variant: ProductVariant, delta: number) => void;
}) {
  const cartQty = cart.get(variant.id)?.quantity || 0;

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 hover:bg-muted/30">
      <div className="flex items-center gap-4 flex-1">
        {/* Variant Image */}
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
          {variant.image_url || productImage ? (
            <img
              src={variant.image_url || productImage || ''}
              alt={variant.variant_name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).classList.remove('hidden');
                }
              }}
            />
          ) : null}
          <Package className={`h-5 w-5 text-muted-foreground ${(variant.image_url || productImage) ? 'hidden' : ''}`} />
        </div>

        {/* Variant Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" title={variant.variant_name}>{variant.variant_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{variant.sku || 'No SKU'}</p>
        </div>
      </div>

      {/* Quantity Controls - All products orderable */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => onUpdateCart(productName, productImage, variant, -1)}
          disabled={cartQty === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min="0"
          value={cartQty === 0 ? '' : cartQty}
          onChange={(e) => {
            const val = e.target.value;
            const newQty = val === '' ? 0 : (parseInt(val) || 0);
            const delta = newQty - cartQty;
            if (delta !== 0) {
              onUpdateCart(productName, productImage, variant, delta);
            }
          }}
          className="w-16 h-9 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => onUpdateCart(productName, productImage, variant, 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Client Product Group - collapsible product with variants
function ClientProductGroup({
  product,
  cart,
  onUpdateCart,
  defaultOpen = false
}: {
  product: Product;
  cart: Map<string, { quantity: number }>;
  onUpdateCart: (productName: string, productImage: string | null, variant: ProductVariant, delta: number) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Sync open state when defaultOpen changes (e.g. when search becomes active)
  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const variants = product.variants || [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg mb-2">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}

            {/* Product Image - Medium Size */}
            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden border">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <Package className={`h-6 w-6 text-muted-foreground ${product.image_url ? 'hidden' : ''}`} />
            </div>

            <span className="font-semibold text-left">{product.name}</span>
            <Badge variant="outline">{variants.length} variant{variants.length !== 1 ? 's' : ''}</Badge>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {variants.map((variant) => (
            <ClientVariantRow
              key={variant.id}
              variant={variant}
              productName={product.name}
              productImage={product.image_url}
              cart={cart}
              onUpdateCart={onUpdateCart}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Client Category Group - collapsible category section
function ClientCategoryGroup({
  category,
  products,
  cart,
  onUpdateCart,
  defaultOpen = false
}: {
  category: Category;
  products: Product[];
  cart: Map<string, { quantity: number }>;
  onUpdateCart: (productName: string, productImage: string | null, variant: ProductVariant, delta: number) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Sync open state when defaultOpen changes
  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const categoryProducts = products.filter(p => p.category_id === category.id);
  const totalVariants = categoryProducts.reduce((sum, p) => sum + (p.variants?.length || 0), 0);

  if (categoryProducts.length === 0) return null;

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="py-4 hover:bg-muted/30 rounded-t-lg cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? <FolderOpen className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                <CardTitle className="text-lg text-left">{category.name}</CardTitle>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''} • {totalVariants} variants
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {categoryProducts.map((product) => (
              <ClientProductGroup
                key={product.id}
                product={product}
                cart={cart}
                onUpdateCart={onUpdateCart}
                defaultOpen={defaultOpen}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function ProductsPage() {

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('bulk');
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());

  const { cart, itemCount, addToCart, updateQuantity, removeFromCart } = useCart();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  // Filter only active products and variants
  const activeProducts = products?.filter((product) => product.is_active) || [];

  // Smart search filter - matches across category, product, variant names, and SKUs
  const filteredProducts = useMemo(() => {
    // Prepare search terms (split by space, lowercase)
    const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hasSearch = searchTerms.length > 0;

    return activeProducts
      .map(product => {
        // Category check
        const category = categories?.find(c => c.id === product.category_id);
        const matchesCategoryFilter = categoryFilter === 'all' || product.category_id === categoryFilter;

        if (!matchesCategoryFilter) return null;

        // Search logic
        let matchingVariants = product.variants?.filter(v => v.is_active) || [];

        if (hasSearch) {
          // Build search context with category + product info
          const productContext = `${product.name} ${category?.name || ''}`.toLowerCase();

          // Filter variants where ALL search terms match in the combined context
          matchingVariants = matchingVariants.filter(variant => {
            const variantContext = `${productContext} ${variant.variant_name} ${variant.sku || ''}`.toLowerCase();
            return searchTerms.every(term => variantContext.includes(term));
          });

          // If no variants match, drop the product
          if (matchingVariants.length === 0) {
            return null;
          }
        }

        // Return product with filtered variants
        return {
          ...product,
          variants: matchingVariants
        };
      })
      .filter((p): p is Product => p !== null && (p.variants?.length ?? 0) > 0);
  }, [activeProducts, categories, categoryFilter, searchQuery]);

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
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="lg"
            className="h-12 px-6"
            onClick={() => setViewMode(viewMode === 'grid' ? 'bulk' : 'grid')}
          >
            {viewMode === 'bulk' ? (
              <>
                <LayoutGrid className="mr-2 h-5 w-5" />
                Grid View
              </>
            ) : (
              <>
                <List className="mr-2 h-5 w-5" />
                Bulk Order
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
                  placeholder="Search categories, products, variants, or SKU..."
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
            /* Hierarchical Bulk Order View */
            <div>
              {/* Render categories with their products */}
              {(categories?.filter(c => c.is_active && filteredProducts.some(p => p.category_id === c.id)) || []).map((category) => (
                <ClientCategoryGroup
                  key={category.id}
                  category={category}
                  products={filteredProducts}
                  cart={cart}
                  onUpdateCart={handleUpdateCart}
                  defaultOpen={searchQuery.trim().length > 0}
                />
              ))}

              {/* Uncategorized products */}
              {filteredProducts.filter(p => !p.category_id).length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Uncategorized</CardTitle>
                      <Badge variant="outline">{filteredProducts.filter(p => !p.category_id).length} products</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {filteredProducts.filter(p => !p.category_id).map((product) => (
                      <ClientProductGroup
                        key={product.id}
                        product={product}
                        cart={cart}
                        onUpdateCart={handleUpdateCart}
                        defaultOpen={searchQuery.trim().length > 0}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
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

