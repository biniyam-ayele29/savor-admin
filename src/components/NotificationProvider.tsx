import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order';
}

interface NotificationContextType {
    notifications: Notification[];
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }, []);

    const playSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(err => console.error('Error playing sound:', err));
        }
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { ...notification, id }]);
        playSound();

        // Auto-remove after 8 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 8000);
    }, [playSound, removeNotification]);

    useEffect(() => {
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload) => {
                    console.log('New order received!', payload);

                    try {
                        // Fetch more details for a better notification
                        const { data: orderDetails } = await supabase
                            .from('orders')
                            .select('id, companies(name), employees(name)')
                            .eq('id', payload.new.id)
                            .single();

                        const companyName = (orderDetails as any)?.companies?.name || 'Unknown Company';
                        const employeeName = (orderDetails as any)?.employees?.name || 'Customer';

                        addNotification({
                            title: 'New Order Received!',
                            message: `${employeeName} from ${companyName}`,
                            type: 'order'
                        });
                    } catch (error) {
                        console.error('Error fetching order details for notification:', error);
                        addNotification({
                            title: 'New Order Received!',
                            message: 'Check the orders page for details.',
                            type: 'order'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [addNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, removeNotification }}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none'
            }}>
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            style={{
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                minWidth: '300px',
                                pointerEvents: 'auto',
                                borderLeft: '4px solid var(--primary)'
                            }}
                        >
                            <div style={{
                                background: 'rgba(230, 139, 44, 0.1)',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--primary)'
                            }}>
                                <ShoppingBag size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{n.title}</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', margin: '0.125rem 0 0' }}>{n.message}</p>
                            </div>
                            <button
                                onClick={() => removeNotification(n.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
