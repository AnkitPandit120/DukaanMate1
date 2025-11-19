
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Icons } from '../components/icons';
import { User } from '../types';

// Simple hashing function for simulation. In a real app, use a library like bcrypt on the backend.
const simpleHash = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash);
};

const Login: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleDemoLogin = () => {
    const demoUser: User = { 
        id: 'demo-user', 
        name: 'Demo User', 
        email: 'demo@dukaanmate.com',
        role: 'user',
        registrationDate: new Date().toISOString()
    };
    login(demoUser);
    navigate('/dashboard');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLoginView) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const handleSignup = () => {
    const users: User[] = JSON.parse(localStorage.getItem('dukaan-users') || '[]');
    if (users.find(u => u.email === email)) {
      setError(t('errorEmailExists'));
      return;
    }
    
    const role = email === 'superadmin@dukaanmate.com' ? 'admin' : 'user';
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: simpleHash(password),
      role,
      registrationDate: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('dukaan-users', JSON.stringify(users));
    
    login(newUser);
    navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleLogin = () => {
     const users: User[] = JSON.parse(localStorage.getItem('dukaan-users') || '[]');
     const user = users.find(u => u.email === email);
     
     if (user && user.passwordHash === simpleHash(password)) {
       login(user);
       navigate(user.role === 'admin' ? '/admin' : '/dashboard');
     } else {
       setError(t('errorInvalidCredentials'));
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <div className="flex justify-center items-center text-3xl font-bold text-gray-900">
            <Icons.Zap className="h-10 w-10 text-blue-500 mr-2" />
            {t('appName')}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLoginView ? t('signInToAccount') : t('createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('or')}{' '}
            <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500">
              {isLoginView ? t('createAnAccount') : t('signInInstead')}
            </button>
          </p>
        </div>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLoginView && (
              <div>
                <label htmlFor="name" className="sr-only">{t('fullName')}</label>
                <input id="name" name="name" type="text" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder={t('fullName')} />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">{t('emailAddress')}</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isLoginView ? 'rounded-t-md' : ''} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`} placeholder={t('emailAddress')} />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('password')}</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder={t('password')} />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {isLoginView ? t('signIn') : t('signUp')}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <button onClick={handleDemoLogin} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mb-4">
            {t('loginAsDemoUser')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
