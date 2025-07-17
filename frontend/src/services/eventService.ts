import { apiClient } from "./api";
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventSearchQuery,
  EventStats,
  ApiResponse,
  PaginatedResponse,
  EventSection,
  EventFilters,
} from "../types/events";

// Event API Service Class
export class EventService {
  private readonly baseUrl = "/events";

  /**
   * Get events with filtering and pagination
   */
  async getEvents(
    query: EventSearchQuery = {}
  ): Promise<PaginatedResponse<Event>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Event>>(
        this.baseUrl,
        query
      );
      return response.data!;
    } catch (error) {
      throw this.handleError(error, "getEvents");
    }
  }

  /**
   * Get events silently (without showing loading states)
   */
  async getEventsSilent(
    params?: EventSearchQuery & EventFilters
  ): Promise<PaginatedResponse<Event>> {
    try {
      const response = await apiClient.getSilent<PaginatedResponse<Event>>(
        "/events",
        params
      );
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error, "getEventsSilent");
    }
  }

  /**
   * Get a single event by ID
   */
  async getEventById(id: string, includeStats = false): Promise<Event> {
    try {
      const params = includeStats ? { includeStats: "true" } : {};
      const response = await apiClient.get<ApiResponse<Event>>(
        `${this.baseUrl}/${id}`,
        params
      );

      // Backend returns { success: true, data: event, message: "Event retrieved" }
      // apiClient.get() returns the backend response directly, not the axios response
      // So response = { success: true, data: event, message: "Event retrieved" }
      if (!response.data) {
        throw new Error("Event not found");
      }

      return response.data as unknown as Event;
    } catch (error) {
      throw this.handleError(error, "getEventById");
    }
  }

  /**
   * Legacy method - redirect to getEventById
   */
  async getEvent(id: string): Promise<Event> {
    return this.getEventById(id);
  }

  /**
   * Create a new event
   */
  async createEvent(data: CreateEventRequest): Promise<Event> {
    try {
      console.log('CreateEvent request payload:', JSON.stringify(data, null, 2));
      
      const response = await apiClient.post<ApiResponse<Event>>(
        this.baseUrl,
        data
      );

      console.log('CreateEvent full response:', response);
      console.log('CreateEvent response.data:', response.data);

      // Handle different response formats the backend might return
      if (response.data?.data) {
        // Standard format: { success: true, data: event }
        return response.data.data;
      } else if (response.data && typeof response.data === 'object' && (response.data as any).id) {
        // Direct event object: { id: "...", name: "...", ... }
        return response.data as unknown as Event;
      } else if (response.data) {
        // Check if response.data itself contains the event
        console.log('Trying to parse response.data as event:', response.data);
        return response.data as unknown as Event;
      }

      throw new Error("Failed to create event - unexpected response format");
    } catch (error) {
      throw this.handleError(error, "createEvent");
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, data: UpdateEventRequest): Promise<Event> {
    try {
      console.log('UpdateEvent request:', { id, data });
      
      const response = await apiClient.put<ApiResponse<Event>>(
        `${this.baseUrl}/${id}`,
        data
      );

      console.log('UpdateEvent full response:', response);
      console.log('UpdateEvent response.data:', response.data);

      // Handle different response formats the backend might return
      if (response.data?.data) {
        // Standard format: { success: true, data: event }
        return response.data.data;
      } else if (response.data && typeof response.data === 'object' && (response.data as any).id) {
        // Direct event object: { id: "...", name: "...", ... }
        return response.data as unknown as Event;
      } else if (response.data) {
        // Check if response.data itself contains the event
        console.log('Trying to parse response.data as event:', response.data);
        return response.data as unknown as Event;
      }

      throw new Error("Failed to update event - unexpected response format");
    } catch (error) {
      throw this.handleError(error, "updateEvent");
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw this.handleError(error, "deleteEvent");
    }
  }

  /**
   * Search events
   */
  async searchEvents(
    query: string,
    filters: Partial<EventSearchQuery> = {}
  ): Promise<Event[]> {
    try {
      const params = { q: query, ...filters };
      const response = await apiClient.get<PaginatedResponse<Event>>(
        `${this.baseUrl}/search`,
        params
      );
      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, "searchEvents");
    }
  }

  /**
   * Get popular events
   */
  async getPopularEvents(limit = 10): Promise<Event[]> {
    try {
      const response = await apiClient.get<ApiResponse<Event[]>>(
        `${this.baseUrl}/popular`,
        { limit }
      );
      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, "getPopularEvents");
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(
    limit = 10,
    city?: string,
    state?: string
  ): Promise<Event[]> {
    try {
      const params = { limit, ...(city && { city }), ...(state && { state }) };
      const response = await apiClient.get<ApiResponse<Event[]>>(
        `${this.baseUrl}/upcoming`,
        params
      );
      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, "getUpcomingEvents");
    }
  }

  /**
   * Get event sections
   */
  async getEventSections(eventId: string): Promise<EventSection[]> {
    try {
      const response = await apiClient.get<ApiResponse<EventSection[]>>(
        `/events/${eventId}/sections`
      );
      return (response.data?.data || response.data || []) as EventSection[];
    } catch (error) {
      throw this.handleError(error, "getEventSections");
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<EventStats> {
    try {
      const response = await apiClient.get<ApiResponse<EventStats>>(
        `${this.baseUrl}/${eventId}/stats`
      );

      if (!response.data?.data) {
        throw new Error("Failed to get event statistics");
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "getEventStats");
    }
  }

  /**
   * Create event section
   */
  async createEventSection(
    eventId: string,
    sectionData: Omit<
      EventSection,
      "id" | "eventId" | "createdAt" | "updatedAt"
    >
  ): Promise<EventSection> {
    try {
      const response = await apiClient.post<ApiResponse<EventSection>>(
        `/events/${eventId}/sections`,
        sectionData
      );
      return (response.data?.data || response.data) as EventSection;
    } catch (error) {
      throw this.handleError(error, "createEventSection");
    }
  }

  /**
   * Update event section
   */
  async updateEventSection(
    sectionId: string,
    sectionData: Partial<EventSection>
  ): Promise<EventSection> {
    try {
      const response = await apiClient.put<ApiResponse<EventSection>>(
        `/events/sections/${sectionId}`,
        sectionData
      );
      return (response.data?.data || response.data) as EventSection;
    } catch (error) {
      throw this.handleError(error, "updateEventSection");
    }
  }

  /**
   * Delete event section
   */
  async deleteEventSection(sectionId: string): Promise<void> {
    try {
      await apiClient.delete(`/events/sections/${sectionId}`);
    } catch (error) {
      throw this.handleError(error, "deleteEventSection");
    }
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ status: string; timestamp: string }>
      >(`${this.baseUrl}/health/check`);
      return (
        response.data?.data || {
          status: "unknown",
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      throw this.handleError(error, "healthCheck");
    }
  }

  /**
   * Handle API errors and transform them into user-friendly messages
   */
  private handleError(error: unknown, operation: string): Error {
    console.error(`EventService.${operation} failed:`, error);
    
    // Log the full error response for debugging
    const fullError = error as any;
    console.error('Full error object:', fullError);
    
    if (fullError?.response) {
      console.error('Full error response:', {
        status: fullError.response.status,
        data: fullError.response.data,
        headers: fullError.response.headers,
        statusText: fullError.response.statusText
      });
    }

    // Extract error information from the response
    const errorData = fullError?.response?.data;
    const status = fullError?.response?.status;
    
    console.error('Extracted error data:', errorData);
    console.error('Extracted status:', status);

    // First check if we have a specific error message from the backend
    if (errorData?.message) {
      console.error('Backend error message:', errorData.message);
      return new EventServiceError(
        errorData.message,
        errorData.code || "BACKEND_ERROR",
        errorData,
        status,
        operation
      );
    }

    // Handle specific error types
    if (errorData?.success === false) {
      return new EventServiceError(
        errorData.error || "An error occurred",
        errorData.code || "UNKNOWN_ERROR",
        errorData.details,
        status,
        operation
      );
    }

    // Handle HTTP status codes
    switch (status) {
      case 400:
        console.error('400 validation error details:', errorData);
        let validationMessage = "Invalid request data";
        
        if (errorData?.error) {
          validationMessage = errorData.error;
        } else if (errorData?.message) {
          validationMessage = errorData.message;
        } else if (errorData?.details) {
          const details = Array.isArray(errorData.details) 
            ? errorData.details.map((d: any) => d.message || d.path || d).join(', ')
            : JSON.stringify(errorData.details);
          validationMessage = `Validation failed: ${details}`;
        } else if (errorData && typeof errorData === 'object') {
          // Handle field-specific validation errors like {imageUrl: ["Invalid image URL"]}
          const fieldErrors = Object.entries(errorData)
            .map(([field, messages]) => {
              const errorMessages = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${errorMessages}`;
            })
            .join('; ');
          validationMessage = `Validation failed: ${fieldErrors}`;
        }
        
        return new EventServiceError(
          validationMessage,
          "VALIDATION_ERROR",
          errorData,
          status,
          operation
        );
      case 401:
        return new EventServiceError(
          "Authentication required",
          "UNAUTHORIZED",
          null,
          status,
          operation
        );
      case 403:
        return new EventServiceError(
          "Insufficient permissions",
          "FORBIDDEN",
          null,
          status,
          operation
        );
      case 404:
        return new EventServiceError(
          "Resource not found",
          "NOT_FOUND",
          null,
          status,
          operation
        );
      case 409:
        return new EventServiceError(
          "Resource already exists or conflicts with existing data",
          "CONFLICT",
          errorData,
          status,
          operation
        );
      case 422:
        return new EventServiceError(
          "Validation failed",
          "VALIDATION_ERROR",
          errorData,
          status,
          operation
        );
      case 429:
        return new EventServiceError(
          "Rate limit exceeded. Please try again later.",
          "RATE_LIMIT_EXCEEDED",
          errorData,
          status,
          operation
        );
      case 500:
        return new EventServiceError(
          "Internal server error",
          "INTERNAL_SERVER_ERROR",
          null,
          status,
          operation
        );
      default:
        // Network or other errors
        if (
          (error as { code?: string; response?: unknown })?.code === "NETWORK_ERROR" ||
          !(error as { code?: string; response?: unknown })?.response
        ) {
          return new EventServiceError(
            "Network error. Please check your connection.",
            "NETWORK_ERROR",
            undefined,
            undefined,
            operation
          );
        }

        return new EventServiceError(
          (error as { message?: string })?.message || "An unexpected error occurred",
          "UNKNOWN_ERROR",
          undefined,
          status,
          operation
        );
    }
  }
}

// Custom Error Class for Event Service
export class EventServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
    public status?: number,
    public operation?: string
  ) {
    super(message);
    this.name = "EventServiceError";
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return (
      this.code === "VALIDATION_ERROR" || this.code === "EVENT_VALIDATION_ERROR"
    );
  }

  /**
   * Check if this is a permission error
   */
  isPermissionError(): boolean {
    return (
      this.code === "FORBIDDEN" ||
      this.code === "UNAUTHORIZED" ||
      this.code === "EVENT_PERMISSION_ERROR"
    );
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimitError(): boolean {
    return (
      this.code === "RATE_LIMIT_EXCEEDED" ||
      this.code === "EVENT_RATE_LIMIT_ERROR"
    );
  }

  /**
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR" || !this.status;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case "EVENT_VALIDATION_ERROR":
      case "VALIDATION_ERROR":
        return "Please check your input and try again.";
      case "EVENT_NOT_FOUND":
      case "NOT_FOUND":
        return "The requested event was not found.";
      case "EVENT_ALREADY_EXISTS":
      case "CONFLICT":
        return "An event with similar details already exists.";
      case "EVENT_PERMISSION_ERROR":
      case "FORBIDDEN":
        return "You do not have permission to perform this action.";
      case "UNAUTHORIZED":
        return "Please log in to continue.";
      case "RATE_LIMIT_EXCEEDED":
        return "Too many requests. Please wait a moment and try again.";
      case "NETWORK_ERROR":
        return "Network error. Please check your connection and try again.";
      case "SERVICE_UNAVAILABLE":
        return "Service is temporarily unavailable. Please try again later.";
      default:
        return this.message || "An unexpected error occurred.";
    }
  }

  /**
   * Get validation errors if available
   */
  getValidationErrors(): Array<{ field: string; message: string }> {
    if (!this.isValidationError() || !this.details) {
      return [];
    }

    if (Array.isArray(this.details)) {
      return this.details.map((error) => ({
        field: error.field || "unknown",
        message: error.message || "Invalid value",
      }));
    }

    return [];
  }
}

// Utility functions for error handling
export const isEventServiceError = (
  error: unknown
): error is EventServiceError => {
  return error instanceof EventServiceError;
};

export const handleEventServiceError = (
  error: unknown,
  fallbackMessage = "An error occurred"
): string => {
  if (isEventServiceError(error)) {
    return error.getUserMessage();
  }

  if ((error as Error)?.message) {
    return (error as Error).message;
  }

  return fallbackMessage;
};

// Create singleton instance
const eventServiceInstance = new EventService();

// Export singleton instance

// Legacy object export for backward compatibility
export const eventService = eventServiceInstance;

export default eventServiceInstance;
