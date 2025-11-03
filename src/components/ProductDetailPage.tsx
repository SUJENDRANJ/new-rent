import { useState, useEffect } from 'react';
import { supabase, Product, Rental } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, DollarSign, User, Calendar, ArrowLeft, Star, Shield, ExternalLink } from 'lucide-react';
import { RentalModal } from './RentalModal';
import { ReviewsSection } from './ReviewsSection';
import { ReviewForm } from './ReviewForm';

type ProductDetailPageProps = {
  productId: string;
  onBack: () => void;
};

export const ProductDetailPage = ({ productId, onBack }: ProductDetailPageProps) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [hostRentals, setHostRentals] = useState<Rental[]>([]);
  const [reviewsRefresh, setReviewsRefresh] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        profiles:host_id (
          id,
          full_name,
          avatar_url,
          created_at
        ),
        categories (
          id,
          name
        )
      `)
      .eq('id', productId)
      .maybeSingle();

    if (productError) {
      console.error('Error fetching product:', productError);
      setLoading(false);
      return;
    }

    if (productData?.host_id) {
      const { data: rentalsData } = await supabase
        .from('rentals')
        .select('*')
        .eq('host_id', productData.host_id)
        .eq('status', 'completed');

      setHostRentals(rentalsData || []);
    }

    setProduct(productData);
    setLoading(false);
  };

  const calculateHostRating = () => {
    const completedRentals = hostRentals.length;
    return completedRentals > 0 ? Math.min(4.5 + (completedRentals * 0.1), 5.0) : 0;
  };

  const getHostJoinDate = () => {
    if (!product?.profiles?.created_at) return '';
    return new Date(product.profiles.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Product not found</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProduct = user?.id === product.host_id;
  const hostRating = calculateHostRating();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6" id="product-details">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-96 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <span className="text-9xl font-bold">
                      {product.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.title}</h1>
                    {product.categories && (
                      <span className="inline-block text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {product.categories.name}
                      </span>
                    )}
                  </div>
                  {!product.is_available && (
                    <span className="text-sm bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium">
                      Unavailable
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-6 py-6 border-y border-gray-200">
                  <div className="flex items-center text-gray-600">
                    <MapPin size={20} className="mr-2 text-blue-600" />
                    <span className="font-medium">{product.location}</span>
                    {product.location_url && (
                      <a
                        href={product.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-700"
                        title="View on map"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
              <ReviewsSection productId={productId} refreshTrigger={reviewsRefresh} />
            </div>

            {user && !isOwnProduct && (
              <ReviewForm
                productId={productId}
                onReviewSubmitted={() => setReviewsRefresh(prev => prev + 1)}
              />
            )}

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Host Information</h2>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {product.profiles?.avatar_url ? (
                    <img
                      src={product.profiles.avatar_url}
                      alt={product.profiles.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{product.profiles?.full_name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {product.profiles?.full_name || 'Unknown Host'}
                  </h3>
                  <p className="text-gray-600 mb-3">Joined {getHostJoinDate()}</p>

                  <div className="space-y-2">
                    {hostRating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-900">
                          {hostRating.toFixed(1)}
                        </span>
                        <span className="text-gray-600">
                          ({hostRentals.length} {hostRentals.length === 1 ? 'rental' : 'rentals'})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Shield size={18} className="text-green-600" />
                      <span>Verified Host</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${product.price_per_day}
                  </span>
                  <span className="text-gray-600 text-lg">/ day</span>
                </div>
                <p className="text-gray-500 text-sm">Base rental price</p>
              </div>

              {!isOwnProduct && product.is_available && (
                <button
                  onClick={() => setShowRentalModal(true)}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Request to Rent
                </button>
              )}

              {isOwnProduct && (
                <div className="text-center py-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-600 font-medium">This is your listing</p>
                </div>
              )}

              {!product.is_available && !isOwnProduct && (
                <div className="text-center py-4 bg-red-50 rounded-xl">
                  <p className="text-red-700 font-medium">Currently unavailable</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={20} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Flexible booking</p>
                    <p className="text-sm">Book for any duration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Shield size={20} className="text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Secure payment</p>
                    <p className="text-sm">Your payment is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRentalModal && (
        <RentalModal
          product={product}
          onClose={() => setShowRentalModal(false)}
          onSuccess={() => {
            setShowRentalModal(false);
            onBack();
          }}
        />
      )}
    </div>
  );
};
