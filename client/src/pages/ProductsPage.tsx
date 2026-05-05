import { useEffect, useState } from 'react';
import {
    Plus, Pencil, Trash2, Loader2, X,
    Search, Package, CheckCircle, Circle, Tag,
} from 'lucide-react';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { useRole } from '../hooks/useAuth';
import type { Product, UpsertProductRequest, ProductCategory } from '../types';

// ─── Category Modal ───────────────────────────────────────────────────────────

function CategoryModal({ onClose, onSaved }: {
    onClose: () => void;
    onSaved: (categories: ProductCategory[]) => void;
}) {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

                {/* Список */}
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

                {/* Нова категорія */}
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

interface ProductModalProps {
    product?: Product;
    categories: ProductCategory[];
    onClose: () => void;
    onSave: (data: UpsertProductRequest) => Promise<void>;
}

function ProductModal({ product, categories, onClose, onSave }: ProductModalProps) {
    const [form, setForm] = useState<UpsertProductRequest>({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        barcode: product?.barcode ?? '',
        categoryId: product?.categoryId ?? '',
        isBatchTracked: product?.isBatchTracked ?? false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await onSave({
                ...form,
                barcode: form.barcode || undefined,
                categoryId: form.categoryId || undefined,
            });
            onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка збереження');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
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
                               placeholder="Наприклад: Ноутбук Dell XPS 15"
                               className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Артикул (SKU) *</label>
                        <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                               placeholder="DELL-XPS-15-001"
                               className="w-full rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Штрих-код</label>
                        <input value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
                               placeholder="1234567890123"
                               className="w-full rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                    </div>

                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Категорія</label>
                        <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            <option value="">— Без категорії —</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <button type="button" onClick={() => setForm(p => ({ ...p, isBatchTracked: !p.isBatchTracked }))}
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
                        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ product, onClose, onConfirm }: {
    product: Product; onClose: () => void; onConfirm: () => Promise<void>;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handle() {
        setLoading(true);
        try { await onConfirm(); onClose(); }
        catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка видалення');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-base font-semibold mb-2" style={{ color: '#f1f5f9' }}>Видалити товар?</h2>
                <p className="text-sm mb-5" style={{ color: '#475569' }}>
                    <span style={{ color: '#94a3b8' }}>{product.name}</span> буде видалено назавжди.
                </p>
                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}
                <div className="flex gap-3">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button onClick={handle} disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                            style={{ background: '#ef4444', color: '#fff' }}>
                        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                        Видалити
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
    const { isAdmin } = useRole();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | undefined>();
    const [deleteProduct, setDeleteProduct] = useState<Product | undefined>();

    useEffect(() => {
        Promise.all([productService.getAll(), categoryService.getAll()])
            .then(([p, c]) => { setProducts(p); setCategories(c); })
            .finally(() => setLoading(false));
    }, []);

    const filtered = products.filter(p => {
        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode ?? '').includes(search);
        const matchCategory = !filterCategory || p.categoryId === filterCategory;
        return matchSearch && matchCategory;
    });

    async function handleSave(data: UpsertProductRequest) {
        if (editProduct) {
            await productService.update(editProduct.id, data);
        } else {
            await productService.create(data);
        }
        const updated = await productService.getAll();
        setProducts(updated);
    }

    async function handleDelete() {
        if (!deleteProduct) return;
        await productService.delete(deleteProduct.id);
        setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
    }

    return (
        <div className="space-y-6">
            {modalOpen && (
                <ProductModal
                    product={editProduct}
                    categories={categories}
                    onClose={() => { setModalOpen(false); setEditProduct(undefined); }}
                    onSave={handleSave}
                />
            )}
            {deleteProduct && (
                <DeleteConfirm
                    product={deleteProduct}
                    onClose={() => setDeleteProduct(undefined)}
                    onConfirm={handleDelete}
                />
            )}
            {categoryModalOpen && (
                <CategoryModal
                    onClose={() => setCategoryModalOpen(false)}
                    onSaved={setCategories}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Товари</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>{products.length} позицій у каталозі</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button onClick={() => setCategoryModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                            <Tag size={15} /> Категорії
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => { setEditProduct(undefined); setModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                                style={{ background: '#6366f1', color: '#fff' }}>
                            <Plus size={16} /> Додати товар
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="Пошук за назвою, SKU або штрих-кодом..."
                           className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none"
                           style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                           onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
                           onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                        className="rounded-lg px-3 py-2.5 text-sm outline-none"
                        style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: filterCategory ? '#f1f5f9' : '#475569' }}>
                    <option value="">Всі категорії</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid text-xs font-medium px-4 py-3"
                     style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', background: '#13151f', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
                    <span>Назва</span>
                    <span>SKU</span>
                    <span>Категорія</span>
                    <span>Штрих-код</span>
                    <span className="text-right">Дії</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16" style={{ background: '#13151f' }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ background: '#13151f' }}>
                        <Package size={32} style={{ color: '#1e293b' }} />
                        <p className="text-sm" style={{ color: '#334155' }}>
                            {search || filterCategory ? 'Нічого не знайдено' : 'Товарів ще немає'}
                        </p>
                    </div>
                ) : (
                    filtered.map((product, i) => (
                        <div key={product.id} className="grid items-center px-4 py-3"
                             style={{
                                 gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                                 background: i % 2 === 0 ? '#13151f' : 'rgba(255,255,255,0.01)',
                                 borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                             }}>
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                     style={{ background: 'rgba(99,102,241,0.1)' }}>
                                    <Package size={14} style={{ color: '#6366f1' }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>{product.name}</p>
                                    {product.isBatchTracked && (
                                        <span className="text-xs" style={{ color: '#475569' }}>Партійний облік</span>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{product.sku}</span>
                            <span>
                {product.category ? (
                    <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                    {product.category.name}
                  </span>
                ) : <span className="text-xs" style={{ color: '#334155' }}>—</span>}
              </span>
                            <span className="text-xs font-mono" style={{ color: '#475569' }}>{product.barcode ?? '—'}</span>
                            <div className="flex items-center justify-end gap-1">
                                {isAdmin && (
                                    <>
                                        <button onClick={() => { setEditProduct(product); setModalOpen(true); }}
                                                className="p-1.5 rounded-md" style={{ color: '#475569' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setDeleteProduct(product)}
                                                className="p-1.5 rounded-md" style={{ color: '#475569' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}