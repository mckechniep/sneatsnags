import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { eventService } from "../services/eventService";
import type { Event } from "../types/events";
import {
  Search,
  Shield,
  Clock,
  ArrowRight,
  Play,
  Star,
  Users,
  Zap,
  CheckCircle,
  Sparkles,
  Calendar,
  MapPin,
  Ticket,
  Music,
  Trophy,
  Theater,
  Mic,
  Bell,
  DollarSign,
  Target,
  BarChart3,
  Headphones,
  Globe,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  price: string;
  image: string;
  category: string;
  attendees: string;
  isLive: boolean;
}

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events for hero slider and live events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log("Fetching events...");
      
      // Fetch hero events (upcoming events)
      const heroResponse = await eventService.getEvents({
        limit: 5,
        sortBy: "eventDate",
        sortOrder: "asc",
      });
      console.log("Hero events response:", heroResponse);

      const heroEvents = heroResponse.data || [];
      console.log("Hero events data:", heroEvents);

      if (heroEvents.length === 0) {
        console.log("No hero events found, using fallback");
        setHeroSlides([
          {
            id: "1",
            title: "Discover Amazing Events",
            subtitle: "Find your next unforgettable experience",
            location: "Various Venues",
            date: "Coming Soon",
            price: "Starting Soon",
            image: "https://picsum.photos/1200/800?random=1",
            category: "Events",
            attendees: "Thousands",
            isLive: false,
          },
        ]);
      } else {
        // Transform events for slider
        const transformedEvents = heroEvents.map((event, index) => ({
          id: event.id,
          title: event.name,
          subtitle: event.description || `Experience ${event.name}`,
          location: `${event.venue}, ${event.city}`,
          date: new Date(event.eventDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: event.minPrice ? `From $${event.minPrice}` : "Price TBA",
          image:
            event.imageUrl ||
            `https://picsum.photos/1200/800?random=${index + 1}`,
          category: event.eventType || "Event",
          attendees: event.totalSeats
            ? `${event.totalSeats.toLocaleString()}+`
            : "TBA",
          isLive:
            new Date(event.eventDate) <=
            new Date(Date.now() + 24 * 60 * 60 * 1000), // Live if within 24 hours
        }));

        console.log("Transformed hero events:", transformedEvents);
        setHeroSlides(transformedEvents);
      }

      // Fetch live events (events happening soon or now)
      const liveResponse = await eventService.getEvents({
        limit: 3,
        sortBy: "eventDate",
        sortOrder: "asc",
      });
      console.log("Live events response:", liveResponse);

      const liveEventsData = liveResponse.data || [];
      console.log("Live events data:", liveEventsData);
      setLiveEvents(liveEventsData);

    } catch (error) {
      console.error("Error fetching events:", error);
      // Fallback to static slides if API fails
      setHeroSlides([
        {
          id: "1",
          title: "Discover Amazing Events",
          subtitle: "Find your next unforgettable experience",
          location: "Various Venues",
          date: "Coming Soon",
          price: "Starting Soon",
          image: "https://picsum.photos/1200/800?random=1",
          category: "Events",
          attendees: "Thousands",
          isLive: false,
        },
      ]);
      setLiveEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const eventCategories = [
    { id: "all", name: "All Events", icon: Globe, count: "2.8M" },
    { id: "concerts", name: "Concerts", icon: Music, count: "847K" },
    { id: "sports", name: "Sports", icon: Trophy, count: "623K" },
    { id: "theater", name: "Theater", icon: Theater, count: "234K" },
    { id: "comedy", name: "Comedy", icon: Mic, count: "156K" },
  ];

  const features = [
    {
      icon: Search,
      title: "Smart Event Discovery",
      description:
        "AI-powered search finds exactly what you're looking for with personalized recommendations.",
    },
    {
      icon: Zap,
      title: "Instant Ticket Matching",
      description:
        "Get matched with sellers in real-time. No more waiting or missing out on sold-out events.",
    },
    {
      icon: Shield,
      title: "Verified Tickets Only",
      description:
        "Every ticket is verified for authenticity. 100% secure transactions with buyer protection.",
    },
    {
      icon: DollarSign,
      title: "Dynamic Pricing",
      description:
        "Fair market pricing with real-time adjustments. Get the best deals on premium events.",
    },
  ];


  const stats = [
    { number: "2.8M+", label: "Events Listed", icon: Calendar },
    { number: "950K+", label: "Happy Customers", icon: Users },
    { number: "99.8%", label: "Success Rate", icon: CheckCircle },
    { number: "24/7", label: "Live Support", icon: Headphones },
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Event Organizer",
      content:
        "AutoMatch revolutionized how I sell tickets. The AI matching increased my sales by 340% in just 3 months.",
      avatar: "👨‍💼",
      rating: 5,
      verified: true,
    },
    {
      name: "Sarah Rodriguez",
      role: "Concert Enthusiast",
      content:
        "Found front-row seats to a sold-out show at face value! The platform's verification system is incredible.",
      avatar: "👩‍🎤",
      rating: 5,
      verified: true,
    },
    {
      name: "Mike Johnson",
      role: "Sports Fan",
      content:
        "Last-minute playoff tickets? No problem! Got seats 2 hours before the game. Game-changer for spontaneous fans.",
      avatar: "⚽",
      rating: 5,
      verified: true,
    },
  ];

  const organizerFeatures = [
    {
      icon: Target,
      title: "Smart Audience Targeting",
      description: "Reach the right buyers with AI-powered audience matching.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track sales performance and optimize pricing strategies.",
    },
    {
      icon: Bell,
      title: "Automated Notifications",
      description: "Keep attendees informed with smart communication tools.",
    },
    {
      icon: Smartphone,
      title: "Mobile-First Management",
      description: "Manage your events anywhere with our mobile app.",
    },
  ];

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Auto-advance slider
  useEffect(() => {
    if (heroSlides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroSlides.length]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
    );
  };

  const currentHeroSlide = heroSlides[currentSlide];

  // Handle "Get Tickets Now" click
  const handleGetTicketsClick = (eventId: string) => {
    if (!isAuthenticated) {
      // Store the intended destination in localStorage so we can redirect after login
      localStorage.setItem('redirectAfterLogin', `/buyer/dashboard?eventId=${eventId}`);
      // Redirect to login page
      navigate('/login');
    } else {
      // If user is authenticated, redirect to buyer dashboard with event ID
      navigate(`/buyer/dashboard?eventId=${eventId}`);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Clean background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white"></div>

      {/* Subtle cursor effect */}
      <div
        className="fixed pointer-events-none z-10 w-4 h-4 bg-blue-500/10 rounded-full blur-sm transition-all duration-300"
        style={{
          left: mousePosition.x - 8,
          top: mousePosition.y - 8,
          transform: "scale(1.2)",
        }}
      />

      {/* Hero Slider Section */}
      <section className="relative h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Dynamic Background Image */}
        {!loading && currentHeroSlide && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{
              backgroundImage: `url(${currentHeroSlide.image})`,
            }}
          >
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-indigo-900/30"></div>
          </div>
        )}

        {/* Fallback background for loading state */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-indigo-900/20"></div>
          </div>
        )}

        {/* Slider Navigation */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        </div>
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-blue-500" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading amazing events...</p>
            </div>
          ) : currentHeroSlide ? (
            <>
              {/* Live Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                <div className="flex items-center space-x-2">
                  {currentHeroSlide.isLive && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  <span className="text-white font-medium">
                    {currentHeroSlide.isLive ? "LIVE NOW" : "UPCOMING"}
                  </span>
                </div>
              </div>

              {/* Event Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-white/80 mb-6 leading-tight drop-shadow-lg">
                {currentHeroSlide?.title}
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                {currentHeroSlide?.subtitle}
              </p>

              {/* Event Details */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8 text-white/80">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{currentHeroSlide.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{currentHeroSlide.date}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{currentHeroSlide.attendees} attending</span>
                </div>
              </div>

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <div className="text-3xl font-bold text-white">
                  {currentHeroSlide.price}
                </div>
                <Button 
                  variant="secondary" 
                  size="xl" 
                  className="group"
                  onClick={() => handleGetTicketsClick(currentHeroSlide.id)}
                >
                  <Ticket className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                  Get Tickets Now
                  <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Discover Events
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Amazing events coming soon
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10 bg-white">
        {/* Stats Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by Millions
              </h2>
              <p className="text-xl text-gray-600">
                Join the world's largest event marketplace
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-20 bg-white">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
                <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  The Future of Event Discovery
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-center">
                Discover Events
                <span className="block text-blue-600">Like Never Before</span>
              </h1>

              <div className="max-w-3xl mx-auto text-center mb-12">
                <p className="text-xl text-gray-600">
                  Connect with millions of events worldwide. Buy, sell, and
                  trade tickets with
                  <span className="font-semibold text-blue-600">
                    {" "}
                    AI-powered matching
                  </span>
                  ,
                  <span className="font-semibold text-blue-600">
                    {" "}
                    verified authenticity
                  </span>
                  , and
                  <span className="font-semibold text-blue-600">
                    {" "}
                    instant delivery
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search events, artists, venues, or teams..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <Button variant="primary" className="rounded-lg px-6 py-2">
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/events">
                <Button variant="primary" size="lg" className="group">
                  <Calendar className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  Browse Events
                  <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="group">
                  <Play className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Live Events Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Live Events Right Now
                </h2>
                <p className="text-gray-600">
                  Don't miss out on these trending events
                </p>
              </div>
              <Link to="/events">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {liveEvents.map((event) => {
                const isLive = new Date(event.eventDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
                return (
                  <Card
                    key={event.id}
                    className="bg-white border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">
                          {event.eventType === 'CONCERT' ? '🎤' : 
                           event.eventType === 'SPORTS' ? '🏀' : 
                           event.eventType === 'THEATER' ? '🎭' : 
                           event.eventType === 'COMEDY' ? '🎭' : '🎟️'}
                        </div>
                        <div className="flex items-center gap-2">
                          {isLive && (
                            <div className="flex items-center px-2 py-1 bg-red-500 rounded-full">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                              <span className="text-white text-xs font-medium">
                                LIVE
                              </span>
                            </div>
                          )}
                          <span className="text-gray-500 text-sm">
                            {event.eventType || 'Event'}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">
                        {event.name}
                      </h3>
                      <div className="space-y-1 text-gray-600 text-sm mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{new Date(event.eventDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </div>
                        <div className="flex items-center">
                          <Ticket className="h-4 w-4 mr-2" />
                          <span className="font-semibold text-gray-900">
                            {event.minPrice ? `From $${event.minPrice}` : 'Price TBA'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Event Categories */}
        <section className="py-20 bg-white">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Explore by Category
              </h2>
              <p className="text-xl text-gray-600">
                Find exactly what you're looking for
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {eventCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`p-6 rounded-xl transition-all duration-300 text-center ${
                      activeCategory === category.id
                        ? "bg-blue-50 border-2 border-blue-200 text-blue-900"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700"
                    }`}
                  >
                    <Icon className="h-8 w-8 mx-auto mb-3" />
                    <h3 className="font-medium mb-1">{category.name}</h3>
                    <p className="text-sm opacity-75">{category.count}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose AutoMatch?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Advanced technology meets seamless user experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="bg-white border-gray-200 text-center"
                  >
                    <CardContent className="p-8">
                      <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Event Organizer Section */}
        <section className="py-20 bg-white">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Built for Event Organizers
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Powerful tools to manage, promote, and sell your events
                </p>

                <div className="space-y-6">
                  {organizerFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 space-x-4">
                  <Button variant="primary" size="lg">
                    Start Selling Events
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Event Dashboard
                    </h3>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Total Sales
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          $47,230
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Tickets Sold
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          1,247
                        </span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Active Events
                        </span>
                        <span className="text-2xl font-bold text-purple-600">
                          12
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by Millions
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of satisfied event-goers and organizers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white border-gray-200">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                      {testimonial.verified && (
                        <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-green-600 text-xs font-medium">
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to Experience Events
              <span className="block text-blue-400">Like Never Before?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Join millions of event enthusiasts who trust AutoMatch for
              seamless ticket discovery and secure transactions.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link to="/register">
                <Button variant="secondary" size="xl" className="group">
                  <Users className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/events">
                <Button
                  variant="outline"
                  size="xl"
                  className="group border-white/30 text-white hover:bg-white/10"
                >
                  <Search className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Browse Events
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-slate-300">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Free to Join</span>
              </div>
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 mr-2" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center justify-center">
                <Zap className="h-5 w-5 mr-2" />
                <span>Instant Matching</span>
              </div>
              <div className="flex items-center justify-center">
                <Headphones className="h-5 w-5 mr-2" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Full-Width Footer */}
      <footer className="bg-slate-800 text-white">
        <div className="py-16">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">AutoMatch</span>
                </div>
                <p className="text-slate-400 mb-6 max-w-md">
                  The world's most advanced event discovery platform. Connecting
                  millions of event enthusiasts with unforgettable experiences.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <Link
                      to="/events"
                      className="hover:text-white transition-colors"
                    >
                      Browse Events
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/sell"
                      className="hover:text-white transition-colors"
                    >
                      Sell Tickets
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/organizers"
                      className="hover:text-white transition-colors"
                    >
                      For Organizers
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/api"
                      className="hover:text-white transition-colors"
                    >
                      API
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <Link
                      to="/about"
                      className="hover:text-white transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/careers"
                      className="hover:text-white transition-colors"
                    >
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/help"
                      className="hover:text-white transition-colors"
                    >
                      Help
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 py-6">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-slate-400 mb-4 md:mb-0">
                © 2024 AutoMatch. All rights reserved.
              </div>
              <div className="flex space-x-6 text-slate-400">
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms
                </Link>
                <Link
                  to="/security"
                  className="hover:text-white transition-colors"
                >
                  Security
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
