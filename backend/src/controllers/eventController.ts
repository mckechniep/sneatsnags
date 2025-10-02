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
  // Get all events (public) - from Ticketmaster
  getEvents: async (req: Request, res: Response) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const { city, state, eventType, category, search, startDate, endDate } =
        req.query;

      // Prepare Ticketmaster search parameters
      const searchParams: any = {
        countryCode: 'US',
        size: limit,
        page: (page || 1) - 1, // TM uses 0-based pagination
        sort: 'date,asc',
      };

      if (search) searchParams.keyword = search;
      if (city) searchParams.city = city;
      if (eventType) searchParams.classificationName = eventType;
      if (startDate) searchParams.startDateTime = new Date(startDate as string).toISOString();
      if (endDate) searchParams.endDateTime = new Date(endDate as string).toISOString();

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
          totalCapacity: 0,
          ticketsAvailable: 0,
          sections: [],
          _count: {
            offers: 0,
            listings: 0,
            transactions: 0,
          }
        };
      });

      // Apply additional filtering if needed
      let filteredEvents = transformedEvents;

      if (category) {
        filteredEvents = filteredEvents.filter(event =>
          event.category?.toLowerCase().includes((category as string).toLowerCase())
        );
      }

      if (state) {
        filteredEvents = filteredEvents.filter(event =>
          event.state?.toLowerCase().includes((state as string).toLowerCase())
        );
      }

      const result = {
        data: filteredEvents,
        pagination: {
          page: tmResponse.page.number + 1, // Convert back to 1-based
          limit: tmResponse.page.size,
          total: tmResponse.page.totalElements,
          totalPages: tmResponse.page.totalPages,
          hasNext: tmResponse.page.number + 1 < tmResponse.page.totalPages,
          hasPrev: tmResponse.page.number > 0,
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
        totalCapacity: 0,
        ticketsAvailable: 0,
        sections: [],
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
          totalCapacity: 0,
          ticketsAvailable: 0,
          sections: [],
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
          totalCapacity: 0,
          ticketsAvailable: 0,
          sections: [],
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
        startDateTime: new Date().toISOString(), // Only future events
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
          totalCapacity: 0,
          ticketsAvailable: 0,
          sections: [],
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
