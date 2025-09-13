import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Notification } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, X, AlertCircle } from 'lucide-react';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
        // Add event listener to refresh notifications
        const handleRefresh = () => {
            if (isOpen) {
                fetchNotifications();
            }
        };
        window.addEventListener('notifications-changed', handleRefresh);
        return () => window.removeEventListener('notifications-changed', handleRefresh);
    }, [isOpen]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Check if online
            if (!navigator.onLine) {
                setError("אין חיבור לרשת");
                setNotifications([]);
                return;
            }

            // Add retry logic with timeout
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    const unread = await Promise.race([
                        Notification.filter({ is_read: false }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), 10000)
                        )
                    ]);
                    
                    // Sort by created_date descending and limit to 50
                    const sortedUnread = unread
                        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                        .slice(0, 50);
                    setNotifications(sortedUnread);
                    break;
                } catch (retryError) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw retryError;
                    }
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        } catch (error) {
            console.error("NotificationCenter: Failed to fetch notifications:", error);
            
            if (error.message === 'Network Error' || error.message === 'Timeout') {
                setError("בעיית רשת זמנית");
            } else {
                setError("שגיאה בטעינת התראות");
            }
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await Notification.update(id, { is_read: true });
            fetchNotifications();
            window.dispatchEvent(new CustomEvent('notifications-changed'));
        } catch (error) {
            console.error("NotificationCenter: Failed to mark notification as read:", error);
            // Don't show error to user for this action, just log it
        }
    };

    const markAllAsRead = async () => {
        try {
            const updates = notifications.map(n => Notification.update(n.id, { is_read: true }));
            await Promise.all(updates);
            fetchNotifications();
            window.dispatchEvent(new CustomEvent('notifications-changed'));
        } catch(error) {
            console.error("NotificationCenter: Failed to mark all as read:", error);
            // Don't show error to user for this action, just log it
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-4">
                    <div className="text-sm text-gray-500">טוען התראות...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                    <div className="text-sm text-red-600 mb-2">{error}</div>
                    <Button variant="outline" size="sm" onClick={fetchNotifications}>
                        נסה שוב
                    </Button>
                </div>
            );
        }

        if (notifications.length === 0) {
            return (
                <div className="text-center py-4">
                    <div className="text-sm text-gray-500">אין התראות חדשות</div>
                </div>
            );
        }

        return (
            <div className="grid gap-2 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className="flex items-start justify-between p-2 rounded-md hover:bg-gray-50"
                    >
                        <Link to={notification.link} className="flex-1 text-sm" onClick={() => setIsOpen(false)}>
                            {notification.message}
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(notification.id)}>
                            <Check className="h-4 w-4 text-green-500" />
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && !error && (
                        <span className="absolute top-0 right-0 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" dir="rtl">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium leading-none">התראות</h4>
                            {notifications.length > 0 && !error && (
                                <Button variant="link" size="sm" onClick={markAllAsRead}>
                                    סמן הכל כנקרא
                                </Button>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {error ? error : 
                             notifications.length > 0 ? `יש לך ${notifications.length} התראות חדשות.` : 
                             'אין התראות חדשות.'}
                        </p>
                    </div>
                    {renderContent()}
                </div>
            </PopoverContent>
        </Popover>
    );
}