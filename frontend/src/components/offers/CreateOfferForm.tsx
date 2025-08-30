import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { buyerService } from '../../services/buyerService';
import { offerService } from '../../services/offerService';
import { useAuth } from '../../hooks/useAuth';
import type { PriceSuggestion } from '../../types/offer';
import type { Event } from '../../types/events';
import SweetAlert from '../../utils/sweetAlert';

const createOfferSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  sectionIds: z.array(z.string()).min(1, 'At least one section is required'),
  maxPrice: z.string().min(1, 'Price is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Price must be a positive number'
  ),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets'),
  message: z.string(),
  expirationDays: z.number().min(1, 'Expiration must be at least 1 day').max(30, 'Maximum 30 days')
});

type CreateOfferSchemaType = z.infer<typeof createOfferSchema>;

interface CreateOfferFormProps {
  event: Event;
  onSuccess?: (offer: any) => void;
  onCancel?: () => void;
}

export const CreateOfferForm: React.FC<CreateOfferFormProps> = ({
  event,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  const [loadingPriceSuggestion, setLoadingPriceSuggestion] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateOfferSchemaType>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      eventId: event.id,
      sectionIds: [],
      maxPrice: '',
      quantity: 1,
      message: '',
      expirationDays: 7
    }
  });

  const watchedSections = watch('sectionIds');

  // Load price suggestions when component mounts or sections change
  useEffect(() => {
    const loadPriceSuggestions = async () => {
      setLoadingPriceSuggestion(true);
      try {
        const suggestions = await offerService.getPriceSuggestions(
          event.id,
          selectedSections.length > 0 ? selectedSections : undefined
        );
        setPriceSuggestion(suggestions);
        
        // Auto-fill suggested price if no price is set
        const currentPrice = watch('maxPrice');
        if (!currentPrice && suggestions.suggestedPrice) {
          setValue('maxPrice', suggestions.suggestedPrice.toString());
        }
      } catch (error) {
        console.error('Failed to load price suggestions:', error);
      } finally {
        setLoadingPriceSuggestion(false);
      }
    };

    loadPriceSuggestions();
  }, [event.id, selectedSections, setValue, watch]);

  // Update selected sections when form value changes
  useEffect(() => {
    setSelectedSections(watchedSections || []);
  }, [watchedSections]);

  const onSubmit = async (data: CreateOfferSchemaType) => {
    if (!user) {
      SweetAlert.error('Authentication Required', 'You must be logged in to create an offer');
      return;
    }

    setIsLoading(true);
    try {
      SweetAlert.loading('Creating Offer', 'Please wait while we submit your offer...');
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + data.expirationDays);

      const offerData = {
        eventId: data.eventId,
        sectionIds: data.sectionIds,
        maxPrice: parseFloat(data.maxPrice),
        quantity: data.quantity,
        message: data.message || undefined,
        expiresAt: expirationDate.toISOString()
      };

      const newOffer = await buyerService.createOffer(offerData);
      
      SweetAlert.close();
      SweetAlert.success('Offer Created!', 'Your offer has been submitted successfully and sellers will be notified');
      
      if (onSuccess) {
        onSuccess(newOffer);
      }
    } catch (error: any) {
      console.error('Failed to create offer:', error);
      SweetAlert.close();
      SweetAlert.error('Failed to Create Offer', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSuggestedPrice = () => {
    if (priceSuggestion?.suggestedPrice) {
      setValue('maxPrice', priceSuggestion.suggestedPrice.toString());
    }
  };

  const handleSectionChange = (sectionId: string, checked: boolean) => {
    const currentSections = watch('sectionIds') || [];
    const newSections = checked
      ? [...currentSections, sectionId]
      : currentSections.filter(id => id !== sectionId);
    
    setValue('sectionIds', newSections);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '32px',
      '@media (max-width: 1024px)': {
        gridTemplateColumns: '1fr'
      }
    }}>
      {/* Event Details Card */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        height: 'fit-content',
        order: 2
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#1f2937',
              margin: '0 0 4px 0'
            }}>
              Event Details
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              fontWeight: '500'
            }}>
              You're making an offer for
            </p>
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 12px 0',
            lineHeight: '1.3'
          }}>
            {event.name}
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(event.eventDate || event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.venue}, {event.city}, {event.state}</span>
            </div>

            {(event.minPrice || event.maxPrice) && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '8px'
              }}>
                <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Price Range: ${event.minPrice || 0} - ${event.maxPrice || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        order: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            🎯
          </div>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#1f2937',
              margin: '0 0 4px 0'
            }}>
              Create Your Offer
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0,
              fontWeight: '500'
            }}>
              Fill in the details for your ticket offer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🎪 Preferred Sections *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '16px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              border: '2px solid #e2e8f0'
            }}>
              {event.sections?.map((section) => (
                <label key={section.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  const checkbox = e.currentTarget.querySelector('input') as HTMLInputElement;
                  if (!checkbox?.checked) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
                >
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      handleSectionChange(section.id, e.target.checked);
                      const label = e.currentTarget.parentElement as HTMLLabelElement;
                      if (e.target.checked) {
                        label.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                        label.style.borderColor = '#2563eb';
                        label.style.color = '#1e40af';
                      } else {
                        label.style.background = 'white';
                        label.style.borderColor = '#e5e7eb';
                        label.style.color = '#374151';
                      }
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '12px',
                      accentColor: '#2563eb'
                    }}
                  />
                  <span>{section.name}</span>
                </label>
              ))}
            </div>
            {errors.sectionIds && (
              <p style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#dc2626',
                fontWeight: '500'
              }}>
                {errors.sectionIds.message}
              </p>
            )}
          </div>

          {/* Price Suggestion Section */}
          {priceSuggestion && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '2px solid #93c5fd',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  💡
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e40af',
                  margin: 0
                }}>
                  Smart Price Suggestions
                </h3>
              </div>
              
              {loadingPriceSuggestion ? (
                <div>
                  <div style={{
                    height: '16px',
                    background: 'linear-gradient(90deg, #93c5fd, #60a5fa, #93c5fd)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '8px',
                    width: '75%',
                    marginBottom: '12px'
                  }} />
                  <div style={{
                    height: '16px',
                    background: 'linear-gradient(90deg, #93c5fd, #60a5fa, #93c5fd)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '8px',
                    width: '50%'
                  }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(37, 99, 235, 0.2)'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      color: '#1e40af',
                      fontWeight: '600'
                    }}>
                      💰 Recommended Price:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#1e40af'
                      }}>
                        ${priceSuggestion.suggestedPrice}
                      </span>
                      <button
                        type="button"
                        onClick={handleUseSuggestedPrice}
                        style={{
                          fontSize: '12px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Use This
                      </button>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#1e40af',
                    fontWeight: '600'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      📊 Avg: ${priceSuggestion.averagePrice}
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      📈 Median: ${priceSuggestion.medianPrice}
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      🎯 Range: ${priceSuggestion.priceRange.low}-${priceSuggestion.priceRange.high}
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      📝 Recent: {priceSuggestion.recentOffers}
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#1e40af',
                    margin: 0,
                    textAlign: 'center',
                    fontWeight: '500',
                    background: 'rgba(255, 255, 255, 0.6)',
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }}>
                    📊 Based on {priceSuggestion.totalOffers} offers • Suggested price is the 75th percentile
                  </p>
                </div>
              )}
              <style>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
            </div>
          )}

          {/* Max Price */}
          <div>
            <label htmlFor="maxPrice" style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              💰 Maximum Price Per Ticket *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                $
              </span>
              <input
                {...register('maxPrice')}
                type="text"
                id="maxPrice"
                placeholder="0.00"
                style={{
                  display: 'block',
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  padding: '16px 16px 16px 40px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontWeight: '600'
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            {errors.maxPrice && (
              <p style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#dc2626',
                fontWeight: '500'
              }}>
                {errors.maxPrice.message}
              </p>
            )}
          </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Tickets *
          </label>
          <select
            {...register('quantity', { valueAsNumber: true })}
            id="quantity"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        {/* Expiration */}
        <div>
          <label htmlFor="expirationDays" className="block text-sm font-medium text-gray-700 mb-1">
            Offer Expires In *
          </label>
          <select
            {...register('expirationDays', { valueAsNumber: true })}
            id="expirationDays"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
          {errors.expirationDays && (
            <p className="mt-1 text-sm text-red-600">{errors.expirationDays.message}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Message (Optional)
          </label>
          <textarea
            {...register('message')}
            id="message"
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any additional details about your offer..."
          />
        </div>

          {/* Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label htmlFor="quantity" style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                🎫 Number of Tickets *
              </label>
              <select
                {...register('quantity', { valueAsNumber: true })}
                id="quantity"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontWeight: '600',
                  backgroundColor: 'white'
                }}
                onFocus={(e: React.FocusEvent<HTMLSelectElement>) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e: React.FocusEvent<HTMLSelectElement>) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              {errors.quantity && (
                <p style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#dc2626',
                  fontWeight: '500'
                }}>
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Expiration */}
            <div>
              <label htmlFor="expirationDays" style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ⏰ Offer Expires In *
              </label>
              <select
                {...register('expirationDays', { valueAsNumber: true })}
                id="expirationDays"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontWeight: '600',
                  backgroundColor: 'white'
                }}
                onFocus={(e: React.FocusEvent<HTMLSelectElement>) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e: React.FocusEvent<HTMLSelectElement>) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
              {errors.expirationDays && (
                <p style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#dc2626',
                  fontWeight: '500'
                }}>
                  {errors.expirationDays.message}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              💬 Additional Message (Optional)
            </label>
            <textarea
              {...register('message')}
              id="message"
              rows={4}
              placeholder="Add any specific requirements or details about your offer..."
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            paddingTop: '32px',
            borderTop: '2px solid #e2e8f0',
            marginTop: '32px'
          }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  minWidth: '140px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#6b7280',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                minWidth: '160px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '700',
                color: 'white',
                background: isLoading 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(37, 99, 235, 0.4)'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.6)';
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
                }
              }}
            >
              {isLoading ? '⏳ Creating...' : '🚀 Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};