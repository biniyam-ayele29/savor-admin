import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Mail, Phone, Building2, X, Loader2, ChevronDown, User, Edit2, Trash2 } from 'lucide-react';

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

interface Company {
    id: string;
    name: string;
}

const Employees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [, setLoading] = useState(true);
    const [fetchingEmployees, setFetchingEmployees] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        company_id: '',
        avatar_url: '',
        is_active: true
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchEmployeesByCompany(selectedCompanyId);
            setFormData(prev => ({ ...prev, company_id: selectedCompanyId }));
        } else {
            setEmployees([]);
        }
    }, [selectedCompanyId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data: compData, error: compError } = await supabase
                .from('companies')
                .select('id, name')
                .order('name');

            if (compError) throw compError;
            setCompanies(compData || []);

            if (compData && compData.length > 0) {
                if (compData.length === 1) {
                    setSelectedCompanyId(compData[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchEmployeesByCompany = async (companyId: string) => {
        try {
            setFetchingEmployees(true);
            setFetchError(null);
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', companyId)
                .order('name');

            if (empError) throw empError;
            setEmployees(empData || []);
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
            company_id: selectedCompanyId,
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
        try {
            setSaving(true);
            if (editingId) {
                const { error } = await supabase
                    .from('employees')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('employees')
                    .insert([formData]);
                if (error) throw error;
            }

            await fetchEmployeesByCompany(selectedCompanyId);
            setShowModal(false);
            resetForm();
        } catch (error) {
            alert('Error saving employee: ' + (error as any).message);
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
            await fetchEmployeesByCompany(selectedCompanyId);
        } catch (error) {
            alert('Error deleting employee: ' + (error as any).message);
        } finally {
            setFetchingEmployees(false);
        }
    };

    const getCompanyName = (companyId: string) => {
        return companies.find(c => c.id === companyId)?.name || 'Unknown';
    };

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Employees</h1>
                    <p>Browse staff by company</p>
                </div>
                {selectedCompanyId && (
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Add Employee
                    </button>
                )}
            </header>

            {/* Company Selector */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                        Filter by Company
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Building2 style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} size={20} />
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            style={{ paddingLeft: '3rem', cursor: 'pointer', appearance: 'none' }}
                            className="glass"
                        >
                            <option value="">Choose a company to see its employees...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={20} />
                    </div>
                </div>
            </div>

            {!selectedCompanyId ? (
                <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', borderStyle: 'dashed', backgroundColor: 'transparent' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'var(--bg-sub)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                    }}>
                        <Building2 size={40} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                    </div>
                    <h2 style={{ color: 'var(--text-sub)', marginBottom: '0.5rem' }}>View Employees</h2>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                        Please select a company from the dropdown list above to view all registered staff members for that organization.
                    </p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                            <input
                                type="text"
                                placeholder={`Search staff in ${getCompanyName(selectedCompanyId)}...`}
                                style={{ paddingLeft: '3rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {fetchingEmployees ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading staff list...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="card" style={{ textAlign: 'center', padding: '4rem', borderColor: '#ef4444' }}>
                            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Error loading employees: {fetchError}</p>
                            <button onClick={() => fetchEmployeesByCompany(selectedCompanyId)} className="btn-secondary">Retry</button>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No employees found for {getCompanyName(selectedCompanyId)}.</p>
                            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ marginTop: '1rem' }}>Add First Employee</button>
                        </div>
                    ) : (
                        <div className="grid-list">
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
                </>
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
                        <h2 style={{ marginBottom: '0.5rem' }}>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Registering for <strong>{getCompanyName(selectedCompanyId)}</strong>
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
                                    <input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Manager" />
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
                                {saving ? 'Saving...' : editingId ? 'Update Employee' : 'Create Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
