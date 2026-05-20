import { useRef, useState } from 'react';
import { Scan, X } from 'lucide-react';

interface BarcodeScannerInputProps {
    value: string;
    onChange: (v: string) => void;
    onScan?: (barcode: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function BarcodeScannerInput({
                                                value,
                                                onChange,
                                                onScan,
                                                placeholder = 'Штрих-код або пошук...',
                                                disabled,
                                            }: BarcodeScannerInputProps) {
    const [scanning, setScanning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && value.trim()) {
            setScanning(true);
            onScan?.(value.trim());
            setTimeout(() => setScanning(false), 600);
        }
    }

    return (
        <div className="relative flex items-center">
            {/* Іконка сканера */}
            <div className="absolute left-3 flex items-center"
                 style={{ color: scanning ? '#6366f1' : '#475569' }}>
                <Scan
                    size={15}
                    style={{
                        transition: 'color 0.2s',
                        color: scanning ? '#6366f1' : '#475569',
                    }}
                />
                {scanning && (
                    <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping"
                        style={{ background: '#6366f1' }}
                    />
                )}
            </div>

            <input
                ref={inputRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-lg pl-9 pr-8 py-2.5 text-sm outline-none font-mono"
                style={{
                    background: '#13151f',
                    border: `1px solid ${scanning ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: '#f1f5f9',
                    transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
                onBlur={e => (e.target.style.borderColor = scanning
                    ? 'rgba(99,102,241,0.5)'
                    : 'rgba(255,255,255,0.08)')}
            />

            {/* Кнопка очищення */}
            {value && (
                <button
                    onClick={() => { onChange(''); inputRef.current?.focus(); }}
                    className="absolute right-2.5"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
}