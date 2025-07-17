import { Request, Response, NextFunction } from "express";
import { successResponse, errorResponse } from "../utils/response";
import { logger } from "../utils/logger";
import { eventService } from "../services/eventService";
import {
  getPaginationParams,
  createPaginationResult,
} from "../utils/pagination";
import { AuthenticatedRequest } from "../types/auth";
import {
  createEventSchema,
  updateEventSchema,
  createEventSectionSchema,
  updateEventSectionSchema,
  eventSearchSchema,
} from "../utils/validations";

export const eventController = {
  // Get all events (public)
  getEvents: async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { city, state, eventType, category, search, startDate, endDate } =
        req.query;

      const result = await eventService.getEvents({
        page,
        limit,
        city: city as string,
        state: state as string,
        eventType: eventType as string,
        category: category as string,
        search: search as string,
        dateFrom: startDate as string,
        dateTo: endDate as string,
      });

      res.json(successResponse(result, "Events retrieved"));
    } catch (error) {
      logger.error("Get events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve events"));
    }
  },

  // Get single event by ID (public)
  getEventById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json(errorResponse("Event not found"));
      }

      res.json(successResponse(event, "Event retrieved"));
    } catch (error) {
      logger.error("Get event by ID error:", error);
      res.status(500).json(errorResponse("Failed to retrieve event"));
    }
  },

  // Get event sections (public)
  getEventSections: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sections = await eventService.getEventSections(id);
      res.json(successResponse(sections, "Event sections retrieved"));
    } catch (error) {
      logger.error("Get event sections error:", error);
      res.status(500).json(errorResponse("Failed to retrieve event sections"));
    }
  },

  // Get event statistics (public)
  getEventStats: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await eventService.getEventStats(id);
      res.json(successResponse(stats, "Event statistics retrieved"));
    } catch (error) {
      logger.error("Get event stats error:", error);
      res
        .status(500)
        .json(errorResponse("Failed to retrieve event statistics"));
    }
  },

  // Create event (admin only)
  createEvent: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.info(
        "Creating event with data:",
        JSON.stringify(req.body, null, 2)
      );
      const validatedData = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(validatedData);
      logger.info("Event created successfully:", event.id);
      res
        .status(201)
        .json(successResponse(event, "Event created successfully"));
    } catch (error) {
      logger.error("Create event error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create event";
      res.status(500).json(errorResponse(errorMessage));
    }
  },

  updateEvent: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const validatedData = updateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(id, validatedData);
      res.json(successResponse(event, "Event updated successfully"));
    } catch (error) {
      next(error);
    }
  },

  // Delete event (admin only)
  deleteEvent: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      await eventService.deleteEvent(id);
      res.json(successResponse(null, "Event deleted successfully"));
    } catch (error) {
      next(error);
    }
  },

  // Create event section (admin only)
  createSection: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id: eventId } = req.params;
      const sectionData = { ...req.body, eventId };
      const validatedData = createEventSectionSchema.parse(sectionData);
      const section = await eventService.createSection(validatedData);
      res
        .status(201)
        .json(successResponse(section, "Section created successfully"));
    } catch (error) {
      next(error);
    }
  },

  // Update event section (admin only)
  updateSection: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { sectionId } = req.params;
      const validatedData = updateEventSectionSchema.parse(req.body);
      const section = await eventService.updateSection(
        sectionId,
        validatedData
      );
      res.json(successResponse(section, "Section updated successfully"));
    } catch (error) {
      next(error);
    }
  },

  // Delete event section (admin only)
  deleteSection: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { sectionId } = req.params;
      await eventService.deleteSection(sectionId);
      res.json(successResponse(null, "Section deleted successfully"));
    } catch (error) {
      next(error);
    }
  },

  // Search events (public)
  searchEvents: async (req: Request, res: Response) => {
    try {
      const { q, city, state, eventType, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json(errorResponse("Search query is required"));
      }

      const events = await eventService.searchEvents({
        query: q as string,
        city: city as string,
        state: state as string,
        eventType: eventType as string,
        limit: parseInt(limit as string),
      });

      res.json(successResponse(events, "Search completed"));
    } catch (error) {
      logger.error("Search events error:", error);
      res.status(500).json(errorResponse("Failed to search events"));
    }
  },

  // Get popular events (public)
  getPopularEvents: async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const events = await eventService.getPopularEvents(
        parseInt(limit as string)
      );
      res.json(successResponse(events, "Popular events retrieved"));
    } catch (error) {
      logger.error("Get popular events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve popular events"));
    }
  },

  // Get upcoming events (public)
  getUpcomingEvents: async (req: Request, res: Response) => {
    try {
      const { limit = 10, city, state } = req.query;
      const events = await eventService.getUpcomingEvents({
        limit: parseInt(limit as string),
        city: city as string,
        state: state as string,
      });
      res.json(successResponse(events, "Upcoming events retrieved"));
    } catch (error) {
      logger.error("Get upcoming events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve upcoming events"));
    }
  },
};
