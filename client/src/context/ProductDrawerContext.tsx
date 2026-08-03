import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer';

interface DrawerOptions {
    productId: string;
    productName: string;
    sku: string;
    // Опціонально — тільки InventoryPage передає ці колбеки
    onTransfer?: (item: import('../types').StockItem) => void;
    onAdjust?: (item: import('../types').StockItem) => void;
    canManage?: boolean;
}

interface ProductDrawerContextValue {
    openProductDrawer: (
        productId: string,
        productName: string,
        sku: string,
        options?: Pick<DrawerOptions, 'onTransfer' | 'onAdjust' | 'canManage'>
    ) => void;
}

const ProductDrawerContext = createContext<ProductDrawerContextValue>({
    openProductDrawer: () => {},
});

export function useProductDrawer() {
    return useContext(ProductDrawerContext);
}

export function ProductDrawerProvider({ children }: { children: ReactNode }) {
    const [drawer, setDrawer] = useState<DrawerOptions | null>(null);

    const openProductDrawer = useCallback((
        productId: string,
        productName: string,
        sku: string,
        options?: Pick<DrawerOptions, 'onTransfer' | 'onAdjust' | 'canManage'>
    ) => {
        setDrawer({ productId, productName, sku, ...options });
    }, []);

    const close = useCallback(() => setDrawer(null), []);

    return (
        <ProductDrawerContext.Provider value={{ openProductDrawer }}>
            {children}
            {drawer && (
                <ProductDetailDrawer
                    productId={drawer.productId}
                    productName={drawer.productName}
                    sku={drawer.sku}
                    onClose={close}
                    onTransfer={drawer.onTransfer ? item => { close(); drawer.onTransfer!(item); } : undefined}
                    onAdjust={drawer.onAdjust ? item => { close(); drawer.onAdjust!(item); } : undefined}
                    canManage={drawer.canManage ?? false}
                />
            )}
        </ProductDrawerContext.Provider>
    );
}