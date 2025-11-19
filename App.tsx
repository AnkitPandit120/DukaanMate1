
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Stock from './pages/Stock';
import Payments from './pages/Payments';
import RushMode from './pages/RushMode';
import Reports from './pages/Reports';
import Tutorials from './pages/Tutorials';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Strict Admin Route: Only admins can enter.
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { user } = useAuth();
    if (!user || user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

// Strict User Route: Admins CANNOT enter shop pages.
const UserRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                          <Routes>
                            <Route path="/" element={<HomeRedirect />} />
                            
                            {/* Shop pages protected from Admins */}
                            <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
                            <Route path="/sales" element={<UserRoute><Sales /></UserRoute>} />
                            <Route path="/stock" element={<UserRoute><Stock /></UserRoute>} />
                            <Route path="/payments" element={<UserRoute><Payments /></UserRoute>} />
                            <Route path="/rush-mode" element={<UserRoute><RushMode /></UserRoute>} />
                            <Route path="/reports" element={<UserRoute><Reports /></UserRoute>} />
                            <Route path="/tutorials" element={<UserRoute><Tutorials /></UserRoute>} />
                            
                            {/* Admin page protected from Users */}
                            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                          </Routes>
                      </MainLayout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </HashRouter>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
