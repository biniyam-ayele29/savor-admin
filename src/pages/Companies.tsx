import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Search, Building2, MapPin, Mail, Phone, X, Loader2, Trash2, Edit2 } from 'lucide-react';
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



interface CompaniesProps {
    role?: string | null;
}

const Companies = ({ role }: CompaniesProps) => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        floor_number: 0,
        contact_email: '',
        contact_phone: '',
        logo_url: '',
        is_active: true
    });

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
    const [deleting, setDeleting] = useState(false);

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



    const resetForm = () => {
        setFormData({
            name: '',
            floor_number: 0,
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
        } catch (error: any) {
            alert('Error saving company: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (company: Company) => {
        setCompanyToDelete(company);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!companyToDelete) return;

        try {
            setDeleting(true);
            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', companyToDelete.id);

            if (error) throw error;
            await fetchCompanies();
            setShowDeleteModal(false);
            setCompanyToDelete(null);
        } catch (error) {
            alert('Error deleting company: ' + (error as any).message);
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setCompanyToDelete(null);
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
                {role === 'super_admin' && (
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Add Company
                    </button>
                )}
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
                            {role === 'super_admin' && (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(company); }}
                                        className="btn-secondary"
                                        style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(company); }}
                                        className="btn-secondary"
                                        style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#ef4444' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            <div
                                onClick={() => navigate(`/companies/${company.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
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
                                <input
                                    required
                                    type="number"
                                    min={0}
                                    value={formData.floor_number}
                                    onChange={e => {
                                        const value = parseInt(e.target.value);
                                        if (!isNaN(value)) {
                                            setFormData({ ...formData, floor_number: value });
                                        }
                                    }}
                                    placeholder="1"
                                />
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



            {/* Delete Confirmation Modal */}
            {showDeleteModal && companyToDelete && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', zIndex: 1001
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <Trash2 size={32} color="#dc2626" />
                        </div>

                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                            Delete Company?
                        </h2>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{companyToDelete.name}</strong>?
                        </p>

                        <p style={{
                            color: '#dc2626',
                            fontSize: '0.8rem',
                            marginBottom: '1.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#fef2f2',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #fecaca'
                        }}>
                            This action cannot be undone. All employees and orders associated with this company will also be deleted.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={handleCancelDelete}
                                disabled={deleting}
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: deleting ? 0.7 : 1
                                }}
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Yes, Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
