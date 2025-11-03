import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Navbar } from './components/Navbar';
import { BrowsePage } from './components/BrowsePage';
import { HostPage } from './components/HostPage';
import { RentalsPage } from './components/RentalsPage';
import { AdminPage } from './components/AdminPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'browse' | 'host' | 'rentals' | 'admin'>('browse');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'browse' && <BrowsePage />}
      {currentView === 'host' && <HostPage />}
      {currentView === 'rentals' && <RentalsPage />}
      {currentView === 'admin' && <AdminPage />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
