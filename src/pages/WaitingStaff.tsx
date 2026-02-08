import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Mail, Phone, Building2, X, Loader2, User, Edit2, Trash2 } from 'lucide-react';

interface WaitingStaff {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
}

const WaitingStaff = () => {
    const [staff, setStaff] = useState<WaitingStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingStaff, setFetchingStaff] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatar_url: '',
        is_active: true
    });
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllStaff();
    }, []);

    const fetchAllStaff = async () => {
        try {
            setFetchingStaff(true);
            setFetchError(null);
            const { data, error } = await supabase
                .from('waiting_staff')
                .select('*')
                .order('name');

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching waiting staff:', error);
            setFetchError((error as any).message);
            setStaff([]);
        } finally {
            setFetchingStaff(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            avatar_url: '',
            is_active: true
        });
        setEditingId(null);
    };

    const handleEdit = (staffMember: WaitingStaff) => {
        setFormData({
            name: staffMember.name,
            phone: staffMember.phone || '',
            avatar_url: staffMember.avatar_url || '',
            is_active: staffMember.is_active
        });
        setEditingId(staffMember.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('waiting_staff')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('waiting_staff')
                    .insert([formData]);
                if (error) throw error;
            }

            await fetchAllStaff();
            setShowModal(false);
            resetForm();
        } catch (error) {
            alert('Error saving staff member: ' + (error as any).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            setFetchingStaff(true);
            const { error } = await supabase
                .from('waiting_staff')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchAllStaff();
        } catch (error) {
            alert('Error deleting staff member: ' + (error as any).message);
        } finally {
            setFetchingStaff(false);
        }
    };



    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Waiting Staff</h1>
                    <p>Manage waiters and service staff across all companies</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Add Waiter
                </button>
            </header>

            <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search waiters..."
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {fetchingStaff ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading staff list...</p>
                </div>
            ) : fetchError ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', borderColor: '#ef4444' }}>
                    <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Error loading staff: {fetchError}</p>
                    <button onClick={fetchAllStaff} className="btn-secondary">Retry</button>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No waiting staff found.</p>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ marginTop: '1rem' }}>Add First Waiter</button>
                </div>
            ) : (
                <div className="grid-list">
                    {filteredStaff.map(member => (
                        <div key={member.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(member)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(member.id, member.name)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#ef4444' }}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-sub)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={24} color="var(--text-muted)" />
                                        )}
                                    </div>
                                    <div style={{ paddingRight: '4rem' }}>
                                        <h3 style={{ fontSize: '1.125rem' }}>{member.name}</h3>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                {member.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <Mail size={16} color="var(--text-muted)" /> {member.email}
                                    </div>
                                )}
                                {member.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <Phone size={16} color="var(--text-muted)" /> {member.phone}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                    <span style={{
                                        backgroundColor: member.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: member.is_active ? '#22c55e' : '#ef4444',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {member.is_active ? 'Active' : 'Inactive'}
                                    </span>
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
                        <h2 style={{ marginBottom: '0.5rem' }}>{editingId ? 'Edit Waiter' : 'Add New Waiter'}</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Doe" />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Phone Number (Optional)</label>
                                <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+251 ..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Avatar URL (Optional)</label>
                                <input value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="staff_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="staff_active" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Active Status</label>
                            </div>
                            <button disabled={saving} type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                {saving ? 'Saving...' : editingId ? 'Update Waiter' : 'Create Waiter'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaitingStaff;
