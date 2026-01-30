import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, CheckCircle, XCircle, X, Loader2, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: 'food' | 'drinks' | 'snacks';
    available: boolean;
    image: string | null;
}

const Menu = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'food' | 'drinks' | 'snacks'>('all');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'food',
        available: true,
        image: ''
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('name');

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            category: 'food',
            available: true,
            image: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item: MenuItem) => {
        setFormData({
            name: item.name,
            price: item.price.toString(),
            category: item.category,
            available: item.available,
            image: item.image || ''
        });
        setEditingId(item.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...formData,
                price: parseFloat(formData.price)
            };

            if (editingId) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('menu_items')
                    .insert([payload]);
                if (error) throw error;
            }

            await fetchItems();
            setShowModal(false);
            resetForm();
        } catch (error) {
            alert('Error saving menu item: ' + (error as any).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchItems();
        } catch (error) {
            alert('Error deleting menu item: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || item.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const toggleAvailability = async (id: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .update({ available: !current })
                .eq('id', id);

            if (error) throw error;
            setItems(items.map(item => item.id === id ? { ...item, available: !current } : item));
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Menu Items</h1>
                    <p>Manage your food, drinks and snacks</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Add Menu Item
                </button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                <div className="card" style={{ flex: 1, padding: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            style={{ paddingLeft: '3rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['all', 'food', 'drinks', 'snacks'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`btn-tab ${activeTab === tab ? 'active' : ''}`}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: activeTab === tab ? 'var(--primary)' : 'var(--bg-card)',
                            color: activeTab === tab ? 'white' : 'var(--text-sub)',
                            boxShadow: 'var(--shadow-sm)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No items found in this category. Add some delicious food to your menu!</p>
                </div>
            ) : (
                <div className="grid-list">
                    {filteredItems.map(item => (
                        <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ height: '200px', backgroundColor: 'var(--bg-sub)', position: 'relative' }}>
                                {item.image ? (
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => toggleAvailability(item.id, item.available)}
                                        style={{
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.95)',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: 'var(--shadow-md)',
                                            color: item.available ? '#22c55e' : '#ef4444'
                                        }}
                                    >
                                        {item.available ? <CheckCircle size={22} /> : <XCircle size={22} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                        color: 'var(--primary)',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 800
                                    }}>
                                        {item.category}
                                    </span>
                                    <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem' }}>
                                        ETB {item.price}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>{item.name}</h3>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="btn-secondary"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem' }}
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        style={{
                                            padding: '0.625rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border)',
                                            color: '#ef4444',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => { setShowModal(false); resetForm(); }} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Item Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Classic Burger" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price (ETB)</label>
                                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="250.00" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category</label>
                                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                                        <option value="food">Food</option>
                                        <option value="drinks">Drinks</option>
                                        <option value="snacks">Snacks</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Item Image</label>
                                <ImageUpload
                                    value={formData.image}
                                    path="menus"
                                    onChange={(url: string) => setFormData({ ...formData, image: url })}
                                    onUploading={(uploading: boolean) => setSaving(uploading)}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="item_available"
                                    checked={formData.available}
                                    onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                />
                                <label htmlFor="item_available" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Available for Order</label>
                            </div>
                            <button disabled={saving} type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                {saving ? 'Saving...' : editingId ? 'Update Menu Item' : 'Add Menu Item'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
