import { Download } from 'lucide-react';

interface ExportButtonProps {
    onClick: () => void;
    disabled?: boolean;
    label?: string;
}

export default function ExportButton({ onClick, disabled, label = 'CSV' }: ExportButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-40"
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = '#94a3b8'; }}
            title={`Експортувати в ${label}`}
        >
            <Download size={14} />
            {label}
        </button>
    );
}