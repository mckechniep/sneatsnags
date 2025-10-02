import { Request, Response, NextFunction } from "express";
import { successResponse, errorResponse } from "../utils/response";
import { logger } from "../utils/logger";
import { ticketmasterService } from "../services/ticketmasterService";
import {
  getPaginationParams,
  createPaginationResult,
} from "../utils/pagination";
import { AuthenticatedRequest } from "../types/auth";

export const eventController = {
  // Get all events (public) - from Ticketmaster with comprehensive search criteria
  getEvents: async (req: Request, res: Response) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const {
        // Location filters
        city,
        state,
        countryCode,
        postalCode,
        radius,
        unit,
        dmaId,

        // Event classification filters
        eventType,
        category,
        segment,
        genre,
        subGenre,
        classificationName,
        segmentId,
        genreId,
        subGenreId,

        // Search and keyword
        search,
        keyword,

        // Date and time filters
        startDate,
        endDate,
        startDateTime,
        endDateTime,

        // Price filters
        minPrice,
        maxPrice,

        // Source and availability
        source,
        ageRestrictions,
        includeTBD,
        includeTBA,
        includeTest,

        // Venue and attraction filters
        venueId,
        attractionId,
        promoterId,

        // Sorting and display
        sort,
        sortOrder,
        locale,

        // Additional filters
        onSaleStartFrom,
        onSaleStartTo,
        onSaleEndFrom,
        onSaleEndTo,
      } = req.query;

      // Prepare Ticketmaster search parameters
      const searchParams: any = {
        countryCode: (countryCode as string) || 'US',
        size: limit,
        page: (page || 1) - 1, // TM uses 0-based pagination
        sort: (sort as string) || 'date,asc',
        includeTBD: (includeTBD as string) || 'yes',
        includeTBA: (includeTBA as string) || 'yes',
        includeTest: (includeTest as string) || 'no',
      };

      // Add search/keyword parameters
      if (search || keyword) {
        searchParams.keyword = (search || keyword) as string;
      }

      // Add location parameters
      if (city) searchParams.city = city as string;
      if (state) searchParams.stateCode = state as string;
      if (postalCode) searchParams.postalCode = postalCode as string;
      if (radius) searchParams.radius = radius as string;
      if (unit) searchParams.unit = unit as string; // miles or km
      if (dmaId) searchParams.dmaId = dmaId as string;

      // Add classification parameters
      if (eventType || classificationName) {
        searchParams.classificationName = (eventType || classificationName) as string;
      }
      if (segment) searchParams.segmentName = segment as string;
      if (genre) searchParams.genreName = genre as string;
      if (subGenre) searchParams.subGenreName = subGenre as string;
      if (segmentId) searchParams.segmentId = segmentId as string;
      if (genreId) searchParams.genreId = genreId as string;
      if (subGenreId) searchParams.subGenreId = subGenreId as string;

      // Add date/time parameters - default to current/future events only
      if (startDate) {
        searchParams.startDateTime = new Date(startDate as string).toISOString().split('.')[0] + 'Z';
      } else if (!startDateTime) {
        // Default: only show current and future events
        searchParams.startDateTime = new Date().toISOString().split('.')[0] + 'Z';
      }

      if (endDate) {
        searchParams.endDateTime = new Date(endDate as string).toISOString().split('.')[0] + 'Z';
      }
      if (startDateTime) {
        searchParams.startDateTime = new Date(startDateTime as string).toISOString().split('.')[0] + 'Z';
      }
      if (endDateTime) {
        searchParams.endDateTime = new Date(endDateTime as string).toISOString().split('.')[0] + 'Z';
      }

      // Add additional filters
      if (source) searchParams.source = source as string;
      if (venueId) searchParams.venueId = venueId as string;
      if (attractionId) searchParams.attractionId = attractionId as string;
      if (promoterId) searchParams.promoterId = promoterId as string;
      if (locale) searchParams.locale = locale as string;
      if (ageRestrictions) searchParams.ageRestrictions = ageRestrictions as string;

      // Add on-sale date filters
      if (onSaleStartFrom) {
        searchParams.onsaleStartDateTime = new Date(onSaleStartFrom as string).toISOString().split('.')[0] + 'Z';
      }
      if (onSaleEndFrom) {
        searchParams.onsaleEndDateTime = new Date(onSaleEndFrom as string).toISOString().split('.')[0] + 'Z';
      }

      const tmResponse = await ticketmasterService.searchEvents(searchParams);

      if (!tmResponse || !tmResponse._embedded?.events) {
        return res.json(successResponse({
          data: [],
          pagination: {
            page: page || 1,
            limit: limit || 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        }, "No events found"));
      }

      // Transform Ticketmaster events to our format
      const transformedEvents = tmResponse._embedded.events.map(tmEvent => {
        const transformed = ticketmasterService.transformEventToInternal(tmEvent);
        return {
          ...transformed,
          id: tmEvent.id,
          date: transformed.eventDate.toISOString(),
          time: transformed.eventDate.toISOString(),
          totalCapacity: transformed.totalSeats || 0,
          ticketsAvailable: transformed.availableSeats || 0,
          sections: transformed.sections || [],
          _count: {
            offers: 0,
            listings: 0,
            transactions: 0,
          }
        };
      });

      // Apply additional client-side filtering if needed
      let filteredEvents = transformedEvents;

      // Filter by category if specified (post-processing since TM might not have exact category matches)
      if (category) {
        filteredEvents = filteredEvents.filter(event =>
          event.category?.toLowerCase().includes((category as string).toLowerCase()) ||
          event.genre?.toLowerCase().includes((category as string).toLowerCase()) ||
          event.segment?.toLowerCase().includes((category as string).toLowerCase())
        );
      }

      // Filter by price range if specified (post-processing)
      if (minPrice || maxPrice) {
        filteredEvents = filteredEvents.filter(event => {
          const eventMinPrice = event.minPrice || 0;
          const eventMaxPrice = event.maxPrice || 0;

          let priceMatches = true;

          if (minPrice && eventMaxPrice > 0) {
            priceMatches = priceMatches && eventMaxPrice >= parseFloat(minPrice as string);
          }

          if (maxPrice && eventMinPrice > 0) {
            priceMatches = priceMatches && eventMinPrice <= parseFloat(maxPrice as string);
          }

          return priceMatches;
        });
      }

      // Enhanced pagination response with metadata
      const result = {
        data: filteredEvents,
        pagination: {
          page: tmResponse.page.number + 1, // Convert back to 1-based
          limit: tmResponse.page.size,
          total: tmResponse.page.totalElements,
          totalPages: tmResponse.page.totalPages,
          hasNext: tmResponse.page.number + 1 < tmResponse.page.totalPages,
          hasPrev: tmResponse.page.number > 0,
          filteredTotal: filteredEvents.length, // Events after client-side filtering
          maxPages: Math.min(tmResponse.page.totalPages, 1000), // TM limit
        },
        metadata: {
          searchCriteria: {
            location: { city, state, countryCode: searchParams.countryCode },
            classification: { eventType: eventType || classificationName, segment, genre, subGenre },
            dateRange: { startDate, endDate },
            priceRange: { minPrice, maxPrice },
            keyword: search || keyword,
            source: source || 'all',
            sorting: searchParams.sort,
          },
          responseInfo: {
            source: 'Ticketmaster Discovery API v2',
            apiResponseTime: Date.now(),
            totalAvailableEvents: tmResponse.page.totalElements,
            currentPageEvents: filteredEvents.length,
          }
        }
      };

      res.json(successResponse(result, "Events retrieved"));
    } catch (error) {
      logger.error("Get events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve events"));
    }
  },

  // Get single event by ID (public) - from Ticketmaster
  getEventById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tmEvent = await ticketmasterService.getEventById(id);

      if (!tmEvent) {
        return res.status(404).json(errorResponse("Event not found"));
      }

      // Transform to our format
      const transformed = ticketmasterService.transformEventToInternal(tmEvent);
      const event = {
        ...transformed,
        id: tmEvent.id,
        date: transformed.eventDate.toISOString(),
        time: transformed.eventDate.toISOString(),
        totalCapacity: transformed.totalSeats || 0,
        ticketsAvailable: transformed.availableSeats || 0,
        sections: transformed.sections || [],
        _count: {
          offers: 0,
          listings: 0,
          transactions: 0,
        }
      };

      res.json(successResponse(event, "Event retrieved"));
    } catch (error) {
      logger.error("Get event by ID error:", error);
      res.status(500).json(errorResponse("Failed to retrieve event"));
    }
  },

  // Get event sections (public) - Ticketmaster events don't have local sections
  getEventSections: async (req: Request, res: Response) => {
    try {
      // Ticketmaster events don't have sections in our local database
      // Return empty array for now
      res.json(successResponse([], "Event sections retrieved"));
    } catch (error) {
      logger.error("Get event sections error:", error);
      res.status(500).json(errorResponse("Failed to retrieve event sections"));
    }
  },

  // Get event statistics (public) - Default stats for Ticketmaster events
  getEventStats: async (req: Request, res: Response) => {
    try {
      // Return default stats for Ticketmaster events
      const stats = {
        totalOffers: 0,
        totalListings: 0,
        totalTransactions: 0,
        averageOfferPrice: 0,
        averageListingPrice: 0,
      };
      res.json(successResponse(stats, "Event statistics retrieved"));
    } catch (error) {
      logger.error("Get event stats error:", error);
      res
        .status(500)
        .json(errorResponse("Failed to retrieve event statistics"));
    }
  },

  // Create event (admin only) - Not supported with Ticketmaster-only events
  createEvent: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    res.status(501).json(errorResponse("Event creation not supported. Events are sourced from Ticketmaster."));
  },

  // Update event (admin only) - Not supported with Ticketmaster-only events
  updateEvent: async (
    _req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(501).json(errorResponse("Event modification not supported. Events are sourced from Ticketmaster."));
  },

  // Delete event (admin only) - Not supported with Ticketmaster-only events
  deleteEvent: async (
    _req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(501).json(errorResponse("Event deletion not supported. Events are sourced from Ticketmaster."));
  },

  // Create event section (admin only) - Not supported with Ticketmaster-only events
  createSection: async (
    _req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(501).json(errorResponse("Section management not supported. Events are sourced from Ticketmaster."));
  },

  // Update event section (admin only) - Not supported with Ticketmaster-only events
  updateSection: async (
    _req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(501).json(errorResponse("Section management not supported. Events are sourced from Ticketmaster."));
  },

  // Delete event section (admin only) - Not supported with Ticketmaster-only events
  deleteSection: async (
    _req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(501).json(errorResponse("Section management not supported. Events are sourced from Ticketmaster."));
  },

  // Search events (public) - from Ticketmaster
  searchEvents: async (req: Request, res: Response) => {
    try {
      const { q, city, state, eventType, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json(errorResponse("Search query is required"));
      }

      const tmEvents = await ticketmasterService.searchEventsByKeyword(q as string, {
        city: city as string,
        state: state as string,
        countryCode: 'US',
        classificationName: eventType as string,
        size: parseInt(limit as string),
      });

      // Transform events to our format
      const transformedEvents = tmEvents.map(tmEvent => {
        const transformed = ticketmasterService.transformEventToInternal(tmEvent);
        return {
          ...transformed,
          id: tmEvent.id,
          date: transformed.eventDate.toISOString(),
          time: transformed.eventDate.toISOString(),
          totalCapacity: transformed.totalSeats || 0,
          ticketsAvailable: transformed.availableSeats || 0,
          sections: transformed.sections || [],
          _count: {
            offers: 0,
            listings: 0,
            transactions: 0,
          }
        };
      });

      res.json(successResponse(transformedEvents, "Search completed"));
    } catch (error) {
      logger.error("Search events error:", error);
      res.status(500).json(errorResponse("Failed to search events"));
    }
  },

  // Get popular events (public) - from Ticketmaster
  getPopularEvents: async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;

      // Get popular music events from Ticketmaster
      const tmEvents = await ticketmasterService.getEventsByClassification('music', {
        countryCode: 'US',
        size: parseInt(limit as string),
      });

      // Transform events to our format
      const transformedEvents = tmEvents.map(tmEvent => {
        const transformed = ticketmasterService.transformEventToInternal(tmEvent);
        return {
          ...transformed,
          id: tmEvent.id,
          date: transformed.eventDate.toISOString(),
          time: transformed.eventDate.toISOString(),
          totalCapacity: transformed.totalSeats || 0,
          ticketsAvailable: transformed.availableSeats || 0,
          sections: transformed.sections || [],
          _count: {
            offers: 0,
            listings: 0,
            transactions: 0,
          }
        };
      });

      res.json(successResponse(transformedEvents, "Popular events retrieved"));
    } catch (error) {
      logger.error("Get popular events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve popular events"));
    }
  },

  // Get upcoming events (public) - from Ticketmaster
  getUpcomingEvents: async (req: Request, res: Response) => {
    try {
      const { limit = 10, city, state } = req.query;

      // Prepare search parameters for upcoming events
      const searchParams: any = {
        countryCode: 'US',
        size: parseInt(limit as string),
        sort: 'date,asc',
        startDateTime: new Date().toISOString().split('.')[0] + 'Z', // Only future events
      };

      if (city) searchParams.city = city;

      const tmResponse = await ticketmasterService.searchEvents(searchParams);

      let tmEvents: any[] = [];
      if (tmResponse?._embedded?.events) {
        tmEvents = tmResponse._embedded.events;
      }

      // Transform events to our format
      let transformedEvents = tmEvents.map(tmEvent => {
        const transformed = ticketmasterService.transformEventToInternal(tmEvent);
        return {
          ...transformed,
          id: tmEvent.id,
          date: transformed.eventDate.toISOString(),
          time: transformed.eventDate.toISOString(),
          totalCapacity: transformed.totalSeats || 0,
          ticketsAvailable: transformed.availableSeats || 0,
          sections: transformed.sections || [],
          _count: {
            offers: 0,
            listings: 0,
            transactions: 0,
          }
        };
      });

      // Filter by state if provided
      if (state) {
        transformedEvents = transformedEvents.filter(event =>
          event.state?.toLowerCase().includes((state as string).toLowerCase())
        );
      }

      res.json(successResponse(transformedEvents, "Upcoming events retrieved"));
    } catch (error) {
      logger.error("Get upcoming events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve upcoming events"));
    }
  },
};
