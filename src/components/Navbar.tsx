import { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock, ShoppingBag, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'order' | 'info' | 'success' | 'warning';
    orderId?: string;
}

const Navbar = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load notifications from localStorage
        loadNotifications();

        // Subscribe to new orders
        const channel = supabase
            .channel('orders-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    console.log('New order notification:', payload);
                    handleNewOrder(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    console.log('Order updated notification:', payload);
                    handleOrderUpdate(payload.new, payload.old);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Update unread count
        setUnreadCount(notifications.filter(n => !n.read).length);
        // Save to localStorage
        saveNotifications(notifications);
    }, [notifications]);

    const loadNotifications = () => {
        try {
            const stored = localStorage.getItem('savor_notifications');
            if (stored) {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const saveNotifications = (notifs: Notification[]) => {
        try {
            localStorage.setItem('savor_notifications', JSON.stringify(notifs));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    };

    const handleNewOrder = async (order: any) => {
        // Fetch employee and company details
        let employeeName = 'Unknown';
        let companyName = 'Unknown';

        if (order.employee_id) {
            const { data: empData } = await supabase
                .from('employees')
                .select('name')
                .eq('id', order.employee_id)
                .single();
            if (empData) employeeName = empData.name;
        }

        if (order.company_id) {
            const { data: compData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', order.company_id)
                .single();
            if (compData) companyName = compData.name;
        }

        const newNotification: Notification = {
            id: `order-${order.id}-${Date.now()}`,
            title: 'New Order Received',
            message: `Order #${order.id.slice(0, 8)} from ${employeeName} at ${companyName} - ETB ${order.total_price.toFixed(2)}`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'order',
            orderId: order.id
        };

        setNotifications(prev => [newNotification, ...prev]);

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order Received', {
                body: `Order from ${employeeName} - ETB ${order.total_price.toFixed(2)}`,
                icon: '/savor-logo.png',
                tag: order.id
            });
        }

        // Play notification sound (optional)
        playNotificationSound();
    };

    const handleOrderUpdate = async (newOrder: any, oldOrder: any) => {
        // Only notify on status changes to delivered
        if (newOrder.status !== oldOrder.status && 
            (newOrder.status.toLowerCase() === 'delivered' || 
             newOrder.status.toLowerCase() === 'delivered/completed')) {
            
            const notification: Notification = {
                id: `order-delivered-${newOrder.id}-${Date.now()}`,
                title: 'Order Delivered',
                message: `Order #${newOrder.id.slice(0, 8)} has been successfully delivered`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'success',
                orderId: newOrder.id
            };

            setNotifications(prev => [notification, ...prev]);
        }
    };

    const playNotificationSound = () => {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OSXTxALT6fj8LJnHAU3kdXx0HwoBS15x/DdkUALFF+z6uvpVRMKRp/g8r5sIQUrgc7y2Ik2CBhou+zkl08QC0+n4/CyZxwFN5HV8dB8KAUtecc=');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Could not play notification sound:', e));
        } catch (error) {
            console.log('Notification sound not supported');
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order':
                return <ShoppingBag size={16} color="var(--primary)" />;
            case 'success':
                return <CheckCircle size={16} color="#16a34a" />;
            default:
                return <Bell size={16} color="var(--text-muted)" />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    };

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    return (
        <div className="navbar">
            <div className="navbar-content">
                <div className="navbar-left">
                    {/* Empty for now, can add search or breadcrumbs later */}
                </div>
                <div className="navbar-right">
                    <div className="notification-wrapper" ref={dropdownRef}>
                        <button
                            className="notification-bell"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="notification-badge">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {isOpen && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <h3>Notifications</h3>
                                    {notifications.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="mark-read-btn"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                            <button
                                                onClick={clearAll}
                                                className="clear-all-btn"
                                                title="Clear all notifications"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="notification-list">
                                    {notifications.length === 0 ? (
                                        <div className="notification-empty">
                                            <Bell size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                            <p>No notifications yet</p>
                                            <span>You'll be notified about new orders here</span>
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="notification-icon">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="notification-content">
                                                    <div className="notification-title">
                                                        {notification.title}
                                                    </div>
                                                    <div className="notification-message">
                                                        {notification.message}
                                                    </div>
                                                    <div className="notification-time">
                                                        <Clock size={12} />
                                                        {formatTimestamp(notification.timestamp)}
                                                    </div>
                                                </div>
                                                <button
                                                    className="notification-delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    aria-label="Delete notification"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
