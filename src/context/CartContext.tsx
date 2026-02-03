import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type ProductVariant } from '@/hooks/useProducts';

export interface CartItem {
    variant: ProductVariant;
    quantity: number;
    productName: string;
    productImage: string | null;
    isMakeToOrder: boolean; // New: Flag for make-to-order items
}

interface CartContextType {
    cart: Map<string, CartItem>;
    itemCount: number;
    mtoItemCount: number; // New: Count of MTO items
    addToCart: (productName: string, productImage: string | null, variant: ProductVariant, quantity: number, isMakeToOrder?: boolean) => void;
    removeFromCart: (variantId: string) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('microsun_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                setCart(new Map(parsed));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('microsun_cart', JSON.stringify(Array.from(cart.entries())));
    }, [cart]);

    const addToCart = (
        productName: string,
        productImage: string | null,
        variant: ProductVariant,
        quantity: number,
        isMakeToOrder: boolean = false
    ) => {
        setCart((prev) => {
            const next = new Map(prev);
            const existing = next.get(variant.id);
            const newQty = (existing?.quantity || 0) + quantity;

            if (newQty <= 0) {
                next.delete(variant.id);
            } else {
                next.set(variant.id, {
                    variant,
                    quantity: newQty,
                    productName,
                    productImage,
                    // Keep MTO flag if item was already in cart as MTO, or use new value
                    isMakeToOrder: existing?.isMakeToOrder || isMakeToOrder
                });
            }
            return next;
        });
    };

    const removeFromCart = (variantId: string) => {
        setCart((prev) => {
            const next = new Map(prev);
            next.delete(variantId);
            return next;
        });
    };

    const updateQuantity = (variantId: string, quantity: number) => {
        setCart((prev) => {
            const next = new Map(prev);
            const item = next.get(variantId);
            if (item) {
                if (quantity <= 0) {
                    next.delete(variantId);
                } else {
                    next.set(variantId, { ...item, quantity });
                }
            }
            return next;
        });
    };

    const clearCart = () => {
        setCart(new Map());
    };

    const itemCount = Array.from(cart.values()).reduce((acc, item) => acc + item.quantity, 0);
    const mtoItemCount = Array.from(cart.values())
        .filter(item => item.isMakeToOrder)
        .reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            itemCount,
            mtoItemCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
