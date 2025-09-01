import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  Share2, 
  Heart,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { eventService } from '../services/eventService';
import type { Event, EventSection } from '../types/events';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [sections, setSections] = useState<EventSection[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  useEffect(() => {
    if (event) {
      fetchRelatedEvents();
    }
  }, [event]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error('Event ID is required');
      }

      const [eventData, sectionsData] = await Promise.all([
        eventService.getEvent(id),
        eventService.getEventSections(id).catch(() => []) // Gracefully handle missing sections
      ]);

      setEvent(eventData);
      setSections(sectionsData);
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedEvents = async () => {
    if (!event || !id) return;
    
    try {
      setRelatedLoading(true);
      
      // Get related events based on category, city, or general popularity
      const relatedEventsData = await eventService.getEvents({
        category: event.category,
        city: event.city,
        state: event.state,
        limit: 10, // Request more to have enough after filtering
        page: 1
      });

      // Filter out the current event if it appears in results
      const filteredEvents = relatedEventsData.data?.filter((relatedEvent: Event) => relatedEvent.id !== id) || [];
      
      setRelatedEvents(filteredEvents.slice(0, 6)); // Limit to 6 events
    } catch (err) {
      console.error('Failed to fetch related events:', err);
      // Don't show error for related events, just show empty state
      setRelatedEvents([]);
    } finally {
      setRelatedLoading(false);
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

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleMakeOffer = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== UserRole.BUYER) {
      alert('Only buyers can make offers');
      return;
    }
    
    navigate(`/events/${id}/offer`);
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out this event: ${event.name}`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Event link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality with backend
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Professional Loading State */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              position: 'relative',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '6px solid white',
                borderTop: '6px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
            
            <h3 style={{
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px'
            }}>
              Loading Event Details
            </h3>
            
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Please wait while we fetch the event information...
            </p>
            
            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          borderRadius: '24px',
          padding: '48px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          maxWidth: '600px',
          width: '100%'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            fontSize: '56px'
          }}>
            ⚠️
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em'
          }}>
            Event Not Found
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            margin: '0 0 40px 0',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            {error || 'The event you\'re looking for doesn\'t exist or may have been removed.'}
          </p>
          <button
            onClick={() => navigate('/events')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.6)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '12px' }} />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(135deg, #2563eb15, #7c3aed15)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '10%',
        width: '250px',
        height: '250px',
        background: 'linear-gradient(135deg, #dc262615, #7c3aed15)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        zIndex: 0
      }} />
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={() => navigate('/events')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#2563eb',
              fontSize: '16px',
              fontWeight: '700',
              marginBottom: '32px',
              padding: '16px 24px',
              background: 'rgba(37, 99, 235, 0.1)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)';
              e.currentTarget.style.transform = 'translateX(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.3)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.2)';
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '12px' }} />
            ← Back to Events
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '48px',
          '@media (max-width: 1024px)': {
            gridTemplateColumns: '1fr',
            gap: '32px'
          }
        }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Event Hero Section */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{ position: 'relative' }}>
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '400px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '400px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar style={{ width: '96px', height: '96px', color: 'white', opacity: 0.8 }} />
                  </div>
                )}
                
                {/* Category Badge */}
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px'
                }}>
                  <span style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(12px)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                  }}>
                    {event.category}
                  </span>
                </div>
                
                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)'
                }} />
              </div>
              
              <div style={{ padding: '40px' }}>
                <h1 style={{
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '16px',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1'
                }}>
                  {event.name}
                </h1>
                <p style={{
                  fontSize: '18px',
                  color: '#4b5563',
                  lineHeight: '1.8',
                  fontWeight: '500'
                }}>
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Details Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.7)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#1f2937',
                    marginLeft: '16px'
                  }}>
                    Event Information
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <Calendar style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '16px', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{formatDate(event.eventDate)}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Date</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '16px', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{formatTime(event.eventDate)}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Time</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <MapPin style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '16px', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{event.venue}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{event.city}, {event.state}</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <Users style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '16px', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{event.totalSeats?.toLocaleString() || 'N/A'}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Capacity</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.7)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Plus style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#1f2937',
                    marginLeft: '16px'
                  }}>
                    Pricing & Availability
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #2563eb10 0%, #7c3aed10 100%)',
                    padding: '32px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '8px'
                    }}>
                      Price Range
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {formatPrice(event.minPrice || 0)} - {formatPrice(event.maxPrice || 0)}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, #10b98110 0%, #05966910 100%)',
                    borderRadius: '12px',
                    border: '1px solid #10b981'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>Available Tickets</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Ready for offers</div>
                    </div>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: '900',
                      color: '#10b981'
                    }}>
                      {event.availableSeats?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Sections */}
            {sections.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.7)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: '#1f2937',
                    marginLeft: '16px'
                  }}>
                    Available Sections
                  </h3>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '2px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '24px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 25px rgba(37, 99, 235, 0.15)';
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <h4 style={{
                        fontWeight: '800',
                        color: '#1f2937',
                        marginBottom: '12px',
                        fontSize: '18px',
                        transition: 'color 0.3s ease'
                      }}>
                        {section.name}
                      </h4>
                      {section.description && (
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          marginBottom: '20px',
                          lineHeight: '1.6',
                          fontWeight: '500'
                        }}>
                          {section.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          borderRadius: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Capacity
                          </span>
                          <span style={{
                            fontWeight: '800',
                            color: '#1f2937',
                            fontSize: '16px'
                          }}>
                            {section.seatCount?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          borderRadius: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Price Level
                          </span>
                          <span style={{
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: '18px'
                          }}>
                            ${section.priceLevel || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Events Section */}
            {(relatedEvents.length > 0 || relatedLoading) && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
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
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <Calendar style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: '#1f2937',
                      margin: '0 0 4px 0'
                    }}>
                      Related Events
                    </h3>
                    <p style={{
                      fontSize: '16px',
                      color: '#6b7280',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Discover similar events you might enjoy
                    </p>
                  </div>
                </div>

                {relatedLoading ? (
                  // Loading skeleton for related events
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{
                        background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite',
                        borderRadius: '16px',
                        height: '320px'
                      }} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    {relatedEvents.map((relatedEvent) => (
                      <Link 
                        key={relatedEvent.id} 
                        to={`/events/${relatedEvent.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            height: '100%'
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                          }}
                        >
                          <div style={{ position: 'relative' }}>
                            {relatedEvent.imageUrl ? (
                              <img
                                src={relatedEvent.imageUrl}
                                alt={relatedEvent.name}
                                style={{
                                  width: '100%',
                                  height: '160px',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '160px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Calendar style={{ width: '32px', height: '32px', color: 'white', opacity: 0.8 }} />
                              </div>
                            )}
                            
                            {/* Category Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px'
                            }}>
                              <span style={{
                                background: 'rgba(0, 0, 0, 0.75)',
                                backdropFilter: 'blur(8px)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {relatedEvent.category}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ padding: '16px' }}>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#1f2937',
                              margin: '0 0 8px 0',
                              lineHeight: '1.3',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {relatedEvent.name}
                            </h4>
                            
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              color: '#6b7280',
                              fontSize: '13px',
                              fontWeight: '500',
                              marginBottom: '8px'
                            }}>
                              <MapPin style={{ width: '14px', height: '14px', marginRight: '6px', color: '#2563eb' }} />
                              <span style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {relatedEvent.city}, {relatedEvent.state}
                              </span>
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              color: '#6b7280',
                              fontSize: '13px',
                              fontWeight: '500',
                              marginBottom: '12px'
                            }}>
                              <Calendar style={{ width: '14px', height: '14px', marginRight: '6px', color: '#2563eb' }} />
                              <span>{new Date(relatedEvent.eventDate).toLocaleDateString()}</span>
                            </div>
                            
                            {/* Price */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}>
                              <div>
                                <span style={{
                                  fontSize: '10px',
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  fontWeight: '600',
                                  display: 'block',
                                  marginBottom: '2px'
                                }}>
                                  From
                                </span>
                                <div style={{
                                  fontSize: '16px',
                                  fontWeight: '800',
                                  color: '#2563eb'
                                }}>
                                  {formatPrice(relatedEvent.minPrice || 0)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#1f2937'
                                }}>
                                  {relatedEvent.availableSeats || 'N/A'}
                                </div>
                                <div style={{
                                  fontSize: '10px',
                                  color: '#6b7280',
                                  fontWeight: '500'
                                }}>
                                  available
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
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
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Main Action Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
              border: '2px solid rgba(37, 99, 235, 0.15)',
              position: 'sticky',
              top: '32px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Price Display */}
                <div style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #2563eb10 0%, #7c3aed10 100%)',
                  padding: '32px 24px',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: '12px'
                  }}>
                    Starting From
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '8px',
                    lineHeight: '1'
                  }}>
                    {formatPrice(event.minPrice || 0)}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    fontWeight: '600'
                  }}>
                    {event.availableSeats || 'N/A'} tickets available
                  </div>
                </div>

                {/* Action Buttons */}
                {user && user.role === UserRole.BUYER && (
                  <button
                    onClick={handleMakeOffer}
                    style={{
                      width: '100%',
                      padding: '20px',
                      fontSize: '18px',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(37, 99, 235, 0.6)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)';
                    }}
                  >
                    <Plus style={{ width: '24px', height: '24px', marginRight: '12px' }} />
                    Make an Offer
                  </button>
                )}

                {!user && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      <button style={{
                        width: '100%',
                        padding: '20px',
                        fontSize: '18px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)'
                      }}>
                        Sign In to Make Offer
                      </button>
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                      <button style={{
                        width: '100%',
                        padding: '20px',
                        fontSize: '18px',
                        fontWeight: '800',
                        background: 'transparent',
                        color: '#2563eb',
                        border: '2px solid #2563eb',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}>
                        Create Account
                      </button>
                    </Link>
                  </div>
                )}

                {/* Secondary Actions */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  paddingTop: '24px',
                  borderTop: '2px solid #e5e7eb'
                }}>
                  <button
                    onClick={handleToggleFavorite}
                    style={{
                      flex: 1,
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: '700',
                      background: 'transparent',
                      color: isFavorite ? '#ef4444' : '#6b7280',
                      border: '2px solid ' + (isFavorite ? '#ef4444' : '#d1d5db'),
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Heart
                      style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '8px',
                        fill: isFavorite ? '#ef4444' : 'none'
                      }}
                    />
                    {isFavorite ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    style={{
                      flex: 1,
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: '700',
                      background: 'transparent',
                      color: '#6b7280',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Share2 style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Venue Information */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginLeft: '16px'
                }}>
                  Venue Details
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontWeight: '800',
                    fontSize: '18px',
                    color: '#1f2937',
                    marginBottom: '12px'
                  }}>
                    {event.venue}
                  </h4>
                  <p style={{
                    color: '#6b7280',
                    lineHeight: '1.6',
                    fontWeight: '500',
                    fontSize: '16px'
                  }}>
                    {event.address}<br />
                    {event.city}, {event.state} {event.zipCode}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const query = encodeURIComponent(`${event.venue} ${event.address} ${event.city} ${event.state}`);
                    window.open(`https://maps.google.com/?q=${query}`, '_blank');
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    background: 'transparent',
                    color: '#3b82f6',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <ExternalLink style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                  View on Maps
                </button>
              </div>
            </div>

            {/* Event Status */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginLeft: '16px'
                }}>
                  Event Status
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: '#4b5563',
                    fontSize: '16px'
                  }}>
                    Status
                  </span>
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    ...(event.status === 'ACTIVE' ? {
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white'
                    } : {
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white'
                    })
                  }}>
                    {event.status || 'Active'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: '#4b5563',
                    fontSize: '16px'
                  }}>
                    Listed
                  </span>
                  <span style={{
                    color: '#1f2937',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: '#4b5563',
                    fontSize: '16px'
                  }}>
                    Updated
                  </span>
                  <span style={{
                    color: '#1f2937',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};