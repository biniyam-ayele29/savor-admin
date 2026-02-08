import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import CompanyEmployees from '../components/CompanyEmployees';

interface Company {
    id: string;
    name: string;
    logo_url: string | null;
}

const Employees = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data: compData, error: compError } = await supabase
                .from('companies')
                .select('id, name, logo_url')
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

    const getCompanyName = (companyId: string) => {
        return companies.find(c => c.id === companyId)?.name || 'Unknown';
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Employees</h1>
                    <p>Browse staff by company</p>
                </div>
            </header>

            <div
                className="card"
                style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    position: 'relative',
                    zIndex: showDropdown ? 100 : 1
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                        Filter by Company
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem 1rem',
                                paddingLeft: '3rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                backgroundColor: 'var(--bg-sub)',
                                color: selectedCompanyId ? 'var(--text-main)' : 'var(--text-muted)',
                                transition: 'all 0.2s ease',
                                minHeight: '48px'
                            }}
                            className="glass-hover"
                        >
                            <Building2 style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} size={20} />

                            {selectedCompanyId ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {companies.find(c => c.id === selectedCompanyId)?.logo_url ? (
                                            <img src={companies.find(c => c.id === selectedCompanyId)?.logo_url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Building2 size={14} color="var(--primary)" />
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>{getCompanyName(selectedCompanyId)}</span>
                                </div>
                            ) : (
                                <span style={{ flex: 1 }}>Choose a company to see its employees...</span>
                            )}

                            <ChevronDown
                                style={{
                                    transition: 'transform 0.2s ease',
                                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                    color: 'var(--text-muted)'
                                }}
                                size={20}
                            />
                        </div>

                        {showDropdown && (
                            <>
                                <div
                                    onClick={() => setShowDropdown(false)}
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 0.5rem)',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                                    zIndex: 110,
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    padding: '0.5rem'
                                }}>
                                    {companies.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedCompanyId(c.id);
                                                setShowDropdown(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem 1rem',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                backgroundColor: selectedCompanyId === c.id ? 'var(--primary-light)' : 'transparent',
                                                color: selectedCompanyId === c.id ? 'var(--primary)' : 'var(--text-main)'
                                            }}
                                            className="list-item-hover"
                                        >
                                            <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {c.logo_url ? (
                                                    <img src={c.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <Building2 size={16} color="var(--primary)" />
                                                )}
                                            </div>
                                            <span style={{ fontWeight: selectedCompanyId === c.id ? 600 : 400 }}>{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading companies...</p>
                </div>
            ) : !selectedCompanyId ? (
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
                <CompanyEmployees
                    companyId={selectedCompanyId}
                    companyName={getCompanyName(selectedCompanyId)}
                />
            )}
        </div>
    );
};

export default Employees;
