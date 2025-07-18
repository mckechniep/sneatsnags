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
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        label: 'Active'
      },
      AVAILABLE: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        label: 'Available'
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        label: 'Pending'
      },
      SOLD: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: DollarSign,
        label: 'Sold'
      },
      CANCELLED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle,
        label: 'Cancelled'
      },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/seller/listings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/seller/listings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const canEdit = isOwner && (listing.status === 'ACTIVE' || listing.status === 'AVAILABLE');
  const canDelete = isOwner && (listing.status === 'ACTIVE' || listing.status === 'AVAILABLE' || listing.status === 'PENDING');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/seller/listings"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{listing.event.name}</h1>
            <p className="text-gray-600 mt-1">Listing Details</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(listing.status as ListingStatus)}
            {listing.isVerified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{formatDate(listing.event.eventDate)}</p>
                      <p className="text-sm text-gray-600">{formatTime(listing.event.eventDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-3">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{listing.event.venue}</p>
                      <p className="text-sm text-gray-600">
                        {listing.event.city}, {listing.event.state}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-3">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">Section: {listing.section.name}</p>
                      {listing.row && (
                        <p className="text-sm text-gray-600">Row: {listing.row}</p>
                      )}
                    </div>
                  </div>
                  {listing.seats && listing.seats.length > 0 && (
                    <div className="flex items-center mb-3">
                      <Users className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">Seats: {listing.seats.join(', ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Listing Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <p className="text-lg font-semibold">{listing.quantity} ticket{listing.quantity > 1 ? 's' : ''}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Ticket
                    </label>
                    <p className="text-lg font-semibold">{formatPrice(listing.price)}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Value
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(listing.price * listing.quantity)}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Listed On
                    </label>
                    <p className="text-sm text-gray-600">{formatDate(listing.createdAt)}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-600">{formatDate(listing.updatedAt)}</p>
                  </div>
                  {listing.verifiedAt && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verified On
                      </label>
                      <p className="text-sm text-gray-600">{formatDate(listing.verifiedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {listing.notes && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Ticket Files */}
          {listing.ticketFiles && listing.ticketFiles.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Ticket Files</h2>
                <div className="space-y-2">
                  {listing.ticketFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">
                          {typeof file === 'string' ? `Ticket File ${index + 1}` : file.filename || `Ticket File ${index + 1}`}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open(typeof file === 'string' ? file : file.url, '_blank')}
                      >
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
        <div className="space-y-6">
          {/* Action Buttons */}
          {isOwner && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Manage Listing</h3>
                <div className="space-y-3">
                  {canEdit && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/listings/${listing.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Listing
                    </Button>
                  )}
                  
                  {canEdit && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleMarkAsSold}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Mark as Sold
                    </Button>
                  )}
                  
                  {(!listing.ticketFiles || listing.ticketFiles.length === 0) && canEdit && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/listings/${listing.id}/upload`)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Ticket Files
                    </Button>
                  )}
                  
                  {canDelete && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleDeleteListing}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Listing
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="font-medium">{listing.views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interested</span>
                  <span className="font-medium">{listing.interested || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Offers</span>
                  <span className="font-medium">{(listing as any).offerCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Share</h3>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button size="sm" variant="outline">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};