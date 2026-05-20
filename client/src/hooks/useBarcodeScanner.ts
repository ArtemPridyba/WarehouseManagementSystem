import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeOptions {
    onScan: (barcode: string) => void;
    minLength?: number;      // мінімальна довжина щоб не реагувати на одиночні символи
    timeout?: number;        // час між символами — сканер вводить дуже швидко
    enabled?: boolean;
}

export function useBarcodeScanner({
                                      onScan,
                                      minLength = 3,
                                      timeout = 80,
                                      enabled = true,
                                  }: UseBarcodeOptions) {
    const bufferRef   = useRef<string>('');
    const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastKeyTime = useRef<number>(0);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Ігноруємо якщо фокус на input/textarea/select
        const tag = (e.target as HTMLElement).tagName;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

        const now = Date.now();
        const timeDiff = now - lastKeyTime.current;
        lastKeyTime.current = now;

        // Якщо пауза між символами більша timeout — скидаємо буфер
        if (timeDiff > timeout && bufferRef.current.length > 0) {
            bufferRef.current = '';
        }

        if (e.key === 'Enter') {
            const barcode = bufferRef.current.trim();
            if (barcode.length >= minLength) {
                onScan(barcode);
            }
            bufferRef.current = '';
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        // Додаємо тільки друковані символи
        if (e.key.length === 1) {
            bufferRef.current += e.key;
        }

        // Автоскидання буферу якщо Enter не прийшов
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            bufferRef.current = '';
        }, 500);

    }, [enabled, minLength, timeout, onScan]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [handleKeyDown]);
}