import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { buyerService } from '../../services/buyerService';
import { sellerService } from '../../services/sellerService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { TransactionDetailModal } from '../transaction/TransactionDetailModal';
import { TicketDeliveryModal } from '../transaction/TicketDeliveryModal';
import SweetAlert from '../../utils/sweetAlert';

// Helper function to format names safely
const formatName = (firstName?: string, lastName?: string): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (!first && !last) return 'Name not available';
  if (!first) return last;
  if (!last) return first;
  
  return `${first} ${last}`;
};

interface TransactionHistoryProps {
  userType: 'buyer' | 'seller';
}

// Generic transaction interface to handle both buyer and seller transactions
interface BaseTransaction {
  id: string;
  buyerId: string;
  sellerId: string;
  offerId: string;
  listingId: string;
  eventId: string;
  amount: number;
  platformFee: number;
  status: string;
  paidAt?: string;
  ticketsDelivered: boolean;
  ticketsDeliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  offer: {
    id: string;
    maxPrice: number;
    quantity: number;
    message?: string;
    event: {
      id: string;
      name: string;
      eventDate: string;
      venue: string;
      city: string;
      state: string;
    };
  };
  listing: {
    id: string;
    price: number;
    seats: string[];
    row?: string;
    seller?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sellerAmount?: number;
  sellerPaidOut: boolean;
  sellerPaidOutAt?: string;
  buyerConfirmed?: boolean;
}

interface PaginatedTransactionResponse {
  data: BaseTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const TransactionHistory = ({ userType }: TransactionHistoryProps) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<BaseTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryTransaction, setDeliveryTransaction] = useState<BaseTransaction | null>(null);

