import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).slice(2, 11);
        const notification = { id, message, type, duration };

        setNotifications((prev) => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const notify = {
        success: (message, duration = 2500) => addNotification(message, 'success', duration),
        error: (message, duration = 4000) => addNotification(message, 'error', duration),
        info: (message, duration = 3000) => addNotification(message, 'info', duration),
        warning: (message, duration = 3500) => addNotification(message, 'warning', duration),
        loading: (message) => addNotification(message, 'loading', 0),
        clear: () => setNotifications([]),
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
