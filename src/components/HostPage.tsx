import { useState, useEffect } from 'react';
import { supabase, Product, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { KYCSubmission } from './KYCSubmission';

export const HostPage = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyProducts();
    }
  }, [user]);

  const fetchMyProducts = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles:host_id (
          id,
          full_name,
          avatar_url
        ),
        categories (
          id,
          name
        )
      `)
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSuccess = () => {
    handleClose();
    fetchMyProducts();
  };

  if (profile?.kyc_status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Become a Host</h2>

          {profile?.kyc_status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 flex items-start gap-4">
              <Clock size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">KYC Verification Pending</h3>
                <p className="text-gray-600 text-sm">
                  To list products as a host, you need to complete the KYC verification process. This helps ensure a safe and trusted community.
                </p>
              </div>
            </div>
          )}

          {profile?.kyc_status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex items-start gap-4">
              <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">KYC Verification Required</h3>
                <p className="text-gray-600 text-sm">
                  Your previous verification was not approved. Please resubmit your documents to become a verified host.
                </p>
              </div>
            </div>
          )}

          <KYCSubmission />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            <span className="font-semibold">Verified Host</span> - You can now list products
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Listings</h2>
            <p className="text-gray-600 mt-1">Manage your rental products</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg mb-4">You haven't listed any products yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              List Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleEdit(product)}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
