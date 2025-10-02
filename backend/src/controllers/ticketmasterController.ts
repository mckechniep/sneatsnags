import { Request, Response } from 'express';
import { ticketmasterService } from '../services/ticketmasterService';
import { eventService } from '../services/eventService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/response';

export class TicketmasterController {
  async searchEvents(req: Request, res: Response) {
    try {
      const {
        keyword,
        city,
        state,
        countryCode = 'US',
        classificationName,
        size = 20,
        page = 0,
        sort = 'date,asc',
      } = req.query;

      const events = await ticketmasterService.searchEvents({
        keyword: keyword as string,
        city: city as string,
        countryCode: countryCode as string,
        classificationName: classificationName as string,
        size: parseInt(size as string),
        page: parseInt(page as string),
        sort: sort as string,
      });

      if (!events) {
        return ApiResponse.error(res, 'Failed to fetch events from Ticketmaster', 500);
      }

      return ApiResponse.success(res, {
        events: events._embedded?.events || [],
        pagination: {
          page: events.page.number,
          size: events.page.size,
          totalElements: events.page.totalElements,
          totalPages: events.page.totalPages,
        },
        _links: events._links,
      });
    } catch (error: any) {
      logger.error('Error searching Ticketmaster events:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getEventById(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      const event = await ticketmasterService.getEventById(eventId);

      if (!event) {
        return ApiResponse.error(res, 'Event not found', 404);
      }

      return ApiResponse.success(res, event);
    } catch (error: any) {
      logger.error('Error fetching Ticketmaster event:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async importEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      // Fetch event from Ticketmaster
      const tmEvent = await ticketmasterService.getEventById(eventId);

      if (!tmEvent) {
        return ApiResponse.error(res, 'Event not found in Ticketmaster', 404);
      }

      // Transform to internal format
      const eventData = ticketmasterService.transformEventToInternal(tmEvent);

      // Check if event already exists
      const existingEvents = await eventService.searchEvents({
        query: tmEvent.name,
        limit: 1,
      });

      if (existingEvents.length > 0) {
        const existingEvent = existingEvents.find(e =>
          e.ticketmasterId === tmEvent.id ||
          (e.name.toLowerCase() === tmEvent.name.toLowerCase() &&
           e.eventDate.getTime() === eventData.eventDate.getTime())
        );

        if (existingEvent) {
          return ApiResponse.error(res, 'Event already exists in the system', 409);
        }
      }

      // Create event in our database
      const createdEvent = await eventService.createEvent(eventData);

      logger.info(`Imported event from Ticketmaster: ${tmEvent.id} -> ${createdEvent.id}`);

      return ApiResponse.success(res, {
        message: 'Event imported successfully',
        event: createdEvent,
        ticketmasterEvent: tmEvent,
      });
    } catch (error: any) {
      logger.error('Error importing Ticketmaster event:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async importMultipleEvents(req: Request, res: Response) {
    try {
      const { eventIds } = req.body;

      if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return ApiResponse.error(res, 'Event IDs array is required', 400);
      }

      const results = [];
      const errors = [];

      for (const eventId of eventIds) {
        try {
          // Fetch event from Ticketmaster
          const tmEvent = await ticketmasterService.getEventById(eventId);

          if (!tmEvent) {
            errors.push({ eventId, error: 'Event not found in Ticketmaster' });
            continue;
          }

          // Transform to internal format
          const eventData = ticketmasterService.transformEventToInternal(tmEvent);

          // Check if event already exists
          const existingEvents = await eventService.searchEvents({
            query: tmEvent.name,
            limit: 1,
          });

          const existingEvent = existingEvents.find(e =>
            e.ticketmasterId === tmEvent.id ||
            (e.name.toLowerCase() === tmEvent.name.toLowerCase() &&
             e.eventDate.getTime() === eventData.eventDate.getTime())
          );

          if (existingEvent) {
            errors.push({ eventId, error: 'Event already exists in the system' });
            continue;
          }

          // Create event in our database
          const createdEvent = await eventService.createEvent(eventData);

          results.push({
            eventId,
            ticketmasterEvent: tmEvent,
            createdEvent,
            status: 'success',
          });

          logger.info(`Imported event from Ticketmaster: ${tmEvent.id} -> ${createdEvent.id}`);
        } catch (error: any) {
          errors.push({ eventId, error: error.message });
          logger.error(`Error importing event ${eventId}:`, error.message);
        }
      }

      return ApiResponse.success(res, {
        message: `Imported ${results.length} events successfully`,
        imported: results,
        errors: errors,
        summary: {
          total: eventIds.length,
          successful: results.length,
          failed: errors.length,
        },
      });
    } catch (error: any) {
      logger.error('Error importing multiple Ticketmaster events:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async searchEventsByKeyword(req: Request, res: Response) {
    try {
      const { keyword } = req.params;
      const { city, state, countryCode, classificationName, size = 50 } = req.query;

      const events = await ticketmasterService.searchEventsByKeyword(keyword, {
        city: city as string,
        state: state as string,
        countryCode: countryCode as string,
        classificationName: classificationName as string,
        size: parseInt(size as string),
      });

      return ApiResponse.success(res, {
        keyword,
        events,
        count: events.length,
      });
    } catch (error: any) {
      logger.error('Error searching events by keyword:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getEventsByCity(req: Request, res: Response) {
    try {
      const { city } = req.params;
      const { countryCode, classificationName, size = 50, startDate, endDate } = req.query;

      const events = await ticketmasterService.getEventsByCity(city, {
        countryCode: countryCode as string,
        classificationName: classificationName as string,
        size: parseInt(size as string),
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return ApiResponse.success(res, {
        city,
        events,
        count: events.length,
      });
    } catch (error: any) {
      logger.error('Error getting events by city:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getEventsByClassification(req: Request, res: Response) {
    try {
      const { classification } = req.params;
      const { city, state, countryCode, size = 50 } = req.query;

      const events = await ticketmasterService.getEventsByClassification(classification, {
        city: city as string,
        state: state as string,
        countryCode: countryCode as string,
        size: parseInt(size as string),
      });

      return ApiResponse.success(res, {
        classification,
        events,
        count: events.length,
      });
    } catch (error: any) {
      logger.error('Error getting events by classification:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async syncEvents(req: Request, res: Response) {
    try {
      const {
        keyword,
        city,
        state,
        countryCode = 'US',
        classificationName,
        size = 100,
        autoImport = false,
      } = req.body;

      // Search events from Ticketmaster
      const tmResponse = await ticketmasterService.searchEvents({
        keyword,
        city,
        countryCode,
        classificationName,
        size,
        sort: 'date,asc',
      });

      if (!tmResponse?._embedded?.events) {
        return ApiResponse.success(res, {
          message: 'No events found',
          events: [],
          imported: [],
        });
      }

      const tmEvents = tmResponse._embedded.events;
      const imported = [];
      const errors = [];

      if (autoImport) {
        for (const tmEvent of tmEvents) {
          try {
            // Transform to internal format
            const eventData = ticketmasterService.transformEventToInternal(tmEvent);

            // Check if event already exists
            const existingEvents = await eventService.searchEvents({
              query: tmEvent.name,
              limit: 1,
            });

            const existingEvent = existingEvents.find(e =>
              e.ticketmasterId === tmEvent.id ||
              (e.name.toLowerCase() === tmEvent.name.toLowerCase() &&
               e.eventDate.getTime() === eventData.eventDate.getTime())
            );

            if (!existingEvent) {
              // Create event in our database
              const createdEvent = await eventService.createEvent(eventData);
              imported.push({
                ticketmasterEvent: tmEvent,
                createdEvent,
              });

              logger.info(`Auto-imported event: ${tmEvent.id} -> ${createdEvent.id}`);
            }
          } catch (error: any) {
            errors.push({ eventId: tmEvent.id, error: error.message });
            logger.error(`Error auto-importing event ${tmEvent.id}:`, error.message);
          }
        }
      }

      return ApiResponse.success(res, {
        message: `Found ${tmEvents.length} events${autoImport ? `, imported ${imported.length}` : ''}`,
        events: tmEvents,
        imported: autoImport ? imported : undefined,
        errors: autoImport && errors.length > 0 ? errors : undefined,
        pagination: {
          page: tmResponse.page.number,
          size: tmResponse.page.size,
          totalElements: tmResponse.page.totalElements,
          totalPages: tmResponse.page.totalPages,
        },
      });
    } catch (error: any) {
      logger.error('Error syncing events:', error.message);
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

export const ticketmasterController = new TicketmasterController();