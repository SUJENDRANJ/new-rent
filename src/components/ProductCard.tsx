import { Product } from '../lib/supabase';
import { MapPin, DollarSign, User, ExternalLink } from 'lucide-react';

type ProductCardProps = {
  product: Product;
  onRent?: () => void;
  onEdit?: () => void;
  onClick?: () => void;
  showActions?: boolean;
};

export const ProductCard = ({ product, onRent, onEdit, onClick, showActions = true }: ProductCardProps) => {
  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
            {product.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
          {product.categories && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {product.categories.name}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2" />
              {product.location}
            </div>
            {product.location_url && (
              <a
                href={product.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                title="View on map"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <User size={16} className="mr-2" />
            {product.profiles?.full_name || 'Unknown Host'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center">
            <DollarSign size={20} className="text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{product.price_per_day}</span>
            <span className="text-gray-500 ml-1">/day</span>
          </div>

          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
              )}
              {onRent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRent();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Rent Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
