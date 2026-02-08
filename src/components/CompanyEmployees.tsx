import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, Phone, X, Loader2, User, Edit2, Trash2, Building2 } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    position: string | null;
    company_id: string;
    avatar_url: string | null;
    is_active: boolean;
}

interface CompanyEmployeesProps {
    companyId: string;
    companyName: string;
}

const CompanyEmployees = ({ companyId, companyName }: CompanyEmployeesProps) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [fetchingEmployees, setFetchingEmployees] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        company_id: companyId,
        avatar_url: '',
        is_active: true
    });

    useEffect(() => {
        if (companyId) {
            fetchEmployees();
            setFormData(prev => ({ ...prev, company_id: companyId }));
        }
    }, [companyId]);

    const fetchEmployees = async () => {
        try {
            setFetchingEmployees(true);
            setFetchError(null);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', companyId)
                .order('name');

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setFetchError((error as any).message);
            setEmployees([]);
        } finally {
            setFetchingEmployees(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            position: '',
            company_id: companyId,
            avatar_url: '',
            is_active: true
        });
        setEditingId(null);
    };

    const handleEdit = (employee: Employee) => {
        setFormData({
            name: employee.name,
            email: employee.email,
            phone: employee.phone || '',
            position: employee.position || '',
            company_id: employee.company_id,
            avatar_url: employee.avatar_url || '',
            is_active: employee.is_active
        });
        setEditingId(employee.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        try {
            setSaving(true);
            const dataToSave = { ...formData, company_id: companyId };

            const { error } = await supabase
                .from('employees')
                .update(dataToSave)
                .eq('id', editingId);
            if (error) throw error;

            await fetchEmployees();
            setShowModal(false);
            resetForm();
        } catch (error) {
            alert('Error updating employee: ' + (error as any).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            setFetchingEmployees(true);
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchEmployees();
        } catch (error) {
            alert('Error deleting employee: ' + (error as any).message);
        } finally {
            setFetchingEmployees(false);
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${companyName} staff...`}
                        style={{ paddingLeft: '3rem', width: '100%' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {fetchingEmployees ? (
                <div style={{ textAlign: 'center', padding: '3rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading staff list...</p>
                </div>
            ) : fetchError ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', borderColor: '#ef4444' }}>
                    <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Error loading employees: {fetchError}</p>
                    <button onClick={fetchEmployees} className="btn-secondary">Retry</button>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--bg-sub)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <Building2 size={32} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.5rem' }}>No employees found</p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>There are no employees registered for {companyName} yet.</p>
                </div>
            ) : (
                <div className="grid-list" style={{ overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '1rem' }}>
                    {filteredEmployees.map(employee => (
                        <div key={employee.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(employee)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(employee.id, employee.name)}
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
                                        {employee.avatar_url ? (
                                            <img src={employee.avatar_url} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={24} color="var(--text-muted)" />
                                        )}
                                    </div>
                                    <div style={{ paddingRight: '4rem' }}>
                                        <h3 style={{ fontSize: '1.125rem' }}>{employee.name}</h3>
                                        <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>{employee.position || 'Staff'}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <Mail size={16} color="var(--text-muted)" /> {employee.email}
                                </div>
                                {employee.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <Phone size={16} color="var(--text-muted)" /> {employee.phone}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                    <span style={{
                                        backgroundColor: employee.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: employee.is_active ? '#22c55e' : '#ef4444',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {employee.is_active ? 'Active' : 'Inactive'}
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
                    backdropFilter: 'blur(4px)', zIndex: 1100
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => { setShowModal(false); resetForm(); }} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ marginBottom: '0.5rem' }}>Edit Employee</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Registering for <strong>{companyName}</strong>
                        </p>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@company.com" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Phone Number</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+251 ..." />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Position</label>
                                    <select
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem',
                                            fontSize: '0.875rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: 'var(--bg-card)',
                                            color: 'var(--text-main)',
                                        }}
                                    >
                                        <option value="">Select Position</option>
                                        <option value="Waiter">Waiter</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Chef">Chef</option>
                                        <option value="Bartender">Bartender</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Avatar URL</label>
                                <input value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="emp_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="emp_active" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Active Employee</label>
                            </div>
                            <button disabled={saving} type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                {saving ? 'Saving...' : 'Update Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyEmployees;
