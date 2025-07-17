import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { adminService } from "../../services/adminService";
import { eventService } from "../../services/eventService";
import { SweetAlert } from "../../utils/sweetAlert";
import type {
  Event,
  CreateEventRequest,
  EventType,
  EventSection,
} from "../../types/events";
import CreateEventForm from "../../components/admin/CreateEventForm";

interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  activeEvents: number;
  completedEvents: number;
  totalRevenue: number;
  averageTicketPrice: number;
  totalAttendees: number;
}

interface EventFilters {
  search: string;
  eventType: string;
  status: string;
  city: string;
  state: string;
  dateFrom: string;
  dateTo: string;
  category: string;
}

interface EventFormData {
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  category: string;
  imageUrl: string;
  capacity: number;
  sections: SectionFormData[];
}

interface SectionFormData {
  name: string;
  description: string;
  seatCount: number;
  priceLevel: number;
  rowCount: number;
}

export const AdminEventsPage: React.FC = () => {
  // Add custom CSS for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
      }
      .animate-slideUp {
        animation: slideUp 0.3s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0; 
          transform: translateY(20px) scale(0.95); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1); 
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    search: "",
    eventType: "",
    status: "",
    city: "",
    state: "",
    dateFrom: "",
    dateTo: "",
    category: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllEvents({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      setEvents(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch events:", error);
      SweetAlert.error("Failed to load events", "Please try again");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [fetchEvents]);

  const fetchStats = async () => {
    try {
      // Get real event statistics from backend
      const dashboardData = await adminService.getDashboard();
      const eventData = dashboardData.events;
      const transactionData = dashboardData.transactions;

      const statsData: EventStats = {
        totalEvents: eventData.total || 0,
        upcomingEvents: eventData.upcoming || 0,
        activeEvents: eventData.active || 0,
        completedEvents:
          Math.max(
            0,
            eventData.total - eventData.upcoming - eventData.active
          ) || 0,
        totalRevenue: transactionData.revenue || 0,
        averageTicketPrice:
          transactionData.total > 0
            ? transactionData.revenue / transactionData.total
            : 0,
        totalAttendees: transactionData.completed || 0, // Assuming completed transactions = attendees
      };
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleCreateEvent = async (eventData: EventFormData) => {
    try {
      // Check authentication
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      // Map category to proper EventType
      const getEventTypeFromCategory = (category: string): string => {
        const categoryLower = category.toLowerCase();
        if (
          categoryLower.includes("musical") ||
          categoryLower.includes("theater") ||
          categoryLower.includes("theatre") ||
          categoryLower.includes("broadway")
        ) {
          return "THEATER";
        }
        if (
          categoryLower.includes("concert") ||
          categoryLower.includes("music") ||
          categoryLower.includes("band")
        ) {
          return "CONCERT";
        }
        if (
          categoryLower.includes("sport") ||
          categoryLower.includes("game") ||
          categoryLower.includes("football") ||
          categoryLower.includes("basketball")
        ) {
          return "SPORTS";
        }
        if (
          categoryLower.includes("comedy") ||
          categoryLower.includes("standup") ||
          categoryLower.includes("humor")
        ) {
          return "COMEDY";
        }
        return "OTHER";
      };

      // Validate basic requirements according to backend rules
      if (
        !eventData.name ||
        eventData.name.trim().length < 3 ||
        eventData.name.trim().length > 200
      ) {
        throw new Error("Event name must be between 3 and 200 characters long");
      }
      if (!eventData.date || !eventData.time) {
        throw new Error("Event date and time are required");
      }
      if (!eventData.venue?.trim()) {
        throw new Error("Venue is required");
      }
      if (!eventData.address?.trim()) {
        throw new Error("Address is required");
      }
      if (!eventData.city?.trim()) {
        throw new Error("City is required");
      }
      if (!eventData.state?.trim()) {
        throw new Error("State is required");
      }
      if (!eventData.zipCode?.trim()) {
        throw new Error("ZIP code is required");
      }
      if (eventData.sections.length === 0) {
        throw new Error("At least one section is required");
      }
      if (eventData.sections.length > 50) {
        throw new Error("Maximum 50 sections allowed");
      }

      // Validate that total section seats don't exceed event capacity
      const totalSectionSeats = eventData.sections.reduce(
        (sum: number, section: SectionFormData) =>
          sum + (section.seatCount || 0),
        0
      );
      
      if (eventData.capacity && totalSectionSeats > eventData.capacity) {
        throw new Error(`Total section seats (${totalSectionSeats}) cannot exceed event capacity (${eventData.capacity})`);
      }

      // Validate event date is in future and within 2 years
      const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
      const now = new Date();
      const twoYearsFromNow = new Date(
        now.getFullYear() + 2,
        now.getMonth(),
        now.getDate()
      );

      if (eventDateTime <= now) {
        throw new Error("Event date must be in the future");
      }
      if (eventDateTime > twoYearsFromNow) {
        throw new Error("Event date cannot be more than 2 years in the future");
      }

      // Validate description length
      if (eventData.description && eventData.description.trim().length > 2000) {
        throw new Error("Description cannot exceed 2000 characters");
      }

      // Transform sections to match backend structure
      const backendSections = eventData.sections.map((section) => {
        // Validate section name length
        if (
          !section.name?.trim() ||
          section.name.trim().length < 1 ||
          section.name.trim().length > 100
        ) {
          throw new Error(
            "Section name must be between 1 and 100 characters long"
          );
        }

        // Use seatCount directly
        const seatCount = section.seatCount || 0;
        const rowCount = section.rowCount || Math.max(1, Math.ceil(seatCount / 20)); // Use provided rowCount or calculate

        return {
          name: section.name.trim(),
          description: section.description?.trim() || undefined,
          rowCount,
          seatCount,
          priceLevel: section.priceLevel || 0,
        };
      });

      // Calculate pricing from sections using priceLevel
      const validPrices = eventData.sections
        .filter((s) => s.priceLevel !== undefined && s.priceLevel !== null && s.priceLevel >= 0)
        .map((s) => s.priceLevel);

      const minPrice =
        validPrices.length > 0
          ? Math.min(...validPrices)
          : undefined;
      const maxPrice =
        validPrices.length > 0
          ? Math.max(...validPrices)
          : undefined;

      // Use the event capacity or calculate from sections if not provided
      const totalSeats = eventData.capacity || eventData.sections.reduce(
        (sum: number, section: SectionFormData) =>
          sum + (section.seatCount || 0),
        0
      );

      // Prepare request data according to backend API format
      const requestData: CreateEventRequest = {
        name: eventData.name.trim(),
        description: eventData.description?.trim() || undefined,
        venue: eventData.venue.trim(),
        address: eventData.address.trim(),
        city: eventData.city.trim(),
        state: eventData.state.trim(),
        zipCode: eventData.zipCode.trim(),
        country: eventData.country?.trim() || "US",
        eventDate: eventDateTime.toISOString(),
        eventType: getEventTypeFromCategory(
          eventData.category || ""
        ) as EventType,
        category: eventData.category?.trim() || undefined,
        subcategory: undefined, // Add subcategory support if needed
        imageUrl:
          eventData.imageUrl && eventData.imageUrl.trim().length > 0 && eventData.imageUrl.length < 200 * 1024
            ? eventData.imageUrl.trim()
            : undefined,
        minPrice,
        maxPrice,
        totalSeats: totalSeats > 0 ? totalSeats : undefined,
        availableSeats: totalSeats > 0 ? totalSeats : undefined, // Initially all seats are available
        sections: backendSections,
      };

      console.log(
        "Sending request data:",
        JSON.stringify(requestData, null, 2)
      );
      console.log("Selected event:", selectedEvent);
      console.log("Is update operation:", !!selectedEvent);

      let result: Event;

      if (selectedEvent) {
        // Update existing event - backend handles sections in the same request
        result = await eventService.updateEvent(selectedEvent.id, requestData);
      } else {
        // Create new event with sections
        result = await eventService.createEvent(requestData);
      }

      console.log(
        selectedEvent
          ? "Event updated successfully:"
          : "Event created successfully:",
        result
      );

      // Close modal and reset state first (operation succeeded)
      setShowCreateModal(false);
      setSelectedEvent(null);

      // Show success message immediately
      SweetAlert.success(
        selectedEvent ? "Event Updated!" : "Event Created!",
        selectedEvent
          ? "The event has been successfully updated."
          : "The event has been successfully created."
      );

      // Try to refresh data in background - don't fail the whole operation if this fails
      try {
        await fetchEvents();
        await fetchStats();
      } catch (refreshError) {
        console.warn("Failed to refresh data after event operation:", refreshError);
        // Don't show error to user since the main operation succeeded
      }
    } catch (error) {
      console.error("Error with event operation:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      SweetAlert.error(
        selectedEvent ? "Failed to update event" : "Failed to create event",
        errorMessage
      );
    }
  };

  const handleEditEvent = async (event: Event) => {
    try {
      // Fetch full event details including sections
      const fullEvent = await eventService.getEventById(event.id);
      console.log('Full event data for editing:', fullEvent);
      
      setSelectedEvent(fullEvent);
      setShowCreateModal(true);
    } catch (error) {
      console.error('Error fetching event details:', error);
      SweetAlert.error('Failed to load event details', 'Please try again');
    }
  };

  const deleteEvent = async (eventId: string) => {
    const confirmed = await SweetAlert.confirm(
      "Delete Event?",
      "This action cannot be undone. All associated data will be permanently deleted."
    );

    if (confirmed) {
      try {
        await eventService.deleteEvent(eventId);
        await fetchEvents();
        await fetchStats();
        SweetAlert.success(
          "Event deleted",
          "The event has been successfully deleted"
        );
      } catch (error) {
        console.error("Error deleting event:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete event";
        SweetAlert.error("Failed to delete event", errorMessage);
      }
    }
  };

  const exportEvents = async () => {
    try {
      SweetAlert.loading("Exporting events", "Please wait...");
      const result = await adminService.exportData({
        type: "events",
        ...filters,
      });
      SweetAlert.success("Export ready", "Events export is ready for download");
      window.open(result.url, "_blank");
    } catch {
      SweetAlert.error("Export failed", "Unable to export events");
    }
  };

  const bulkImportEvents = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,.xlsx";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          SweetAlert.loading("Importing events", "Please wait...");
          // Mock import - in real app, this would upload and process the file
          setTimeout(() => {
            SweetAlert.success(
              "Import completed",
              "Events have been successfully imported"
            );
            fetchEvents();
          }, 2000);
        }
      };
      input.click();
    } catch {
      SweetAlert.error("Import failed", "Unable to import events");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "upcoming":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "draft":
        return <Edit className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Event Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage platform events and venues
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={fetchEvents} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportEvents} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={bulkImportEvents} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats ? formatNumber(stats.totalEvents) : 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats ? formatNumber(stats.activeEvents) : 0} currently active
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Upcoming Events
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats ? formatNumber(stats.upcomingEvents) : 0}
              </p>
              <p className="text-sm text-green-600 mt-1">Next 30 days</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-yellow-900">
                {stats ? formatCurrency(stats.totalRevenue) : "$0"}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Avg: {stats ? formatCurrency(stats.averageTicketPrice) : "$0"}
                /ticket
              </p>
            </div>
            <div className="bg-yellow-200 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Total Attendees
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {stats ? formatNumber(stats.totalAttendees) : 0}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                All events combined
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-full">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, eventType: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="SPORTS">Sports</option>
              <option value="CONCERT">Concert</option>
              <option value="THEATER">Theater</option>
              <option value="COMEDY">Comedy</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              placeholder="City..."
              value={filters.city}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, city: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {events.map((event) => (
          <Card
            key={event.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-white opacity-50" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    "active"
                  )}`}
                >
                  {getStatusIcon("active")}
                  <span className="ml-1 capitalize">active</span>
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {event.category || "Event"}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {event.name}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {event.description}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="bg-blue-100 p-1 rounded-full mr-3">
                    <Calendar className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="font-medium">
                    {formatDate(event.eventDate)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="bg-green-100 p-1 rounded-full mr-3">
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="truncate">
                    {event.venue}, {event.city}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="bg-purple-100 p-1 rounded-full mr-3">
                    <Users className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="font-medium">
                    {event.totalSeats || 0} capacity
                  </span>
                </div>
                {(event.minPrice || event.maxPrice) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-yellow-100 p-1 rounded-full mr-3">
                      <DollarSign className="h-3 w-3 text-yellow-600" />
                    </div>
                    <span className="font-medium">
                      {formatCurrency(event.minPrice || 0)} -{" "}
                      {formatCurrency(event.maxPrice || 0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                    className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditEvent(event)}
                    className="hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-medium">
                    {event.sections?.length || 0} sections
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} events
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page * pagination.limit >= pagination.total}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
             style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setShowEventModal(false);
               }
             }}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent.name}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {selectedEvent.imageUrl && (
                    <img
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.name}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Description
                      </h4>
                      <p className="text-gray-700">
                        {selectedEvent.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Event Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>Category: {selectedEvent.category}</div>
                        <div>Date: {formatDate(selectedEvent.eventDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Venue Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium">
                          {selectedEvent.venue || "TBA"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedEvent.address || "TBA"}
                          <br />
                          {selectedEvent.city || "TBA"},{" "}
                          {selectedEvent.state || ""}{" "}
                          {selectedEvent.zipCode || ""}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          Capacity: {selectedEvent.totalSeats || 0}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Sections & Pricing
                      </h4>
                      <div className="space-y-2">
                        {selectedEvent.sections?.map(
                          (section: EventSection) => (
                            <div
                              key={section.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded"
                            >
                              <div>
                                <div className="font-medium">
                                  {section.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {section.seatCount || section.capacity} seats
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  Seats: {section.seatCount || section.capacity}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Active: {section.isActive ? "Yes" : "No"}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
             style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setShowCreateModal(false);
                 setSelectedEvent(null);
               }
             }}>
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent ? "Edit Event" : "Create Event"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <CreateEventForm
              event={selectedEvent}
              onSubmit={handleCreateEvent}
              onCancel={() => {
                setShowCreateModal(false);
                setSelectedEvent(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
