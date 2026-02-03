import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Package, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { type Product, type ProductVariant } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
    product: Product;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onEditProduct: (product: Product) => void;
    onAddVariant: (productId: string) => void;
    onEditVariant: (productId: string, variant: ProductVariant) => void;
    onDeleteProduct: (id: string) => void;
    onDeleteVariant: (id: string) => void;
}

const ProductCard = memo(({
    product,
    isExpanded,
    onToggleExpand,
    onEditProduct,
    onAddVariant,
    onEditVariant,
    onDeleteProduct,
    onDeleteVariant
}: ProductCardProps) => {

    const getStockBadge = (variant: ProductVariant) => {
        const status = getStockStatus(variant.stock_quantity ?? 0, variant.low_stock_threshold ?? 10);
        const config = {
            in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
            low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
            out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
        };
        return <Badge className={config[status].className}>{config[status].label}</Badge>;
    };

    return (
        <div
            className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col bg-card"
        >
            <div className="relative bg-muted overflow-hidden" style={{ height: '180px' }}>
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        style={{
                            aspectRatio: '16/9',
                            backgroundColor: 'hsl(var(--muted))'
                        }}
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                )}
                {!product.is_active && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Inactive</Badge>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="w-full">
                        <h3 className="font-semibold text-lg line-clamp-1" title={product.name}>{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>{product.variants?.length || 0} variant(s)</span>
                </div>

                <div className="mt-auto pt-4 border-t flex items-center gap-2 justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-0 hover:bg-transparent"
                        onClick={() => onToggleExpand(product.id)}
                    >
                        {isExpanded ? 'Hide Variants' : 'View Variants'}
                        {isExpanded ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditProduct(product);
                            }}
                            title="Edit Product"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProduct(product.id);
                            }}
                            title="Delete Product"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Manual conditional rendering instead of Collapsible for performance */}
            {isExpanded && (
                <div className="border-t px-4 py-4 bg-muted/30 text-sm animate-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-muted-foreground">Variants</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAddVariant(product.id)}>
                            <Plus className="mr-1 h-3 w-3" /> Add
                        </Button>
                    </div>

                    {product.variants && product.variants.length > 0 ? (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {product.variants.map((variant) => (
                                <div key={variant.id} className="p-2 bg-background rounded border flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium truncate" title={variant.variant_name}>{variant.variant_name}</span>
                                        {getStockBadge(variant)}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Qty: {variant.stock_quantity ?? 0}</span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEditVariant(product.id, variant)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDeleteVariant(variant.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-2">No variants</p>
                    )}
                </div>
            )}
        </div>
    );
});

export default ProductCard;
