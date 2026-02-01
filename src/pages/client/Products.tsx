import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronRight, ShoppingCart, Package } from 'lucide-react';
import { useProducts, useCategories, type Product, type ProductVariant } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Map<string, { variant: ProductVariant; quantity: number; productName: string }>>(new Map());
  
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
  
  const toggleProductExpanded = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };
  
  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(variant.id);
      if (existing) {
        next.set(variant.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(variant.id, { variant, quantity: 1, productName: product.name });
      }
      return next;
    });
    toast.success(`Added ${product.name} - ${variant.variant_name} to cart`);
  };
  
  const getStockBadge = (variant: ProductVariant) => {
    const status = getStockStatus(variant.stock_quantity ?? 0, variant.low_stock_threshold ?? 10);
    if (status === 'out_of_stock') {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (status === 'low_stock') {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
  };
  
  const isInStock = (variant: ProductVariant) => {
    return (variant.stock_quantity ?? 0) > 0;
  };
  
  const cartItemCount = Array.from(cart.values()).reduce((acc, item) => acc + item.quantity, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Browse our product catalog and add items to your cart.</p>
        </div>
        {cartItemCount > 0 && (
          <Button asChild>
            <a href="/client/cart">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart ({cartItemCount})
            </a>
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Select products and variants to order</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:w-[200px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.filter(c => c.is_active).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'No products match your search criteria.' 
                  : 'Products will appear here once the catalog is set up.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => {
                const activeVariants = product.variants?.filter(v => v.is_active) || [];
                
                return (
                  <Collapsible
                    key={product.id}
                    open={expandedProducts.has(product.id)}
                    onOpenChange={() => toggleProductExpanded(product.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 text-left">
                          <div className="flex items-center gap-3 flex-1">
                            {expandedProducts.has(product.id) ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium truncate">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.category?.name || 'Uncategorized'} • {activeVariants.length} variant(s)
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t px-4 py-3 bg-muted/30">
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                          )}
                          {activeVariants.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {activeVariants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                >
                                  <div className="min-w-0">
                                    <div className="font-medium">{variant.variant_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {variant.sku && <span>SKU: {variant.sku}</span>}
                                    </div>
                                    <div className="mt-1">{getStockBadge(variant)}</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product, variant);
                                    }}
                                    disabled={!isInStock(variant)}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No variants available for this product.
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
