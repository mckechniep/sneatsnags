import { apiClient } from './api';

export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime: string;
    };
  };
  classifications?: Array<{
    segment: { name: string };
    genre: { name: string };
    type: { name: string };
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city: { name: string };
      state: { name: string; stateCode: string };
      address: { line1: string };
    }>;
  };
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface TicketmasterSearchResponse {
  events: TicketmasterEvent[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface SearchEventsParams {
  keyword?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  classificationName?: string;
  size?: number;
  page?: number;
}

export interface ImportEventResponse {
  message: string;
  event: any;
  ticketmasterEvent: TicketmasterEvent;
}

export interface SyncEventsParams extends SearchEventsParams {
  autoImport?: boolean;
}

export interface SyncEventsResponse {
  message: string;
  events: TicketmasterEvent[];
  imported?: Array<{
    ticketmasterEvent: TicketmasterEvent;
    createdEvent: any;
  }>;
  errors?: Array<{
    eventId: string;
    error: string;
  }>;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export class TicketmasterService {
  /**
   * Search events from Ticketmaster
   */
  async searchEvents(params: SearchEventsParams = {}): Promise<TicketmasterSearchResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/ticketmaster/search?${searchParams}`);
    return response.data;
  }

  /**
   * Get a specific event by ID from Ticketmaster
   */
  async getEventById(eventId: string): Promise<TicketmasterEvent> {
    const response = await apiClient.get(`/ticketmaster/events/${eventId}`);
    return response.data;
  }

  /**
   * Search events by keyword
   */
  async searchEventsByKeyword(
    keyword: string,
    params: Omit<SearchEventsParams, 'keyword'> = {}
  ): Promise<{ keyword: string; events: TicketmasterEvent[]; count: number }> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/ticketmaster/search/keyword/${encodeURIComponent(keyword)}?${searchParams}`);
    return response.data;
  }

  /**
   * Get events by city
   */
  async getEventsByCity(
    city: string,
    params: Omit<SearchEventsParams, 'city'> = {}
  ): Promise<{ city: string; events: TicketmasterEvent[]; count: number }> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/ticketmaster/search/city/${encodeURIComponent(city)}?${searchParams}`);
    return response.data;
  }

  /**
   * Get events by classification (music, sports, etc.)
   */
  async getEventsByClassification(
    classification: string,
    params: Omit<SearchEventsParams, 'classificationName'> = {}
  ): Promise<{ classification: string; events: TicketmasterEvent[]; count: number }> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/ticketmaster/search/classification/${encodeURIComponent(classification)}?${searchParams}`);
    return response.data;
  }

  /**
   * Import a specific event from Ticketmaster to your database
   * Requires authentication
   */
  async importEvent(eventId: string): Promise<ImportEventResponse> {
    const response = await apiClient.post(`/ticketmaster/import/${eventId}`);
    return response.data;
  }

  /**
   * Import multiple events from Ticketmaster
   * Requires authentication
   */
  async importMultipleEvents(eventIds: string[]): Promise<{
    message: string;
    imported: Array<{
      eventId: string;
      ticketmasterEvent: TicketmasterEvent;
      createdEvent: any;
      status: string;
    }>;
    errors: Array<{
      eventId: string;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const response = await apiClient.post('/ticketmaster/import/multiple', { eventIds });
    return response.data;
  }

  /**
   * Sync events from Ticketmaster with optional auto-import
   * Requires authentication
   */
  async syncEvents(params: SyncEventsParams): Promise<SyncEventsResponse> {
    const response = await apiClient.post('/ticketmaster/sync', params);
    return response.data;
  }

  /**
   * Helper method to format event date
   */
  formatEventDate(event: TicketmasterEvent): string {
    const date = new Date(event.dates.start.dateTime || event.dates.start.localDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(event.dates.start.localTime && {
        hour: 'numeric',
        minute: '2-digit'
      })
    });
  }

  /**
   * Helper method to get event venue information
   */
  getEventVenue(event: TicketmasterEvent): {
    name: string;
    city: string;
    state: string;
    address: string;
  } | null {
    const venue = event._embedded?.venues?.[0];
    if (!venue) return null;

    return {
      name: venue.name,
      city: venue.city.name,
      state: venue.state.name,
      address: venue.address.line1,
    };
  }

  /**
   * Helper method to get event price range
   */
  getEventPriceRange(event: TicketmasterEvent): {
    min: number;
    max: number;
    currency: string;
  } | null {
    const priceRange = event.priceRanges?.[0];
    if (!priceRange) return null;

    return {
      min: priceRange.min,
      max: priceRange.max,
      currency: priceRange.currency,
    };
  }

  /**
   * Helper method to get event image
   */
  getEventImage(event: TicketmasterEvent, preferredWidth = 640): string | null {
    if (!event.images || event.images.length === 0) return null;

    // Find the image closest to the preferred width
    const sortedImages = event.images
      .filter(img => img.width > 0)
      .sort((a, b) => Math.abs(a.width - preferredWidth) - Math.abs(b.width - preferredWidth));

    return sortedImages[0]?.url || event.images[0]?.url || null;
  }

  /**
   * Helper method to get event classification
   */
  getEventClassification(event: TicketmasterEvent): {
    segment: string;
    genre: string;
    type: string;
  } | null {
    const classification = event.classifications?.[0];
    if (!classification) return null;

    return {
      segment: classification.segment.name,
      genre: classification.genre.name,
      type: classification.type.name,
    };
  }
}

export const ticketmasterService = new TicketmasterService();