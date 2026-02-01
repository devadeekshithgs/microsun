import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Search, MoreVertical, Pencil, Trash2, Package, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
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
      in_stock: { label: 'In Stock', variant: 'default' as const },
      low_stock: { label: 'Low Stock', variant: 'secondary' as const },
      out_of_stock: { label: 'Out of Stock', variant: 'destructive' as const },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };
  
  const totalProducts = products?.length || 0;
  const totalVariants = products?.reduce((acc, p) => acc + (p.variants?.length || 0), 0) || 0;
  const lowStockCount = products?.reduce((acc, p) => 
    acc + (p.variants?.filter(v => getStockStatus(v.stock_quantity ?? 0, v.low_stock_threshold ?? 10) !== 'in_stock').length || 0), 0) || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage product catalog and variants.</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>Add, edit, and manage products</CardDescription>
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
                <p className="text-sm text-muted-foreground text-center py-12">
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'No products match your search criteria.' 
                    : 'No products yet. Add products to start building your catalog.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <Collapsible
                      key={product.id}
                      open={expandedProducts.has(product.id)}
                      onOpenChange={() => toggleProductExpanded(product.id)}
                    >
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left">
                            {expandedProducts.has(product.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{product.name}</span>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddVariant(product.id)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Variant
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteConfirm('product', product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="border-t px-4 py-3 bg-muted/30">
                            {product.description && (
                              <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                            )}
                            {product.variants && product.variants.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.variants.map((variant) => (
                                    <TableRow key={variant.id}>
                                      <TableCell className="font-medium">
                                        {variant.variant_name}
                                        {!variant.is_active && (
                                          <Badge variant="secondary" className="ml-2">Inactive</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {variant.sku || '-'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {variant.stock_quantity}
                                      </TableCell>
                                      <TableCell>
                                        {getStockBadge(variant)}
                                      </TableCell>
                                      <TableCell>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditVariant(product.id, variant)}>
                                              <Pencil className="mr-2 h-4 w-4" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => handleDeleteConfirm('variant', variant.id)}
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                No variants. 
                                <Button 
                                  variant="link" 
                                  className="px-1"
                                  onClick={() => handleAddVariant(product.id)}
                                >
                                  Add a variant
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
              <Button onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Loading categories...</p>
              ) : categories?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No categories yet. Add categories to organize your products.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-center">Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map((category) => {
                      const productCount = products?.filter(p => p.category_id === category.id).length || 0;
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {category.description || '-'}
                          </TableCell>
                          <TableCell className="text-center">{productCount}</TableCell>
                          <TableCell className="text-center">{category.display_order}</TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteConfirm('category', category.id)}
                                  disabled={productCount > 0}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
