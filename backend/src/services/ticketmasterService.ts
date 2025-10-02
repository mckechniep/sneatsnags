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

      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        ...params,
        size: (params.size || 20).toString(),
        page: (params.page || 0).toString(),
      });

      const url = `${this.baseUrl}/events.json?${searchParams}`;

      logger.info(`Fetching events from Ticketmaster: ${url.replace(this.apiKey, '[API_KEY]')}`);

      const response: AxiosResponse<TicketmasterResponse> = await axios.get(url, {
        timeout: 10000,
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

    return {
      name: tmEvent.name,
      description: tmEvent.info || tmEvent.pleaseNote || '',
      venue: venue?.name || 'TBD',
      address: venue?.address?.line1 || '',
      city: venue?.city?.name || '',
      state: venue?.state?.stateCode || venue?.state?.name || '',
      country: venue?.country?.countryCode || 'US',
      eventDate: new Date(tmEvent.dates.start.dateTime || `${tmEvent.dates.start.localDate}T${tmEvent.dates.start.localTime || '00:00:00'}`),
      eventType: classification?.type?.name || 'Event',
      category: classification?.genre?.name || classification?.segment?.name || 'General',
      minPrice: priceRange?.min || 0,
      maxPrice: priceRange?.max || 0,
      currency: priceRange?.currency || 'USD',
      ticketmasterId: tmEvent.id,
      ticketmasterUrl: tmEvent.url,
      imageUrl: tmEvent.images?.[0]?.url || null,
      status: 'ACTIVE',
      isActive: true,
      timezone: tmEvent.dates.timezone || 'America/New_York',
      externalSource: 'TICKETMASTER',
      externalId: tmEvent.id,
    };
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
      startDateTime: options.startDate,
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
      ...options,
    };

    const response = await this.searchEvents(searchParams);
    return response?._embedded?.events || [];
  }
}

export const ticketmasterService = new TicketmasterService();