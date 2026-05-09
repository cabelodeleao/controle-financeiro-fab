import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Planning } from './pages/Planning';
import { Months } from './pages/Months';
import { Charts } from './pages/Charts';
import { AnnualSummary } from './pages/AnnualSummary';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'planning': return <Planning />;
      case 'months': return <Months />;
      case 'charts': return <Charts />;
      case 'annual': return <AnnualSummary />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} title="">
        {renderPage()}
      </Layout>
    </AppProvider>
  );
};

export default App;
