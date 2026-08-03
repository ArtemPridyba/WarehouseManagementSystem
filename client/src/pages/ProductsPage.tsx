import {useEffect, useState, useCallback, useRef} from 'react';
import {
    Plus, Pencil, Trash2, Loader2, X,
    Search, Package, CheckCircle, Circle, Tag, Download, ChevronDown,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { useRole } from '../hooks/useAuth';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { exportToCsv } from '../utils/exportCsv';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import type { Product, UpsertProductRequest, ProductCategory, PagedResult } from '../types';
import {useProductDrawer} from "../context/ProductDrawerContext.tsx";

const PAGE_SIZE = 7;

// ─── Category Modal ───────────────────────────────────────────────────────────

function CategoryModal({ onClose, onSaved }: {
    onClose: () => void;
    onSaved: (categories: ProductCategory[]) => void;
}) {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [newName, setNewName]       = useState('');
    const [editId, setEditId]         = useState<string | null>(null);
    const [editName, setEditName]     = useState('');
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState<string | null>(null);

    useEffect(() => {
        categoryService.getAll().then(setCategories);
    }, []);

    async function handleCreate() {
        if (!newName.trim()) return;
        setError(null);
        setLoading(true);
        try {
            const created = await categoryService.create({ name: newName.trim() });
            const updated = [...categories, created];
            setCategories(updated);
            onSaved(updated);
            setNewName('');
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(id: string) {
        if (!editName.trim()) return;
        setError(null);
        try {
            const updated = await categoryService.update(id, { name: editName.trim() });
            const newList = categories.map(c => c.id === id ? updated : c);
            setCategories(newList);
            onSaved(newList);
            setEditId(null);
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка');
        }
    }

    async function handleDelete(id: string) {
        setError(null);
        try {
            await categoryService.delete(id);
            const newList = categories.filter(c => c.id !== id);
            setCategories(newList);
            onSaved(newList);
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка видалення');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Категорії товарів
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
                    {categories.length === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: '#334155' }}>
                            Категорій ще немає
                        </p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group"
                                 style={{ background: 'rgba(255,255,255,0.02)' }}>
                                {editId === cat.id ? (
                                    <>
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 rounded-md px-2 py-1 text-sm outline-none"
                                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.4)', color: '#f1f5f9' }}
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                                        />
                                        <button onClick={() => handleUpdate(cat.id)}
                                                className="text-xs px-2 py-1 rounded"
                                                style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                                            Зберегти
                                        </button>
                                        <button onClick={() => setEditId(null)} style={{ color: '#475569' }}>
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Tag size={13} style={{ color: '#6366f1' }} />
                                        <span className="flex-1 text-sm" style={{ color: '#f1f5f9' }}>{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                                                    style={{ color: '#475569' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                                <Pencil size={13} />
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)}
                                                    style={{ color: '#475569' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Назва нової категорії"
                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <button onClick={handleCreate} disabled={loading || !newName.trim()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                            style={{
                                background: loading || !newName.trim() ? 'rgba(99,102,241,0.3)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || !newName.trim() ? 'not-allowed' : 'pointer',
                            }}>
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Додати
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ product, categories, onClose, onSave }: {
    product?: Product;
    categories: ProductCategory[];
    onClose: () => void;
    onSave: (data: UpsertProductRequest) => Promise<void>;
}) {
    const [form, setForm] = useState<UpsertProductRequest>({
        name:           product?.name           ?? '',
        sku:            product?.sku            ?? '',
        barcode:        product?.barcode        ?? '',
        categoryId:     product?.categoryId     ?? '',
        isBatchTracked: product?.isBatchTracked ?? false,
        minStock:       product?.minStock       ?? 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await onSave({
                ...form,
                barcode:    form.barcode    || undefined,
                categoryId: form.categoryId || undefined,
            });
            onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка збереження');
        } finally {
            setLoading(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#f1f5f9',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 13,
        width: '100%',
        outline: 'none',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        {product ? 'Редагувати товар' : 'Новий товар'}
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Назва товару *</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                               placeholder="Наприклад: Ноутбук Dell XPS 15" style={inputStyle}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Артикул (SKU) *</label>
                        <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                               placeholder="DELL-XPS-15-001" className="font-mono" style={inputStyle}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Штрих-код</label>
                        <input value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
                               placeholder="1234567890123" className="font-mono" style={inputStyle}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Категорія</label>
                        <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                                style={{ ...inputStyle, background: '#1e2130' }}>
                            <option value="">— Без категорії —</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Мінімальний залишок
                        </label>
                        <input
                            type="number" min={0} step={0.001}
                            value={form.minStock}
                            onChange={e => setForm(p => ({ ...p, minStock: parseFloat(e.target.value) || 0 }))}
                            placeholder="0 — без обмежень"
                            style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                        <p className="text-xs mt-1" style={{ color: '#334155' }}>
                            При залишку нижче цього значення — попередження на Dashboard
                        </p>
                    </div>

                    <button type="button"
                            onClick={() => setForm(p => ({ ...p, isBatchTracked: !p.isBatchTracked }))}
                            className="flex items-center gap-2.5 text-sm"
                            style={{ color: form.isBatchTracked ? '#818cf8' : '#475569' }}>
                        {form.isBatchTracked
                            ? <CheckCircle size={18} style={{ color: '#6366f1' }} />
                            : <Circle size={18} />}
                        Партійний облік (Batch Tracking)
                    </button>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !form.name || !form.sku}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                            style={{
                                background: loading || !form.name || !form.sku ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || !form.name || !form.sku ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
    const { canManage }   = useRole();
    const { openProductDrawer } = useProductDrawer();
    const { confirm, options, handleConfirm, handleClose } = useConfirm();

    const [categories, setCategories]     = useState<ProductCategory[]>([]);
    const [result, setResult]             = useState<PagedResult<Product> | null>(null);
    const [loading, setLoading]           = useState(true);
    const [page, setPage]                 = useState(1);
    const [search, setSearch]             = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [modalOpen, setModalOpen]       = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editProduct, setEditProduct]   = useState<Product | undefined>();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Завантаження категорій
    useEffect(() => {
        let mounted = true;
        categoryService.getAll().then(c => { if (mounted) setCategories(c); });
        return () => { mounted = false; };
    }, []);

    // Завантаження товарів з пагінацією
    const load = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await productService.getPaged({
                page:       p,
                pageSize:   PAGE_SIZE,
                search:     search     || undefined,
                categoryId: filterCategory || undefined,
            });
            setResult(data);
        } finally {
            setLoading(false);
        }
    }, [search, filterCategory]);

    useEffect(() => {
        let mounted = true;
        setPage(1);
        load(1).then(() => { if (!mounted) return; });
        return () => { mounted = false; };
    }, [load]);

    // Штрих-код сканер — підставляємо в пошук
    useBarcodeScanner({
        enabled: !modalOpen && !categoryModalOpen,
        onScan: (barcode) => setSearch(barcode),
    });

    function handlePageChange(next: number) {
        setPage(next);
        load(next);
    }

    async function handleSave(data: UpsertProductRequest) {
        if (editProduct) {
            await productService.update(editProduct.id, data);
        } else {
            await productService.create(data);
        }
        await load(page);
    }

    async function handleDeleteClick(product: Product) {
        const confirmed = await confirm({
            title:        'Видалити товар?',
            message:      `Товар "${product.name}" (${product.sku}) буде видалено назавжди. Цю дію неможливо скасувати.`,
            confirmLabel: 'Видалити',
            danger:       true,
        });
        if (confirmed) {
            try {
                await productService.delete(product.id);
                await load(page);
            } catch (err: unknown) {
                const data = (err as { response?: { data?: unknown } })?.response?.data;
                console.error(typeof data === 'string' ? data : 'Помилка видалення');
            }
        }
    }

    // CSV Експорт
    function handleExport() {
        exportToCsv('products', (result?.items ?? []).map(p => ({
            'Назва':       p.name,
            'SKU':         p.sku,
            'Штрих-код':   p.barcode ?? '',
            'Категорія':   p.category?.name ?? '',
            'Партійний':   p.isBatchTracked ? 'Так' : 'Ні',
            'Мін. залишок': p.minStock,
        })));
    }

    const products = result?.items ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {options && (
                <ConfirmModal {...options} onConfirm={handleConfirm} onClose={handleClose} />
            )}
            {modalOpen && (
                <ProductModal
                    product={editProduct}
                    categories={categories}
                    onClose={() => { setModalOpen(false); setEditProduct(undefined); }}
                    onSave={handleSave}
                />
            )}
            {categoryModalOpen && (
                <CategoryModal
                    onClose={() => setCategoryModalOpen(false)}
                    onSaved={setCategories}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Package size={22} className="text-indigo-400" />
                        Товари
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {result ? `${result.totalCount} позицій у каталозі` : 'Завантаження...'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={products.length === 0}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-100 disabled:opacity-40"
                    >
                        <Download size={15} /> Експорт CSV
                    </button>
                    {canManage && (
                        <button onClick={() => setCategoryModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all">
                            <Tag size={15} /> Категорії
                        </button>
                    )}
                    {canManage && (
                        <button onClick={() => { setEditProduct(undefined); setModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/20">
                            <Plus size={16} /> Додати товар
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Пошук за назвою, SKU або штрих-кодом..."
                        className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:border-indigo-500/50 outline-none transition-all"
                    />
                </div>

                {/* Кастомний Селектор Категорій */}
                <div className="relative w-full sm:w-64" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.08] text-left outline-none transition-all focus:border-indigo-500/50"
                    >
                    <span className={filterCategory ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                        {filterCategory ? categories.find(c => c.id === filterCategory)?.name : '— Всі категорії —'}
                    </span>
                        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 z-40 rounded-xl border border-white/[0.08] bg-[#11131C] shadow-2xl p-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto">
                            <button
                                onClick={() => { setFilterCategory(''); setDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-white/[0.03] transition-colors"
                            >
                                — Всі категорії —
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setFilterCategory(c.id); setDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                                        filterCategory === c.id
                                            ? 'bg-indigo-600/20 text-indigo-400 font-medium border-l-2 border-indigo-500'
                                            : 'text-slate-300 hover:bg-white/[0.04] hover:text-slate-100'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0B0D14]/40 backdrop-blur-md shadow-lg">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center text-xs font-semibold px-4 py-3 bg-[#0B0D14]/80 border-b border-white/[0.04] text-slate-400 tracking-wider">
                    <span>Назва</span>
                    <span>SKU</span>
                    <span>Категорія</span>
                    <span>Штрих-код</span>
                    <span className="text-right">Дії</span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Package size={48} className="text-slate-800" />
                        <p className="text-sm font-medium text-slate-500">
                            {search || filterCategory ? 'Нічого не знайдено' : 'Товарів ще немає'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.02]">
                        {products.map((product) => (
                            <div key={product.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                                        <Package size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <button onClick={() => openProductDrawer(product.id, product.name, product.sku)}
                                                className="text-sm font-medium text-slate-200 hover:text-indigo-400 transition-colors truncate w-full text-left">
                                            {product.name}
                                        </button>
                                        <div className="flex gap-2 mt-0.5">
                                            {product.isBatchTracked && <span className="text-[10px] text-slate-500">Партійний облік</span>}
                                            {product.minStock > 0 && <span className="text-[10px] text-slate-600">мін: {product.minStock}</span>}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                                <div>
                                    {product.category ? (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.03] text-slate-400 border border-white/[0.05]">
                                        {product.category.name}
                                    </span>
                                    ) : <span className="text-xs text-slate-600">—</span>}
                                </div>
                                <span className="text-xs font-mono text-slate-500">{product.barcode ?? '—'}</span>
                                <div className="flex items-center justify-end gap-1">
                                    {canManage && (
                                        <>
                                            <button onClick={() => { setEditProduct(product); setModalOpen(true); }}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDeleteClick(product)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && result && result.totalCount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04] bg-[#0B0D14]/20">
                        <span className="text-xs text-slate-500 font-medium">
                            Сторінка {result.page} з {result.totalPages} · Всього: {result.totalCount}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={!result.hasPreviousPage}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30">
                                <ChevronLeft size={13} /> Назад
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={!result.hasNextPage}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30">
                                Вперед <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}