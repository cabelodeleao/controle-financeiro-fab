import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { isSupabaseConfigured } from './lib/supabase';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Planning } from './pages/Planning';
import { Months } from './pages/Months';
import { Charts } from './pages/Charts';
import { AnnualSummary } from './pages/AnnualSummary';
import { Settings } from './pages/Settings';

const AppShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':    return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'planning':     return <Planning />;
      case 'months':       return <Months />;
      case 'charts':       return <Charts />;
      case 'annual':       return <AnnualSummary />;
      case 'settings':     return <Settings />;
      default:             return <Dashboard />;
    }
  };

  // Still resolving the Supabase session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a1628' }}>
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Supabase configured but user not logged in → show login page
  if (isSupabaseConfigured && !user) return <Login />;

  // Either Supabase is configured and user is logged in, or Supabase is not
  // configured at all — in both cases render the app (userId may be undefined)
  return (
    <AppProvider userId={user?.id}>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} title="">
        {renderPage()}
      </Layout>
    </AppProvider>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
