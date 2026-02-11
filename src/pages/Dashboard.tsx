import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    ShoppingBag,
    Loader2,
    TrendingUp,
    Clock,
    CheckCircle2,
    Building2,
    Users,
    ChefHat,
    DollarSign,
    Activity,
    Package,
    AlertCircle
} from 'lucide-react';

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
    employees?: { name: string };
}

interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    activeOrders: number;
    completedOrders: number;
    todayOrders: number;
    todayRevenue: number;
    avgOrderValue: number;
    pendingOrders: number;
    beingPreparedOrders: number;
    readyForPickupOrders: number;
    outForDeliveryOrders: number;
}

interface Company {
    id: string;
    name: string;
}

interface Employee {
    id: string;
    name: string;
}

interface MenuItem {
    id: string;
    name: string;
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        totalRevenue: 0,
        activeOrders: 0,
        completedOrders: 0,
        todayOrders: 0,
        todayRevenue: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        beingPreparedOrders: 0,
        readyForPickupOrders: 0,
        outForDeliveryOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Record<string, string>>({});
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [totalMenuItems, setTotalMenuItems] = useState(0);

    useEffect(() => {
        fetchAllData();

        // Subscribe to realtime updates for orders
        const channel = supabase
            .channel('dashboard-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                () => {
                    console.log('Order change detected, refreshing dashboard...');
                    fetchAllData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchOrders(),
                fetchCompanies(),
                fetchEmployees(),
                fetchMenuItems()
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, employees(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const orders = data || [];
            
            // Calculate stats
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
            
            // Today's stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayOrders = orders.filter(order => new Date(order.created_at) >= today);
            const todayOrdersCount = todayOrders.length;
            const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_price, 0);

            // Status-based stats
            const isActive = (status: string) => {
                const s = status.toLowerCase();
                return !['delivered', 'delivered/completed', 'cancelled'].includes(s);
            };

            const activeOrders = orders.filter(order => isActive(order.status)).length;
            const completedOrders = orders.filter(order => {
                const s = order.status.toLowerCase();
                return s === 'delivered' || s === 'delivered/completed';
            }).length;

            // Status breakdown
            const pendingOrders = orders.filter(o => 
                o.status.toLowerCase().includes('pending') || o.status.toLowerCase().includes('confirmed')
            ).length;
            const beingPreparedOrders = orders.filter(o => 
                o.status.toLowerCase().includes('preparing') || o.status.toLowerCase().includes('cooking')
            ).length;
            const readyForPickupOrders = orders.filter(o => 
                o.status.toLowerCase().includes('ready')
            ).length;
            const outForDeliveryOrders = orders.filter(o => 
                o.status.toLowerCase().includes('delivery') || o.status.toLowerCase().includes('picked')
            ).length;

            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            setStats({
                totalOrders,
                totalRevenue,
                activeOrders,
                completedOrders,
                todayOrders: todayOrdersCount,
                todayRevenue,
                avgOrderValue,
                pendingOrders,
                beingPreparedOrders,
                readyForPickupOrders,
                outForDeliveryOrders
            });

            // Get recent orders (last 5)
            setRecentOrders(orders.slice(0, 5));
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('id, name');

            if (error) throw error;

            const compMap: Record<string, string> = {};
            data?.forEach(c => compMap[c.id] = c.name);
            setCompanies(compMap);
            setTotalCompanies(data?.length || 0);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id, name');

            if (error) throw error;
            setTotalEmployees(data?.length || 0);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('id');

            if (error) throw error;
            setTotalMenuItems(data?.length || 0);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    const getStatusColor = (status: string): { bg: string; text: string } => {
        switch (status.toLowerCase()) {
            case 'pending_confirmation':
            case 'pending':
            case 'confirmed':
                return { bg: '#fff7ed', text: '#E68B2C' };
            case 'being prepared':
            case 'being prepared/cooking':
                return { bg: '#fffbeb', text: '#D97706' };
            case 'ready for pickup':
                return { bg: '#fef3c7', text: '#B45309' };
            case 'out for delivery':
            case 'out for delivery/picked up':
                return { bg: '#fef9c3', text: '#92520a' };
            case 'delivered/completed':
            case 'delivered':
                return { bg: '#f0fdf4', text: '#7FA14B' };
            default:
                return { bg: '#fafaf9', text: '#78716c' };
        }
    };

    const StatCard = ({ 
        icon: Icon, 
        title, 
        value, 
        subtitle, 
        iconColor = 'var(--primary)',
        trend 
    }: { 
        icon: any; 
        title: string; 
        value: string | number; 
        subtitle?: string;
        iconColor?: string;
        trend?: { value: string; positive: boolean };
    }) => (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Icon size={20} color={iconColor} />
                        <h3 style={{ color: 'var(--text-sub)', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                            {title}
                        </h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', lineHeight: 1 }}>
                        {value}
                    </p>
                    {subtitle && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {trend && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: trend.positive ? '#f0fdf4' : '#fef2f2',
                        color: trend.positive ? '#16a34a' : '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        <TrendingUp size={12} style={{ transform: trend.positive ? 'none' : 'scaleY(-1)' }} />
                        {trend.value}
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} size={48} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-title">
                    <h1>Dashboard</h1>
                    <p>Real-time overview of your restaurant operations</p>
                </div>
            </header>

            {/* Key Metrics */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} color="var(--primary)" />
                    Key Metrics
                </h2>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <StatCard
                        icon={ShoppingBag}
                        title="Total Orders"
                        value={stats.totalOrders}
                        subtitle={`${stats.activeOrders} active • ${stats.completedOrders} completed`}
                    />
                    <StatCard
                        icon={DollarSign}
                        title="Total Revenue"
                        value={`ETB ${stats.totalRevenue.toFixed(2)}`}
                        subtitle={`Avg: ETB ${stats.avgOrderValue.toFixed(2)} per order`}
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="Today's Orders"
                        value={stats.todayOrders}
                        subtitle={`Revenue: ETB ${stats.todayRevenue.toFixed(2)}`}
                        iconColor="#7FA14B"
                    />
                    <StatCard
                        icon={Clock}
                        title="Active Orders"
                        value={stats.activeOrders}
                        subtitle="Currently being processed"
                        iconColor="#D97706"
                    />
                </div>
            </div>

            {/* Order Status Breakdown */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={20} color="var(--primary)" />
                    Order Status Breakdown
                </h2>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <StatCard
                        icon={AlertCircle}
                        title="Pending"
                        value={stats.pendingOrders}
                        iconColor="#E68B2C"
                    />
                    <StatCard
                        icon={ChefHat}
                        title="Being Prepared"
                        value={stats.beingPreparedOrders}
                        iconColor="#D97706"
                    />
                    <StatCard
                        icon={Package}
                        title="Ready for Pickup"
                        value={stats.readyForPickupOrders}
                        iconColor="#B45309"
                    />
                    <StatCard
                        icon={ShoppingBag}
                        title="Out for Delivery"
                        value={stats.outForDeliveryOrders}
                        iconColor="#92520a"
                    />
                </div>
            </div>

            {/* System Overview */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={20} color="var(--primary)" />
                    System Overview
                </h2>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <StatCard
                        icon={Building2}
                        title="Companies"
                        value={totalCompanies}
                        iconColor="var(--primary)"
                    />
                    <StatCard
                        icon={Users}
                        title="Employees"
                        value={totalEmployees}
                        iconColor="#7FA14B"
                    />
                    <StatCard
                        icon={ChefHat}
                        title="Menu Items"
                        value={totalMenuItems}
                        iconColor="#E68B2C"
                    />
                </div>
            </div>

            {/* Live Orders Feed */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Activity size={20} color="var(--primary)" />
                        Live Orders Feed
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#16a34a',
                            backgroundColor: '#f0fdf4',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            marginLeft: '0.5rem'
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#16a34a',
                                borderRadius: '50%',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }}></span>
                            LIVE
                        </span>
                    </h2>
                    <a 
                        href="/orders" 
                        style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--primary)', 
                            textDecoration: 'none',
                            fontWeight: 500
                        }}
                    >
                        View All Orders →
                    </a>
                </div>
                
                {recentOrders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <ShoppingBag size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)' }}>No orders yet. Orders will appear here in real-time.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentOrders.map(order => {
                            const statusColors = getStatusColor(order.status);
                            return (
                                <div key={order.id} className="card" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                backgroundColor: statusColors.bg,
                                                borderRadius: 'var(--radius-lg)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <ShoppingBag size={24} color={statusColors.text} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                    Order #{order.id.slice(0, 8)}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={12} />
                                                        {new Date(order.created_at).toLocaleString()}
                                                    </span>
                                                    {order.company_id && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <Building2 size={12} />
                                                            {companies[order.company_id] || 'Unknown'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{
                                                backgroundColor: statusColors.bg,
                                                color: statusColors.text,
                                                padding: '0.375rem 0.875rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'capitalize',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {order.status}
                                            </span>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                ETB {order.total_price.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
