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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="text-center mb-12">
              <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <div className="h-16 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
            
            {/* Events Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Discover Events</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find and make offers on the hottest events in your area. From concerts to sports, theater to comedy shows.
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search Events</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search events, venues, artists, or locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 py-4 text-base border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="lg:w-64">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as EventType | '')}
                    className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">All Categories</option>
                    <option value="CONCERT">🎵 Concerts</option>
                    <option value="SPORTS">⚽ Sports</option>
                    <option value="THEATER">🎭 Theater</option>
                    <option value="COMEDY">😂 Comedy</option>
                    <option value="OTHER">🎪 Other</option>
                  </select>
                </div>
                
                <div className="lg:w-40">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">&nbsp;</label>
                  <Button 
                    type="submit" 
                    className="w-full py-4 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              
              {/* Quick Category Filters */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Popular:</span>
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
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events && events.length > 0 && events.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
            >
              <Link to={`/events/${event.id}`} className="block">
                <div className="relative overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <Calendar className="h-16 w-16 text-white opacity-80" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {event.category}
                    </span>
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {event.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-3 text-indigo-500" />
                        <span className="text-sm font-medium">{formatDate(event.eventDate)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-3 text-indigo-500" />
                        <span className="text-sm truncate">{event.venue}, {event.city}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price and Availability */}
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">From</span>
                      <div className="text-lg font-bold text-indigo-600">
                        {formatPrice(event.minPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{event.availableSeats || 'N/A'}</div>
                      <div className="text-xs text-gray-500">available</div>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Make Offer Button */}
              {user && user.role === UserRole.BUYER && (
                <div className="px-6 pb-6">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full py-3 font-semibold border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200"
                    onClick={(e) => handleMakeOffer(e, event.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Make Offer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {events.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No events found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any events matching your criteria. Try adjusting your search or filters.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  fetchEvents();
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                View All Events
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};