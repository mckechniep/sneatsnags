import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Share2,
  Heart,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { sellerService } from '../services/sellerService';
import { useAuth } from '../hooks/useAuth';
import SweetAlert from '../utils/sweetAlert';
import type { SellerListing } from '../services/sellerService';
import type { ListingStatus } from '../types/listing';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<SellerListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchListingDetails();
    }
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the listing details
      const response = await sellerService.getListings({ 
        limit: 1000 // Get all listings to find the specific one
      });
      
      const foundListing = response.data.find(l => l.id === id);
      
      if (!foundListing) {
        setError('Listing not found');
        return;
      }
      
      setListing(foundListing);
    } catch (err) {
      console.error('Failed to fetch listing details:', err);
      setError('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing) return;
    
    const result = await SweetAlert.deleteConfirmation('listing');
    
    if (result.isConfirmed) {
      try {
        SweetAlert.loading('Deleting Listing', 'Please wait...');
        await sellerService.deleteListing(listing.id);
        SweetAlert.close();
        SweetAlert.success('Listing Deleted!', 'Your listing has been deleted successfully');
        navigate('/seller/listings');
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Delete Failed', 'Failed to delete the listing. Please try again.');
      }
    }
  };

  const handleMarkAsSold = async () => {
    if (!listing) return;
    
    const result = await SweetAlert.confirm(
      'Mark as Sold?',
      'Are you sure you want to mark this listing as sold?',
      'Mark as Sold',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      try {
        SweetAlert.loading('Updating Listing', 'Please wait...');
        await sellerService.updateListing(listing.id, { status: 'SOLD' });
        SweetAlert.close();
        SweetAlert.success('Listing Updated!', 'Your listing has been marked as sold');
        fetchListingDetails(); // Refresh the listing data
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Update Failed', 'Failed to update the listing. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: ListingStatus) => {
    const statusConfig = {
      ACTIVE: { 
        color: 'bg-green-100 text-green-800 border-green-300 shadow-sm', 
        icon: CheckCircle,
        label: 'Active'
      },
      AVAILABLE: { 
        color: 'bg-green-100 text-green-800 border-green-300 shadow-sm', 
        icon: CheckCircle,
        label: 'Available'
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm', 
        icon: Clock,
        label: 'Pending'
      },
      SOLD: { 
        color: 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm', 
        icon: DollarSign,
        label: 'Sold'
      },
      CANCELLED: { 
        color: 'bg-red-100 text-red-800 border-red-300 shadow-sm', 
        icon: XCircle,
        label: 'Cancelled'
      },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${config.color}`}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
              <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="h-32 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="space-y-8">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Listing</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => navigate('/seller/listings')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-gray-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
            <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate('/seller/listings')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const canEdit = isOwner && (listing.status === 'ACTIVE' || listing.status === 'AVAILABLE');
  const canDelete = isOwner && (listing.status === 'ACTIVE' || listing.status === 'AVAILABLE' || listing.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/seller/listings"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6 font-medium transition-colors duration-150"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{listing.event.name}</h1>
                <p className="text-lg text-gray-600 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {formatDate(listing.event.eventDate)} at {formatTime(listing.event.eventDate)}
                </p>
                <p className="text-gray-600 flex items-center mt-1">
                  <MapPin className="h-5 w-5 mr-2" />
                  {listing.event.venue}, {listing.event.city}, {listing.event.state}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(listing.status as ListingStatus)}
                {listing.isVerified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pricing Highlight */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">Price per Ticket</p>
                  <p className="text-3xl font-bold">{formatPrice(listing.price)}</p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">Quantity</p>
                  <p className="text-3xl font-bold">{listing.quantity}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">Total Value</p>
                  <p className="text-4xl font-bold">{formatPrice(listing.price * listing.quantity)}</p>
                </div>
              </div>
            </div>

            {/* Seating Information */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900">Seating Information</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Section</h3>
                        <p className="text-gray-600 text-lg">{listing.section.name}</p>
                      </div>
                    </div>
                    
                    {listing.row && (
                      <div className="flex items-start space-x-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">Row</h3>
                          <p className="text-gray-600 text-lg">{listing.row}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {listing.seats && listing.seats.length > 0 && (
                      <div className="flex items-start space-x-4">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">Seats</h3>
                          <p className="text-gray-600 text-lg">{listing.seats.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listing Timeline */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900">Listing Timeline</h2>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Listed On</h3>
                      <p className="text-gray-600">{formatDate(listing.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Last Updated</h3>
                      <p className="text-gray-600">{formatDate(listing.updatedAt)}</p>
                    </div>
                  </div>
                  
                  {listing.verifiedAt && (
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Verified On</h3>
                        <p className="text-gray-600">{formatDate(listing.verifiedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {listing.notes && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-900">Additional Notes</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">{listing.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket Files */}
            {listing.ticketFiles && listing.ticketFiles.length > 0 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-900">Ticket Files</h2>
                  <div className="grid gap-4">
                    {listing.ticketFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="bg-indigo-100 p-3 rounded-lg">
                            <Download className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {typeof file === 'string' ? `Ticket File ${index + 1}` : file.filename || `Ticket File ${index + 1}`}
                            </h3>
                            <p className="text-sm text-gray-600">Click to view or download</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-indigo-50 hover:border-indigo-200"
                          onClick={() => window.open(typeof file === 'string' ? file : file.url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Action Buttons */}
            {isOwner && (
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6 text-gray-900">Manage Listing</h3>
                  <div className="flex flex-col gap-6">
                    {canEdit && (
                      <Button
                        className="w-full justify-center py-4 px-6 text-base font-medium h-auto transition-all duration-200 hover:shadow-md"
                        variant="outline"
                        onClick={() => navigate(`/listings/${listing.id}/edit`)}
                      >
                        <Edit className="h-5 w-5 mr-3" />
                        Edit Listing
                      </Button>
                    )}
                    
                    {canEdit && (
                      <Button
                        className="w-full justify-center py-4 px-6 text-base font-medium h-auto bg-green-600 hover:bg-green-700 text-white border-green-600 transition-all duration-200 hover:shadow-md"
                        onClick={handleMarkAsSold}
                      >
                        <DollarSign className="h-5 w-5 mr-3" />
                        Mark as Sold
                      </Button>
                    )}
                    
                    {(!listing.ticketFiles || listing.ticketFiles.length === 0) && canEdit && (
                      <Button
                        className="w-full justify-center py-4 px-6 text-base font-medium h-auto bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 transition-all duration-200 hover:shadow-md"
                        onClick={() => navigate(`/listings/${listing.id}/upload`)}
                      >
                        <Upload className="h-5 w-5 mr-3" />
                        Upload Ticket Files
                      </Button>
                    )}
                    
                    {canDelete && (
                      <Button
                        className="w-full justify-center py-4 px-6 text-base font-medium h-auto text-red-600 border-red-300 hover:bg-red-50 transition-all duration-200 hover:shadow-md"
                        variant="outline"
                        onClick={handleDeleteListing}
                      >
                        <Trash2 className="h-5 w-5 mr-3" />
                        Delete Listing
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">Performance</h3>
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-semibold">Views</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{listing.views || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Heart className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-semibold">Interested</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{listing.interested || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-gray-700 font-semibold">Offers</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{(listing as any).offerCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">Share This Listing</h3>
                <div className="flex flex-col gap-6">
                  <Button 
                    variant="outline" 
                    className="w-full py-4 px-6 text-base font-medium h-auto justify-center hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                  >
                    <Share2 className="h-5 w-5 mr-3" />
                    Share Listing
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full py-4 px-6 text-base font-medium h-auto justify-center hover:bg-red-50 text-red-600 border-red-200 transition-all duration-200 hover:shadow-md"
                  >
                    <Heart className="h-5 w-5 mr-3" />
                    Save to Favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};