import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Navbar } from './components/Navbar';
import { BrowsePage } from './components/BrowsePage';
import { HostPage } from './components/HostPage';
import { RentalsPage } from './components/RentalsPage';
import { AdminPage } from './components/AdminPage';
import { WishlistPage } from './components/WishlistPage';
import { ProductDetailPage } from './components/ProductDetailPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'browse' | 'host' | 'rentals' | 'wishlist' | 'admin'>('browse');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

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

  if (selectedProductId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentView={currentView} onViewChange={setCurrentView} />
        <ProductDetailPage
          productId={selectedProductId}
          onBack={() => setSelectedProductId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'browse' && <BrowsePage onProductClick={setSelectedProductId} />}
      {currentView === 'host' && <HostPage />}
      {currentView === 'rentals' && <RentalsPage />}
      {currentView === 'wishlist' && <WishlistPage onProductClick={setSelectedProductId} />}
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
