import { useState, useEffect } from 'react';
import { supabase, Rental } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, DollarSign, MapPin, User, Package } from 'lucide-react';

export const RentalsPage = () => {
  const { user } = useAuth();
  const [asRenter, setAsRenter] = useState<Rental[]>([]);
  const [asHost, setAsHost] = useState<Rental[]>([]);
  const [activeTab, setActiveTab] = useState<'renter' | 'host'>('renter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRentals();
    }
  }, [user]);

  const fetchRentals = async () => {
    if (!user) return;

    setLoading(true);

    const { data: renterData, error: renterError } = await supabase
      .from('rentals')
      .select(`
        *,
        products (
          *,
          profiles:host_id (
            full_name
          )
        )
      `)
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false });

    const { data: hostData, error: hostError } = await supabase
      .from('rentals')
      .select(`
        *,
        products (*),
        renter:renter_id (
          full_name,
          email
        )
      `)
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });

    if (renterError) console.error('Error fetching renter rentals:', renterError);
    if (hostError) console.error('Error fetching host rentals:', hostError);

    setAsRenter(renterData || []);
    setAsHost(hostData || []);
    setLoading(false);
  };

  const updateRentalStatus = async (rentalId: string, status: string) => {
    const { error } = await supabase
      .from('rentals')
      .update({ status })
      .eq('id', rentalId);

    if (error) {
      console.error('Error updating rental:', error);
    } else {
      fetchRentals();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const RentalCard = ({ rental, isHost }: { rental: Rental; isHost: boolean }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {rental.products?.title}
          </h3>
          <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(rental.status)}`}>
            {rental.status}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">${rental.total_price}</div>
          <div className="text-xs text-gray-500">
            {calculateDays(rental.start_date, rental.end_date)} days
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Calendar size={16} className="mr-2" />
          {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin size={16} className="mr-2" />
          {rental.products?.location}
        </div>
        <div className="flex items-center text-gray-600">
          <User size={16} className="mr-2" />
          {isHost ? rental.renter?.full_name : rental.products?.profiles?.full_name}
        </div>
      </div>

      {isHost && rental.status === 'pending' && (
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={() => updateRentalStatus(rental.id, 'approved')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Approve
          </button>
          <button
            onClick={() => updateRentalStatus(rental.id, 'cancelled')}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Decline
          </button>
        </div>
      )}

      {isHost && rental.status === 'approved' && (
        <div className="pt-4 border-t">
          <button
            onClick={() => updateRentalStatus(rental.id, 'active')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Mark as Active
          </button>
        </div>
      )}

      {isHost && rental.status === 'active' && (
        <div className="pt-4 border-t">
          <button
            onClick={() => updateRentalStatus(rental.id, 'completed')}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {!isHost && rental.status === 'pending' && (
        <div className="pt-4 border-t">
          <button
            onClick={() => updateRentalStatus(rental.id, 'cancelled')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Cancel Request
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">My Rentals</h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('renter')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'renter'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package size={20} />
            As Renter ({asRenter.length})
          </button>
          <button
            onClick={() => setActiveTab('host')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'host'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User size={20} />
            As Host ({asHost.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'renter' ? (
              asRenter.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500 text-lg">No rentals found</p>
                </div>
              ) : (
                asRenter.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} isHost={false} />
                ))
              )
            ) : asHost.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500 text-lg">No rental requests found</p>
              </div>
            ) : (
              asHost.map((rental) => (
                <RentalCard key={rental.id} rental={rental} isHost={true} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
