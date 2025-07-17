import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { sellerService, type AvailableOffer, type SellerListing } from '../../services/sellerService';
import SweetAlert from '../../utils/sweetAlert';

export const OffersBrowser = () => {
  const [filters, setFilters] = useState({
    eventId: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 20,
  });

  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<Record<string, number>>({});

  const queryClient = useQueryClient();

  // Fetch seller's listings for dropdown selection
  const { data: listingsData } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => sellerService.getListings({ limit: 100 }), // Get all listings
  });


  const { data, isLoading, error } = useQuery({
    queryKey: ['available-offers', filters],
    queryFn: () => sellerService.getAvailableOffers({
      ...filters,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    }),
  });

  const acceptOfferMutation = useMutation({
    mutationFn: ({ offerId, listingId, quantity }: { offerId: string; listingId: string; quantity?: number }) =>
      sellerService.acceptOffer(offerId, listingId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      setSelectedListingId('');
      setSelectedQuantity({});
    },
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleAcceptOffer = async (offerId: string, suggestedListingId?: string) => {
    const listingId = suggestedListingId || selectedListingId;
    
    if (!listingId) {
      SweetAlert.warning('Select a Listing', 'Please select one of your listings first to match with this offer');
      return;
    }

    const offer = data?.data.find(o => o.id === offerId);
    if (!offer) return;

    const listing = listingsData?.data.find(l => l.id === listingId);
    if (!listing) return;

    // Get the quantity to sell (default to offer quantity, max available in listing)
    const quantityToSell = Math.min(
      selectedQuantity[offerId] || offer.quantity,
      listing.quantity,
      offer.quantity
    );

    if (quantityToSell <= 0) {
      SweetAlert.warning('Invalid Quantity', 'Please select a valid quantity to sell');
      return;
    }

    // Show detailed confirmation dialog
    const platformFee = offer.maxPrice * quantityToSell * 0.1;
    const sellerAmount = offer.maxPrice * quantityToSell * 0.9;
    
    const confirmMessage = `Event: ${offer.event.name}\n` +
      `Buyer: ${offer.buyer.firstName} ${offer.buyer.lastName}\n` +
      `Quantity to Sell: ${quantityToSell} tickets\n` +
      `Offer Price per Ticket: $${offer.maxPrice}\n` +
      `Total Revenue: $${(offer.maxPrice * quantityToSell).toFixed(2)}\n` +
      `Platform Fee (10%): $${platformFee.toFixed(2)}\n` +
      `Your Earnings: $${sellerAmount.toFixed(2)}\n\n` +
      `Your Listing: ${listing.event.name} - ${listing.section?.name || 'General'} - $${listing.price}\n` +
      `Remaining after sale: ${listing.quantity - quantityToSell} tickets`;

    const result = await SweetAlert.confirm(
      'Accept this offer?',
      confirmMessage,
      'Accept',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        SweetAlert.loading('Accepting Offer', 'Please wait while we process your acceptance...');
        await acceptOfferMutation.mutateAsync({ offerId, listingId, quantity: quantityToSell });
        SweetAlert.close();
        SweetAlert.success('Offer Accepted!', 'The offer has been accepted successfully. The transaction will now be processed.');
      } catch (error) {
        console.error('Failed to accept offer:', error);
        SweetAlert.close();
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        SweetAlert.error('Failed to Accept Offer', errorMessage);
      }
    }
  };

  const isOfferExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Find compatible listings for an offer
  const getCompatibleListings = (offer: AvailableOffer) => {
    if (!listingsData?.data) return [];
    
    return listingsData.data.filter((listing: SellerListing) => {
      // Must be available and for the same event
      if (listing.status !== 'AVAILABLE' || listing.eventId !== offer.event.id) {
        return false;
      }
      
      // If offer specifies sections, check if listing matches
      if (offer.sections && offer.sections.length > 0) {
        const offerSectionIds = offer.sections.map(s => s.sectionId);
        return offerSectionIds.includes(listing.sectionId);
      }
      
      // If no sections specified, any listing for this event is compatible
      return true;
    }).sort((a, b) => {
      // Sort by price descending to show most profitable first
      return b.price - a.price;
    });
  };

  // Get the best matching listing for an offer
  const getBestMatchingListing = (offer: AvailableOffer) => {
    const compatible = getCompatibleListings(offer);
    return compatible.length > 0 ? compatible[0] : null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading offers. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Browse Offers</h1>
      </div>

      {/* Global Listing Selection */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Your Listing</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose which of your listings you want to match with buyer offers.
          </p>
          
          {listingsData?.data && listingsData.data.length > 0 ? (
            <div className="max-w-md">
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a listing...</option>
                {listingsData.data
                  .filter((listing: SellerListing) => listing.status === 'AVAILABLE')
                  .map((listing: SellerListing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.event.name} - {listing.section?.name || 'General'} - ${listing.price} ({listing.quantity} tickets)
                    </option>
                  ))}
              </select>
              
              {selectedListingId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Listing selected. You can now accept offers that match this listing.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>No active listings found.</strong>
                </p>
                <p className="text-sm text-yellow-700 mb-3">
                  You need to create a listing before you can accept offers.
                </p>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = '/seller/listings/new'}
                >
                  Create Your First Listing
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Search Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filter Offers</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event ID
              </label>
              <Input
                type="text"
                placeholder="Enter event ID"
                value={filters.eventId}
                onChange={(e) => handleFilterChange('eventId', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <Input
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <Input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Results per page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Offers List */}
      {data?.data && data.data.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {data.pagination.total} offers found
            </p>
          </div>

          {data.data.map((offer: AvailableOffer) => {
            const expired = isOfferExpired(offer.expiresAt);
                        const compatibleListings = getCompatibleListings(offer);
                        const bestMatch = getBestMatchingListing(offer);
                        const sellerEarnings = offer.maxPrice * 0.9;
            
            return (
              <Card key={offer.id}>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {offer.event.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          expired
                            ? 'bg-red-100 text-red-800'
                            : offer.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {expired ? 'EXPIRED' : offer.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Max Price:</strong> ${offer.maxPrice}</p>
                                                    <p><strong>Your Earnings:</strong> ${sellerEarnings.toFixed(2)} <span className="text-gray-500">(after 10% fee)</span></p>
                          <p><strong>Quantity:</strong> {offer.quantity}</p>
                          <p><strong>Buyer:</strong> {offer.buyer.firstName} {offer.buyer.lastName}</p>
                          <p><strong>Created:</strong> {new Date(offer.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Event Date:</strong> {new Date(offer.event.eventDate).toLocaleDateString()}</p>
                          <p><strong>Venue:</strong> {offer.event.venue}</p>
                          <p><strong>Location:</strong> {offer.event.city}, {offer.event.state}</p>
                          <p><strong>Expires:</strong> {new Date(offer.expiresAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">
                            <strong>Message:</strong> {offer.message}
                          </p>
                        </div>
                      )}

                      {offer.sections && offer.sections.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">
                            <strong>Requested Sections:</strong> {offer.sections.map(s => s.section.name).join(', ')}
                          </p>
                        </div>
                      )}

                      {expired && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-800">
                            This offer has expired and can no longer be accepted.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {!expired && offer.status === 'ACTIVE' && (
                        <>
                          {compatibleListings.length === 0 && !selectedListingId && (
                            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-2">
                              ⚠️ No compatible listings found. Select a listing above to accept this offer.
                            </div>
                          )}
                          
                          {(selectedListingId || bestMatch) && (
                            <div className="mb-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Quantity to Sell
                              </label>
                              <select
                                value={selectedQuantity[offer.id] || offer.quantity}
                                onChange={(e) => setSelectedQuantity(prev => ({
                                  ...prev,
                                  [offer.id]: parseInt(e.target.value)
                                }))}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {(() => {
                                  const availableListing = listingsData?.data.find(l => l.id === (selectedListingId || bestMatch?.id));
                                  const maxQuantity = Math.min(
                                    offer.quantity,
                                    availableListing?.quantity || 0
                                  );
                                  return Array.from({ length: maxQuantity }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>
                                      {num} ticket{num > 1 ? 's' : ''}
                                    </option>
                                  ));
                                })()}
                              </select>
                              {(() => {
                                const availableListing = listingsData?.data.find(l => l.id === (selectedListingId || bestMatch?.id));
                                return availableListing && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Available: {availableListing.quantity} • Buyer wants: {offer.quantity}
                                  </p>
                                );
                              })()}
                            </div>
                          )}
                          
                          <Button
                            onClick={() => handleAcceptOffer(offer.id, bestMatch?.id)}
                            disabled={(!selectedListingId && !bestMatch) || acceptOfferMutation.isPending}
                            size="sm"
                          >
                            {acceptOfferMutation.isPending ? 'Accepting...' : bestMatch ? `Accept with ${bestMatch.section?.name || 'Best Match'}` : 'Accept Offer'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement contact buyer functionality
                              console.log('Contact buyer for offer:', offer.id);
                            }}
                          >
                            Contact Buyer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page >= data.pagination.totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-4">No active offers found</p>
            <p>Check back later for new buyer offers, or try adjusting your search criteria.</p>
          </div>
        </Card>
      )}

      {!selectedListingId && data?.data && data.data.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 rounded-lg p-4 max-w-sm">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Select one of your listings above to start accepting offers that match your tickets.
          </p>
        </div>
      )}
    </div>
  );
};