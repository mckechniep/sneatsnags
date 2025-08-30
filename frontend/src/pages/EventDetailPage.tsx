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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div>
              <div className="bg-white rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The event you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            className="mb-6 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Events
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Hero Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
              <div className="relative">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-white opacity-80" />
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-6 right-6">
                  <span className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {event.category}
                  </span>
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              </div>
              
              <div className="p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.name}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            </div>

            {/* Event Details Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold ml-4 text-gray-900">Event Information</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-indigo-500 mr-4 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900">{formatDate(event.eventDate)}</div>
                      <div className="text-sm text-gray-600">Event Date</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-indigo-500 mr-4 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900">{formatTime(event.eventDate)}</div>
                      <div className="text-sm text-gray-600">Start Time</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-indigo-500 mr-4 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900">{event.venue}</div>
                      <div className="text-sm text-gray-600">{event.city}, {event.state}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-indigo-500 mr-4 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900">{event.totalSeats?.toLocaleString() || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Total Capacity</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold ml-4 text-gray-900">Pricing & Availability</h3>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Price Range</div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatPrice(event.minPrice || 0)} - {formatPrice(event.maxPrice || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-4 px-6 bg-green-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-gray-900">Available Tickets</div>
                      <div className="text-sm text-gray-600">Ready for offers</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {event.availableSeats?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Sections */}
            {sections.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold ml-4 text-gray-900">Available Sections</h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="group border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                    >
                      <h4 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-indigo-600 transition-colors">{section.name}</h4>
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{section.description}</p>
                      )}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Capacity</span>
                          <span className="font-semibold text-gray-900">{section.seatCount?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Price Range</span>
                          <span className="font-bold text-indigo-600">
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
          <div className="space-y-8">
            {/* Main Action Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100">
              <div className="space-y-6">
                {/* Price Display */}
                <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Starting From</div>
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {formatPrice(event.minPrice || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {event.availableSeats || 'N/A'} tickets available
                  </div>
                </div>

                {/* Action Buttons */}
                {user && user.role === UserRole.BUYER && (
                  <Button 
                    onClick={handleMakeOffer} 
                    className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Make an Offer
                  </Button>
                )}

                {!user && (
                  <div className="space-y-4">
                    <Link to="/login" className="block">
                      <Button className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl" size="lg">
                        Sign In to Make Offer
                      </Button>
                    </Link>
                    <Link to="/register" className="block">
                      <Button variant="outline" className="w-full py-4 text-lg font-semibold border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Secondary Actions */}
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className="flex-1 py-3 font-semibold border-2 hover:shadow-md transition-all duration-200"
                  >
                    <Heart 
                      className={`h-5 w-5 mr-2 ${isFavorite ? 'fill-current text-red-500' : ''}`} 
                    />
                    {isFavorite ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex-1 py-3 font-semibold border-2 hover:shadow-md transition-all duration-200"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Venue Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold ml-4 text-gray-900">Venue Details</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{event.venue}</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {event.address}<br />
                    {event.city}, {event.state} {event.zipCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full py-3 font-semibold border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  onClick={() => {
                    const query = encodeURIComponent(`${event.venue} ${event.address} ${event.city} ${event.state}`);
                    window.open(`https://maps.google.com/?q=${query}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View on Maps
                </Button>
              </div>
            </div>

            {/* Event Status */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold ml-4 text-gray-900">Event Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    event.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {event.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Listed</span>
                  <span className="text-gray-900">{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Updated</span>
                  <span className="text-gray-900">{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};