import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Box } from '@mui/material';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  Package,
  Truck,
  Receipt
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { transactionService } from '../../services/transactionService';
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

interface TransactionDetailModalProps {
  open: boolean;
  onClose: () => void;
  transaction: any;
  userType: 'buyer' | 'seller';
  onTransactionUpdate?: () => void;
  onDeliverTickets?: (transaction: any) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  open,
  onClose,
  transaction,
  userType,
  onTransactionUpdate,
  onDeliverTickets
}) => {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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

  const handleConfirmReceipt = async () => {
    const result = await SweetAlert.confirm(
      'Confirm Receipt',
      'Are you sure you want to confirm that you have received the tickets? This will release payment to the seller.',
      'Yes, Confirm Receipt',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        SweetAlert.loading('Confirming Receipt', 'Processing your confirmation...');
        
        await paymentService.confirmTicketReceipt(transaction.id);
        
        SweetAlert.close();
        SweetAlert.success('Receipt Confirmed!', 'Payment has been released to the seller.');
        
        if (onTransactionUpdate) {
          onTransactionUpdate();
        }
        onClose();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Confirmation Failed', 'Failed to confirm receipt. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkDelivered = async () => {
    const result = await SweetAlert.confirm(
      'Mark as Delivered',
      'Are you sure you want to mark the tickets as delivered? This will notify the buyer.',
      'Yes, Mark as Delivered',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        SweetAlert.loading('Marking as Delivered', 'Updating delivery status...');
        
        await paymentService.markTicketsDelivered(transaction.id);
        
        SweetAlert.close();
        SweetAlert.success('Tickets Marked as Delivered!', 'The buyer has been notified.');
        
        if (onTransactionUpdate) {
          onTransactionUpdate();
        }
        onClose();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Update Failed', 'Failed to update delivery status. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelTransaction = async () => {
    const result = await SweetAlert.confirm(
      'Cancel Transaction',
      'Are you sure you want to cancel this transaction? This action cannot be undone.',
      'Yes, Cancel Transaction',
      'Keep Transaction'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        SweetAlert.loading('Canceling Transaction', 'Processing cancellation...');
        
        await paymentService.cancelTransaction(transaction.id, 'Cancelled by user');
        
        SweetAlert.close();
        SweetAlert.success('Transaction Cancelled!', 'The transaction has been cancelled successfully.');
        
        if (onTransactionUpdate) {
          onTransactionUpdate();
        }
        onClose();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Cancellation Failed', 'Failed to cancel transaction. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRequestRefund = async () => {
    const result = await SweetAlert.confirm(
      'Request Refund',
      'Are you sure you want to request a refund for this transaction? Please provide a reason.',
      'Request Refund',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        SweetAlert.loading('Requesting Refund', 'Processing refund request...');
        
        await paymentService.requestRefund(transaction.id, 'Refund requested by buyer');
        
        SweetAlert.close();
        SweetAlert.success('Refund Requested!', 'Your refund request has been submitted for review.');
        
        if (onTransactionUpdate) {
          onTransactionUpdate();
        }
        onClose();
      } catch (error) {
        SweetAlert.close();
        SweetAlert.error('Refund Request Failed', 'Failed to request refund. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!transaction) return null;

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          maxHeight: '90vh'
        }
      }}
    >
      {/* Header */}
      <div style={{
        padding: '32px 32px 0 32px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em'
            }}>
              Transaction Details
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0,
              fontWeight: '500'
            }}>
              {transaction.offer?.event?.name || 'Event Name Not Available'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '600',
              color: statusConfig.color,
              backgroundColor: statusConfig.backgroundColor,
              border: `2px solid ${statusConfig.borderColor}`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span style={{ fontSize: '16px' }}>{statusConfig.icon}</span>
              {statusConfig.label}
            </div>
            <IconButton 
              onClick={onClose} 
              size="small"
              style={{
                backgroundColor: '#f3f4f6',
                width: '40px',
                height: '40px',
                borderRadius: '50%'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </IconButton>
          </div>
        </div>

        {/* Transaction ID and Date */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Transaction ID
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>
              {transaction.id}
            </div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Created
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
              {formatDate(transaction.createdAt)}
            </div>
          </div>
          {transaction.paidAt && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Paid At
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                {formatDate(transaction.paidAt)}
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogContent style={{ padding: '0 32px 32px 32px', maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Event Information */}
          <Card variant="elevated" style={{ overflow: 'visible' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                }}>
                  <Calendar style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Event Information
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar style={{ color: '#6b7280', width: '20px', height: '20px' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Event Date
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {formatDate(transaction.offer.event.eventDate)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MapPin style={{ color: '#6b7280', width: '20px', height: '20px' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Venue & Location
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {transaction.offer.event.venue}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {transaction.offer.event.city}, {transaction.offer.event.state}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users style={{ color: '#6b7280', width: '20px', height: '20px' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Quantity
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {transaction.offer.quantity} ticket{transaction.offer.quantity > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Package style={{ color: '#6b7280', width: '20px', height: '20px', marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Seats {transaction.listing.row && `• Row ${transaction.listing.row}`}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {transaction.listing.seats.map((seat: string, index: number) => (
                          <div key={index} style={{
                            display: 'inline-block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#3b82f6',
                            backgroundColor: '#eff6ff',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: '1px solid #93c5fd'
                          }}>
                            {seat}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Information */}
          <Card variant="elevated">
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                }}>
                  <DollarSign style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Payment Breakdown
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Subtotal</span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                        {formatPrice(transaction.amount - transaction.platformFee)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Platform Fee</span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {formatPrice(transaction.platformFee)}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '2px solid #e2e8f0',
                      marginTop: '8px'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>Total</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>
                        {formatPrice(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {userType === 'seller' && transaction.sellerAmount && (
                  <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    borderRadius: '12px',
                    border: '2px solid #a7f3d0'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Your Earnings
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>
                        {formatPrice(transaction.sellerAmount)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                        After platform fees
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Progress Indicator */}
          <Card variant="elevated">
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
                }}>
                  <Truck style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Transaction Progress
                </h3>
              </div>

              {/* Visual Progress Timeline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '16px',
                position: 'relative'
              }}>
                {/* Payment Step */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: transaction.paidAt ? '#10b981' : '#d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    boxShadow: transaction.paidAt ? '0 8px 32px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <CreditCard style={{ color: 'white', width: '28px', height: '28px' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                      Payment
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {transaction.paidAt ? formatDate(transaction.paidAt) : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Progress Line 1 */}
                <div style={{
                  flex: 1,
                  height: '4px',
                  margin: '0 16px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  position: 'relative',
                  top: '-26px'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: transaction.ticketsDelivered ? '#10b981' : '#d1d5db',
                    width: transaction.paidAt ? '100%' : '0%',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {/* Delivery Step */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: transaction.ticketsDelivered ? '#10b981' : '#d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    boxShadow: transaction.ticketsDelivered ? '0 8px 32px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Package style={{ color: 'white', width: '28px', height: '28px' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                      Delivery
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {transaction.ticketsDeliveredAt ? formatDate(transaction.ticketsDeliveredAt) : 'Pending'}
                    </div>
                  </div>
                </div>

                {userType === 'seller' && (
                  <>
                    {/* Progress Line 2 */}
                    <div style={{
                      flex: 1,
                      height: '4px',
                      margin: '0 16px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      position: 'relative',
                      top: '-26px'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: transaction.sellerPaidOut ? '#10b981' : '#d1d5db',
                        width: transaction.ticketsDelivered ? '100%' : '0%',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>

                    {/* Payout Step */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: transaction.sellerPaidOut ? '#10b981' : '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        boxShadow: transaction.sellerPaidOut ? '0 8px 32px rgba(16, 185, 129, 0.3)' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        <DollarSign style={{ color: 'white', width: '28px', height: '28px' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                          Payout
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {transaction.sellerPaidOutAt ? formatDate(transaction.sellerPaidOutAt) : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Parties Information */}
          <Card variant="elevated">
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                }}>
                  <Users style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Transaction Parties
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {/* Buyer Information */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '12px',
                  border: '2px solid #93c5fd'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1e40af',
                    margin: '0 0 16px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    👤 Buyer Information
                  </h4>
                  {transaction.buyer ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <User style={{ color: '#3b82f6', width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {formatName(transaction.buyer.firstName, transaction.buyer.lastName)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Mail style={{ color: '#3b82f6', width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {transaction.buyer.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                      Buyer information not available
                    </span>
                  )}
                </div>

                {/* Seller Information */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  border: '2px solid #a7f3d0'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#166534',
                    margin: '0 0 16px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    👤 Seller Information
                  </h4>
                  {transaction.listing?.seller ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <User style={{ color: '#10b981', width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {formatName(transaction.listing.seller.firstName, transaction.listing.seller.lastName)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Mail style={{ color: '#10b981', width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {transaction.listing.seller.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                      Seller information not available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Buyer Message */}
          {transaction.offer?.message && (
            <Card variant="elevated">
              <div style={{ padding: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                  }}>
                    <FileText style={{ color: 'white', width: '24px', height: '24px' }} />
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Buyer Message
                  </h3>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#fffbeb',
                  borderRadius: '12px',
                  border: '2px solid #fed7aa',
                  borderLeft: '6px solid #f59e0b'
                }}>
                  <p style={{
                    fontSize: '16px',
                    color: '#92400e',
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: '1.6',
                    fontWeight: '500'
                  }}>
                    "{transaction.offer.message}"
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <Card variant="elevated">
            <div style={{
              padding: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {userType === 'buyer' && (
                <>
                  {transaction.status === 'PENDING' && (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleCancelTransaction}
                      disabled={loading}
                      style={{ minWidth: '180px' }}
                    >
                      <AlertCircle style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                      Cancel Transaction
                    </Button>
                  )}
                  
                  {transaction.ticketsDelivered && !transaction.buyerConfirmed && transaction.status !== 'COMPLETED' && (
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={handleConfirmReceipt}
                      disabled={loading}
                      style={{ minWidth: '240px' }}
                    >
                      <Receipt style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                      Confirm Receipt & Release Payment
                    </Button>
                  )}
                  
                  {transaction.status === 'COMPLETED' && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleRequestRefund}
                      disabled={loading}
                      style={{ minWidth: '160px' }}
                    >
                      Request Refund
                    </Button>
                  )}
                </>
              )}

              {userType === 'seller' && !transaction.sellerPaidOut && transaction.status === 'COMPLETED' && (
                <>
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => onDeliverTickets?.(transaction)}
                    disabled={loading}
                    style={{ minWidth: '180px' }}
                  >
                    <Package style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                    Deliver Tickets
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleMarkDelivered}
                    disabled={loading}
                    style={{ minWidth: '180px' }}
                  >
                    <CheckCircle style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                    Mark as Delivered
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};