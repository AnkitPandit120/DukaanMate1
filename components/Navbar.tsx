
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Icons } from './icons';
import { Link } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { generateNotifications } from '../utils/aiUtils';
import QRModal from './QRModal';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

const SyncStatus: React.FC<{ online: boolean }> = ({ online }) => {
    const { t } = useLanguage();
    return (
        <div className={`flex items-center space-x-2 text-sm font-medium ${online ? 'text-green-600' : 'text-yellow-600'}`}>
            <div className="relative h-6 w-6">
                {online ? <Icons.Cloud className="h-6 w-6" /> : <Icons.CloudOff className="h-6 w-6" />}
                {online && <Icons.Sync className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white sync-animate" />}
            </div>
            <span className="hidden sm:inline">{online ? t('synced') : t('offline')}</span>
        </div>
    );
};

const QuickLink: React.FC<{ to: string, label: string, icon: React.ElementType }> = ({ to, label, icon: Icon }) => (
    <Link to={to} className="hidden sm:flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors">
        <Icon className="h-4 w-4 mr-1.5" />
        {label}
    </Link>
);

const Navbar: React.FC<NavbarProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { online, stock } = useData();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => generateNotifications(stock), [stock]);

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none lg:hidden">
          <Icons.Menu className="h-6 w-6" />
        </button>
        <div className="relative mx-4 lg:mx-0">
           <h1 className="text-lg font-semibold text-gray-700 hidden md:block">
            {t('welcome')}, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <SyncStatus online={online} />

        <div className="hidden sm:flex items-center space-x-2">
            <QuickLink to="/sales" label={t('addSale')} icon={Icons.Add} />
            <QuickLink to="/stock" label={t('stock')} icon={Icons.Stock} />
            <QuickLink to="/reports" label={t('reports')} icon={Icons.Reports} />
        </div>
        
        <button onClick={() => setIsQrModalOpen(true)} className="text-gray-600 hover:text-blue-500 focus:outline-none transition-colors" aria-label={t('paymentQR')}>
          <Icons.QrCode className="h-5 w-5" />
        </button>

        <div className="relative" ref={notificationsRef}>
            <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="relative text-gray-600 hover:text-blue-500 focus:outline-none transition-colors"
                aria-label={t('notifications')}
            >
              <Icons.Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 text-xs flex items-center justify-center rounded-full bg-red-500 text-white border-2 border-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
                <NotificationCenter 
                    notifications={notifications} 
                    onClose={() => setIsNotificationsOpen(false)} 
                />
            )}
        </div>
        
        {/* Theme Toggle Removed */}

        <button onClick={handleLanguageToggle} className="flex items-center text-gray-600 hover:text-blue-500 focus:outline-none transition-colors">
          <Icons.Language className="h-5 w-5" />
        </button>
        
        <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center text-gray-600 hover:text-red-500 focus:outline-none transition-colors">
          <Icons.Logout className="h-5 w-5" />
        </button>
      </div>
    </header>
    {isQrModalOpen && <QRModal onClose={() => setIsQrModalOpen(false)} />}
    
    {/* Logout Confirmation Modal */}
    {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('logout')}</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={() => setIsLogoutModalOpen(false)} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">
                        {t('cancel')}
                    </button>
                    <button onClick={() => { logout(); setIsLogoutModalOpen(false); }} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">
                        {t('logout')}
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Navbar;
