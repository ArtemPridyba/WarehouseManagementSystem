import { useState, useCallback } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
}

export function useConfirm() {
    const [options, setOptions]   = useState<ConfirmOptions | null>(null);
    const [resolver, setResolver] = useState<((confirmed: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setOptions(opts);
            setResolver(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        resolver?.(true);
        setOptions(null);
        setResolver(null);
    }, [resolver]);

    const handleClose = useCallback(() => {
        resolver?.(false);
        setOptions(null);
        setResolver(null);
    }, [resolver]);

    return { confirm, options, handleConfirm, handleClose };
}