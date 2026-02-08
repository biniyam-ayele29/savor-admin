import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Utensils, LayoutDashboard, Settings, LogOut, Building2, ShoppingBag } from 'lucide-react';

interface SidebarProps {
    role: string | null;
}

const Sidebar = ({ role }: SidebarProps) => {
    const allNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['super_admin', 'admin', 'default'] },
        { icon: ShoppingBag, label: 'Orders', path: '/orders', roles: ['super_admin', 'admin', 'default'] },
        { icon: Building2, label: 'Companies', path: '/companies', roles: ['super_admin'] },
        { icon: Users, label: 'Clients', path: '/employees', roles: ['super_admin', 'admin'] },
        { icon: Users, label: 'Waiting Staff', path: '/waiting-staff', roles: ['super_admin', 'admin'] },
        { icon: Utensils, label: 'Menu', path: '/menu', roles: ['super_admin', 'admin'] },
        { icon: Settings, label: 'Settings', path: '/settings', roles: ['super_admin', 'admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(role || 'default'));

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error.message);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h2 className="brand">SAVOUR</h2>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="nav-link logout-btn" style={{ width: '100%', border: 'none', background: 'none' }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