  const { data, isLoading, error, refetch } = useQuery<PaginatedTransactionResponse>({
    queryKey: [`${userType}-transactions`, filters],
    queryFn: async (): Promise<PaginatedTransactionResponse> => {
      if (userType === 'buyer') {
        const response = await buyerService.getTransactions(filters);
        return response as PaginatedTransactionResponse;
      } else {
        const response = await sellerService.getTransactions(filters);
        return response as PaginatedTransactionResponse;
      }
    },
    enabled: !!user && (
      (userType === 'buyer' && user.role === UserRole.BUYER) ||
      (userType === 'seller' && user.role === UserRole.SELLER)
    ),
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleViewDetails = (transaction: BaseTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
  };

  const handleDeliverTickets = (transaction: BaseTransaction) => {
    setDeliveryTransaction(transaction);
    setShowDeliveryModal(true);
  };

  const handleCloseDeliveryModal = () => {
    setShowDeliveryModal(false);
    setDeliveryTransaction(null);
  };

  const handleDeliveryComplete = () => {
    refetch();
    setShowDeliveryModal(false);
    setDeliveryTransaction(null);
  };

  const handleTransactionUpdate = () => {
    refetch();
  };

  const handleQuickCancel = async (transaction: BaseTransaction) => {
    const result = await SweetAlert.confirm(
      'Cancel Transaction',
      'Are you sure you want to cancel this transaction?',
      'Yes, Cancel',
      'Keep Transaction'
    );

    if (result.isConfirmed) {
      try {
        SweetAlert.loading('Canceling Transaction', 'Please wait...');
        await paymentService.cancelTransaction(transaction.id, 'Cancelled by user');
        SweetAlert.close();
        SweetAlert.success('Transaction Cancelled!', 'The transaction has been cancelled successfully.');
        refetch();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Cancellation Failed', 'Failed to cancel transaction. Please try again.');
      }
    }
  };

  const handleQuickConfirmReceipt = async (transaction: BaseTransaction) => {
    const result = await SweetAlert.confirm(
      'Confirm Receipt & Release Payment',
      'Are you sure you want to confirm that you received the tickets? This will release payment to the seller.',
      'Yes, Confirm Receipt',
      'Not Yet'
    );

    if (result.isConfirmed) {
      try {
        SweetAlert.loading('Confirming Receipt', 'Processing your confirmation...');
        await paymentService.confirmTicketReceipt(transaction.id);
        SweetAlert.close();
        SweetAlert.success('Receipt Confirmed!', 'Payment has been released to the seller.');
        refetch();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Confirmation Failed', 'Failed to confirm receipt. Please try again.');
      }
    }
  };

  const handleMarkDelivered = async (transaction: BaseTransaction) => {
    const result = await SweetAlert.confirm(
      'Mark as Delivered',
      'Are you sure the tickets have been delivered to the buyer?',
      'Yes, Mark as Delivered',
      'Not Yet'
    );

    if (result.isConfirmed) {
      try {
        SweetAlert.loading('Marking as Delivered', 'Updating delivery status...');
        await paymentService.markTicketsDelivered(transaction.id);
        SweetAlert.close();
        SweetAlert.success('Marked as Delivered!', 'The buyer has been notified.');
        refetch();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Update Failed', 'Failed to update delivery status. Please try again.');
      }
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      completed: {
        color: '#10b981',
        backgroundColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        icon: '✓',
        label: 'Completed'
      },
      pending: {
        color: '#f59e0b',
        backgroundColor: '#fffbeb',
        borderColor: '#fed7aa',
        icon: '⏳',
        label: 'Pending'
      },
      cancelled: {
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        borderColor: '#fca5a5',
        icon: '✕',
        label: 'Cancelled'
      },
      refunded: {
        color: '#3b82f6',
        backgroundColor: '#eff6ff',
        borderColor: '#93c5fd',
        icon: '↩',
        label: 'Refunded'
      }
    };
    return configs[status.toLowerCase() as keyof typeof configs] || {
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      borderColor: '#d1d5db',
      icon: '•',
      label: status
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '24px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid white',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <div style={{
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Loading Transactions
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Please wait while we fetch your transaction history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="bordered" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#dc2626'
          }}>
            ⚠️
          </div>
          <div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#dc2626'
            }}>
              Error Loading Transactions
            </h3>
            <p style={{ 
              margin: '0 0 24px 0', 
              color: '#6b7280',
              fontSize: '14px'
            }}>
              We encountered an error while loading your transactions. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em'
        }}>
          Transaction History
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0,
          fontWeight: '500'
        }}>
          {userType === 'buyer' 
            ? 'Track your ticket purchases and payment status'
            : 'Monitor your sales and earnings'
          }
        </p>
      </div>

      {/* Stats Cards */}
      {data?.pagination && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Card variant="gradient" hover style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
              {data.pagination.total}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
              Total Transactions
            </div>
          </Card>
          
          {data.data.length > 0 && (
            <>
              <Card variant="gradient" hover style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                  {data.data.filter(t => t.status.toLowerCase() === 'completed').length}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  Completed
                </div>
              </Card>
              
              <Card variant="gradient" hover style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                  {formatCurrency(data.data.reduce((sum, t) => sum + (userType === 'seller' ? (t.sellerAmount || 0) : t.amount), 0))}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  Total {userType === 'seller' ? 'Earned' : 'Spent'}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <Card variant="elevated" style={{ marginBottom: '32px' }}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: '0 0 20px 0' 
          }}>
            Filter & Sort
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: 'white',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Items per page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: 'white',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {data?.data && data.data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {data.data.map((transaction: BaseTransaction) => {
            const statusConfig = getStatusConfig(transaction.status);
            
            return (
              <Card key={transaction.id} variant="elevated" hover>
                <div style={{ padding: '28px' }}>
                  {/* Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#1f2937',
                          margin: 0,
                          lineHeight: '1.2'
                        }}>
                          {transaction.offer?.event?.name || 'Event Name Not Available'}
                        </h3>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: statusConfig.color,
                          backgroundColor: statusConfig.backgroundColor,
                          border: `1px solid ${statusConfig.borderColor}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          <span>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        <span>📅 {formatDate(transaction.offer?.event?.eventDate || transaction.createdAt)}</span>
                        <span>📍 {transaction.offer?.event?.venue}</span>
                        <span>{transaction.offer?.event?.city}, {transaction.offer?.event?.state}</span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      alignItems: 'flex-end'
                    }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(transaction)}
                        style={{ minWidth: '120px' }}
                      >
                        View Details
                      </Button>

                      {userType === 'buyer' && 
                       transaction.ticketsDelivered && 
                       !transaction.buyerConfirmed && 
                       transaction.status !== 'COMPLETED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleQuickConfirmReceipt(transaction)}
                          style={{ minWidth: '120px' }}
                        >
                          Release Payment
                        </Button>
                      )}

                      {userType === 'seller' && 
                       !transaction.sellerPaidOut && 
                       transaction.status === 'COMPLETED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeliverTickets(transaction)}
                          style={{ minWidth: '120px' }}
                        >
                          Deliver Tickets
                        </Button>
                      )}

                      {transaction.status === 'PENDING' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleQuickCancel(transaction)}
                          style={{ minWidth: '120px' }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Transaction Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '20px'
                  }}>
                    {/* Financial Details */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        margin: '0 0 12px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        💰 Financial Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Amount:</span>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Platform Fee:</span>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>
                            {formatCurrency(transaction.platformFee)}
                          </span>
                        </div>
                        {userType === 'seller' && transaction.sellerAmount && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            paddingTop: '8px',
                            borderTop: '1px solid #e2e8f0'
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Your Earnings:</span>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
                              {formatCurrency(transaction.sellerAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        margin: '0 0 12px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🎫 Ticket Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Quantity:</span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            {transaction.offer?.quantity || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Seats:</span>
                          <div style={{ textAlign: 'right' }}>
                            {transaction.listing?.seats?.map((seat, index) => (
                              <div key={index} style={{ 
                                display: 'inline-block',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#3b82f6',
                                backgroundColor: '#eff6ff',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                margin: '2px'
                              }}>
                                {seat}
                              </div>
                            )) || <span style={{ fontSize: '14px', color: '#6b7280' }}>N/A</span>}
                          </div>
                        </div>
                        {transaction.listing?.row && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>Row:</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                              {transaction.listing.row}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {/* Payment */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: transaction.paidAt ? '#10b981' : '#d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          💳
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
                            Payment
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {transaction.paidAt ? formatDate(transaction.paidAt) : 'Pending'}
                          </div>
                        </div>
                      </div>

                      {/* Progress Line */}
                      <div style={{
                        flex: 1,
                        height: '2px',
                        margin: '0 16px',
                        backgroundColor: '#e5e7eb',
                        position: 'relative'
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: transaction.ticketsDelivered ? '#10b981' : '#d1d5db',
                          width: transaction.paidAt ? '100%' : '0%',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      {/* Delivery */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: transaction.ticketsDelivered ? '#10b981' : '#d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          🚚
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
                            Delivery
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {transaction.ticketsDeliveredAt 
                              ? formatDate(transaction.ticketsDeliveredAt) 
                              : 'Pending'
                            }
                          </div>
                        </div>
                      </div>

                      {userType === 'seller' && (
                        <>
                          {/* Progress Line */}
                          <div style={{
                            flex: 1,
                            height: '2px',
                            margin: '0 16px',
                            backgroundColor: '#e5e7eb',
                            position: 'relative'
                          }}>
                            <div style={{
                              height: '100%',
                              backgroundColor: transaction.sellerPaidOut ? '#10b981' : '#d1d5db',
                              width: transaction.ticketsDelivered ? '100%' : '0%',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>

                          {/* Payout */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: transaction.sellerPaidOut ? '#10b981' : '#d1d5db',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              💰
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
                                Payout
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                {transaction.sellerPaidOutAt 
                                  ? formatDate(transaction.sellerPaidOutAt) 
                                  : 'Pending'
                                }
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(transaction.offer?.message || 
                    (userType === 'buyer' && transaction.listing?.seller) ||
                    (userType === 'seller' && transaction.buyer)) && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {transaction.offer?.message && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            💬 Message:
                          </span>
                          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                            "{transaction.offer.message}"
                          </p>
                        </div>
                      )}
                      
                      {userType === 'buyer' && transaction.listing?.seller && (
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            👤 Seller:
                          </span>
                          <span style={{ fontSize: '14px', color: '#1f2937', marginLeft: '8px', fontWeight: '500' }}>
                            {formatName(transaction.listing.seller.firstName, transaction.listing.seller.lastName)}
                          </span>
                        </div>
                      )}

                      {userType === 'seller' && transaction.buyer && (
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            👤 Buyer:
                          </span>
                          <span style={{ fontSize: '14px', color: '#1f2937', marginLeft: '8px', fontWeight: '500' }}>
                            {formatName(transaction.buyer.firstName, transaction.buyer.lastName)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <Card variant="elevated">
              <div style={{ 
                padding: '24px',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '16px' 
              }}>
                <Button
                  variant="outline"
                  disabled={filters.page <= 1}
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                >
                  ← Previous
                </Button>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={filters.page >= data.pagination.totalPages}
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                >
                  Next →
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card variant="elevated" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              🎫
            </div>
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 12px 0'
              }}>
                No Transactions Yet
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '0 0 24px 0',
                lineHeight: '1.5'
              }}>
                {userType === 'buyer' 
                  ? 'Your ticket purchases and accepted offers will appear here. Start browsing events to make your first transaction!'
                  : 'Your ticket sales will appear here once buyers accept your offers. List your first tickets to get started!'
                }
              </p>
              <Button variant="gradient" size="lg">
                {userType === 'buyer' ? 'Browse Events' : 'List Tickets'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          open={showDetailModal}
          onClose={handleCloseDetailModal}
          transaction={selectedTransaction}
          userType={userType}
          onTransactionUpdate={handleTransactionUpdate}
          onDeliverTickets={handleDeliverTickets}
        />
      )}

      {/* Ticket Delivery Modal */}
      {deliveryTransaction && (
        <TicketDeliveryModal
          open={showDeliveryModal}
          onClose={handleCloseDeliveryModal}
          transaction={deliveryTransaction}
          onDeliveryComplete={handleDeliveryComplete}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};