import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Search, Pencil, Trash2, Package, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { useProducts, useCategories, useDeleteProduct, useDeleteVariant, useDeleteCategory, type Product, type ProductVariant, type Category } from '@/hooks/useProducts';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { VariantDialog } from '@/components/admin/VariantDialog';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import { getStockStatus } from '@/lib/types';

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
  
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const deleteProduct = useDeleteProduct();
  const deleteVariant = useDeleteVariant();
  const deleteCategory = useDeleteCategory();
  
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];
  
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
  
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };
  
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };
  
  const handleAddVariant = (productId: string) => {
    setSelectedProductForVariant(productId);
    setSelectedVariant(null);
    setVariantDialogOpen(true);
  };
  
  const handleEditVariant = (productId: string, variant: ProductVariant) => {
    setSelectedProductForVariant(productId);
    setSelectedVariant(variant);
    setVariantDialogOpen(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };
  
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };
  
  const handleDeleteConfirm = (type: 'product' | 'variant' | 'category', id: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };
  
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
  
  const getStockBadge = (variant: ProductVariant) => {
    const status = getStockStatus(variant.stock_quantity ?? 0, variant.low_stock_threshold ?? 10);
    const config = {
      in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
      out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    return <Badge className={config[status].className}>{config[status].label}</Badge>;
  };
  
  const totalProducts = products?.length || 0;
  const totalVariants = products?.reduce((acc, p) => acc + (p.variants?.length || 0), 0) || 0;
  const lowStockCount = products?.reduce((acc, p) => 
    acc + (p.variants?.filter(v => getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10) !== 'in_stock').length || 0), 0) || 0;
  
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
              ) : filteredProducts.length === 0 ? (
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
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <Collapsible
                      key={product.id}
                      open={expandedProducts.has(product.id)}
                      onOpenChange={() => toggleProductExpanded(product.id)}
                    >
                      <div className="border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-4 p-4 hover:bg-muted/50">
                          {/* Product Image */}
                          <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          
                          <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left min-w-0">
                            {expandedProducts.has(product.id) ? (
                              <ChevronDown className="h-5 w-5 shrink-0" />
                            ) : (
                              <ChevronRight className="h-5 w-5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-lg truncate">{product.name}</span>
                                {!product.is_active && (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{product.category?.name || 'Uncategorized'}</span>
                                <span>•</span>
                                <span>{product.variants?.length || 0} variant(s)</span>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          {/* Direct Edit Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-11 px-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProduct(product);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-11 px-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddVariant(product.id);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Variant
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-11 w-11 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfirm('product', product.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="border-t px-4 py-4 bg-muted/30">
                            {product.description && (
                              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                            )}
                            {product.variants && product.variants.length > 0 ? (
                              <div className="space-y-2">
                                {product.variants.map((variant) => (
                                  <div
                                    key={variant.id}
                                    className="flex items-center justify-between p-4 bg-background rounded-lg border"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{variant.variant_name}</span>
                                        {!variant.is_active && (
                                          <Badge variant="secondary">Inactive</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        {variant.sku && <span>SKU: {variant.sku}</span>}
                                        <span>Stock: {variant.stock_quantity}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {getStockBadge(variant)}
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-10"
                                        onClick={() => handleEditVariant(product.id, variant)}
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteConfirm('variant', variant.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground mb-3">No variants yet</p>
                                <Button onClick={() => handleAddVariant(product.id)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Variant
                                </Button>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
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
