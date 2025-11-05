import { useState, useEffect } from 'react';
import { supabase, Wishlist, Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Trash2 } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const WishlistPage = ({ onProductClick }: { onProductClick: (productId: string) => void }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
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
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
    } else {
      setWishlistItems(data || []);
    }
    setLoading(false);
  };

  const removeFromWishlist = async (wishlistId: string) => {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) {
      console.error('Error removing from wishlist:', error);
    } else {
      fetchWishlist();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={32} className="text-red-500 fill-red-500" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Wishlist</h2>
            <p className="text-gray-600 mt-1">Products you've saved for later</p>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">Your wishlist is empty</p>
            <p className="text-gray-400 text-sm">Start adding products you love!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors group"
                  title="Remove from wishlist"
                >
                  <Trash2 size={20} className="text-gray-600 group-hover:text-red-600" />
                </button>
                {item.products && (
                  <ProductCard
                    product={item.products}
                    onClick={() => onProductClick(item.product_id)}
                    showActions={false}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
