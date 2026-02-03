import { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Package, FolderOpen } from 'lucide-react';
import { useProducts, useCategories, useDeleteProduct, useDeleteVariant, useDeleteCategory, useProductStats, type Product, type ProductVariant, type Category } from '@/hooks/useProducts';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { VariantDialog } from '@/components/admin/VariantDialog';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import ProductCard from '@/components/admin/ProductCard';

// Virtualized Product Grid for performance
interface VirtualizedProductGridProps {
  products: Product[];
  expandedProducts: Set<string>;
  onToggleExpand: (id: string) => void;
  onEditProduct: (product: Product) => void;
  onAddVariant: (productId: string) => void;
  onEditVariant: (productId: string, variant: ProductVariant) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteVariant: (id: string) => void;
}

function VirtualizedProductGrid({
  products,
  expandedProducts,
  onToggleExpand,
  onEditProduct,
  onAddVariant,
  onEditVariant,
  onDeleteProduct,
  onDeleteVariant,
}: VirtualizedProductGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on a fixed breakpoint assumption
  // For simplicity, we use 4 columns (can be made responsive with resize observer)
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 768) return 1; // mobile
    if (width < 1024) return 2; // tablet
    if (width < 1280) return 3; // small desktop
    return 4; // large desktop
  };

  const [columnCount, setColumnCount] = useState(getColumnCount);

  // Update column count on resize
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Group products into rows
  const rows = useMemo(() => {
    const result: Product[][] = [];
    for (let i = 0; i < products.length; i += columnCount) {
      result.push(products.slice(i, i + columnCount));
    }
    return result;
  }, [products, columnCount]);

  // Estimate row height: base card ~320px, expanded adds ~200px
  const getRowHeight = useCallback((index: number) => {
    const row = rows[index];
    const hasExpanded = row?.some(p => expandedProducts.has(p.id));
    return hasExpanded ? 520 : 350; // Approximate heights
  }, [rows, expandedProducts]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => getRowHeight(index),
    overscan: 2, // Render 2 extra rows above/below viewport
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }}
    >
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {row.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isExpanded={expandedProducts.has(product.id)}
                    onToggleExpand={onToggleExpand}
                    onEditProduct={onEditProduct}
                    onAddVariant={onAddVariant}
                    onEditVariant={onEditVariant}
                    onDeleteProduct={onDeleteProduct}
                    onDeleteVariant={onDeleteVariant}
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

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'product' | 'variant' | 'category'>('product');
  const [deleteId, setDeleteId] = useState<string>('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Fetch ALL products at once as requested
  const { data: productsData, isLoading: productsLoading } = useProducts();

  // Client-side filtering
  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter(product => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [productsData, searchQuery, categoryFilter]);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const deleteProduct = useDeleteProduct();
  const deleteVariant = useDeleteVariant();
  const deleteCategory = useDeleteCategory();

  // Handlers wrapped in useCallback for performance (passes stable props to memoized ProductCard)
  const toggleProductExpanded = useCallback((productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };

  const handleAddVariant = useCallback((productId: string) => {
    setSelectedProductForVariant(productId);
    setSelectedVariant(null);
    setVariantDialogOpen(true);
  }, []);

  const handleEditVariant = useCallback((productId: string, variant: ProductVariant) => {
    setSelectedProductForVariant(productId);
    setSelectedVariant(variant);
    setVariantDialogOpen(true);
  }, []);

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleDeleteConfirm = useCallback((type: 'product' | 'variant' | 'category', id: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, []); // Note category delete uses this too, but we can pass 'category' type

  const handleDeleteProduct = useCallback((id: string) => handleDeleteConfirm('product', id), [handleDeleteConfirm]);
  const handleDeleteVariant = useCallback((id: string) => handleDeleteConfirm('variant', id), [handleDeleteConfirm]);


  const executeDelete = async () => {
    if (deleteType === 'product') {
      await deleteProduct.mutateAsync(deleteId);
    } else if (deleteType === 'variant') {
      await deleteVariant.mutateAsync(deleteId);
    } else {
      await deleteCategory.mutateAsync(deleteId);
    }
    setDeleteDialogOpen(false);
  };

  // Stats can now be computed directly from the full list 'productsData' (for accurate total counts)
  const { data: stats } = useProductStats();
  const totalProducts = productsData?.length || 0;
  const totalVariants = stats?.totalVariants || 0;
  const lowStockCount = stats?.lowStockCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage product catalog and variants.</p>
        </div>
        <Button size="lg" className="h-12 px-6" onClick={handleAddProduct}>
          <Plus className="mr-2 h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVariants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low/Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>Add, edit, and manage products</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="sm:w-[200px] h-12">
                      <SelectValue placeholder="All Categories" />
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Loading products...</p>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {searchQuery || categoryFilter !== 'all'
                      ? 'No products match your search.'
                      : 'No products yet.'}
                  </p>
                  <Button className="mt-4" onClick={handleAddProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <VirtualizedProductGrid
                  products={products}
                  expandedProducts={expandedProducts}
                  onToggleExpand={toggleProductExpanded}
                  onEditProduct={handleEditProduct}
                  onAddVariant={handleAddVariant}
                  onEditVariant={handleEditVariant}
                  onDeleteProduct={handleDeleteProduct}
                  onDeleteVariant={handleDeleteVariant}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Organize products into categories</CardDescription>
              </div>
              <Button size="lg" className="h-12 px-6" onClick={handleAddCategory}>
                <Plus className="mr-2 h-5 w-5" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Loading categories...</p>
              ) : categories?.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No categories yet</p>
                  <Button className="mt-4" onClick={handleAddCategory}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories?.map((category) => {
                    const productCount = products?.filter(p => p.category_id === category.id).length || 0;
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{category.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {productCount} product(s) • Order: {category.display_order}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-11"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteConfirm('category', category.id)}
                            disabled={productCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
      />

      <VariantDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        productId={selectedProductForVariant}
        variant={selectedVariant}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {deleteType === 'product' ? 'product and all its variants' : deleteType}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-12"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
