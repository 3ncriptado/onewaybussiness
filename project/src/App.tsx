import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Businesses from './components/Businesses';
import Items from './components/Items';
import Sales from './components/Sales';
import Configuration from './components/Configuration';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'negocios':
        return <Businesses />;
      case 'items':
        return <Items />;
      case 'ventas':
        return <Sales />;
      case 'configuracion':
        return <Configuration />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {renderPage()}
      <ToastContainer />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
