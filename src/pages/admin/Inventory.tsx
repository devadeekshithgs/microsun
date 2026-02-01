import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, AlertTriangle } from 'lucide-react';
import { useProducts, useCategories, type ProductVariant } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  
  // Flatten products and variants for inventory view
  const inventoryItems = products?.flatMap((product) => 
    (product.variants || []).map((variant) => ({
      ...variant,
      productName: product.name,
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
      in_stock: { label: 'In Stock', variant: 'default' as const },
      low_stock: { label: 'Low Stock', variant: 'secondary' as const },
      out_of_stock: { label: 'Out of Stock', variant: 'destructive' as const },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
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
      <div className="grid gap-4 md:grid-cols-4">
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
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
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
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Stock Overview</CardTitle>
              <CardDescription>Monitor and update inventory levels</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, variant, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:w-[250px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-[150px]">
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
                <SelectTrigger className="sm:w-[150px]">
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
            <p className="text-sm text-muted-foreground text-center py-12">
              {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'No items match your filters.' 
                : 'No inventory data. Stock levels will appear once products are added.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Low Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.variant_name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                      <TableCell className="text-right font-medium">{item.stock_quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.low_stock_threshold}</TableCell>
                      <TableCell>{getStockBadge(item)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
