import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Utensils, LayoutDashboard, Settings, LogOut, Building2, ShoppingBag } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ShoppingBag, label: 'Orders', path: '/orders' },
        { icon: Building2, label: 'Companies', path: '/companies' },
        { icon: Users, label: 'Employees', path: '/employees' },
        { icon: Utensils, label: 'Menu', path: '/menu' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

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
