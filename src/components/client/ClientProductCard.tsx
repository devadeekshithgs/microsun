import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus } from 'lucide-react';
import { type Product, type ProductVariant } from '@/hooks/useProducts';
import { getStockStatus } from '@/lib/types';

interface ClientProductCardProps {
    product: Product;
    variant: ProductVariant;
    cartQuantity: number;
    isActiveInput: boolean;
    onUpdateCart: (productName: string, productImage: string | null, variant: ProductVariant, delta: number, forceRemove?: boolean) => void;
    onSetQuantity: (productName: string, productImage: string | null, variant: ProductVariant, qty: number) => void;
    onInputBlur: (variantId: string) => void;
    onActivateInput: (variantId: string) => void;
    onImageClick: (imageUrl: string, imageAlt: string) => void;
}

const ClientProductCard = memo(({
    product,
    variant,
    cartQuantity,
    isActiveInput,
    onUpdateCart,
    onSetQuantity,
    onInputBlur,
    onActivateInput,
    onImageClick
}: ClientProductCardProps) => {
    // All products are make-to-order - no stock visibility needed

    return (
        <Card
            className="overflow-hidden flex flex-col h-full bg-card"
        >
            {/* Product Image - Large and prominent */}
            <div
                className="relative bg-muted overflow-hidden cursor-pointer group"
                style={{ aspectRatio: '1/1' }}
                onClick={() => product.image_url && onImageClick(product.image_url, product.name)}
                title={product.image_url ? 'Click to view full size' : 'No image'}
            >
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        style={{
                            aspectRatio: '1/1',
                            backgroundColor: 'hsl(var(--muted))'
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                )}
            </div>

            {/* Product Info */}
            <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        {variant.sku || 'No SKU'}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1" title={variant.variant_name}>{variant.variant_name}</p>
                </div>

                {/* Add to Cart Controls */}
                <div className="mt-4">
                    {isActiveInput || cartQuantity > 0 ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 shrink-0"
                                onClick={() => onUpdateCart(product.name, product.image_url, variant, -1, true)}
                            >
                                <Minus className="h-5 w-5" />
                            </Button>
                            <Input
                                type="number"
                                min="0"
                                value={cartQuantity === 0 ? '' : cartQuantity}
                                onChange={(e) => {
                                    const newQty = parseInt(e.target.value);
                                    if (!isNaN(newQty)) {
                                        onSetQuantity(product.name, product.image_url, variant, newQty);
                                    } else if (e.target.value === '') {
                                        onSetQuantity(product.name, product.image_url, variant, 0);
                                    }
                                }}
                                onBlur={() => onInputBlur(variant.id)}
                                className="flex-1 h-12 text-center text-xl font-bold"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 shrink-0"
                                onClick={() => onUpdateCart(product.name, product.image_url, variant, 1)}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="w-full h-12 text-base"
                            onClick={() => {
                                onActivateInput(variant.id);
                                onUpdateCart(product.name, product.image_url, variant, 1);
                            }}
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

export default ClientProductCard;
