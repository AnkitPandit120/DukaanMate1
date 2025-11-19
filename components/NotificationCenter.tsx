
import React from 'react';
import { Notification, NotificationType } from '../types';
import { Icons } from './icons';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface NotificationCenterProps {
    notifications: Notification[];
    onClose: () => void;
}

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch (type) {
        case NotificationType.LowStock:
            return <Icons.Warning className="h-5 w-5 text-red-500" />;
        case NotificationType.NearExpiry:
            return <Icons.Pending className="h-5 w-5 text-yellow-500" />;
        case NotificationType.OutOfStock:
            return <Icons.XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
        default:
            return <Icons.Bell className="h-5 w-5 text-gray-500" />;
    }
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose }) => {
    const { t } = useLanguage();
    return (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('notifications')}</h3>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <Link to="/stock" onClick={onClose} key={notification.id} className="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0">
                            <div className="flex-shrink-0 pt-1">
                                <NotificationIcon type={notification.type} />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-700 dark:text-gray-200">{notification.message}</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <p>{t('noNotifications')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;