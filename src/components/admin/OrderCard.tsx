import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, User, Building2, Calendar, Package, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@/hooks/useOrders';

interface OrderCardProps {
    order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const hasMTOItems = order.items?.some(item => (item as any).is_make_to_order);

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
            in_production: { label: 'In Production', className: 'bg-purple-100 text-purple-800' },
            ready: { label: 'Ready', className: 'bg-green-100 text-green-800' },
            dispatched: { label: 'Dispatched', className: 'bg-indigo-100 text-indigo-800' },
            delivered: { label: 'Delivered', className: 'bg-gray-100 text-gray-800' },
        };
        const config = statusConfig[status] || { label: status, className: 'bg-yellow-100 text-yellow-800' };
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
        >
            <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isExpanded ? 'ring-2 ring-primary shadow-xl' : 'hover:border-primary/50'
                    }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg font-semibold">{order.order_number}</CardTitle>
                            {getStatusBadge(order.status)}
                            {hasMTOItems && (
                                <Badge variant="outline" className="border-orange-400 text-orange-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Make to Order
                                </Badge>
                            )}
                        </div>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </motion.div>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Summary Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-foreground">{order.client?.full_name || 'Unknown'}</span>
                        </div>
                        {order.client?.company_name && (
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                <span>{order.client.company_name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Package className="h-4 w-4" />
                            <span>{totalItems} items</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(order.created_at), 'dd MMM, HH:mm')}</span>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 border-t">
                                    {/* Products Table */}
                                    <h4 className="font-medium mb-3">Order Items</h4>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Variant</TableHead>
                                                    <TableHead className="text-center">Qty</TableHead>
                                                    <TableHead>Type</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {order.items?.map(item => {
                                                    const isMTO = (item as any).is_make_to_order;
                                                    return (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {item.variant?.product?.image_url && (
                                                                        <img
                                                                            src={item.variant.product.image_url}
                                                                            alt=""
                                                                            className="h-8 w-8 rounded object-cover"
                                                                        />
                                                                    )}
                                                                    {item.variant?.product?.name || 'Unknown Product'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{item.variant?.variant_name || 'N/A'}</TableCell>
                                                            <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                                                            <TableCell>
                                                                {isMTO ? (
                                                                    <Badge variant="outline" className="border-orange-400 text-orange-600 text-xs">
                                                                        Make to Order
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="text-xs">In Stock</Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Notes */}
                                    {order.notes && (
                                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                            <span className="font-medium text-sm">Client Notes:</span>
                                            <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}
