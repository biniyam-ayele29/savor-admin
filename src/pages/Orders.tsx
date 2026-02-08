import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Loader2, Clock, CheckCircle2, MapPin, Building2, Filter, X, ChevronDown, User } from 'lucide-react';

interface Order {
    id: string;
    total_price: number;
    status: string;
    status_description: string | null;
    floor_number: number;
    company_id: string | null;
    employee_id: string | null;
    waiting_staff_id: string | null;
    created_at: string;
    updated_at: string;
}

interface Company {
    id: string;
    name: string;
}
interface WaitingStaff {
    id: string;
    name: string;
}

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Record<string, string>>({});
    const [companyList, setCompanyList] = useState<Company[]>([]);
    const [waitingStaffList, setWaitingStaffList] = useState<WaitingStaff[]>([]);

    // Filter state
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');

    useEffect(() => {
        fetchOrders();
        fetchSupportData();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSupportData = async () => {
        try {
            const { data: compData } = await supabase.from('companies').select('id, name').order('name');
            const { data: waitData } = await supabase.from('waiting_staff').select('id, name').order('name');

            const compMap: Record<string, string> = {};
            compData?.forEach(c => compMap[c.id] = c.name);

            setCompanies(compMap);
            setCompanyList(compData || []);
            setWaitingStaffList(waitData || []);
        } catch (error) {
            console.error('Error fetching support data:', error);
        }
    };

    // All waiting staff are global
    const filteredStaff = waitingStaffList;

    // Filter orders based on selected company and staff
    const filteredOrders = orders.filter(order => {
        if (selectedCompanyId && order.company_id !== selectedCompanyId) return false;
        if (selectedStaffId && order.waiting_staff_id !== selectedStaffId) return false;
        return true;
    });

    // Clear selection when company changes
    const handleCompanyChange = (companyId: string) => {
        setSelectedCompanyId(companyId);
        setSelectedStaffId('');
    };

    const clearFilters = () => {
        setSelectedCompanyId('');
        setSelectedStaffId('');
    };

    const getStatusColor = (status: string): { bg: string; text: string } => {
        switch (status.toLowerCase()) {
            case 'pending_confirmation':
            case 'pending':
            case 'confirmed':
                return { bg: '#fef3c7', text: '#92400e' }; // Amber
            case 'being prepared':
            case 'being prepared/cooking':
                return { bg: '#dbeafe', text: '#1e40af' }; // Blue
            case 'ready for pickup':
                return { bg: '#fef9c3', text: '#854d0e' }; // Yellow
            case 'out for delivery':
            case 'out for delivery/picked up':
                return { bg: '#ede9fe', text: '#5b21b6' }; // Purple
            case 'delivered/completed':
            case 'delivered':
                return { bg: '#d1fae5', text: '#065f46' }; // Green
            default:
                return { bg: '#f3f4f6', text: '#374151' }; // Gray
        }
    };

    // Check if order is in a completed/delivered state
    const isDelivered = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        return normalizedStatus === 'delivered' || normalizedStatus === 'delivered/completed';
    };

    const statusOptions = [
        'pending_confirmation',
        'Being Prepared',
        'Ready for pickup',
        'Out for delivery',
        'delivered'
    ];

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            await fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status. Please try again.');
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Orders</h1>
                    <p>Track and manage active service requests</p>
                </div>
            </header>

            {/* Filter Section */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Filter size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Filter Orders</h3>
                    {(selectedCompanyId || selectedStaffId) && (
                        <button
                            onClick={clearFilters}
                            style={{
                                marginLeft: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            <X size={14} /> Clear Filters
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Company Selector */}
                    <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                            Company
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Building2 style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} size={18} />
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => handleCompanyChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                                    fontSize: '0.875rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    appearance: 'none'
                                }}
                            >
                                <option value="">All Companies</option>
                                {companyList.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={18} />
                        </div>
                    </div>

                    {/* Waiting Staff Selector */}
                    <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                            Waiting Staff
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} size={18} />
                            <select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                                    fontSize: '0.875rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    appearance: 'none'
                                }}
                            >
                                <option value="">All Staff</option>
                                {filteredStaff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={18} />
                        </div>
                    </div>
                </div>
                {(selectedCompanyId || selectedStaffId) && (
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Showing {filteredOrders.length} of {orders.length} orders
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <ShoppingBag size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-muted)' }}>
                        {orders.length === 0 ? 'No orders found.' : 'No orders match the selected filters.'}
                    </p>
                </div>
            ) : (
                <div className="grid-list">
                    {filteredOrders.map(order => {
                        const statusColors = getStatusColor(order.status);
                        return (
                            <div key={order.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                            <Clock size={12} /> {new Date(order.created_at).toLocaleString()}
                                        </div>
                                        <h3 style={{ fontSize: '1.125rem' }}>Order #{order.id.slice(0, 8)}</h3>
                                    </div>
                                    <span style={{
                                        backgroundColor: statusColors.bg,
                                        color: statusColors.text,
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textTransform: 'capitalize'
                                    }}>
                                        {order.status}
                                    </span>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', fontStyle: 'italic', borderLeft: `3px solid ${statusColors.text}`, paddingLeft: '0.75rem' }}>
                                        {order.status_description || 'Track your order progress here.'}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <Building2 size={16} color="var(--primary)" /> {order.company_id ? (companies[order.company_id] || 'Unknown Company') : 'No Company'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <ShoppingBag size={16} color="var(--text-muted)" />
                                        <select
                                            value={order.waiting_staff_id || ''}
                                            onChange={(e) => {
                                                const newStaffId = e.target.value === '' ? null : e.target.value;
                                                // Only update if the value actually changed
                                                if (order.waiting_staff_id !== newStaffId) {
                                                    const performUpdate = async () => {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('orders')
                                                                .update({ waiting_staff_id: newStaffId })
                                                                .eq('id', order.id);

                                                            if (error) throw error;
                                                            await fetchOrders(); // Refresh
                                                        } catch (error) {
                                                            console.error('Error assigning staff:', error);
                                                            alert('Failed to assign staff. Please try again.');
                                                        }
                                                    };
                                                    performUpdate();
                                                }
                                            }}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.875rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                backgroundColor: 'var(--bg-card)',
                                                color: 'var(--text-main)',
                                                cursor: 'pointer',
                                                maxWidth: '200px'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="">Unassigned</option>
                                            {waitingStaffList
                                                .map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <MapPin size={16} color="var(--text-muted)" /> Floor {order.floor_number}
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                        ETB {order.total_price.toFixed(2)}
                                    </div>
                                    {isDelivered(order.status) ? (
                                        <CheckCircle2 size={24} color="#10b981" />
                                    ) : (
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                            style={{
                                                fontSize: '0.875rem',
                                                padding: '0.5rem 1rem',
                                                backgroundColor: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                minWidth: '180px'
                                            }}
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Orders;
