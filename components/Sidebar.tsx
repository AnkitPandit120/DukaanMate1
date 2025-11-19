
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from './icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  let navItems;

  if (user?.role === 'admin') {
    // Admin only sees the Admin Panel
    navItems = [
      { to: '/admin', icon: Icons.Dashboard, label: "Admin Command Center" }
    ];
  } else {
    // Regular users see the full shop management suite
    navItems = [
      { to: '/dashboard', icon: Icons.Dashboard, label: t('dashboard') },
      { to: '/sales', icon: Icons.Sales, label: t('salesAndExpenses') },
      { to: '/stock', icon: Icons.Stock, label: t('stockManagement') },
      { to: '/payments', icon: Icons.Payments, label: t('payments') },
      { to: '/rush-mode', icon: Icons.RushMode, label: t('rushMode') },
      { to: '/reports', icon: Icons.Reports, label: t('reportsAndAnalytics') },
      { to: '/tutorials', icon: Icons.Tutorials, label: t('tutorials') },
    ];
  }

  const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center px-4 py-2.5 mt-2 text-gray-600 dark:text-gray-300 transition-colors duration-300 transform rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white ${
          isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold' : ''
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="mx-4 font-medium">{label}</span>
    </NavLink>
  );

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 px-4 py-4 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transform lg:static lg:inset-auto lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center text-2xl font-bold text-gray-800 dark:text-white">
            <Icons.Zap className="h-7 w-7 text-blue-500 mr-2"/>
            {t('appName')}
          </div>
           <button onClick={() => setSidebarOpen(false)} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
              <Icons.Close className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-10">
          {navItems.map(item => <NavItem key={item.to} {...item} />)}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
