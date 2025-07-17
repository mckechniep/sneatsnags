import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Upload,
  DollarSign,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Handshake,
  AlertTriangle,
  Package,
  RefreshCw,
  Download,
  BarChart3,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CreateListingForm } from '../components/listings/CreateListingForm';
import { ListingOffersModal } from '../components/offers/ListingOffersModal';
import { sellerService } from '../services/sellerService';
import SweetAlert from '../utils/sweetAlert';
import Swal from 'sweetalert2';
import type { Listing, ListingStatus } from '../types/listing';
import type { SellerListing } from '../services/sellerService';

export const ListingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalListings, setTotalListings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | ''>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  
  // New inventory management state
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  // const [inventoryAdjustment, setInventoryAdjustment] = useState<{ listingId: string; quantity: number } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'price' | 'quantity' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAlerts, setShowAlerts] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchListings();
    fetchLowStockAlerts();
    fetchInventoryReport();
  }, [currentPage, selectedStatus]);

  const fetchLowStockAlerts = async () => {
    try {
      const alerts = await sellerService.getLowStockAlerts(5);
      setLowStockAlerts(alerts);
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      const report = await sellerService.getInventoryReport();
      setInventoryReport(report);
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getListings({
        page: currentPage,
        limit: 20,
        status: selectedStatus || undefined,
      });

      if (response) {
        setListings(response.data || []);
        setTotalListings(response.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      SweetAlert.error('Failed to Load Listings', 'Unable to load your listings at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchListings();
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      await sellerService.deleteListing(listingId);
      SweetAlert.success('Listing Deleted', 'Your listing has been deleted successfully.');
      fetchListings();
    } catch (error) {
      SweetAlert.error('Delete Failed', 'Failed to delete the listing. Please try again.');
    }
  };

  const handleMarkAsSold = async (listingId: string) => {
    try {
      await sellerService.updateListing(listingId, { status: 'SOLD' });
      SweetAlert.success('Listing Updated', 'Your listing has been marked as sold.');
      fetchListings();
    } catch (error) {
      SweetAlert.error('Update Failed', 'Failed to update the listing. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewOffers = (listingId: string) => {
    setSelectedListingId(listingId);
    setShowOffersModal(true);
  };

  const handleCloseOffersModal = () => {
    setShowOffersModal(false);
    setSelectedListingId(null);
    // Refresh listings to update offer counts
    fetchListings();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (status: ListingStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SOLD: { color: 'bg-blue-100 text-blue-800', icon: DollarSign },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchListings();
  };

  // New inventory management functions
  const handleBulkInventoryUpdate = async () => {
    if (selectedListings.length === 0) {
      SweetAlert.warning('No Listings Selected', 'Please select at least one listing to update.');
      return;
    }

    const { value: quantity } = await Swal.fire({
      title: 'Update Inventory',
      text: `Set quantity for ${selectedListings.length} selected listings:`,
      input: 'number',
      inputAttributes: {
        min: '0',
        step: '1',
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return 'Please enter a valid quantity (0 or greater)';
        }
      },
    });

    if (quantity) {
      try {
        const updates = selectedListings.map(listingId => ({
          listingId,
          quantity: parseInt(quantity),
        }));

        const result = await sellerService.bulkUpdateInventory(updates);
        
        if (result.successful > 0) {
          SweetAlert.success(
            'Inventory Updated',
            `Successfully updated ${result.successful} listings${result.failed > 0 ? `, ${result.failed} failed` : ''}.`
          );
          setSelectedListings([]);
          fetchListings();
          fetchLowStockAlerts();
          fetchInventoryReport();
        } else {
          SweetAlert.error('Update Failed', 'Failed to update inventory for selected listings.');
        }
      } catch (error) {
        SweetAlert.error('Update Failed', 'Failed to update inventory. Please try again.');
      }
    }
  };

  const handleAdjustInventory = async (listingId: string, currentQuantity: number) => {
    const { value: adjustment } = await Swal.fire({
      title: 'Adjust Inventory',
      text: `Current quantity: ${currentQuantity}. Enter adjustment (+/-):`,
      input: 'number',
      inputAttributes: {
        step: '1',
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter an adjustment value';
        }
        const adj = parseInt(value);
        if (currentQuantity + adj < 0) {
          return 'Adjustment would result in negative quantity';
        }
      },
    });

    if (adjustment) {
      try {
        await sellerService.adjustInventory(listingId, parseInt(adjustment));
        SweetAlert.success('Inventory Adjusted', 'Inventory has been updated successfully.');
        fetchListings();
        fetchLowStockAlerts();
        fetchInventoryReport();
      } catch (error) {
        SweetAlert.error('Adjustment Failed', 'Failed to adjust inventory. Please try again.');
      }
    }
  };

  const handleBulkAction = async () => {
    if (selectedListings.length === 0) {
      SweetAlert.warning('No Listings Selected', 'Please select at least one listing.');
      return;
    }

    switch (bulkAction) {
      case 'update-inventory':
        await handleBulkInventoryUpdate();
        break;
      case 'mark-sold':
        await handleBulkMarkSold();
        break;
      case 'delete':
        await handleBulkDelete();
        break;
      case 'archive':
        await handleBulkArchive();
        break;
      default:
        SweetAlert.warning('No Action Selected', 'Please select an action to perform.');
    }
  };

  const handleBulkMarkSold = async () => {
    const result = await SweetAlert.confirm(
      'Mark as Sold',
      `Are you sure you want to mark ${selectedListings.length} listings as sold?`,
      'Mark Sold',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const promises = selectedListings.map(id => sellerService.updateListing(id, { status: 'SOLD' }));
        await Promise.all(promises);
        
        SweetAlert.success('Listings Updated', `${selectedListings.length} listings marked as sold.`);
        setSelectedListings([]);
        fetchListings();
        fetchInventoryReport();
      } catch (error) {
        SweetAlert.error('Update Failed', 'Failed to update listings. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    const result = await SweetAlert.confirm(
      'Delete Listings',
      `Are you sure you want to delete ${selectedListings.length} listings? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const promises = selectedListings.map(id => sellerService.deleteListing(id));
        await Promise.all(promises);
        
        SweetAlert.success('Listings Deleted', `${selectedListings.length} listings deleted successfully.`);
        setSelectedListings([]);
        fetchListings();
        fetchInventoryReport();
      } catch (error) {
        SweetAlert.error('Delete Failed', 'Failed to delete listings. Please try again.');
      }
    }
  };

  const handleBulkArchive = async () => {
    const result = await SweetAlert.confirm(
      'Archive Listings',
      `Are you sure you want to archive ${selectedListings.length} listings?`,
      'Archive',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const promises = selectedListings.map(id => sellerService.updateListing(id, { status: 'CANCELLED' }));
        await Promise.all(promises);
        
        SweetAlert.success('Listings Archived', `${selectedListings.length} listings archived successfully.`);
        setSelectedListings([]);
        fetchListings();
        fetchInventoryReport();
      } catch (error) {
        SweetAlert.error('Archive Failed', 'Failed to archive listings. Please try again.');
      }
    }
  };

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map(l => l.id));
    }
  };

  const sortedListings = [...listings].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.event.name.toLowerCase();
        bValue = b.event.name.toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.event.eventDate).getTime();
        bValue = new Date(b.event.eventDate).getTime();
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalPages = Math.ceil(totalListings / 20);

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateListingForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (loading && listings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <div className="h-16 w-16 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/seller/dashboard"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600 mt-1">
              {totalListings.toLocaleString()} total listings
              {lowStockAlerts.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {lowStockAlerts.length} low stock alerts
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts ({lowStockAlerts.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReport(!showReport)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchListings();
                fetchLowStockAlerts();
                fetchInventoryReport();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {showAlerts && lowStockAlerts.length > 0 && (
        <Card className="p-6 mb-6 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alerts
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlerts(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {lowStockAlerts.map((alert) => (
              <div
                key={alert.listingId}
                className={`p-3 rounded-lg border ${
                  alert.urgency === 'critical'
                    ? 'bg-red-100 border-red-300'
                    : alert.urgency === 'high'
                    ? 'bg-orange-100 border-orange-300'
                    : 'bg-yellow-100 border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.eventName}</p>
                    <p className="text-sm text-gray-600">
                      {alert.sectionName} • {alert.venue}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(alert.eventDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      alert.urgency === 'critical' ? 'text-red-800' : 
                      alert.urgency === 'high' ? 'text-orange-800' : 'text-yellow-800'
                    }`}>
                      {alert.currentQuantity} left
                    </p>
                    <p className="text-xs text-gray-500">
                      Threshold: {alert.threshold}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Inventory Report */}
      {showReport && inventoryReport && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Inventory Report
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReport(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Inventory</p>
              <p className="text-2xl font-bold text-blue-900">{inventoryReport.summary.totalInventory}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Available</p>
              <p className="text-2xl font-bold text-green-900">{inventoryReport.summary.availableInventory}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Sold</p>
              <p className="text-2xl font-bold text-purple-900">{inventoryReport.summary.soldInventory}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Status Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(inventoryReport.statusBreakdown).map(([status, data]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{status}</span>
                    <span className="text-sm font-medium">{(data as any).quantity} tickets ({(data as any).count} listings)</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInventoryReport()}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement export functionality
                    SweetAlert.info('Export', 'Export functionality coming soon!');
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {listings.filter(l => l.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                {listings.filter(l => l.status === 'SOLD').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {listings.filter(l => l.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(listings.reduce((sum, l) => sum + (Number(l.price) * l.quantity), 0))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedListings.length > 0 && (
        <Card className="p-4 mb-6 border-l-4 border-blue-500 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm font-medium text-blue-900">
                {selectedListings.length} listing{selectedListings.length > 1 ? 's' : ''} selected
              </p>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select action...</option>
                <option value="update-inventory">Update Inventory</option>
                <option value="mark-sold">Mark as Sold</option>
                <option value="archive">Archive</option>
                <option value="delete">Delete</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkAction}
                disabled={!bulkAction}
              >
                <Zap className="h-4 w-4 mr-2" />
                Apply Action
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedListings([])}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Listings
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Event name, venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ListingStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SOLD">Sold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="quantity-desc">Quantity (High to Low)</option>
                <option value="quantity-asc">Quantity (Low to High)</option>
                <option value="status-asc">Status</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedListings.length === listings.length && listings.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Select All</span>
              </label>
              {selectedListings.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedListings.length} selected
                </span>
              )}
            </div>
            
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Listings Grid */}
      <div className="grid gap-6">
        {sortedListings.map((listing) => (
          <Card key={listing.id} className="p-6">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Selection Checkbox */}
              <div className="lg:col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedListings.includes(listing.id)}
                  onChange={() => handleSelectListing(listing.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                />
                <div className="h-16 w-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              
              {/* Event Info */}
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {listing.event.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📅 {formatDate(listing.event.eventDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      📍 {listing.event.venue}, {listing.event.city}
                    </p>
                    {listing.section && (
                      <p className="text-sm text-gray-600">
                        🎫 {listing.section.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Listing Details */}
              <div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{listing.quantity}</span>
                      {listing.quantity <= 5 && listing.quantity > 0 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      {listing.quantity === 0 && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price each:</span>
                    <span className="font-medium">{formatPrice(Number(listing.price))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total:</span>
                    <span className="font-bold text-lg">{formatPrice(Number(listing.price) * listing.quantity)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    {getStatusBadge(listing.status as ListingStatus)}
                  </div>
                  {listing.row && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Row:</span>
                      <span className="font-medium">{listing.row}</span>
                    </div>
                  )}
                  {listing.seats && listing.seats.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Seats:</span>
                      <span className="font-medium">{listing.seats.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/listings/${listing.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                {listing.status === 'ACTIVE' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/listings/${listing.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustInventory(listing.id, listing.quantity)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Adjust Qty
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsSold(listing.id)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Mark Sold
                    </Button>
                  </>
                )}

                {listing.ticketFiles.length === 0 && listing.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/listings/${listing.id}/upload`)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                )}

                {listing.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOffers(listing.id)}
                  >
                    <Handshake className="h-4 w-4 mr-2" />
                    View Offers
                    {(listing as any).offerCount > 0 && (
                      <span className="ml-2 bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                        {(listing as any).offerCount}
                      </span>
                    )}
                  </Button>
                )}

                {(listing.status === 'ACTIVE' || listing.status === 'PENDING') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteListing(listing.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {listing.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {listing.notes}
                </p>
              </div>
            )}

            {listing.ticketFiles.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Ticket Files:</strong> {listing.ticketFiles.length} file(s) uploaded
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Files verified</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalListings)} of {totalListings} listings
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {listings.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-6">
            {selectedStatus 
              ? `No ${selectedStatus.toLowerCase()} listings found. Try adjusting your filters.`
              : "You haven't created any listings yet. Start by listing your first tickets!"
            }
          </p>
          {!selectedStatus && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Listing
            </Button>
          )}
        </Card>
      )}

      {/* Modals */}
      {showCreateForm && (
        <CreateListingForm
          onSuccess={() => {
            setShowCreateForm(false);
            fetchListings();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showOffersModal && selectedListingId && (
        <ListingOffersModal
          open={showOffersModal}
          onClose={handleCloseOffersModal}
          listingId={selectedListingId}
        />
      )}
    </div>
  );
};