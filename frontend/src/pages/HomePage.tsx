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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryEvents, setCategoryEvents] = useState<Event[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [insights, setInsights] = useState({
    totalEvents: 0,
    activeUsers: 0,
    avgPrice: 0,
    popularCategory: "Concerts",
    totalTicketsSold: 0,
    successRate: 0,
    totalRevenue: 0,
  });
  const [dynamicStats, setDynamicStats] = useState({
    totalEvents: 0,
    happyCustomers: 0,
    successRate: 98.5,
    avgResponseTime: "2.3min",
  });
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

      // Fetch featured events (popular events)
      try {
        const featuredResponse = await eventService.getEvents({
          limit: 8,
          sortBy: "eventDate",
          sortOrder: "asc",
        });
        setFeaturedEvents(featuredResponse.data || []);
      } catch (featuredError) {
        console.error("Error fetching featured events:", featuredError);
        setFeaturedEvents([]);
      }

      // Calculate dynamic statistics from actual data
      const allEventsResponse = await eventService.getEvents({
        limit: 1000, // Get a large sample to calculate accurate stats
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const allEventsData = allEventsResponse.data || [];

      // Calculate real statistics with proper error handling
      const totalEventsCount = Math.max(
        allEventsResponse.pagination?.total || allEventsData.length || 0,
        0
      );
      const eventsWithPrices = allEventsData.filter(
        (event) =>
          event.minPrice &&
          typeof event.minPrice === "number" &&
          event.minPrice > 0 &&
          event.minPrice < 10000 // Reasonable upper limit
      );
      const avgPrice =
        eventsWithPrices.length > 0
          ? Math.round(
              eventsWithPrices.reduce(
                (sum, event) => sum + (event.minPrice || 0),
                0
              ) / eventsWithPrices.length
            )
          : 75; // fallback for reasonable ticket price

      // Calculate category popularity with error handling
      const categoryCount = allEventsData.reduce((acc, event) => {
        const type = event?.eventType || "OTHER";
        if (typeof type === "string" && type.length > 0) {
          acc[type.toUpperCase()] = (acc[type.toUpperCase()] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const popularCategoryKey =
        Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "CONCERT";

      const popularCategoryName =
        {
          CONCERT: "Concerts",
          SPORTS: "Sports",
          THEATER: "Theater",
          COMEDY: "Comedy",
        }[popularCategoryKey] || "Concerts";

      // Estimate metrics based on real data with reasonable multipliers and bounds
      const avgCustomersPerEvent = Math.min(
        Math.max(totalEventsCount > 50 ? 45 : 25, 15),
        80
      );
      const avgTicketsPerEvent = Math.min(
        Math.max(totalEventsCount > 50 ? 120 : 80, 50),
        200
      );

      const estimatedCustomers = Math.max(
        Math.floor(totalEventsCount * avgCustomersPerEvent),
        1200
      );
      const estimatedTicketsSold = Math.max(
        Math.floor(totalEventsCount * avgTicketsPerEvent),
        3500
      );
      const estimatedRevenue = Math.max(
        Math.floor(estimatedTicketsSold * avgPrice),
        150000
      );

      // Set dynamic insights with logging for debugging
      const calculatedInsights = {
        totalEvents: totalEventsCount,
        activeUsers: estimatedCustomers,
        avgPrice: avgPrice,
        popularCategory: popularCategoryName,
        totalTicketsSold: estimatedTicketsSold,
        successRate: 98.7, // Can be calculated from actual transaction data if available
        totalRevenue: estimatedRevenue,
      };

      console.log("📊 Dynamic Statistics Calculated:", {
        rawEventCount: allEventsData.length,
        totalEvents: totalEventsCount,
        eventsWithPrices: eventsWithPrices.length,
        categoryBreakdown: categoryCount,
        calculatedInsights,
      });

      setInsights(calculatedInsights);

      // Set dynamic stats for the stats section
      setDynamicStats({
        totalEvents: totalEventsCount,
        happyCustomers: estimatedCustomers,
        successRate: 98.5,
        avgResponseTime: "2.3min", // This would come from support ticket data in real implementation
      });

      // Fetch actual event categories with real counts
      try {
        // Use the already fetched allEventsData to calculate category counts
        const allCount = totalEventsCount;
        const concertCount = categoryCount["CONCERT"] || 0;
        const sportsCount = categoryCount["SPORTS"] || 0;
        const theaterCount = categoryCount["THEATER"] || 0;
        const comedyCount = categoryCount["COMEDY"] || 0;

        setEventCategories([
          {
            id: "all",
            name: "All Events",
            icon: Globe,
            count: allCount > 0 ? `${allCount.toLocaleString()}` : "0",
          },
          {
            id: "concerts",
            name: "Concerts",
            icon: Music,
            count: concertCount > 0 ? `${concertCount.toLocaleString()}` : "0",
          },
          {
            id: "sports",
            name: "Sports",
            icon: Trophy,
            count: sportsCount > 0 ? `${sportsCount.toLocaleString()}` : "0",
          },
          {
            id: "theater",
            name: "Theater",
            icon: Theater,
            count: theaterCount > 0 ? `${theaterCount.toLocaleString()}` : "0",
          },
          {
            id: "comedy",
            name: "Comedy",
            icon: Mic,
            count: comedyCount > 0 ? `${comedyCount.toLocaleString()}` : "0",
          },
        ]);
      } catch (categoryError) {
        console.error("Error fetching event categories:", categoryError);
        // Set fallback counts based on reasonable estimates
        setEventCategories([
          { id: "all", name: "All Events", icon: Globe, count: "350+" },
          { id: "concerts", name: "Concerts", icon: Music, count: "125" },
          { id: "sports", name: "Sports", icon: Trophy, count: "89" },
          { id: "theater", name: "Theater", icon: Theater, count: "67" },
          { id: "comedy", name: "Comedy", icon: Mic, count: "43" },
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

      // Set fallback statistics even when API fails
      setDynamicStats({
        totalEvents: 450, // Conservative fallback
        happyCustomers: 15000,
        successRate: 98.2,
        avgResponseTime: "3.1min",
      });

      setInsights({
        totalEvents: 450,
        activeUsers: 15000,
        avgPrice: 75,
        popularCategory: "Concerts",
        totalTicketsSold: 48000,
        successRate: 98.2,
        totalRevenue: 3600000,
      });
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

  // Dynamic stats array that updates with real data
  const stats = [
    {
      number:
        dynamicStats.totalEvents > 0
          ? `${dynamicStats.totalEvents.toLocaleString()}+`
          : "Loading...",
      label: "Events Listed",
      icon: Calendar,
    },
    {
      number:
        dynamicStats.happyCustomers > 0
          ? `${Math.floor(dynamicStats.happyCustomers / 1000)}K+`
          : "Loading...",
      label: "Happy Customers",
      icon: Users,
    },
    {
      number: `${dynamicStats.successRate}%`,
      label: "Success Rate",
      icon: CheckCircle,
    },
    {
      number: dynamicStats.avgResponseTime || "24/7",
      label: "Avg Response Time",
      icon: Headphones,
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

  // Handle category selection and fetch events
  const handleCategoryClick = async (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      setCategoryEvents([]);
      return;
    }

    setSelectedCategory(categoryId);
    setCategoryLoading(true);

    try {
      let eventType: string | undefined;
      switch (categoryId) {
        case "concerts":
          eventType = "CONCERT";
          break;
        case "sports":
          eventType = "SPORTS";
          break;
        case "theater":
          eventType = "THEATER";
          break;
        case "comedy":
          eventType = "COMEDY";
          break;
        default:
          eventType = undefined;
      }

      const response = await eventService.getEvents({
        limit: 6,
        eventType,
        sortBy: "eventDate",
        sortOrder: "asc",
      });

      setCategoryEvents(response.data || []);
    } catch (error) {
      console.error("Error fetching category events:", error);
      setCategoryEvents([]);
    } finally {
      setCategoryLoading(false);
    }
  };

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
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Professional background with enhanced gradients */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 25%, #F7F7F7 50%, #FFFFFF 75%, #F0F3F7 100%)",
          zIndex: -50,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at top, rgba(59, 130, 246, 0.03) 0%, transparent 50%)",
            zIndex: -49,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at bottom right, rgba(124, 58, 237, 0.02) 0%, transparent 50%)",
            zIndex: -48,
          }}
        />
      </div>

      {/* Break out of Layout container for full-width sections */}
      <div style={{ position: "relative" }}>
        {/* Enhanced cursor effect */}
        <div
          style={{
            position: "fixed",
            pointerEvents: "none",
            zIndex: 50,
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
            width: "24px",
            height: "24px",
            background:
              "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.08) 50%, transparent 100%)",
            borderRadius: "50%",
            filter: "blur(2px)",
            transform: "scale(1.5)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Enhanced Hero Section - Professional Eventbrite Style */}
        <section
          style={{
            position: "relative",
            height: "clamp(600px, 70vh, 800px)",
            margin: "0 auto",
            maxWidth: "1400px",
            padding: "0 20px",
            marginBottom: "80px",
            borderRadius: "32px",
            overflow: "hidden",
            boxShadow:
              "0 25px 50px rgba(0, 0, 0, 0.08), 0 8px 25px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Professional Dynamic Background with Enhanced Overlays */}
          {!loading && currentHeroSlide && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${currentHeroSlide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Multiple layered overlays for depth */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(29, 53, 87, 0.85) 0%, rgba(69, 123, 157, 0.65) 40%, rgba(168, 218, 220, 0.45) 80%, rgba(247, 247, 247, 0.25) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 40%, rgba(0, 0, 0, 0.3) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.2) 70%)",
                }}
              />
            </div>
          )}

          {/* Enhanced loading background */}
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at top left, #1D3557 0%, #457B9D 35%, #A8DADC 70%, #FFFFFF 100%)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 40%, rgba(0, 0, 0, 0.2) 100%)",
                }}
              />
              {/* Animated shimmer effect */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Enhanced Professional Slider Navigation */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "32px",
              transform: "translateY(-50%)",
              zIndex: 20,
            }}
          >
            <button
              onClick={prevSlide}
              style={{
                padding: "16px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.1) translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)";
              }}
            >
              <ChevronLeft
                style={{ width: "20px", height: "20px", color: "white" }}
              />
            </button>
          </div>
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "32px",
              transform: "translateY(-50%)",
              zIndex: 20,
            }}
          >
            <button
              onClick={nextSlide}
              style={{
                padding: "16px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.1) translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)";
              }}
            >
              <ChevronRight
                style={{ width: "20px", height: "20px", color: "white" }}
              />
            </button>
          </div>

          {/* Enhanced Slide Indicators */}
          <div
            style={{
              position: "absolute",
              bottom: "32px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "12px",
              zIndex: 20,
              padding: "12px 20px",
              background: "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(8px)",
              borderRadius: "25px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: index === currentSlide ? "32px" : "12px",
                  height: "12px",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    index === currentSlide
                      ? "linear-gradient(90deg, #FFFFFF 0%, #F0F3F7 100%)"
                      : "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: index === currentSlide ? "scale(1.1)" : "scale(1)",
                  boxShadow:
                    index === currentSlide
                      ? "0 4px 12px rgba(255, 255, 255, 0.3)"
                      : "none",
                }}
                onMouseEnter={(e) => {
                  if (index !== currentSlide) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== currentSlide) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              />
            ))}
          </div>

          {/* Professional Hero Content - Eventbrite Style */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 40px",
              textAlign: "center",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    border: "4px solid rgba(255, 255, 255, 0.2)",
                    borderTop: "4px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginBottom: "24px",
                  }}
                />
                <p
                  style={{
                    color: "white",
                    fontSize: "24px",
                    fontWeight: "600",
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  Discovering Amazing Events...
                </p>
              </div>
            ) : currentHeroSlide ? (
              <div style={{ width: "100%", maxWidth: "1000px" }}>
                {/* Enhanced Booking Badge */}
                <div style={{ marginBottom: "32px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      borderRadius: "50px",
                      background: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(12px)",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      color: "rgba(255, 255, 255, 0.95)",
                      fontSize: "14px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      boxShadow:
                        "0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Sparkles style={{ width: "18px", height: "18px" }} />
                    {currentSlide === 0
                      ? "🔥 Trending Now"
                      : currentSlide === 1
                      ? "⚡ Almost Sold Out"
                      : "✨ Featured Event"}
                  </span>
                </div>

                {/* Main Event Title */}
                <div style={{ position: "relative", marginBottom: "40px" }}>
                  {/* Glowing background effect */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "-20px",
                      background:
                        "linear-gradient(45deg, rgba(37, 99, 235, 0.3) 0%, rgba(124, 58, 237, 0.3) 30%, rgba(220, 38, 38, 0.3) 60%, rgba(245, 158, 11, 0.3) 100%)",
                      borderRadius: "32px",
                      filter: "blur(30px)",
                      animation: "pulse 4s ease-in-out infinite",
                    }}
                  />

                  <h1
                    style={{
                      position: "relative",
                      fontSize: "clamp(36px, 8vw, 72px)",
                      fontWeight: "900",
                      lineHeight: "1.1",
                      color: "#1D3557",
                      textShadow: "0 2px 8px rgba(29, 53, 87, 0.3)",
                      letterSpacing: "-0.02em",
                      marginBottom: "20px",
                    }}
                  >
                    {currentHeroSlide.title}
                  </h1>

                  <p
                    style={{
                      fontSize: "clamp(18px, 3vw, 28px)",
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.9)",
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                      marginBottom: "16px",
                      lineHeight: "1.4",
                    }}
                  >
                    {currentHeroSlide.subtitle}
                  </p>
                </div>

                {/* Event Details Cards */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                    marginBottom: "40px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    <MapPin style={{ width: "18px", height: "18px" }} />
                    {currentHeroSlide.location}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    <Calendar style={{ width: "18px", height: "18px" }} />
                    {currentHeroSlide.date}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      background:
                        "linear-gradient(135deg, rgba(168, 218, 220, 0.3) 0%, rgba(69, 123, 157, 0.3) 100%)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "20px",
                      border: "2px solid rgba(168, 218, 220, 0.4)",
                      color: "#FFFFFF",
                      fontSize: "16px",
                      fontWeight: "700",
                      boxShadow: "0 4px 16px rgba(168, 218, 220, 0.3)",
                    }}
                  >
                    <DollarSign style={{ width: "18px", height: "18px" }} />
                    {currentHeroSlide.price}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => navigate(`/events/${currentHeroSlide.id}`)}
                    style={{
                      padding: "16px 32px",
                      fontSize: "18px",
                      fontWeight: "700",
                      background:
                        "linear-gradient(135deg, #FFFFFF 0%, #F0F3F7 100%)",
                      color: "#2C2C2C",
                      border: "none",
                      borderRadius: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow:
                        "0 8px 32px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-3px) scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 40px rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 32px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    🎫 Get Tickets Now
                    <ArrowRight style={{ width: "20px", height: "20px" }} />
                  </button>

                  <button
                    onClick={() => navigate("/events")}
                    style={{
                      padding: "16px 32px",
                      fontSize: "18px",
                      fontWeight: "700",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backdropFilter: "blur(8px)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.2)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.3)";
                    }}
                  >
                    🌟 Explore More
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ width: "100%", maxWidth: "800px" }}>
                <div style={{ marginBottom: "32px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      borderRadius: "50px",
                      background: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(12px)",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      color: "rgba(255, 255, 255, 0.95)",
                      fontSize: "14px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    <Sparkles style={{ width: "18px", height: "18px" }} />✨
                    Discover Events
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: "clamp(36px, 8vw, 72px)",
                    fontWeight: "900",
                    lineHeight: "1.1",
                    color: "#1D3557",
                    letterSpacing: "-0.02em",
                    marginBottom: "40px",
                  }}
                >
                  Amazing Events Await
                </h1>
              </div>
            )}
          </div>
        </section>
        {/* Enhanced Stats Section - Professional Eventbrite Style */}
        <section
          style={{
            padding: "120px 0",
            background:
              "linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 25%, #F7F7F7 50%, #FFFFFF 75%, #F0F3F7 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decorative elements */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              left: "-100px",
              width: "300px",
              height: "300px",
              background:
                "linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(124, 58, 237, 0.05))",
              borderRadius: "50%",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-150px",
              right: "-150px",
              width: "400px",
              height: "400px",
              background:
                "linear-gradient(135deg, rgba(220, 38, 38, 0.03), rgba(245, 158, 11, 0.03))",
              borderRadius: "50%",
              filter: "blur(80px)",
            }}
          />

          <div
            style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "50px",
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                  border: "2px solid rgba(37, 99, 235, 0.15)",
                  marginBottom: "32px",
                  backdropFilter: "blur(8px)",
                }}
              >
                <CheckCircle
                  style={{ width: "20px", height: "20px", color: "#1D3557" }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#1D3557",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Industry Leading Performance
                </span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(36px, 6vw, 56px)",
                  fontWeight: "900",
                  color: "#1D3557",
                  marginBottom: "24px",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.1",
                }}
              >
                🌟 Trusted by Millions Worldwide
              </h2>

              <p
                style={{
                  fontSize: "clamp(18px, 3vw, 24px)",
                  color: "#555555",
                  maxWidth: "800px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                  fontWeight: "500",
                }}
              >
                Join the world's most trusted event marketplace, powering
                magical connections between event organizers and attendees
                globally
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "40px",
                alignItems: "center",
              }}
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const gradients = [
                  "linear-gradient(135deg, #1D3557 0%, #457B9D 100%)",
                  "linear-gradient(135deg, #457B9D 0%, #A8DADC 100%)",
                  "linear-gradient(135deg, #457B9D 0%, #1D3557 100%)",
                  "linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)",
                ];
                const backgrounds = [
                  "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
                  "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)",
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)",
                ];
                const borderColors = [
                  "rgba(37, 99, 235, 0.15)",
                  "rgba(16, 185, 129, 0.15)",
                  "rgba(139, 92, 246, 0.15)",
                  "rgba(245, 158, 11, 0.15)",
                ];

                return (
                  <div
                    key={index}
                    style={{
                      textAlign: "center",
                      padding: "40px 32px",
                      background: backgrounds[index],
                      borderRadius: "24px",
                      border: `2px solid ${borderColors[index]}`,
                      backdropFilter: "blur(8px)",
                      boxShadow:
                        "0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-8px) scale(1.02)";
                      e.currentTarget.style.boxShadow =
                        "0 20px 40px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)";
                    }}
                  >
                    {/* Background glow effect */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-50%",
                        left: "-50%",
                        width: "200%",
                        height: "200%",
                        background: gradients[index],
                        borderRadius: "50%",
                        opacity: 0.02,
                        zIndex: 0,
                      }}
                    />

                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          margin: "0 auto 24px",
                          background: gradients[index],
                          borderRadius: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 12px 40px ${borderColors[index]}, 0 4px 16px rgba(0, 0, 0, 0.05)`,
                          transition: "all 0.3s ease",
                        }}
                      >
                        <Icon
                          style={{
                            width: "40px",
                            height: "40px",
                            color: "white",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: "clamp(32px, 5vw, 48px)",
                          fontWeight: "900",
                          color:
                            index === 0
                              ? "#1D3557"
                              : index === 1
                              ? "#457B9D"
                              : index === 2
                              ? "#A8DADC"
                              : "#1D3557",
                          marginBottom: "16px",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {stat.number}
                      </div>

                      <div
                        style={{
                          fontSize: "16px",
                          color: "#555555",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Enhanced Search Section - Modern Professional Design */}
        <section
          style={{
            padding: "120px 0",
            background: "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Sophisticated background patterns */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(37, 99, 235, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(124, 58, 237, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.02) 0%, transparent 50%)
            `,
            }}
          />

          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "0 20px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 32px",
                  borderRadius: "50px",
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)",
                  border: "2px solid rgba(37, 99, 235, 0.1)",
                  marginBottom: "40px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(37, 99, 235, 0.1)",
                }}
              >
                <Sparkles
                  style={{ width: "24px", height: "24px", color: "#1D3557" }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1D3557",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  The Future of Event Discovery
                </span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(40px, 8vw, 80px)",
                  fontWeight: "900",
                  lineHeight: "1.1",
                  marginBottom: "40px",
                  letterSpacing: "-0.02em",
                }}
              >
                <span
                  style={{
                    color: "#1D3557",
                  }}
                >
                  Discover Events
                </span>
                <br />
                <span
                  style={{
                    color: "#1D3557",
                    position: "relative",
                  }}
                >
                  Like Never Before
                  {/* Underline decoration */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "80%",
                      height: "4px",
                      background:
                        "linear-gradient(90deg, #2563eb, #7c3aed, #dc2626)",
                      borderRadius: "2px",
                    }}
                  />
                </span>
              </h1>

              <div
                style={{
                  maxWidth: "900px",
                  margin: "0 auto",
                  marginBottom: "60px",
                }}
              >
                <p
                  style={{
                    fontSize: "clamp(18px, 3vw, 24px)",
                    color: "#555555",
                    lineHeight: "1.6",
                    fontWeight: "500",
                  }}
                >
                  Connect with millions of events worldwide. Experience seamless
                  ticket discovery with{" "}
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#1D3557",
                    }}
                  >
                    AI-powered matching
                  </span>
                  ,{" "}
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#457B9D",
                    }}
                  >
                    verified authenticity
                  </span>
                  , and{" "}
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#1D3557",
                    }}
                  >
                    instant delivery
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Professional Search Bar */}
            <div
              style={{
                maxWidth: "800px",
                margin: "0 auto",
                marginBottom: "60px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                  borderRadius: "24px",
                  padding: "8px",
                  boxShadow:
                    "0 20px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                  border: "2px solid rgba(229, 231, 235, 0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "24px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                >
                  <Search
                    style={{
                      width: "24px",
                      height: "24px",
                      color: "#555555",
                      transition: "color 0.3s ease",
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search events, artists, venues, or teams..."
                  style={{
                    width: "100%",
                    paddingLeft: "64px",
                    paddingRight: "160px",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "18px",
                    color: "#2C2C2C",
                    outline: "none",
                    fontWeight: "500",
                  }}
                  onFocus={(e) => {
                    const searchIcon =
                      e.currentTarget.parentElement?.querySelector("div svg");
                    if (searchIcon) {
                      (searchIcon as HTMLElement).style.color = "#1D3557";
                    }
                    e.currentTarget.parentElement!.style.borderColor =
                      "rgba(37, 99, 235, 0.3)";
                    e.currentTarget.parentElement!.style.boxShadow =
                      "0 20px 40px rgba(37, 99, 235, 0.1), 0 4px 16px rgba(37, 99, 235, 0.08)";
                  }}
                  onBlur={(e) => {
                    const searchIcon =
                      e.currentTarget.parentElement?.querySelector("div svg");
                    if (searchIcon) {
                      (searchIcon as HTMLElement).style.color = "#555555";
                    }
                    e.currentTarget.parentElement!.style.borderColor =
                      "rgba(229, 231, 235, 0.5)";
                    e.currentTarget.parentElement!.style.boxShadow =
                      "0 20px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <button
                    style={{
                      padding: "12px 28px",
                      fontSize: "16px",
                      fontWeight: "700",
                      background:
                        "linear-gradient(135deg, #1D3557 0%, #A8DADC 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-2px) scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 40px rgba(37, 99, 235, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 32px rgba(37, 99, 235, 0.3)";
                    }}
                  >
                    🔍 Search
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Link to="/events" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "20px 40px",
                    fontSize: "18px",
                    fontWeight: "700",
                    background:
                      "linear-gradient(135deg, #1D3557 0%, #A8DADC 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow:
                      "0 12px 40px rgba(37, 99, 235, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)",
                    minWidth: "220px",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-4px) scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 60px rgba(37, 99, 235, 0.4), 0 8px 32px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(37, 99, 235, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  <Calendar style={{ width: "24px", height: "24px" }} />
                  🎉 Browse Events
                  <ArrowRight style={{ width: "20px", height: "20px" }} />
                </button>
              </Link>

              <Link to="/register" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "20px 40px",
                    fontSize: "18px",
                    fontWeight: "700",
                    background: "rgba(37, 99, 235, 0.05)",
                    color: "#1D3557",
                    border: "2px solid rgba(37, 99, 235, 0.2)",
                    borderRadius: "20px",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    backdropFilter: "blur(8px)",
                    minWidth: "220px",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(37, 99, 235, 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(37, 99, 235, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(37, 99, 235, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(37, 99, 235, 0.05)";
                    e.currentTarget.style.borderColor =
                      "rgba(37, 99, 235, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Play style={{ width: "24px", height: "24px" }} />
                  🚀 Start Selling
                </button>
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

        {/* Professional Featured Events Section */}
        <section
          style={{
            padding: "120px 0",
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 50%, #FFFFFF 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: "absolute",
              top: "-150px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "600px",
              background:
                "radial-gradient(circle, rgba(37, 99, 235, 0.03) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />

          <div
            style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 32px",
                  borderRadius: "50px",
                  background:
                    "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)",
                  border: "2px solid rgba(245, 158, 11, 0.1)",
                  marginBottom: "40px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(245, 158, 11, 0.1)",
                }}
              >
                <Star
                  style={{ width: "24px", height: "24px", color: "#A8DADC" }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1D3557",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Handpicked for You
                </span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(36px, 6vw, 56px)",
                  fontWeight: "900",
                  color: "#1D3557",
                  marginBottom: "24px",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.1",
                }}
              >
                ✨ Featured Events
              </h2>

              <p
                style={{
                  fontSize: "clamp(18px, 3vw, 22px)",
                  color: "#2C2C2C",
                  maxWidth: "700px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                  fontWeight: "500",
                }}
              >
                Don't miss these carefully selected events happening near you.
                Book your tickets before they sell out!
              </p>
            </div>

            {/* Featured Events Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "40px",
                marginBottom: "60px",
              }}
            >
              {featuredEvents.slice(0, 4).map((event, index) => {
                const gradients = [
                  "linear-gradient(135deg, #1D3557 0%, #A8DADC 100%)",
                  "linear-gradient(135deg, #457B9D 0%, #A8DADC 100%)",
                  "linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)",
                  "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                ];

                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{
                      background:
                        "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                      borderRadius: "24px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow:
                        "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.5)",
                      position: "relative",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-12px) scale(1.02)";
                      e.currentTarget.style.boxShadow =
                        "0 25px 50px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)";
                    }}
                  >
                    {/* Featured badge */}
                    {index === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "20px",
                          left: "20px",
                          padding: "8px 16px",
                          background: gradients[0],
                          color: "white",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          zIndex: 2,
                          backdropFilter: "blur(8px)",
                          boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        🌟 Featured
                      </div>
                    )}

                    {/* Event image */}
                    <div
                      style={{
                        height: "200px",
                        background: event.imageUrl
                          ? `linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%), url(${event.imageUrl})`
                          : gradients[index],
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {!event.imageUrl && (
                        <div
                          style={{
                            fontSize: "48px",
                            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))",
                          }}
                        >
                          {event.eventType === "CONCERT"
                            ? "🎤"
                            : event.eventType === "SPORTS"
                            ? "🏆"
                            : event.eventType === "THEATER"
                            ? "🎭"
                            : event.eventType === "COMEDY"
                            ? "🎙️"
                            : "🎫"}
                        </div>
                      )}

                      {/* Event type badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          padding: "6px 12px",
                          background: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {event.eventType || "EVENT"}
                      </div>
                    </div>

                    {/* Event content */}
                    <div style={{ padding: "24px" }}>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#2C2C2C",
                          marginBottom: "16px",
                          lineHeight: "1.3",
                        }}
                      >
                        {event.name}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginBottom: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            color: "#555555",
                          }}
                        >
                          <MapPin
                            style={{
                              width: "16px",
                              height: "16px",
                              color: "#A8DADC",
                            }}
                          />
                          <span>
                            {event.venue}, {event.city}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            color: "#555555",
                          }}
                        >
                          <Calendar
                            style={{
                              width: "16px",
                              height: "16px",
                              color: "#1D3557",
                            }}
                          />
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
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            background:
                              "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
                            borderRadius: "12px",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          <DollarSign
                            style={{
                              width: "16px",
                              height: "16px",
                              color: "#457B9D",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#1D3557",
                            }}
                          >
                            {event.minPrice
                              ? `From $${event.minPrice}`
                              : "Price TBA"}
                          </span>
                        </div>

                        <button
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            fontWeight: "600",
                            background: gradients[index],
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Get Tickets
                          <ArrowRight
                            style={{ width: "14px", height: "14px" }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View all events CTA */}
            <div style={{ textAlign: "center" }}>
              <Link to="/events" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "20px 40px",
                    fontSize: "18px",
                    fontWeight: "700",
                    background:
                      "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)",
                    color: "#1D3557",
                    border: "2px solid rgba(37, 99, 235, 0.2)",
                    borderRadius: "20px",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 8px 32px rgba(37, 99, 235, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)";
                    e.currentTarget.style.borderColor =
                      "rgba(37, 99, 235, 0.3)";
                    e.currentTarget.style.transform =
                      "translateY(-3px) scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(37, 99, 235, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)";
                    e.currentTarget.style.borderColor =
                      "rgba(37, 99, 235, 0.2)";
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(37, 99, 235, 0.1)";
                  }}
                >
                  <Globe style={{ width: "24px", height: "24px" }} />
                  🌍 View All Events
                  <ArrowRight style={{ width: "20px", height: "20px" }} />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Event Categories Section */}
        <section
          style={{
            padding: "120px 0",
            background:
              "linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 50%, #F7F7F7 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative background elements */}
          <div
            style={{
              position: "absolute",
              top: "-200px",
              right: "-200px",
              width: "500px",
              height: "500px",
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.03), rgba(220, 38, 38, 0.03))",
              borderRadius: "50%",
              filter: "blur(100px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              left: "-100px",
              width: "300px",
              height: "300px",
              background:
                "linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(16, 185, 129, 0.04))",
              borderRadius: "50%",
              filter: "blur(80px)",
            }}
          />

          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "0 20px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 32px",
                  borderRadius: "50px",
                  background:
                    "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)",
                  border: "2px solid rgba(124, 58, 237, 0.1)",
                  marginBottom: "40px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(124, 58, 237, 0.1)",
                }}
              >
                <Globe
                  style={{ width: "24px", height: "24px", color: "#1D3557" }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1D3557",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Event Discovery Hub
                </span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(36px, 6vw, 56px)",
                  fontWeight: "900",
                  marginBottom: "24px",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.1",
                  color: "#1D3557",
                }}
              >
                🎆 Explore by Category
              </h2>

              <p
                style={{
                  fontSize: "clamp(18px, 3vw, 22px)",
                  color: "#2C2C2C",
                  maxWidth: "700px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                  fontWeight: "500",
                }}
              >
                Discover events tailored to your interests with our curated
                categories. Click any category to explore events instantly.
              </p>
            </div>

            {/* Professional Category Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "32px",
                marginBottom: selectedCategory ? "80px" : "0",
              }}
            >
              {eventCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                const gradients = {
                  all: "linear-gradient(135deg, #1D3557 0%, #457B9D 100%)",
                  concerts: "linear-gradient(135deg, #457B9D 0%, #A8DADC 100%)",
                  sports: "linear-gradient(135deg, #1D3557 0%, #A8DADC 100%)",
                  theater: "linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)",
                  comedy: "linear-gradient(135deg, #457B9D 0%, #1D3557 100%)",
                };
                const backgrounds = {
                  all: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                  concerts:
                    "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(190, 24, 93, 0.05) 100%)",
                  sports:
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)",
                  theater:
                    "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)",
                  comedy:
                    "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)",
                };

                return (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    style={{
                      padding: "32px 24px",
                      background: isSelected
                        ? gradients[category.id as keyof typeof gradients]
                        : backgrounds[category.id as keyof typeof backgrounds],
                      borderRadius: "24px",
                      border: isSelected
                        ? "3px solid rgba(255, 255, 255, 0.3)"
                        : "2px solid rgba(0, 0, 0, 0.05)",
                      cursor: "pointer",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                      backdropFilter: "blur(8px)",
                      boxShadow: isSelected
                        ? "0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.08)"
                        : "0 8px 32px rgba(0, 0, 0, 0.04)",
                      transform: isSelected
                        ? "translateY(-8px) scale(1.02)"
                        : "translateY(0) scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform =
                          "translateY(-4px) scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.06)";
                        e.currentTarget.style.borderColor =
                          "rgba(0, 0, 0, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 32px rgba(0, 0, 0, 0.04)";
                        e.currentTarget.style.borderColor =
                          "rgba(0, 0, 0, 0.05)";
                      }
                    }}
                  >
                    {/* Subtle glow effect for selected */}
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          inset: "-20px",
                          background:
                            gradients[category.id as keyof typeof gradients],
                          borderRadius: "32px",
                          opacity: 0.1,
                          filter: "blur(20px)",
                          zIndex: -1,
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        margin: "0 auto 24px",
                        background: isSelected
                          ? "rgba(255, 255, 255, 0.2)"
                          : gradients[category.id as keyof typeof gradients],
                        borderRadius: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                        boxShadow: isSelected
                          ? "0 8px 32px rgba(255, 255, 255, 0.2)"
                          : "0 8px 32px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isSelected ? (
                        <div style={{ fontSize: "28px" }}>
                          {category.id === "all"
                            ? "🌍"
                            : category.id === "concerts"
                            ? "🎤"
                            : category.id === "sports"
                            ? "🏆"
                            : category.id === "theater"
                            ? "🎭"
                            : category.id === "comedy"
                            ? "🎙️"
                            : "🎫"}
                        </div>
                      ) : (
                        <Icon
                          style={{
                            width: "40px",
                            height: "40px",
                            color: "white",
                          }}
                        />
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: isSelected ? "white" : "#2C2C2C",
                        marginBottom: "12px",
                        textShadow: isSelected
                          ? "0 2px 4px rgba(0, 0, 0, 0.2)"
                          : "none",
                      }}
                    >
                      {category.name}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        background: isSelected
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(0, 0, 0, 0.05)",
                        borderRadius: "12px",
                        backdropFilter: "blur(4px)",
                        margin: "0 auto",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: isSelected
                            ? "rgba(255, 255, 255, 0.9)"
                            : "#555555",
                        }}
                      >
                        {category.count}
                      </span>
                      {isSelected && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            background: "rgba(255, 255, 255, 0.7)",
                            borderRadius: "50%",
                            animation: "pulse 2s ease-in-out infinite",
                          }}
                        />
                      )}
                    </div>

                    {isSelected && (
                      <div
                        style={{
                          marginTop: "16px",
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.8)",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        ✨ Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Category Events Display */}
            {selectedCategory && (
              <div
                style={{
                  marginTop: "60px",
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                  borderRadius: "32px",
                  padding: "60px 40px",
                  boxShadow:
                    "0 25px 50px rgba(0, 0, 0, 0.08), 0 8px 25px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Section header */}
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                  <h3
                    style={{
                      fontSize: "clamp(24px, 4vw, 36px)",
                      fontWeight: "800",
                      color: "#1D3557",
                      marginBottom: "16px",
                    }}
                  >
                    {eventCategories.find((cat) => cat.id === selectedCategory)
                      ?.name || "Featured"}{" "}
                    Events
                  </h3>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#555555",
                      fontWeight: "500",
                    }}
                  >
                    Discover amazing events in this category
                  </p>
                </div>

                {/* Events grid or loading */}
                {categoryLoading ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "32px",
                    }}
                  >
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        style={{
                          height: "320px",
                          background:
                            "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                          borderRadius: "20px",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
                            animation: "shimmer 2s ease-in-out infinite",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : categoryEvents.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: "32px",
                    }}
                  >
                    {categoryEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/events/${event.id}`)}
                        style={{
                          background:
                            "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                          borderRadius: "20px",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
                          border: "1px solid rgba(0, 0, 0, 0.05)",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-8px) scale(1.02)";
                          e.currentTarget.style.boxShadow =
                            "0 20px 40px rgba(0, 0, 0, 0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 32px rgba(0, 0, 0, 0.06)";
                        }}
                      >
                        {/* Event image placeholder */}
                        <div
                          style={{
                            height: "200px",
                            background: event.imageUrl
                              ? `linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%), url(${event.imageUrl})`
                              : "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {!event.imageUrl && (
                            <div
                              style={{
                                fontSize: "48px",
                                filter:
                                  "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))",
                              }}
                            >
                              {event.eventType === "CONCERT"
                                ? "🎤"
                                : event.eventType === "SPORTS"
                                ? "🏆"
                                : event.eventType === "THEATER"
                                ? "🎭"
                                : event.eventType === "COMEDY"
                                ? "🎙️"
                                : "🎫"}
                            </div>
                          )}

                          {/* Event type badge */}
                          <div
                            style={{
                              position: "absolute",
                              top: "16px",
                              right: "16px",
                              padding: "6px 12px",
                              background: "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            {event.eventType || "EVENT"}
                          </div>
                        </div>

                        {/* Event details */}
                        <div style={{ padding: "24px" }}>
                          <h4
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color: "#2C2C2C",
                              marginBottom: "12px",
                              lineHeight: "1.3",
                            }}
                          >
                            {event.name}
                          </h4>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              marginBottom: "16px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#555555",
                              }}
                            >
                              <MapPin
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  color: "#A8DADC",
                                }}
                              />
                              <span>
                                {event.venue}, {event.city}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#555555",
                              }}
                            >
                              <Calendar
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  color: "#1D3557",
                                }}
                              />
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
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                background:
                                  "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
                                borderRadius: "12px",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              <DollarSign
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  color: "#457B9D",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "700",
                                  color: "#1D3557",
                                }}
                              >
                                {event.minPrice
                                  ? `From $${event.minPrice}`
                                  : "Price TBA"}
                              </span>
                            </div>

                            <button
                              style={{
                                padding: "8px 16px",
                                fontSize: "14px",
                                fontWeight: "600",
                                background:
                                  "linear-gradient(135deg, #1D3557 0%, #A8DADC 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              View Event
                              <ArrowRight
                                style={{ width: "14px", height: "14px" }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "#2C2C2C",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "64px",
                        marginBottom: "24px",
                        opacity: 0.5,
                      }}
                    >
                      🎭
                    </div>
                    <h4
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        marginBottom: "12px",
                        color: "#2C2C2C",
                      }}
                    >
                      No Events Found
                    </h4>
                    <p style={{ fontSize: "16px" }}>
                      We couldn't find any events in this category right now.
                      Check back soon!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Professional Insights Section */}
        <section
          style={{
            padding: "120px 0",
            background:
              "linear-gradient(135deg, #F7F7F7 0%, #F0F3F7 25%, #F7F7F7 50%, #FFFFFF 75%, #F7F7F7 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-200px",
              width: "500px",
              height: "500px",
              background:
                "radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-150px",
              left: "-150px",
              width: "400px",
              height: "400px",
              background:
                "radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />

          <div
            style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 32px",
                  borderRadius: "50px",
                  background:
                    "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)",
                  border: "2px solid rgba(34, 197, 94, 0.1)",
                  marginBottom: "40px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(34, 197, 94, 0.1)",
                }}
              >
                <BarChart3
                  style={{ width: "24px", height: "24px", color: "#457B9D" }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#457B9D",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Market Insights
                </span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(36px, 6vw, 56px)",
                  fontWeight: "900",
                  color: "#1D3557",
                  marginBottom: "24px",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.1",
                }}
              >
                📊 Event Industry Insights
              </h2>

              <p
                style={{
                  fontSize: "clamp(18px, 3vw, 22px)",
                  color: "#2C2C2C",
                  maxWidth: "800px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                  fontWeight: "500",
                }}
              >
                Real-time data and trends from our marketplace. See what's
                happening in the event industry right now.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "40px",
                marginBottom: "80px",
              }}
            >
              {/* Insight Cards */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                  borderRadius: "24px",
                  padding: "40px 32px",
                  boxShadow:
                    "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(8px)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Background glow */}
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%)",
                    borderRadius: "50%",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 24px",
                      background:
                        "linear-gradient(135deg, #1D3557 0%, #457B9D 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 12px 40px rgba(37, 99, 235, 0.3)",
                    }}
                  >
                    <Calendar
                      style={{ width: "40px", height: "40px", color: "white" }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(28px, 4vw, 40px)",
                      fontWeight: "900",
                      color: "#1D3557",
                      marginBottom: "12px",
                    }}
                  >
                    {insights.totalEvents > 0
                      ? `${insights.totalEvents.toLocaleString()}+`
                      : "Loading..."}
                  </div>

                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#2C2C2C",
                      marginBottom: "8px",
                    }}
                  >
                    Active Events
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#555555",
                      lineHeight: "1.5",
                    }}
                  >
                    Live events currently available on our platform
                  </p>
                </div>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                  borderRadius: "24px",
                  padding: "40px 32px",
                  boxShadow:
                    "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(8px)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(5, 150, 105, 0.02) 100%)",
                    borderRadius: "50%",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 24px",
                      background:
                        "linear-gradient(135deg, #457B9D 0%, #A8DADC 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 12px 40px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <Users
                      style={{ width: "40px", height: "40px", color: "white" }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(28px, 4vw, 40px)",
                      fontWeight: "900",
                      color: "#457B9D",
                      marginBottom: "12px",
                    }}
                  >
                    {insights.activeUsers > 0
                      ? `${Math.floor(insights.activeUsers / 1000)}K+`
                      : "Loading..."}
                  </div>

                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#2C2C2C",
                      marginBottom: "8px",
                    }}
                  >
                    Active Users
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#555555",
                      lineHeight: "1.5",
                    }}
                  >
                    Users actively buying and selling tickets
                  </p>
                </div>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                  borderRadius: "24px",
                  padding: "40px 32px",
                  boxShadow:
                    "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(8px)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "linear-gradient(135deg, rgba(245, 158, 11, 0.02) 0%, rgba(217, 119, 6, 0.02) 100%)",
                    borderRadius: "50%",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 24px",
                      background:
                        "linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 12px 40px rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <DollarSign
                      style={{ width: "40px", height: "40px", color: "white" }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(28px, 4vw, 40px)",
                      fontWeight: "900",
                      color: "#A8DADC",
                      marginBottom: "12px",
                    }}
                  >
                    {insights.avgPrice > 0
                      ? `$${insights.avgPrice}`
                      : "Loading..."}
                  </div>

                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#2C2C2C",
                      marginBottom: "8px",
                    }}
                  >
                    Average Price
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#555555",
                      lineHeight: "1.5",
                    }}
                  >
                    Average ticket price across all events
                  </p>
                </div>
              </div>

              {/* Additional Dynamic Metric - Total Tickets Sold */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F7F7F7 100%)",
                  borderRadius: "24px",
                  padding: "40px 32px",
                  boxShadow:
                    "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(8px)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(124, 58, 237, 0.02) 100%)",
                    borderRadius: "50%",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 24px",
                      background:
                        "linear-gradient(135deg, #457B9D 0%, #1D3557 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 12px 40px rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    <Ticket
                      style={{ width: "40px", height: "40px", color: "white" }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(28px, 4vw, 40px)",
                      fontWeight: "900",
                      color: "#1D3557",
                      marginBottom: "12px",
                    }}
                  >
                    {insights.totalTicketsSold > 0
                      ? `${Math.floor(insights.totalTicketsSold / 1000)}K+`
                      : "Loading..."}
                  </div>

                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#2C2C2C",
                      marginBottom: "8px",
                    }}
                  >
                    Tickets Sold
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#555555",
                      lineHeight: "1.5",
                    }}
                  >
                    Total tickets sold across all events
                  </p>
                </div>
              </div>
            </div>

            {/* Trending Category Highlight */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #1D3557 0%, #457B9D 40%, #A8DADC 80%, rgba(168, 218, 220, 0.8) 100%)",
                borderRadius: "24px",
                padding: "48px 40px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 25px 50px rgba(37, 99, 235, 0.2)",
              }}
            >
              {/* Background pattern */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `
                  radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
                `,
                  zIndex: 0,
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 24px",
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "25px",
                    marginBottom: "24px",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Target
                    style={{ width: "20px", height: "20px", color: "white" }}
                  />
                  <span
                    style={{
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    🔥 Trending Now
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "clamp(24px, 4vw, 36px)",
                    fontWeight: "800",
                    color: "white",
                    marginBottom: "16px",
                    textShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {insights.popularCategory} are Hot Right Now! 🎤
                </h3>

                <p
                  style={{
                    fontSize: "18px",
                    color: "rgba(255, 255, 255, 0.9)",
                    marginBottom: "32px",
                    maxWidth: "600px",
                    margin: "0 auto 32px",
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  The most popular category this week with highest demand. Don't
                  miss out on these amazing events!
                </p>

                <button
                  onClick={() => handleCategoryClick("concerts")}
                  style={{
                    padding: "16px 32px",
                    fontSize: "18px",
                    fontWeight: "700",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "16px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(8px)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.3)";
                    e.currentTarget.style.transform =
                      "translateY(-3px) scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  🎵 Explore Concerts
                  <ArrowRight style={{ width: "20px", height: "20px" }} />
                </button>
              </div>
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

      {/* Enhanced CSS Animations and Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        /* Smooth scrolling for better UX */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #F7F7F7;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #1D3557, #457B9D);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #0F1C2E, #2C5F7A);
        }
        
        /* Focus states for accessibility */
        button:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.5) !important;
          outline-offset: 2px !important;
        }
        
        /* Responsive text scaling */
        @media (max-width: 768px) {
          .hero-title {
            font-size: clamp(24px, 6vw, 48px) !important;
          }
          .hero-subtitle {
            font-size: clamp(16px, 4vw, 20px) !important;
          }
        }
      `}</style>
    </div>
  );
};
