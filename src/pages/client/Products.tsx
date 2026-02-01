import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, Package, Plus, Minus, LayoutGrid, List } from 'lucide-react';
import { useProducts, useCategories, type Product, type ProductVariant } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type ViewMode = 'grid' | 'bulk';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [cart, setCart] = useState<Map<string, { variant: ProductVariant; quantity: number; productName: string; productImage: string | null }>>(new Map());
  
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
  
  const updateCart = (productName: string, productImage: string | null, variant: ProductVariant, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(variant.id);
      const newQty = (existing?.quantity || 0) + delta;
      
      if (newQty <= 0) {
        next.delete(variant.id);
      } else {
        next.set(variant.id, { 
          variant, 
          quantity: newQty, 
          productName,
          productImage
        });
      }
      return next;
    });
    
    if (delta > 0) {
      toast.success(`Added to cart`);
    }
  };

  const getCartQuantity = (variantId: string) => {
    return cart.get(variantId)?.quantity || 0;
  };
  
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
  
  const cartItemCount = Array.from(cart.values()).reduce((acc, item) => acc + item.quantity, 0);
  
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
          {cartItemCount > 0 && (
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/client/cart">
                <ShoppingCart className="mr-2 h-5 w-5" />
                View Cart ({cartItemCount})
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
                        <TableHead className="w-[80px]">Image</TableHead>
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
                        const cartQty = getCartQuantity(variant.id);
                        
                        return (
                          <TableRow key={variant.id}>
                            <TableCell>
                              <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden">
                                {variant.productImage ? (
                                  <img 
                                    src={variant.productImage} 
                                    alt={variant.productName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-muted-foreground/50" />
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
                                  onClick={() => updateCart(variant.productName, variant.productImage, variant, -1)}
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
                                      updateCart(variant.productName, variant.productImage, variant, delta);
                                    }
                                  }}
                                  className="w-16 h-10 text-center"
                                  disabled={!inStock}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => updateCart(variant.productName, variant.productImage, variant, 1)}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const activeVariants = product.variants?.filter(v => v.is_active) || [];
                
                return activeVariants.map((variant) => {
                  const inStock = isInStock(variant);
                  const cartQty = getCartQuantity(variant.id);
                  
                  return (
                    <Card key={variant.id} className="overflow-hidden flex flex-col">
                      {/* Product Image - Large and prominent */}
                      <div className="aspect-square bg-muted relative">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-20 w-20 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          {getStockBadge(variant)}
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            {variant.sku || 'No SKU'}
                          </div>
                          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{variant.variant_name}</p>
                        </div>
                        
                        {/* Add to Cart Controls */}
                        <div className="mt-4">
                          {cartQty > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => updateCart(product.name, product.image_url, variant, -1)}
                              >
                                <Minus className="h-5 w-5" />
                              </Button>
                              <div className="flex-1 text-center">
                                <span className="text-xl font-bold">{cartQty}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => updateCart(product.name, product.image_url, variant, 1)}
                                disabled={!inStock}
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              className="w-full h-12 text-base"
                              onClick={() => updateCart(product.name, product.image_url, variant, 1)}
                              disabled={!inStock}
                            >
                              <Plus className="mr-2 h-5 w-5" />
                              Add to Order
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
