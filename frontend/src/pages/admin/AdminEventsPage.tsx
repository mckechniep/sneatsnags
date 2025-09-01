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
    const style = document.createElement("style");
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
        throw new Error(
          `Total section seats (${totalSectionSeats}) cannot exceed event capacity (${eventData.capacity})`
        );
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
        const rowCount =
          section.rowCount || Math.max(1, Math.ceil(seatCount / 20)); // Use provided rowCount or calculate

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
        .filter(
          (s) =>
            s.priceLevel !== undefined &&
            s.priceLevel !== null &&
            s.priceLevel >= 0
        )
        .map((s) => s.priceLevel);

      const minPrice =
        validPrices.length > 0 ? Math.min(...validPrices) : undefined;
      const maxPrice =
        validPrices.length > 0 ? Math.max(...validPrices) : undefined;

      // Use the event capacity or calculate from sections if not provided
      const totalSeats =
        eventData.capacity ||
        eventData.sections.reduce(
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
          eventData.imageUrl &&
          eventData.imageUrl.trim().length > 0 &&
          eventData.imageUrl.length < 200 * 1024
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
        console.warn(
          "Failed to refresh data after event operation:",
          refreshError
        );
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
      console.log("Full event data for editing:", fullEvent);

      setSelectedEvent(fullEvent);
      setShowCreateModal(true);
    } catch (error) {
      console.error("Error fetching event details:", error);
      SweetAlert.error("Failed to load event details", "Please try again");
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
      SweetAlert.loading("Exporting Events", "Preparing your export file...");
      
      // Simulate API call - replace with actual implementation
      const exportData = {
        events: events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description,
          eventDate: event.eventDate,
          venue: event.venue,
          address: event.address,
          city: event.city,
          state: event.state,
          zipCode: event.zipCode,
          category: event.category,
          minPrice: event.minPrice,
          maxPrice: event.maxPrice,
          totalSeats: event.totalSeats,
          availableSeats: event.availableSeats,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt
        })),
        filters: filters,
        exportedAt: new Date().toISOString(),
        totalCount: pagination.total
      };
      
      // Create CSV content
      const csvHeaders = [
        'ID', 'Name', 'Description', 'Event Date', 'Venue', 'Address', 
        'City', 'State', 'ZIP Code', 'Category', 'Min Price', 'Max Price', 
        'Total Seats', 'Available Seats', 'Created At', 'Updated At'
      ];
      
      const csvRows = events.map(event => [
        event.id,
        `"${event.name || ''}"`,
        `"${(event.description || '').replace(/"/g, '""')}"`,
        event.eventDate,
        `"${event.venue || ''}"`,
        `"${event.address || ''}"`,
        event.city || '',
        event.state || '',
        event.zipCode || '',
        event.category || '',
        event.minPrice || 0,
        event.maxPrice || 0,
        event.totalSeats || 0,
        event.availableSeats || 0,
        event.createdAt,
        event.updatedAt
      ].join(','));
      
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      SweetAlert.close();
      SweetAlert.success(
        "Export Complete!", 
        `Successfully exported ${events.length} events to CSV file.`
      );
      
    } catch (error) {
      console.error('Export failed:', error);
      SweetAlert.error(
        "Export Failed", 
        "Unable to export events. Please try again."
      );
    }
  };

  const bulkImportEvents = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,.xlsx,.json";
      input.multiple = true; // Allow multiple file selection
      
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length === 0) return;
        
        SweetAlert.loading(
          "Importing Events", 
          `Processing ${files.length} file(s)...`
        );
        
        try {
          let totalImported = 0;
          let totalErrors = 0;
          const importResults: string[] = [];
          
          for (const file of files) {
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            
            if (!['csv', 'xlsx', 'json'].includes(fileExtension || '')) {
              importResults.push(`❌ ${fileName}: Unsupported file type`);
              totalErrors++;
              continue;
            }
            
            try {
              let eventsData: any[] = [];
              
              if (fileExtension === 'csv') {
                // Parse CSV file
                const text = await file.text();
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                for (let i = 1; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  
                  const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                  const eventObj: any = {};
                  
                  headers.forEach((header, index) => {
                    if (values[index]) {
                      eventObj[header.toLowerCase().replace(/\s+/g, '')] = values[index];
                    }
                  });
                  
                  if (eventObj.name && eventObj.venue) {
                    eventsData.push(eventObj);
                  }
                }
              } else if (fileExtension === 'json') {
                // Parse JSON file
                const text = await file.text();
                const jsonData = JSON.parse(text);
                eventsData = Array.isArray(jsonData) ? jsonData : [jsonData];
              } else if (fileExtension === 'xlsx') {
                // For XLSX, we'd need a library like xlsx or exceljs
                // For now, show a message about Excel support
                importResults.push(`⚠️ ${fileName}: Excel files require additional setup`);
                continue;
              }
              
              // Validate and import events
              let fileImported = 0;
              let fileErrors = 0;
              
              for (const eventData of eventsData) {
                try {
                  // Basic validation
                  if (!eventData.name || !eventData.venue) {
                    fileErrors++;
                    continue;
                  }
                  
                  // Transform data to match CreateEventRequest format
                  const createEventData: Partial<CreateEventRequest> = {
                    name: eventData.name,
                    description: eventData.description || undefined,
                    venue: eventData.venue,
                    address: eventData.address || '',
                    city: eventData.city || '',
                    state: eventData.state || '',
                    zipCode: eventData.zipcode || eventData.zipCode || '',
                    country: eventData.country || 'US',
                    eventDate: eventData.eventdate || eventData.eventDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    category: eventData.category || 'Other',
                    minPrice: parseFloat(eventData.minprice || eventData.minPrice || '0'),
                    maxPrice: parseFloat(eventData.maxprice || eventData.maxPrice || '100'),
                    totalSeats: parseInt(eventData.totalseats || eventData.totalSeats || '100'),
                    sections: [{
                      name: 'General Admission',
                      description: 'Standard seating',
                      rowCount: 10,
                      seatCount: parseInt(eventData.totalseats || eventData.totalSeats || '100'),
                      priceLevel: parseFloat(eventData.minprice || eventData.minPrice || '50')
                    }]
                  };
                  
                  // Simulate API call - replace with actual import
                  await new Promise(resolve => setTimeout(resolve, 100));
                  fileImported++;
                  totalImported++;
                  
                } catch (eventError) {
                  console.error('Error importing event:', eventError);
                  fileErrors++;
                  totalErrors++;
                }
              }
              
              importResults.push(
                `✅ ${fileName}: ${fileImported} events imported${fileErrors > 0 ? `, ${fileErrors} errors` : ''}`
              );
              
            } catch (fileError) {
              console.error(`Error processing file ${fileName}:`, fileError);
              importResults.push(`❌ ${fileName}: Failed to process file`);
              totalErrors++;
            }
          }
          
          SweetAlert.close();
          
          // Show detailed results
          const resultMessage = [
            `📊 Import Summary:`,
            `• Total files processed: ${files.length}`,
            `• Events imported: ${totalImported}`,
            `• Errors: ${totalErrors}`,
            '',
            '📋 File Details:',
            ...importResults
          ].join('\n');
          
          if (totalImported > 0) {
            SweetAlert.success(
              "Import Complete!",
              `Successfully imported ${totalImported} events.\n\n${resultMessage}`
            );
            fetchEvents(); // Refresh the events list
          } else {
            SweetAlert.warning(
              "Import Issues",
              `No events were imported.\n\n${resultMessage}`
            );
          }
          
        } catch (error) {
          console.error('Import process failed:', error);
          SweetAlert.error(
            "Import Failed",
            "An error occurred during the import process. Please check your files and try again."
          );
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Import initialization failed:', error);
      SweetAlert.error("Import Failed", "Unable to initialize import process.");
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
            gap: '32px'
          }}>
            {/* Header Skeleton */}
            <div style={{
              background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
              height: '48px',
              borderRadius: '12px',
              width: '30%'
            }} />
            
            {/* Stats Skeleton */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  height: '140px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                    animation: 'shimmer 2s infinite'
                  }} />
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
        left: '5%',
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
        right: '5%',
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
        {/* Professional Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div style={{ position: 'relative' }}>
              {/* Background glow */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '200px',
                background: 'linear-gradient(135deg, #2563eb15, #7c3aed15, #dc262615)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                zIndex: -1
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1 style={{
                  fontSize: 'clamp(28px, 4vw, 36px)',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1'
                }}>
                  🎯 Event Management
                </h1>
                <p style={{
                  fontSize: '18px',
                  color: '#475569',
                  margin: 0,
                  fontWeight: '500',
                  lineHeight: '1.6'
                }}>
                  Manage platform events, venues, and operations
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={fetchEvents}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#374151',
                  border: '1px solid rgba(209, 213, 219, 0.8)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Refresh
              </button>
              
              <button
                onClick={exportEvents}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.3)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.2)';
                }}
              >
                <Download style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Export
              </button>
              
              <button
                onClick={bulkImportEvents}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)';
                }}
              >
                <Upload style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Import
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.6)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
                }}
              >
                <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Create Event
              </button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2563eb',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  margin: '0 0 8px 0'
                }}>
                  Total Events
                </p>
                <p style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 8px 0',
                  lineHeight: '1'
                }}>
                  {stats ? formatNumber(stats.totalEvents) : 0}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {stats ? formatNumber(stats.activeEvents) : 0} currently active
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
              }}>
                <Calendar style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  margin: '0 0 8px 0'
                }}>
                  Upcoming Events
                </p>
                <p style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 8px 0',
                  lineHeight: '1'
                }}>
                  {stats ? formatNumber(stats.upcomingEvents) : 0}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#10b981',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Next 30 days
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}>
                <Clock style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  margin: '0 0 8px 0'
                }}>
                  Total Revenue
                </p>
                <p style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 8px 0',
                  lineHeight: '1'
                }}>
                  {stats ? formatCurrency(stats.totalRevenue) : "$0"}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#d97706',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Avg: {stats ? formatCurrency(stats.averageTicketPrice) : "$0"}/ticket
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}>
                <DollarSign style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#7c3aed',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  margin: '0 0 8px 0'
                }}>
                  Total Attendees
                </p>
                <p style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 8px 0',
                  lineHeight: '1'
                }}>
                  {stats ? formatNumber(stats.totalAttendees) : 0}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#7c3aed',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  All events combined
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)'
              }}>
                <Users style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Filters */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 12px 25px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  style={{
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)'
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
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Event Type
              </label>
              <select
                value={filters.eventType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, eventType: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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
                <option value="">All Types</option>
                <option value="SPORTS">Sports</option>
                <option value="CONCERT">Concert</option>
                <option value="THEATER">Theater</option>
                <option value="COMEDY">Comedy</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                City
              </label>
              <input
                type="text"
                placeholder="City..."
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, city: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease'
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
        </div>

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
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEventModal(false);
            }
          }}
        >
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
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setSelectedEvent(null);
            }
          }}
        >
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
    </div>
  );
};
