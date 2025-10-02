import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  sales: {
    public: {
      startDateTime: string;
      startTBD: boolean;
      startTBA: boolean;
      endDateTime: string;
    };
  };
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
      dateTBD: boolean;
      dateTBA: boolean;
      timeTBA: boolean;
      noSpecificTime: boolean;
    };
    timezone: string;
    status: {
      code: string;
    };
  };
  classifications: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
    type: {
      id: string;
      name: string;
    };
  }>;
  promoter: {
    id: string;
    name: string;
    description: string;
  };
  promoters: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  info: string;
  pleaseNote: string;
  priceRanges: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  seatmap: {
    staticUrl: string;
  };
  accessibility: {
    ticketLimit: number;
    id: string;
  };
  ticketLimit: {
    id: string;
    info: string;
  };
  ageRestrictions: {
    legalAgeEnforced: boolean;
    id: string;
  };
  ticketing: {
    safeTix: {
      enabled: boolean;
      inAppOnlyEnabled: boolean;
    };
  };
  _links: {
    self: {
      href: string;
    };
    attractions: Array<{
      href: string;
    }>;
    venues: Array<{
      href: string;
    }>;
  };
  _embedded: {
    venues: Array<{
      name: string;
      type: string;
      id: string;
      test: boolean;
      url: string;
      locale: string;
      images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      postalCode: string;
      timezone: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
      };
      location: {
        longitude: string;
        latitude: string;
      };
      markets: Array<{
        name: string;
        id: string;
      }>;
      dmas: Array<{
        id: number;
      }>;
      upcomingEvents: {
        ticketmaster: number;
        _total: number;
        _filtered: number;
      };
      _links: {
        self: {
          href: string;
        };
      };
    }>;
    attractions: Array<{
      name: string;
      type: string;
      id: string;
      test: boolean;
      url: string;
      locale: string;
      externalLinks: {
        youtube: Array<{
          url: string;
        }>;
        twitter: Array<{
          url: string;
        }>;
        itunes: Array<{
          url: string;
        }>;
        lastfm: Array<{
          url: string;
        }>;
        facebook: Array<{
          url: string;
        }>;
        wiki: Array<{
          url: string;
        }>;
        musicbrainz: Array<{
          id: string;
        }>;
        homepage: Array<{
          url: string;
        }>;
      };
      images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      classifications: Array<{
        primary: boolean;
        segment: {
          id: string;
          name: string;
        };
        genre: {
          id: string;
          name: string;
        };
        subGenre: {
          id: string;
          name: string;
        };
        type: {
          id: string;
          name: string;
        };
      }>;
      upcomingEvents: {
        ticketmaster: number;
        _total: number;
        _filtered: number;
      };
      _links: {
        self: {
          href: string;
        };
      };
    }>;
  };
}

interface TicketmasterResponse {
  _embedded: {
    events: TicketmasterEvent[];
  };
  _links: {
    self: {
      href: string;
    };
    next?: {
      href: string;
    };
    prev?: {
      href: string;
    };
    first: {
      href: string;
    };
    last: {
      href: string;
    };
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

interface TicketmasterSearchParams {
  keyword?: string;
  countryCode?: string;
  city?: string;
  classificationName?: string;
  dmaId?: string;
  startDateTime?: string;
  endDateTime?: string;
  size?: number;
  page?: number;
  sort?: string;
  source?: string;
  includeTest?: string;
  includeTBD?: string;
  includeTBA?: string;
  segmentId?: string;
  genreId?: string;
  subGenreId?: string;
  typeId?: string;
  geoPoint?: string;
  radius?: string;
  unit?: string;
  locale?: string;
  marketId?: string;
  attractionId?: string;
  venueId?: string;
  promoterId?: string;
}

export class TicketmasterService {
  private readonly baseUrl = 'https://app.ticketmaster.com/discovery/v2';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('Ticketmaster API key not found in environment variables');
    }
  }

