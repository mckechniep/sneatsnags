import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Plus } from 'lucide-react';
import { eventService } from '../services/eventService';
import type { Event } from '../types/events';
import type { EventType } from '../types/events';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import SweetAlert from '../utils/sweetAlert';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents({
        page: currentPage,
        limit: 12,
        category: selectedCategory || undefined,
      });
      
      // Handle different possible response structures
      const eventsData = response.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      SweetAlert.error('Failed to Load Events', 'Unable to load events at this time. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await eventService.searchEvents(searchQuery, {
        page: 1,
        limit: 12,
      });
      
      // Handle different possible response structures
      const eventsData = response.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search failed:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleMakeOffer = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault(); // Prevent the Link navigation
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== UserRole.BUYER) {
      SweetAlert.warning('Access Restricted', 'Only buyers can make offers');
      return;
    }
    
    navigate(`/events/${eventId}/offer`);
  };

  if (loading && events.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '32px 20px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Header Skeleton */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '48px' 
          }}>
            <div style={{
              height: '48px',
              background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
              borderRadius: '12px',
              width: '33%',
              margin: '0 auto 16px',
            }} />
            <div style={{
              height: '24px',
              background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
              borderRadius: '12px',
              width: '50%',
              margin: '0 auto 32px',
            }} />
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <div style={{
                height: '64px',
                background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
                borderRadius: '16px'
              }} />
            </div>
          </div>
          
          {/* Events Grid Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}>
                <div style={{
                  height: '200px',
                  background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite'
                }} />
                <div style={{ padding: '24px' }}>
                  <div style={{
                    height: '24px',
                    background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }} />
                  <div style={{
                    height: '16px',
                    background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '8px',
                    width: '75%',
                    marginBottom: '8px'
                  }} />
                  <div style={{
                    height: '16px',
                    background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '8px',
                    width: '66%',
                    marginBottom: '16px'
                  }} />
                  <div style={{
                    height: '48px',
                    background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '12px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '32px 20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
            position: 'relative'
          }}>
            {/* Background decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '300px',
              background: 'linear-gradient(135deg, #2563eb15, #7c3aed15, #dc262615)',
              borderRadius: '50%',
              filter: 'blur(80px)',
              zIndex: 0
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{
                fontSize: 'clamp(32px, 6vw, 56px)',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 20px 0',
                letterSpacing: '-0.03em',
                lineHeight: '1.1'
              }}>
                Discover Events
              </h1>
              <p style={{
                fontSize: 'clamp(16px, 2.5vw, 22px)',
                color: '#475569',
                margin: '0 auto',
                fontWeight: '500',
                maxWidth: '800px',
                lineHeight: '1.6'
              }}>
                Find and make offers on the hottest events in your area. From concerts to sports, theater to comedy shows.
              </p>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <form onSubmit={handleSearch}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '24px',
                alignItems: 'end'
              }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    🔍 Search Events
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      width: '20px',
                      height: '20px'
                    }} />
                    <Input
                      type="text"
                      placeholder="Search events, venues, artists, or locations..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      style={{
                        paddingLeft: '52px',
                        padding: '16px 16px 16px 52px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        width: '100%',
                        outline: 'none',
                        transition: 'all 0.2s ease'
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
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    🎭 Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value as EventType | '')}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      transition: 'all 0.2s ease'
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
                    <option value="">All Categories</option>
                    <option value="CONCERT">🎵 Concerts</option>
                    <option value="SPORTS">⚽ Sports</option>
                    <option value="THEATER">🎭 Theater</option>
                    <option value="COMEDY">😂 Comedy</option>
                    <option value="OTHER">🎪 Other</option>
                  </select>
                </div>
                
                <div>
                  <Button 
                    type="submit" 
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.6)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
                    }}
                  >
                    <Search style={{ width: '20px', height: '20px' }} />
                    Search
                  </Button>
                </div>
              </div>
              
              {/* Quick Category Filters */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '24px',
                marginTop: '24px',
                borderTop: '1px solid #e2e8f0',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🔥 Popular:
                </span>
                {[
                  { label: 'This Weekend', value: 'weekend' },
                  { label: 'Concerts', value: 'CONCERT' },
                  { label: 'Sports', value: 'SPORTS' },
                  { label: 'Comedy Shows', value: 'COMEDY' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSelectedCategory(filter.value as EventType | '')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6b7280',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Events Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {events && events.length > 0 && events.map((event) => (
            <div
              key={event.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)';
              }}
            >
              <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Calendar style={{ width: '64px', height: '64px', color: 'white', opacity: 0.8 }} />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px'
                  }}>
                    <span style={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {event.category}
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      fontWeight: '700',
                      fontSize: '20px',
                      color: '#1f2937',
                      margin: '0 0 16px 0',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {event.name}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        <Calendar style={{ width: '16px', height: '16px', marginRight: '12px', color: '#2563eb' }} />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        <MapPin style={{ width: '16px', height: '16px', marginRight: '12px', color: '#2563eb' }} />
                        <span style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {event.venue}, {event.city}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price and Availability */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        From
                      </span>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        color: '#2563eb'
                      }}>
                        {formatPrice(event.minPrice)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        {event.availableSeats || 'N/A'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        available
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Make Offer Button */}
              {user && user.role === UserRole.BUYER && (
                <div style={{ padding: '0 24px 24px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleMakeOffer(e, event.id)}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      fontWeight: '700',
                      fontSize: '14px',
                      border: '2px solid #2563eb',
                      color: '#2563eb',
                      background: 'transparent',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#2563eb';
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Make Offer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {events.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              borderRadius: '20px',
              padding: '48px 32px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
              </div>
              <h3 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#1f2937',
                margin: '0 0 16px 0'
              }}>
                No events found
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '0 0 32px 0',
                lineHeight: '1.6',
                fontWeight: '500'
              }}>
                We couldn't find any events matching your criteria. Try adjusting your search or filters to discover amazing events!
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  fetchEvents();
                }}
                style={{
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.6)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
                }}
              >
                🎉 View All Events
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};