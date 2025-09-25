import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { buyerService } from '../../services/buyerService';
import type { Offer, OfferStatus, UpdateOfferRequest } from '../../types/offer';

interface BuyerOffersListProps {
  showUserOffersOnly?: boolean;
}

export const BuyerOffersList = ({}: BuyerOffersListProps) => {
  const [filters, setFilters] = useState({
    status: undefined as OfferStatus | undefined,
    eventId: '',
    page: 1,
    limit: 20,
  });

  // Edit offer state
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editForm, setEditForm] = useState({
    maxPrice: '',
    message: '',
    expiresAt: ''
  });

  // Cancel confirmation state
  const [cancelConfirmation, setCancelConfirmation] = useState<{
    show: boolean;
    offerId: string;
    offerName: string;
  }>({
    show: false,
    offerId: '',
    offerName: ''
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer-offers', filters],
    queryFn: () => buyerService.getMyOffers(filters),
  });

  const cancelOfferMutation = useMutation({
    mutationFn: (offerId: string) => buyerService.cancelOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-offers'] });
      setCancelConfirmation({ show: false, offerId: '', offerName: '' });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ offerId, updates }: { offerId: string; updates: UpdateOfferRequest }) => 
      buyerService.updateOffer(offerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-offers'] });
      setEditingOffer(null);
      setEditForm({ maxPrice: '', message: '', expiresAt: '' });
    },
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleCancelOffer = (offerId: string, offerName: string) => {
    setCancelConfirmation({
      show: true,
      offerId,
      offerName
    });
  };

  const confirmCancelOffer = async () => {
    try {
      await cancelOfferMutation.mutateAsync(cancelConfirmation.offerId);
    } catch (error) {
      console.error('Failed to cancel offer:', error);
      // Could add toast notification here
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setEditForm({
      maxPrice: offer.maxPrice.toString(),
      message: offer.message || '',
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt).toISOString().split('T')[0] : ''
    });
  };

  const handleUpdateOffer = async () => {
    if (!editingOffer) return;

    const updates: UpdateOfferRequest = {};
    
    if (editForm.maxPrice && parseFloat(editForm.maxPrice) !== editingOffer.maxPrice) {
      updates.maxPrice = parseFloat(editForm.maxPrice);
    }
    
    if (editForm.message !== editingOffer.message) {
      updates.message = editForm.message;
    }
    
    if (editForm.expiresAt) {
      const newExpiresAt = new Date(editForm.expiresAt).toISOString();
      if (newExpiresAt !== editingOffer.expiresAt) {
        updates.expiresAt = newExpiresAt;
      }
    }

    if (Object.keys(updates).length > 0) {
      try {
        await updateOfferMutation.mutateAsync({
          offerId: editingOffer.id,
          updates
        });
      } catch (error) {
        console.error('Failed to update offer:', error);
        // Could add toast notification here
      }
    } else {
      setEditingOffer(null);
    }
  };


  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '24px',
        padding: '48px 20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #1D3557, #457B9D)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '4px solid white',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
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
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#2C2C2C'
          }}>
            Loading Your Offers
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Please wait while we fetch your offers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 20px',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderRadius: '16px',
        border: '1px solid #fecaca',
        margin: '20px 0'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          !
        </div>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: '#555555'
        }}>
          Error Loading Offers
        </h3>
        <p style={{
          margin: 0,
          color: '#555555',
          fontSize: '16px'
        }}>
          Something went wrong. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 100%)'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 36px)',
          fontWeight: '800',
          color: '#1D3557',
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em'
        }}>
          My Offers
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2vw, 18px)',
          color: '#555555',
          margin: 0,
          fontWeight: '500',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Track and manage your ticket offers
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Filters */}
        <Card variant="elevated" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <div style={{ padding: '32px' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '24px',
              color: '#2C2C2C',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1D3557, #457B9D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                ⚙
              </div>
              Filter Offers
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2C2C2C',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value as OfferStatus || undefined)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1D3557';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29, 53, 87, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2C2C2C',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Event ID
                </label>
                <Input
                  type="text"
                  placeholder="Filter by event ID"
                  value={filters.eventId}
                  onChange={(e) => handleFilterChange('eventId', e.target.value)}
                  style={{
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2C2C2C',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Items per page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1D3557';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29, 53, 87, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.data.map((offer: Offer) => (
              <Card key={offer.id} variant="elevated" style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)';
              }}
              >
                <div style={{ padding: '32px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    gap: '24px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '20px',
                        flexWrap: 'wrap'
                      }}>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#2C2C2C',
                          margin: 0
                        }}>
                          {offer.event?.name || 'Event Name'}
                        </h3>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          ...(offer.status === 'ACTIVE' ? {
                            background: 'linear-gradient(135deg, #E8F4F8 0%, #D1E9F1 100%)',
                            color: '#1D3557',
                            border: '1px solid #457B9D'
                          } : offer.status === 'ACCEPTED' ? {
                            background: 'linear-gradient(135deg, #E8F7F9 0%, #D1F0F3 100%)',
                            color: '#1D3557',
                            border: '1px solid #A8DADC'
                          } : offer.status === 'EXPIRED' ? {
                            background: 'linear-gradient(135deg, #F8F8F8 0%, #EEEEEE 100%)',
                            color: '#555555',
                            border: '1px solid #CCCCCC'
                          } : {
                            background: 'linear-gradient(135deg, #F8F8F8 0%, #EEEEEE 100%)',
                            color: '#555555',
                            border: '1px solid #CCCCCC'
                          })
                        }}>
                          {offer.status}
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          padding: '20px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#555555',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              margin: '0 0 4px 0'
                            }}>
                              Max Price
                            </p>
                            <p style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#2C2C2C',
                              margin: 0
                            }}>
                              ${offer.maxPrice}
                            </p>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#555555',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              margin: '0 0 4px 0'
                            }}>
                              Quantity
                            </p>
                            <p style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#2C2C2C',
                              margin: 0
                            }}>
                              {offer.quantity}
                            </p>
                          </div>
                          <div>
                            <p style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#555555',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              margin: '0 0 4px 0'
                            }}>
                              Created
                            </p>
                            <p style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#2C2C2C',
                              margin: 0
                            }}>
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div style={{
                          padding: '20px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#555555',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              margin: '0 0 4px 0'
                            }}>
                              Expires
                            </p>
                            <p style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#2C2C2C',
                              margin: 0
                            }}>
                              {new Date(offer.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          {offer.event && (
                            <>
                              <div style={{ marginBottom: '16px' }}>
                                <p style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#555555',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  margin: '0 0 4px 0'
                                }}>
                                  Venue
                                </p>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#2C2C2C',
                                  margin: 0
                                }}>
                                  {offer.event.venue}
                                </p>
                              </div>
                              <div>
                                <p style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#555555',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  margin: '0 0 4px 0'
                                }}>
                                  Location
                                </p>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#2C2C2C',
                                  margin: 0
                                }}>
                                  {offer.event.city}, {offer.event.state}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {offer.message && (
                        <div style={{
                          marginTop: '20px',
                          padding: '16px',
                          background: 'linear-gradient(135deg, #E8F4F8 0%, #D1E9F1 100%)',
                          borderRadius: '12px',
                          border: '1px solid #457B9D'
                        }}>
                          <p style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#1D3557',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            margin: '0 0 8px 0'
                          }}>
                            Message
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2C2C2C',
                            margin: 0,
                            lineHeight: '1.5'
                          }}>
                            {offer.message}
                          </p>
                        </div>
                      )}

                      {offer.sections && offer.sections.length > 0 && (
                        <div style={{
                          marginTop: '20px',
                          padding: '16px',
                          background: 'linear-gradient(135deg, #E8F7F9 0%, #D1F0F3 100%)',
                          borderRadius: '12px',
                          border: '1px solid #A8DADC'
                        }}>
                          <p style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#1D3557',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            margin: '0 0 8px 0'
                          }}>
                            Sections
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2C2C2C',
                            margin: 0
                          }}>
                            {offer.sections.map(s => s.section?.name).join(', ')}
                          </p>
                        </div>
                      )}

                      {offer.transaction && (
                        <div style={{
                          marginTop: '20px',
                          padding: '20px',
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                          borderRadius: '12px',
                          border: '2px solid #10b981',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              ✓
                            </div>
                            <p style={{
                              fontSize: '15px',
                              fontWeight: '700',
                              color: '#1D3557',
                              margin: 0
                            }}>
                              Transaction Completed
                            </p>
                          </div>
                          <p style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1D3557',
                            margin: 0
                          }}>
                            ${offer.transaction.totalAmount} - {offer.transaction.status}
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minWidth: '140px',
                      alignItems: 'flex-end'
                    }}>
                      {offer.status === 'ACTIVE' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOffer(offer)}
                            style={{
                              borderRadius: '10px',
                              fontWeight: '600',
                              fontSize: '14px',
                              padding: '8px 16px'
                            }}
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOffer(offer.id, offer.event?.name || 'Unknown Event')}
                            disabled={cancelOfferMutation.isPending}
                            style={{
                              borderRadius: '10px',
                              fontWeight: '600',
                              fontSize: '14px',
                              padding: '8px 16px'
                            }}
                          >
                            🗑️ Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <Button
                  variant="outline"
                  disabled={filters.page <= 1}
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  style={{
                    borderRadius: '10px',
                    fontWeight: '600'
                  }}
                >
                  ← Previous
                </Button>
                <span style={{
                  fontSize: '15px',
                  color: '#555555',
                  fontWeight: '600',
                  padding: '0 16px'
                }}>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={filters.page >= data.pagination.totalPages}
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  style={{
                    borderRadius: '10px',
                    fontWeight: '600'
                  }}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card variant="elevated" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{
              padding: '64px 32px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#555555'
              }}>
                📝
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#2C2C2C',
                margin: '0 0 12px 0'
              }}>
                No offers found
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#555555',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Start making offers on events you're interested in!
              </p>
            </div>
          </Card>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelConfirmation.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}>
            <Card variant="elevated" style={{
              maxWidth: '500px',
              margin: '20px',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}>
                    ⚠️
                  </div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#2C2C2C',
                    margin: '0 0 12px 0'
                  }}>
                    Cancel Offer
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: '#555555',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Are you sure you want to cancel your offer for{' '}
                    <strong style={{ color: '#2C2C2C' }}>{cancelConfirmation.offerName}</strong>?
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#555555',
                    margin: '8px 0 0 0',
                    fontWeight: '500'
                  }}>
                    This action cannot be undone.
                  </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <Button
                    variant="outline"
                    onClick={() => setCancelConfirmation({ show: false, offerId: '', offerName: '' })}
                    disabled={cancelOfferMutation.isPending}
                    style={{
                      minWidth: '120px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}
                  >
                    Keep Offer
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmCancelOffer}
                    disabled={cancelOfferMutation.isPending}
                    isLoading={cancelOfferMutation.isPending}
                    style={{
                      minWidth: '120px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}
                  >
                    Yes, Cancel Offer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Offer Modal */}
        {editingOffer && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            overflowY: 'auto',
            padding: '20px'
          }}>
            <Card variant="elevated" style={{
              width: '100%',
              maxWidth: '600px',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}>
                    ✏️
                  </div>
                  <h3 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2C2C2C',
                    margin: '0 0 8px 0'
                  }}>
                    Edit Your Offer
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: '#555555',
                    margin: 0
                  }}>
                    Update your offer for <strong style={{ color: '#2C2C2C' }}>{editingOffer.event?.name}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2C2C2C',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Maximum Price ($)
                    </label>
                    <Input
                      type="number"
                      value={editForm.maxPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, maxPrice: e.target.value })}
                      placeholder="Enter maximum price"
                      style={{
                        padding: '12px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2C2C2C',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Message (Optional)
                    </label>
                    <textarea
                      value={editForm.message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, message: e.target.value })}
                      placeholder="Add a message to your offer..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                        e.currentTarget.style.borderColor = '#1D3557';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29, 53, 87, 0.1)';
                      }}
                      onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2C2C2C',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Expiration Date
                    </label>
                    <Input
                      type="date"
                      value={editForm.expiresAt}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                      style={{
                        padding: '12px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  marginTop: '32px'
                }}>
                  <Button
                    variant="outline"
                    onClick={() => setEditingOffer(null)}
                    disabled={updateOfferMutation.isPending}
                    style={{
                      minWidth: '140px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '16px',
                      padding: '12px 24px'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleUpdateOffer}
                    disabled={updateOfferMutation.isPending || !editForm.maxPrice}
                    isLoading={updateOfferMutation.isPending}
                    style={{
                      minWidth: '140px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '16px',
                      padding: '12px 24px'
                    }}
                  >
                    Update Offer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};