  async searchEvents(params: TicketmasterSearchParams = {}): Promise<TicketmasterResponse | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Ticketmaster API key is required');
      }

      // Add current events filter and other enhanced parameters
      const enhancedParams = {
        apikey: this.apiKey,
        includeTBD: 'yes',
        includeTBA: 'yes',
        includeTest: 'no',
        ...params,
        size: (params.size || 20).toString(),
        page: (params.page || 0).toString(),
      };

      // Don't automatically filter by date - let users specify if needed
      // This allows getting all events including past ones

      const searchParams = new URLSearchParams(enhancedParams);
      const url = `${this.baseUrl}/events.json?${searchParams}`;

      logger.info(`Fetching events from Ticketmaster: ${url.replace(this.apiKey, '[API_KEY]')}`);

      const response: AxiosResponse<TicketmasterResponse> = await axios.get(url, {
        timeout: 15000, // Increased timeout for more detailed requests
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SneatSnags/1.0',
        },
      });

      logger.info(`Ticketmaster API response: ${response.status} - Found ${response.data._embedded?.events?.length || 0} events`);

      return response.data;
    } catch (error: any) {
      if (error.response) {
        logger.error(`Ticketmaster API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);

        if (error.response.status === 401) {
          throw new Error('Invalid Ticketmaster API key');
        }
        if (error.response.status === 429) {
          throw new Error('Ticketmaster API rate limit exceeded');
        }
      } else if (error.request) {
        logger.error('Ticketmaster API network error:', error.message);
        throw new Error('Failed to connect to Ticketmaster API');
      } else {
        logger.error('Ticketmaster API unexpected error:', error.message);
        throw new Error('Unexpected error occurred while fetching events');
      }

      return null;
    }
  }

  /**
   * Get event images for a specific event
   */
  async getEventImages(eventId: string): Promise<Array<{ url: string; width: number; height: number; ratio: string; }> | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Ticketmaster API key is required');
      }

      const url = `${this.baseUrl}/events/${eventId}/images.json?apikey=${this.apiKey}`;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SneatSnags/1.0',
        },
      });

      return response.data.images || [];
    } catch (error: any) {
      logger.warn(`Failed to fetch images for event ${eventId}:`, error.message);
      return null;
    }
  }

  async getEventById(eventId: string): Promise<TicketmasterEvent | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Ticketmaster API key is required');
      }

      const url = `${this.baseUrl}/events/${eventId}.json?apikey=${this.apiKey}`;

      logger.info(`Fetching event details from Ticketmaster: ${eventId}`);

      const response: AxiosResponse<TicketmasterEvent> = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SneatSnags/1.0',
        },
      });

      logger.info(`Ticketmaster API response: ${response.status} - Event found: ${response.data.name}`);

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Event not found in Ticketmaster: ${eventId}`);
        return null;
      }

      logger.error('Error fetching event from Ticketmaster:', error.message);
      throw error;
    }
  }

  // Helper method to transform Ticketmaster event to our internal format
  transformEventToInternal(tmEvent: TicketmasterEvent): any {
    const venue = tmEvent._embedded?.venues?.[0];
    const attraction = tmEvent._embedded?.attractions?.[0];
    const classification = tmEvent.classifications?.[0];
    const priceRange = tmEvent.priceRanges?.[0];

    // Get the best image (prefer 16:9 ratio, then highest resolution)
    const bestImage = this.getBestEventImage(tmEvent.images);

    // Calculate total capacity from venue information
    const totalCapacity = venue?.upcomingEvents?._total || 0;

    // Get all price ranges for better price information
    const allPriceRanges = tmEvent.priceRanges || [];
    const minPrice = allPriceRanges.length > 0 ? Math.min(...allPriceRanges.map(p => p.min)) : 0;
    const maxPrice = allPriceRanges.length > 0 ? Math.max(...allPriceRanges.map(p => p.max)) : 0;

    // Format event description with additional info
    const description = this.formatEventDescription(tmEvent);

    // Get venue location details
    const venueLocation = venue ? {
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
      postalCode: venue.postalCode || '',
      timezone: venue.timezone || tmEvent.dates.timezone || 'America/New_York',
    } : null;

    return {
      name: tmEvent.name,
      description,
      venue: venue?.name || 'TBD',
      address: venue?.address?.line1 || '',
      city: venue?.city?.name || '',
      state: venue?.state?.stateCode || venue?.state?.name || '',
      country: venue?.country?.countryCode || 'US',
      postalCode: venue?.postalCode || '',
      eventDate: new Date(tmEvent.dates.start.dateTime || `${tmEvent.dates.start.localDate}T${tmEvent.dates.start.localTime || '00:00:00'}`),
      eventType: classification?.type?.name || 'Event',
      category: classification?.genre?.name || classification?.segment?.name || 'General',
      subCategory: classification?.subGenre?.name || '',
      segment: classification?.segment?.name || '',
      genre: classification?.genre?.name || '',
      minPrice,
      maxPrice,
      currency: priceRange?.currency || 'USD',
      totalSeats: totalCapacity,
      availableSeats: totalCapacity, // Assume all available for now
      ticketmasterId: tmEvent.id,
      ticketmasterUrl: tmEvent.url,
      imageUrl: bestImage?.url || null,
      images: tmEvent.images || [],
      priceRanges: allPriceRanges,
      status: this.getEventStatus(tmEvent),
      isActive: true,
      timezone: tmEvent.dates.timezone || 'America/New_York',
      venueLocation,
      salesInfo: tmEvent.sales?.public ? {
        salesStart: tmEvent.sales.public.startDateTime,
        salesEnd: tmEvent.sales.public.endDateTime,
        salesStartTBD: tmEvent.sales.public.startTBD,
        salesStartTBA: tmEvent.sales.public.startTBA,
      } : null,
      dateInfo: {
        localDate: tmEvent.dates.start.localDate,
        localTime: tmEvent.dates.start.localTime,
        dateTime: tmEvent.dates.start.dateTime,
        dateTBD: tmEvent.dates.start.dateTBD,
        dateTBA: tmEvent.dates.start.dateTBA,
        timeTBA: tmEvent.dates.start.timeTBA,
        noSpecificTime: tmEvent.dates.start.noSpecificTime,
      },
      attractionInfo: attraction ? {
        id: attraction.id,
        name: attraction.name,
        upcomingEvents: attraction.upcomingEvents?._total || 0,
        externalLinks: attraction.externalLinks || {},
      } : null,
      externalSource: 'TICKETMASTER',
      externalId: tmEvent.id,
    };
  }

  // Helper method to get the best image for an event
  private getBestEventImage(images: Array<{ ratio: string; url: string; width: number; height: number; fallback: boolean; }> = []) {
    if (!images || images.length === 0) return null;

    // First try to find 16:9 ratio images (best for web display)
    const wideImages = images.filter(img => img.ratio === '16_9');
    if (wideImages.length > 0) {
      // Return the highest resolution 16:9 image
      return wideImages.reduce((prev, current) =>
        (prev.width * prev.height) > (current.width * current.height) ? prev : current
      );
    }

    // Fallback to highest resolution image
    return images.reduce((prev, current) =>
      (prev.width * prev.height) > (current.width * current.height) ? prev : current
    );
  }

  // Helper method to format event description
  private formatEventDescription(tmEvent: TicketmasterEvent): string {
    const parts = [];

    if (tmEvent.info) parts.push(tmEvent.info);
    if (tmEvent.pleaseNote) parts.push(`Please Note: ${tmEvent.pleaseNote}`);

    // Add accessibility info if available
    if (tmEvent.accessibility && 'info' in tmEvent.accessibility) {
      parts.push(`Accessibility: ${(tmEvent.accessibility as any).info}`);
    }

    return parts.join('\n\n') || 'Event details to be announced.';
  }

  // Helper method to determine event status
  private getEventStatus(tmEvent: TicketmasterEvent): string {
    const statusCode = tmEvent.dates?.status?.code;

    switch (statusCode) {
      case 'onsale': return 'ON_SALE';
      case 'offsale': return 'OFF_SALE';
      case 'cancelled': return 'CANCELLED';
      case 'postponed': return 'POSTPONED';
      case 'rescheduled': return 'RESCHEDULED';
      default: return 'ACTIVE';
    }
  }

  // Helper method to search by specific criteria
  async searchEventsByKeyword(keyword: string, options: {
    city?: string;
    state?: string;
    countryCode?: string;
    classificationName?: string;
    size?: number;
  } = {}): Promise<TicketmasterEvent[]> {
    const searchParams: TicketmasterSearchParams = {
      keyword,
      countryCode: options.countryCode || 'US',
      size: options.size || 50,
      sort: 'date,asc',
      includeTBD: 'yes',
      includeTBA: 'yes',
      includeTest: 'no',
      startDateTime: new Date().toISOString().split('.')[0] + 'Z', // Only current/future events
      ...options,
    };

    const response = await this.searchEvents(searchParams);
    return response?._embedded?.events || [];
  }

  // Helper method to get events by city
  async getEventsByCity(city: string, options: {
    countryCode?: string;
    classificationName?: string;
    size?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<TicketmasterEvent[]> {
    const searchParams: TicketmasterSearchParams = {
      city,
      countryCode: options.countryCode || 'US',
      size: options.size || 50,
      sort: 'date,asc',
      includeTBD: 'yes',
      includeTBA: 'yes',
      includeTest: 'no',
      startDateTime: options.startDate || new Date().toISOString().split('.')[0] + 'Z', // Default to current/future events
      endDateTime: options.endDate,
      classificationName: options.classificationName,
    };

    const response = await this.searchEvents(searchParams);
    return response?._embedded?.events || [];
  }

  // Helper method to get events by classification (music, sports, etc.)
  async getEventsByClassification(classificationName: string, options: {
    city?: string;
    state?: string;
    countryCode?: string;
    size?: number;
  } = {}): Promise<TicketmasterEvent[]> {
    const searchParams: TicketmasterSearchParams = {
      classificationName,
      countryCode: options.countryCode || 'US',
      size: options.size || 50,
      sort: 'date,asc',
      includeTBD: 'yes',
      includeTBA: 'yes',
      includeTest: 'no',
      startDateTime: new Date().toISOString().split('.')[0] + 'Z', // Only current/future events
      ...options,
    };

    const response = await this.searchEvents(searchParams);
    return response?._embedded?.events || [];
  }
}

export const ticketmasterService = new TicketmasterService();