import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
//import { useAuth } from "../hooks/useAuth";
import { eventService } from "../services/eventService";
import {
  testimonialService,
  type Testimonial,
} from "../services/testimonialService";
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
  //const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventCategories, setEventCategories] = useState([
    { id: "all", name: "All Events", icon: Globe, count: "Loading..." },
    { id: "concerts", name: "Concerts", icon: Music, count: "Loading..." },
    { id: "sports", name: "Sports", icon: Trophy, count: "Loading..." },
    { id: "theater", name: "Theater", icon: Theater, count: "Loading..." },
    { id: "comedy", name: "Comedy", icon: Mic, count: "Loading..." },
  ]);

  // Fetch events for hero slider and live events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log("Fetching events and testimonials...");

      // Fetch hero events (upcoming events) - limit to 2 for slider
      const heroResponse = await eventService.getEvents({
        limit: 2,
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
            title: "Summer Music Festival 2024",
            subtitle: "The biggest music festival of the year",
            location: "Central Park, NYC",
            date: "Coming Soon",
            price: "Starting Soon",
            image: "https://picsum.photos/1200/800?random=1",
            category: "Concert",
            attendees: "50,000+",
            isLive: false,
          },
          {
            id: "2",
            title: "Championship Finals",
            subtitle: "Don't miss the ultimate showdown",
            location: "Madison Square Garden",
            date: "Next Weekend",
            price: "Starting at $89",
            image: "https://picsum.photos/1200/800?random=2",
            category: "Sports",
            attendees: "20,000+",
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

      // Fetch event categories with counts
      try {
        const [
          allEventsResponse,
          concertResponse,
          sportsResponse,
          theaterResponse,
          comedyResponse,
        ] = await Promise.all([
          eventService.getEvents({ limit: 1 }), // Get total count
          eventService.getEvents({ eventType: "CONCERT", limit: 1 }),
          eventService.getEvents({ eventType: "SPORTS", limit: 1 }),
          eventService.getEvents({ eventType: "THEATER", limit: 1 }),
          eventService.getEvents({ eventType: "COMEDY", limit: 1 }),
        ]);

        setEventCategories([
          {
            id: "all",
            name: "All Events",
            icon: Globe,
            count: allEventsResponse.data?.length
              ? `${Math.floor(allEventsResponse.data.length * 100)}+`
              : "0",
          },
          {
            id: "concerts",
            name: "Concerts",
            icon: Music,
            count: concertResponse.data?.length
              ? `${Math.floor(concertResponse.data.length * 50)}+`
              : "0",
          },
          {
            id: "sports",
            name: "Sports",
            icon: Trophy,
            count: sportsResponse.data?.length
              ? `${Math.floor(sportsResponse.data.length * 30)}+`
              : "0",
          },
          {
            id: "theater",
            name: "Theater",
            icon: Theater,
            count: theaterResponse.data?.length
              ? `${Math.floor(theaterResponse.data.length * 20)}+`
              : "0",
          },
          {
            id: "comedy",
            name: "Comedy",
            icon: Mic,
            count: comedyResponse.data?.length
              ? `${Math.floor(comedyResponse.data.length * 15)}+`
              : "0",
          },
        ]);
      } catch (categoryError) {
        console.error("Error fetching event categories:", categoryError);
        // Set fallback counts
        setEventCategories([
          { id: "all", name: "All Events", icon: Globe, count: "2.8M+" },
          { id: "concerts", name: "Concerts", icon: Music, count: "847K+" },
          { id: "sports", name: "Sports", icon: Trophy, count: "623K+" },
          { id: "theater", name: "Theater", icon: Theater, count: "234K+" },
          { id: "comedy", name: "Comedy", icon: Mic, count: "156K+" },
        ]);
      }

      // Fetch testimonials
      try {
        const testimonialsData =
          await testimonialService.getFeaturedTestimonials();
        console.log("Testimonials data:", testimonialsData);
        setTestimonials(testimonialsData || []);
      } catch (testimonialError) {
        console.error("Error fetching testimonials:", testimonialError);
        // Set fallback testimonials if API fails
        setTestimonials([
          {
            id: "1",
            name: "Alex Chen",
            role: "Event Organizer",
            content:
              "AutoMatch revolutionized how I sell tickets. The AI matching increased my sales by 340% in just 3 months.",
            avatar: "👨‍💼",
            rating: 5,
            isVerified: true,
            isFeatured: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Sarah Rodriguez",
            role: "Concert Enthusiast",
            content:
              "Found front-row seats to a sold-out show at face value! The platform's verification system is incredible.",
            avatar: "👩‍🎤",
            rating: 5,
            isVerified: true,
            isFeatured: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Mike Johnson",
            role: "Sports Fan",
            content:
              "Last-minute playoff tickets? No problem! Got seats 2 hours before the game. Game-changer for spontaneous fans.",
            avatar: "⚽",
            rating: 5,
            isVerified: true,
            isFeatured: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      // Fallback to static slides if API fails
      setHeroSlides([
        {
          id: "1",
          title: "Summer Music Festival 2024",
          subtitle: "The biggest music festival of the year",
          location: "Central Park, NYC",
          date: "Coming Soon",
          price: "Starting Soon",
          image: "https://picsum.photos/1200/800?random=1",
          category: "Concert",
          attendees: "50,000+",
          isLive: false,
        },
        {
          id: "2",
          title: "Championship Finals",
          subtitle: "Don't miss the ultimate showdown",
          location: "Madison Square Garden",
          date: "Next Weekend",
          price: "Starting at $89",
          image: "https://picsum.photos/1200/800?random=2",
          category: "Sports",
          attendees: "20,000+",
          isLive: false,
        },
      ]);
      setLiveEvents([]);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

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
  // const handleGetTicketsClick = (eventId: string) => {
  //   if (!isAuthenticated) {
  //     // Store the intended destination in localStorage so we can redirect after login
  //     localStorage.setItem(
  //       "redirectAfterLogin",
  //       `/buyer/dashboard?eventId=${eventId}`
  //     );
  //     // Redirect to login page
  //     navigate("/login");
  //   } else {
  //     // If user is authenticated, redirect to buyer dashboard with event ID
  //     navigate(`/buyer/dashboard?eventId=${eventId}`);
  //   }
  // };

  return (
    <div className="relative">
      {/* Professional background for full viewport coverage */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 -z-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/5 via-transparent to-transparent"></div>
      </div>

      {/* Break out of Layout container for full-width sections */}
      <div className="relative -mx-4 sm:-mx-6 md:-mx-16 xl:-mx-24">
        {/* Subtle cursor effect */}
        <div
          className="fixed pointer-events-none z-50 w-4 h-4 bg-blue-500/10 rounded-full blur-sm transition-all duration-300"
          style={{
            left: mousePosition.x - 8,
            top: mousePosition.y - 8,
            transform: "scale(1.2)",
          }}
        />

        {/* Hero Slider Section - Compact viewport width */}
        <section className="relative h-[27vh] mx-4 sm:mx-6 lg:mx-8 mt-6 mb-12 rounded-2xl overflow-hidden shadow-lg">
          {/* Dynamic Background Image */}
          {!loading && currentHeroSlide && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
              style={{
                backgroundImage: `url(${currentHeroSlide.image})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-blue-900/60"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          )}

          {/* Fallback background for loading state */}
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-blue-800">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
            </div>
          )}

          {/* Slider Navigation */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
            <button
              onClick={prevSlide}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
            <button
              onClick={nextSlide}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* Hero Content - Centered Event Display */}
          <div className="relative z-10 h-full flex items-center justify-center px-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white text-xl font-medium">
                  Loading upcoming events...
                </p>
              </div>
            ) : currentHeroSlide ? (
              <div className="text-center">
                {/* Creative Booking Prompt */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 font-medium text-sm uppercase tracking-wide">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {currentSlide === 0
                      ? "Hurry to Book"
                      : currentSlide === 1
                      ? "Almost Sold Out"
                      : "Book Now"}
                  </span>
                </div>

                {/* Event Name */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-2xl blur-xl transform scale-110 animate-pulse"></div>
                  <h2 className="relative text-3xl md:text-5xl font-black leading-tight drop-shadow-2xl font-serif italic tracking-wide">
                    <span className="relative z-10 inline-block px-6 py-3 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl text-white transform hover:scale-105 transition-transform duration-300">
                      {currentHeroSlide.title}
                    </span>
                  </h2>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-2xl blur-xl transform scale-110 animate-pulse"></div>
                  <h2 className="relative text-3xl md:text-5xl font-black leading-tight drop-shadow-2xl font-serif italic tracking-wide">
                    <span className="relative z-10 inline-block px-6 py-3 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl text-white transform hover:scale-105 transition-transform duration-300">
                      Discover Amazing Events
                    </span>
                  </h2>
                </div>
              </div>
            )}
          </div>
        </section>
        {/* Stats Section */}
        <section className="py-24 bg-gray-50 transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-semibold text-blue-800">
                  Industry Leading Performance
                </span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Trusted by Millions Worldwide
              </h2>
              <div className="flex justify-center">
                <p className="text-xl text-gray-600 max-w-3xl text-center">
                  Join the world's most trusted event marketplace, powering
                  connections between event organizers and attendees globally
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center group">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-3">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-24 bg-white relative overflow-hidden transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-50 border border-blue-100 mb-8 shadow-sm">
                <Sparkles className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-semibold text-blue-900">
                  The Future of Event Discovery
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 text-center leading-tight">
                Discover Events
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Like Never Before
                </span>
              </h1>

              <div className="max-w-4xl mx-auto text-center mb-16">
                <p className="text-xl text-gray-600 leading-relaxed text-center">
                  Connect with millions of events worldwide. Experience seamless
                  ticket discovery with
                  <span className="font-semibold text-blue-600 mx-1">
                    AI-powered matching
                  </span>
                  ,
                  <span className="font-semibold text-blue-600 mx-1">
                    verified authenticity
                  </span>
                  , and
                  <span className="font-semibold text-blue-600 mx-1">
                    instant delivery
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-16">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search events, artists, venues, or teams..."
                  className="w-full pl-16 pr-4 py-6 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Button
                    variant="primary"
                    className="rounded-xl px-8 py-3 shadow-lg hover:shadow-xl"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/events">
                <Button
                  variant="primary"
                  size="xl"
                  className="group shadow-lg hover:shadow-xl"
                >
                  <Calendar className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                  Browse Events
                  <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="outline"
                  size="xl"
                  className="group border-2 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Play className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Live Events Section */}
        <section className="py-24 bg-gray-100 transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-16">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                  <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                    Live Now
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Trending Events Right Now
                </h2>
                <p className="text-xl text-gray-600 text-center">
                  Don't miss out on these hot events happening today
                </p>
              </div>
              <Link to="/events">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 hover:border-blue-500 hover:bg-blue-50"
                >
                  View All Events
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {liveEvents.map((event) => {
                const isLive =
                  new Date(event.eventDate) <=
                  new Date(Date.now() + 24 * 60 * 60 * 1000);
                return (
                  <Card
                    key={event.id}
                    variant="elevated"
                    hover={true}
                    className="bg-white cursor-pointer group transition-all duration-300 hover:scale-105"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">
                          {event.eventType === "CONCERT"
                            ? "🎤"
                            : event.eventType === "SPORTS"
                            ? "🏀"
                            : event.eventType === "THEATER"
                            ? "🎭"
                            : event.eventType === "COMEDY"
                            ? "🎭"
                            : "🎟️"}
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
                            {event.eventType || "Event"}
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
                          <span>
                            {new Date(event.eventDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Ticket className="h-4 w-4 mr-2" />
                          <span className="font-semibold text-gray-900">
                            {event.minPrice
                              ? `From $${event.minPrice}`
                              : "Price TBA"}
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
        <section className="py-24 bg-white transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Explore by Category
              </h2>
              <div className="flex justify-center">
                <p className="text-xl text-gray-600 max-w-2xl text-center">
                  Discover events tailored to your interests with our curated
                  categories
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {eventCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.id}
                    className="w-32 h-32 mx-auto bg-white border border-gray-200 rounded-full transition-all duration-300 text-center flex flex-col items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 cursor-pointer p-4"
                  >
                    <Icon className="h-8 w-8 mb-2 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                    <h3 className="font-semibold text-sm text-gray-800 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs font-medium text-gray-500">
                      {category.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gray-50 relative transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-50 border border-blue-100 mb-8 shadow-sm">
                <Shield className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-semibold text-blue-900">
                  Enterprise-Grade Platform
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose AutoMatch?
              </h2>
              <div className="flex justify-center">
                <p className="text-xl text-gray-600 max-w-4xl leading-relaxed text-center">
                  Advanced technology meets seamless user experience to deliver
                  the world's most trusted event marketplace
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    variant="elevated"
                    hover={true}
                    className="bg-white text-center group transition-all duration-300 hover:scale-105"
                  >
                    <CardContent className="p-10">
                      <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-lg">
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
        <section className="py-24 bg-white relative overflow-hidden transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
                  <Target className="h-5 w-5 text-indigo-600 mr-3" />
                  <span className="text-sm font-semibold text-indigo-900">
                    For Event Professionals
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Built for Event Organizers
                </h2>
                <p className="text-xl text-gray-600 mb-10 leading-relaxed text-center">
                  Powerful tools to manage, promote, and sell your events with
                  enterprise-grade reliability
                </p>

                <div className="space-y-8">
                  {organizerFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start space-x-6 group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="primary"
                    size="xl"
                    className="shadow-lg hover:shadow-xl"
                  >
                    Start Selling Events
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="border-2 hover:border-blue-500 hover:bg-blue-50"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Event Dashboard
                    </h3>
                    <div className="flex space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                      <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                      <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                            Total Sales
                          </span>
                          <div className="text-3xl font-bold text-blue-900 mt-1">
                            $47,230
                          </div>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                            Tickets Sold
                          </span>
                          <div className="text-3xl font-bold text-green-900 mt-1">
                            1,247
                          </div>
                        </div>
                        <Ticket className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                            Active Events
                          </span>
                          <div className="text-3xl font-bold text-purple-900 mt-1">
                            12
                          </div>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gray-100 transition-all duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-green-50 border border-green-100 mb-8 shadow-sm">
                <Star className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-semibold text-green-900">
                  Customer Success Stories
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Trusted by Millions
              </h2>
              <div className="flex justify-center">
                <p className="text-lg text-gray-600 mb-12 max-w-2xl leading-relaxed text-center">
                  Join thousands of satisfied event-goers and organizers who
                  trust AutoMatch for their ticketing needs
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials?.map((testimonial, index) => (
                <Card
                  key={index}
                  variant="elevated"
                  hover={true}
                  className="bg-white group transition-all duration-300 hover:scale-105"
                >
                  <CardContent className="p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-6 w-6 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                      {testimonial.isVerified && (
                        <div className="flex items-center px-3 py-2 bg-green-50 rounded-full border border-green-100 shadow-sm">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-green-700 text-sm font-semibold">
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-8 italic text-lg">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl mr-4 shadow-lg">
                        {testimonial.avatar || "👤"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-600 font-medium">
                          {testimonial.role}
                          {testimonial.company
                            ? ` at ${testimonial.company}`
                            : ""}
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
        <section className="py-20 bg-white relative transition-all duration-500">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight text-gray-900">
              Ready to Experience Events
              <span className="block text-primary-600 mt-2">
                Like Never Before?
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed text-center">
              Join millions of event enthusiasts who trust SeatSnags for
              seamless ticket discovery, secure transactions, and unforgettable
              experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link to="/register">
                <Button
                  variant="primary"
                  size="xl"
                  className="group shadow-lg hover:shadow-xl"
                >
                  <Users className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/events">
                <Button
                  variant="outline"
                  size="xl"
                  className="group border-2 hover:border-primary-500 hover:bg-primary-50 shadow-lg"
                >
                  <Search className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Browse Events
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="font-medium text-gray-700">Free to Join</span>
              </div>
              <div className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <Shield className="h-5 w-5 mr-3 text-blue-500" />
                <span className="font-medium text-gray-700">100% Secure</span>
              </div>
              <div className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <Zap className="h-5 w-5 mr-3 text-yellow-500" />
                <span className="font-medium text-gray-700">
                  Instant Matching
                </span>
              </div>
              <div className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <Headphones className="h-5 w-5 mr-3 text-purple-500" />
                <span className="font-medium text-gray-700">24/7 Support</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
