import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EmployeeSelector from '../components/EmployeeSelector';
import { ShoppingBag, Loader2, Clock, CheckCircle2, MapPin, Building2 } from 'lucide-react';

interface Order {
    id: string;
    total_price: number;
    status: string;
    status_description: string | null;
    floor_number: number;
    company_id: string;
    employee_id: string;
    created_at: string;
}

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Record<string, string>>({});
    const [employees, setEmployees] = useState<Record<string, string>>({});

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
            const { data: compData } = await supabase.from('companies').select('id, name');
            const { data: empData } = await supabase.from('employees').select('id, name');

            const compMap: Record<string, string> = {};
            compData?.forEach(c => compMap[c.id] = c.name);

            const empMap: Record<string, string> = {};
            empData?.forEach(e => empMap[e.id] = e.name);

            setCompanies(compMap);
            setEmployees(empMap);
        } catch (error) {
            console.error('Error fetching support data:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_confirmation': return '#f59e0b';
            case 'Being Prepared': return '#3b82f6';
            case 'Ready for pickup': return '#fbbf24';
            case 'Out for delivery': return '#8b5cf6';
            case 'Delivered/completed': return '#10b981';
            // Legacy support
            case 'Confirmed': return '#f59e0b';
            case 'Being Prepared/Cooking': return '#3b82f6';
            case 'Ready for Pickup': return '#fbbf24';
            case 'Out for Delivery/Picked Up': return '#8b5cf6';
            case 'Delivered/Completed': return '#10b981';
            case 'pending': return '#f59e0b';
            default: return 'var(--text-muted)';
        }
    };

    const statusOptions = [
        'pending_confirmation',
        'Being Prepared',
        'Ready for pickup',
        'Out for delivery',
        'Delivered/completed'
    ];

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Refresh orders to show updated status and description
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

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Active Order Flow Test</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    Test the grouped employee selector below. This component demonstrates the relation between companies and their staff.
                </p>
                <div style={{ maxWidth: '400px' }}>
                    <EmployeeSelector onSelect={(empId, compId) => console.log('Selected:', { empId, compId })} />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={32} />
                </div>
            ) : orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <ShoppingBag size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No orders found.</p>
                </div>
            ) : (
                <div className="grid-list">
                    {orders.map(order => (
                        <div key={order.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                        <Clock size={12} /> {new Date(order.created_at).toLocaleString()}
                                    </div>
                                    <h3 style={{ fontSize: '1.125rem' }}>Order #{order.id.slice(0, 8)}</h3>
                                </div>
                                <span style={{
                                    backgroundColor: `${getStatusColor(order.status)}1a`,
                                    color: getStatusColor(order.status),
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
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', fontStyle: 'italic', borderLeft: `3px solid ${getStatusColor(order.status)}`, paddingLeft: '0.75rem' }}>
                                    {order.status_description || 'Track your order progress here.'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <Building2 size={16} color="var(--primary)" /> {companies[order.company_id] || 'Unknown Company'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <ShoppingBag size={16} color="var(--text-muted)" /> {employees[order.employee_id] || 'Anonymous'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <MapPin size={16} color="var(--text-muted)" /> Floor {order.floor_number}
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    ETB {order.total_price.toFixed(2)}
                                </div>
                                {order.status === 'Delivered/completed' ? (
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
