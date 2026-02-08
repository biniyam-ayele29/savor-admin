import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, MapPin, Mail, Phone, Shield, ArrowLeft, Loader2, Users } from 'lucide-react';
import CompanyEmployees from '../components/CompanyEmployees';

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

interface CompanyDetailsProps {
    role?: string | null;
}

const CompanyDetails = ({ role }: CompanyDetailsProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'employees' | 'admins'>('employees');

    // Admin State
    const [admins, setAdmins] = useState<CompanyAdmin[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [creatingAdmin, setCreatingAdmin] = useState(false);
    const [adminFormData, setAdminFormData] = useState({ email: '', password: '' });

    useEffect(() => {
        if (id) {
            fetchCompanyDetails();
            fetchAdmins();
        }
    }, [id]);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setCompany(data);
        } catch (error) {
            console.error('Error fetching company:', error);
            navigate('/companies');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            setLoadingAdmins(true);
            const { data, error } = await supabase.rpc('get_company_admins', { p_company_id: id });
            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;
        try {
            setCreatingAdmin(true);
            const { error } = await supabase.rpc('create_company_admin', {
                p_email: adminFormData.email,
                p_password: adminFormData.password,
                p_company_id: company.id
            });
            if (error) throw error;
            alert('Admin created successfully!');
            setAdminFormData({ email: '', password: '' });
            fetchAdmins();
        } catch (error) {
            alert('Error creating admin: ' + (error as any).message);
        } finally {
            setCreatingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!company || !confirm('Are you sure you want to remove this admin?')) return;
        try {
            const { error } = await supabase.rpc('remove_company_admin', {
                p_user_id: userId,
                p_company_id: company.id
            });
            if (error) throw error;
            fetchAdmins();
        } catch (error) {
            alert('Error removing admin: ' + (error as any).message);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
        );
    }

    if (!company) return null;

    return (
        <div className="page-container">
            <header style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/companies')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        marginBottom: '1rem', cursor: 'pointer', fontSize: '0.875rem'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Companies
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'var(--bg-sub)', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border)', overflow: 'hidden'
                    }}>
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <Building2 size={40} color="var(--primary)" />
                        )}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{company.name}</h1>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> Floor {company.floor_number}
                            </div>
                            {company.contact_email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} /> {company.contact_email}
                                </div>
                            )}
                            {company.contact_phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} /> {company.contact_phone}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '2rem', display: 'flex', gap: '2rem' }}>
                <button
                    onClick={() => setActiveTab('employees')}
                    style={{
                        padding: '1rem 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'employees' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'employees' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Users size={18} /> Clients
                </button>
                {role === 'super_admin' && (
                    <button
                        onClick={() => setActiveTab('admins')}
                        style={{
                            padding: '1rem 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'admins' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'admins' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Shield size={18} /> Admins
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'employees' ? (
                <div style={{ height: '600px' }}>
                    {/* Reusing the component, forcing it to fill the container */}
                    <CompanyEmployees companyId={company.id} companyName={company.name} />
                </div>
            ) : (
                <div className="card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Manage Administrators</h3>
                        {loadingAdmins ? (
                            <div style={{ padding: '1rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={24} /></div>
                        ) : admins.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No admins assigned to this company.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {admins.map(admin => (
                                    <div key={admin.user_id} style={{
                                        padding: '1rem', background: 'var(--bg-sub)', borderRadius: '12px', border: '1px solid var(--border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{admin.email}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Added {new Date(admin.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAdmin(admin.user_id)}
                                            style={{ color: '#ef4444', background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ background: 'var(--bg-sub)', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Add New Admin</h3>
                        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={adminFormData.email}
                                    onChange={e => setAdminFormData({ ...adminFormData, email: e.target.value })}
                                    placeholder="admin@example.com"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                                <input
                                    required
                                    type="password"
                                    value={adminFormData.password}
                                    onChange={e => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <button
                                disabled={creatingAdmin}
                                type="submit"
                                className="btn-primary"
                                style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                            >
                                {creatingAdmin ? 'Creating...' : 'Create Admin'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDetails;
