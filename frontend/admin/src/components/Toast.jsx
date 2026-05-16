import React from 'react';
import { useNotification } from '../context/NotificationContext';

const Toast = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
            {notifications.map((notification) => {
                const bgColor = {
                    success: 'bg-emerald-500/90',
                    error: 'bg-red-500/90',
                    warning: 'bg-amber-500/90',
                    info: 'bg-blue-500/90',
                    loading: 'bg-zinc-700/90',
                };

                const icon = {
                    success: 'check_circle',
                    error: 'error',
                    warning: 'warning',
                    info: 'info',
                    loading: 'hourglass_empty',
                };

                const animateIcon = notification.type === 'loading' ? 'animate-spin' : '';

                return (
                    <div
                        key={notification.id}
                        className={`${bgColor[notification.type]} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 backdrop-blur pointer-events-auto animate-slideIn`}
                    >
                        <span className={`material-symbols-outlined text-lg flex-shrink-0 ${animateIcon}`}>
                            {icon[notification.type]}
                        </span>
                        <p className="text-sm font-medium flex-1">{notification.message}</p>
                        {notification.type !== 'loading' && (
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-white/70 hover:text-white flex-shrink-0"
                                aria-label="Close notification"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Toast;
