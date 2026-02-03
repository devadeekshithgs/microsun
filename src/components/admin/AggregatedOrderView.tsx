import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Package, Search, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

interface AggregatedOrderViewProps {
    orders: Order[];
}

interface ProductSummary {
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    imageUrl: string | null;
    totalQuantity: number;
    stockQuantity: number;
    lowStockThreshold: number;
    mtoQuantity: number;
    clientOrders: { clientId: string; clientName: string; companyName: string | null; quantity: number }[];
}

export function AggregatedOrderView({ orders }: AggregatedOrderViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const { data: products } = useProducts();

    // Build product summary from all orders
    const productSummary = useMemo(() => {
        const summary: Record<string, ProductSummary> = {};

        orders.forEach(order => {
            order.items?.forEach(item => {
                const variantId = item.variant_id;
                const isMTO = (item as any).is_make_to_order || false;

                if (!summary[variantId]) {
                    // Find stock info from products
                    let stockQuantity = 0;
                    let lowStockThreshold = 10;

                    products?.forEach(product => {
                        product.variants?.forEach(variant => {
                            if (variant.id === variantId) {
                                stockQuantity = variant.stock_quantity;
                                lowStockThreshold = variant.low_stock_threshold;
                            }
                        });
                    });

                    summary[variantId] = {
                        productId: item.variant?.product?.id || '',
                        productName: item.variant?.product?.name || 'Unknown',
                        variantId,
                        variantName: item.variant?.variant_name || 'Unknown',
                        imageUrl: item.variant?.product?.image_url || null,
                        totalQuantity: 0,
                        stockQuantity,
                        lowStockThreshold,
                        mtoQuantity: 0,
                        clientOrders: []
                    };
                }

                summary[variantId].totalQuantity += item.quantity;
                if (isMTO) {
                    summary[variantId].mtoQuantity += item.quantity;
                }

                // Add client order
                const existingClientOrder = summary[variantId].clientOrders.find(
                    co => co.clientId === order.client_id
                );
                if (existingClientOrder) {
                    existingClientOrder.quantity += item.quantity;
                } else {
                    summary[variantId].clientOrders.push({
                        clientId: order.client_id,
                        clientName: order.client?.full_name || 'Unknown',
                        companyName: order.client?.company_name || null,
                        quantity: item.quantity
                    });
                }
            });
        });

        return Object.values(summary);
    }, [orders, products]);

    // Get unique clients
    const clients = useMemo(() => {
        const clientMap = new Map<string, { id: string; name: string; company: string | null }>();
        orders.forEach(order => {
            if (!clientMap.has(order.client_id)) {
                clientMap.set(order.client_id, {
                    id: order.client_id,
                    name: order.client?.full_name || 'Unknown',
                    company: order.client?.company_name || null
                });
            }
        });
        return Array.from(clientMap.values());
    }, [orders]);

    // Filter products by search
    const filteredProducts = productSummary.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variantName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get orders for selected client
    const clientOrders = useMemo(() => {
        if (!selectedClient) return [];
        return orders.filter(o => o.client_id === selectedClient);
    }, [orders, selectedClient]);

    const selectedClientInfo = clients.find(c => c.id === selectedClient);

    const getStockStatus = (qty: number, threshold: number, ordered: number) => {
        const remaining = qty - ordered;
        if (remaining <= 0) return { status: 'out', color: 'destructive' };
        if (remaining <= threshold) return { status: 'low', color: 'warning' };
        return { status: 'ok', color: 'success' };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Order Analytics
                </CardTitle>
                <CardDescription>Aggregated view of pending orders by product and client</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="products" className="space-y-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="products" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Product Summary
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            By Client
                        </TabsTrigger>
                    </TabsList>

                    {/* Product Summary Tab */}
                    <TabsContent value="products" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[300px]">Product / Variant</TableHead>
                                        <TableHead className="text-center">Total Ordered</TableHead>
                                        <TableHead className="text-center">Make to Order</TableHead>
                                        <TableHead className="text-center">In Stock</TableHead>
                                        <TableHead className="text-center">After Order</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No products found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map(product => {
                                            const remaining = product.stockQuantity - (product.totalQuantity - product.mtoQuantity);
                                            const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold, product.totalQuantity - product.mtoQuantity);

                                            return (
                                                <TableRow key={product.variantId}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {product.imageUrl ? (
                                                                <img
                                                                    src={product.imageUrl}
                                                                    alt=""
                                                                    className="h-10 w-10 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium">{product.productName}</p>
                                                                <p className="text-sm text-muted-foreground">{product.variantName}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold text-lg">
                                                        {product.totalQuantity}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {product.mtoQuantity > 0 ? (
                                                            <Badge variant="outline" className="border-orange-400 text-orange-600">
                                                                {product.mtoQuantity}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">{product.stockQuantity}</TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        <span className={remaining < 0 ? 'text-destructive' : ''}>
                                                            {remaining}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {stockStatus.status === 'out' ? (
                                                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Out of Stock
                                                            </Badge>
                                                        ) : stockStatus.status === 'low' ? (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Low Stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                                                <CheckCircle className="h-3 w-3" />
                                                                In Stock
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Client View Tab */}
                    <TabsContent value="clients" className="space-y-4">
                        {!selectedClient ? (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {clients.map(client => {
                                    const clientOrderCount = orders.filter(o => o.client_id === client.id).length;
                                    const totalItems = orders
                                        .filter(o => o.client_id === client.id)
                                        .reduce((acc, o) => acc + (o.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0);

                                    return (
                                        <Card
                                            key={client.id}
                                            className="cursor-pointer hover:border-primary/50 transition-colors"
                                            onClick={() => setSelectedClient(client.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{client.name}</p>
                                                        {client.company && (
                                                            <p className="text-sm text-muted-foreground">{client.company}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="secondary">{clientOrderCount} orders</Badge>
                                                        <p className="text-sm text-muted-foreground mt-1">{totalItems} items</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{selectedClientInfo?.name}</h3>
                                        {selectedClientInfo?.company && (
                                            <p className="text-muted-foreground">{selectedClientInfo.company}</p>
                                        )}
                                    </div>
                                    <Button variant="outline" onClick={() => setSelectedClient(null)}>
                                        Back to All Clients
                                    </Button>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Product</TableHead>
                                                <TableHead>Variant</TableHead>
                                                <TableHead className="text-center">Quantity</TableHead>
                                                <TableHead className="text-center">Stock Available</TableHead>
                                                <TableHead>Type</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {clientOrders.flatMap(order =>
                                                order.items?.map(item => {
                                                    const productInfo = productSummary.find(p => p.variantId === item.variant_id);
                                                    const isMTO = (item as any).is_make_to_order;

                                                    return (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {item.variant?.product?.image_url ? (
                                                                        <img
                                                                            src={item.variant.product.image_url}
                                                                            alt=""
                                                                            className="h-8 w-8 rounded object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded bg-muted" />
                                                                    )}
                                                                    <span className="font-medium">{item.variant?.product?.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{item.variant?.variant_name}</TableCell>
                                                            <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                                                            <TableCell className="text-center">{productInfo?.stockQuantity || 0}</TableCell>
                                                            <TableCell>
                                                                {isMTO ? (
                                                                    <Badge variant="outline" className="border-orange-400 text-orange-600">
                                                                        Make to Order
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary">In Stock</Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }) || []
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
