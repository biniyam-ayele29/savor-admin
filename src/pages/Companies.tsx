import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Building2, MapPin, Mail, Phone, X, Loader2, Trash2, Edit2, Shield, UserPlus, UserMinus } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

interface Company {
    id: string;
    name: string;
    floor_number: number;
    contact_email: string | null;
    contact_phone: string | null;
    logo_url: string | null;
    is_active: boolean;
}

interface CompanyAdmin {
    user_id: string;
    email: string;
    created_at: string;
}

const Companies = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        floor_number: 1,
        contact_email: '',
        contact_phone: '',
        logo_url: '',
        is_active: true
    });

    // Admin Management State
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [admins, setAdmins] = useState<CompanyAdmin[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [creatingAdmin, setCreatingAdmin] = useState(false);
    const [adminFormData, setAdminFormData] = useState({ email: '', password: '' });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async (companyId: string) => {
        try {
            setLoadingAdmins(true);
            const { data, error } = await supabase.rpc('get_company_admins', { p_company_id: companyId });
            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleOpenAdmins = (company: Company) => {
        setSelectedCompany(company);
        setShowAdminModal(true);
        setAdmins([]);
        fetchAdmins(company.id);
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        try {
            setCreatingAdmin(true);
            const { data, error } = await supabase.rpc('create_company_admin', {
                p_email: adminFormData.email,
                p_password: adminFormData.password,
                p_company_id: selectedCompany.id
            });
            if (error) throw error;
            alert('Admin created successfully!');
            setAdminFormData({ email: '', password: '' });
            fetchAdmins(selectedCompany.id);
        } catch (error) {
            alert('Error creating admin: ' + (error as any).message);
        } finally {
            setCreatingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!selectedCompany || !confirm('Are you sure you want to remove this admin?')) return;
        try {
            const { error } = await supabase.rpc('remove_company_admin', {
                p_user_id: userId,
                p_company_id: selectedCompany.id
            });
            if (error) throw error;
            fetchAdmins(selectedCompany.id);
        } catch (error) {
            alert('Error removing admin: ' + (error as any).message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            floor_number: 1,
            contact_email: '',
            contact_phone: '',
            logo_url: '',
            is_active: true
        });
        setEditingId(null);
    };

    const handleEdit = (company: Company) => {
        setFormData({
            name: company.name,
            floor_number: company.floor_number,
            contact_email: company.contact_email || '',
            contact_phone: company.contact_phone || '',
            logo_url: company.logo_url || '',
            is_active: company.is_active
        });
        setEditingId(company.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editingId) {
                const { error } = await supabase
                    .from('companies')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('companies')
                    .insert([formData]);
                if (error) throw error;
            }

            await fetchCompanies();
            setShowModal(false);
            resetForm();
        } catch (error) {
            alert('Error saving company: ' + (error as any).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This will also delete all employees and orders associated with this company.`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchCompanies();
        } catch (error) {
            alert('Error deleting company: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Companies</h1>
                    <p>Manage office locations and branding</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Add Company
                </button>
            </header>

            <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search companies by name..."
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No companies found. Add your first company to get started!</p>
                </div>
            ) : (
                <div className="grid-list">
                    {filteredCompanies.map(company => (
                        <div key={company.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleOpenAdmins(company)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)' }}
                                    title="Manage Admins"
                                >
                                    <Shield size={16} />
                                </button>
                                <button
                                    onClick={() => handleEdit(company)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(company.id, company.name)}
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
                                        width: '60px',
                                        height: '60px',
                                        background: 'var(--bg-sub)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {company.logo_url ? (
                                            <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Building2 size={32} color="var(--primary)" />
                                        )}
                                    </div>
                                    <div style={{ paddingRight: '4rem' }}>
                                        <h3 style={{ fontSize: '1.25rem' }}>{company.name}</h3>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <MapPin size={16} color="var(--text-muted)" /> Floor {company.floor_number}
                                </div>
                                {company.contact_email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <Mail size={16} color="var(--text-muted)" /> {company.contact_email}
                                    </div>
                                )}
                                {company.contact_phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <Phone size={16} color="var(--text-muted)" /> {company.contact_phone}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    <span style={{
                                        backgroundColor: company.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: company.is_active ? '#22c55e' : '#ef4444',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        fontWeight: 600
                                    }}>
                                        {company.is_active ? 'Active' : 'Inactive'}
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
                    <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => { setShowModal(false); resetForm(); }} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Company' : 'Add New Company'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Company Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Inc." />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Floor Number</label>
                                <input required type="number" value={formData.floor_number} onChange={e => setFormData({ ...formData, floor_number: parseInt(e.target.value) })} placeholder="1" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Contact Email</label>
                                    <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="contact@acme.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Contact Phone</label>
                                    <input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+251 ..." />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Company Logo</label>
                                <ImageUpload
                                    value={formData.logo_url}
                                    path="company-logos"
                                    onChange={(url: string) => setFormData({ ...formData, logo_url: url })}
                                    onUploading={(uploading: boolean) => setSaving(uploading)}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Active (Open for orders)</label>
                            </div>

                            <button disabled={saving} type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                {saving ? 'Saving...' : editingId ? 'Update Company' : 'Create Company'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showAdminModal && selectedCompany && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '700px', padding: '2.5rem', position: 'relative', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <button onClick={() => setShowAdminModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Shield color="var(--primary)" size={24} />
                                <h2 style={{ fontSize: '1.5rem' }}>Manage Admins: {selectedCompany.name}</h2>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Admins can manage employees, menus, and orders for this company.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', overflowY: 'auto' }}>
                            {/* Admin List */}
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Current Admins</h3>
                                {loadingAdmins ? (
                                    <div style={{ padding: '1rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={24} /></div>
                                ) : admins.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No admins assigned.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {admins.map(admin => (
                                            <div key={admin.user_id} style={{
                                                padding: '1rem', background: 'var(--bg-sub)', borderRadius: '12px', border: '1px solid var(--border)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{admin.email}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Joined {new Date(admin.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => handleRemoveAdmin(admin.user_id)} style={{ color: '#ef4444', background: 'none', border: 'none', padding: '0.5rem' }}>
                                                    <UserMinus size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Create Form */}
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Add New Admin</h3>
                                <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            value={adminFormData.email}
                                            onChange={e => setAdminFormData({ ...adminFormData, email: e.target.value })}
                                            placeholder="admin@example.com"
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                                        <input
                                            required
                                            type="password"
                                            value={adminFormData.password}
                                            onChange={e => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                            placeholder="••••••••"
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                    </div>
                                    <button disabled={creatingAdmin} type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {creatingAdmin ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                                        {creatingAdmin ? 'Creating...' : 'Create Admin Account'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;

