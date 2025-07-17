import { prisma } from "../utils/prisma";
import {
  CreateEventRequest,
  EventSearchQuery,
  UpdateEventRequest,
} from "../types/event";
import { PaginationResponse } from "../types/api";
import { logger } from "../utils/logger";
import { EventNotFoundError, DatabaseError } from "../utils/errors";

export class EventService {
  async createEvent(data: CreateEventRequest) {
    try {
      logger.info(
        "EventService: Creating event with data:",
        JSON.stringify(data, null, 2)
      );
      const { sections, ...eventData } = data;

      const createData: any = { ...eventData };

      if (sections && sections.length > 0) {
        createData.sections = {
          create: sections,
        };
      }

      const event = await prisma.event.create({
        data: createData,
        include: {
          sections: true,
        },
      });

      logger.info(`Event created: ${event.id}`);

      // Map database fields to frontend expected fields
      return {
        ...event,
        date: event.eventDate.toISOString(),
        time: event.eventDate.toISOString(),
        totalCapacity: event.totalSeats || 0,
        ticketsAvailable: event.availableSeats || 0,
        minPrice: event.minPrice ? parseFloat(event.minPrice.toString()) : 0,
        maxPrice: event.maxPrice ? parseFloat(event.maxPrice.toString()) : 0,
      };
    } catch (error) {
      logger.error("EventService: Failed to create event:", error);
      throw error;
    }
  }

  async getEvents(query: EventSearchQuery): Promise<PaginationResponse<any>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "eventDate",
      sortOrder = "asc",
      city,
      state,
      eventType,
      category,
      dateFrom,
      dateTo,
      minPrice,
      maxPrice,
      search,
    } = query;

    const offset = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (state) {
      where.state = { contains: state, mode: "insensitive" };
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (dateFrom || dateTo) {
      where.eventDate = {};
      if (dateFrom) where.eventDate.gte = new Date(dateFrom);
      if (dateTo) where.eventDate.lte = new Date(dateTo);
    }

    if (minPrice || maxPrice) {
      where.OR = [
        {
          minPrice: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        },
        {
          maxPrice: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        },
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sections: true,
          _count: {
            select: {
              offers: true,
              listings: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Map database fields to frontend expected fields
    const data = events.map((event) => ({
      ...event,
      date: event.eventDate.toISOString(),
      time: event.eventDate.toISOString(),
      totalCapacity: event.totalSeats || 0,
      ticketsAvailable: event.availableSeats || 0,
      minPrice: event.minPrice ? parseFloat(event.minPrice.toString()) : 0,
      maxPrice: event.maxPrice ? parseFloat(event.maxPrice.toString()) : 0,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getEventById(id: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          sections: true,
          _count: {
            select: {
              offers: true,
              listings: true,
              transactions: true,
            },
          },
        },
      });

      if (!event) {
        throw new EventNotFoundError(id);
      }

      // Map database fields to frontend expected fields
      return {
        ...event,
        date: event.eventDate.toISOString(),
        time: event.eventDate.toISOString(),
        totalCapacity: event.totalSeats || 0,
        ticketsAvailable: event.availableSeats || 0,
        minPrice: event.minPrice ? parseFloat(event.minPrice.toString()) : 0,
        maxPrice: event.maxPrice ? parseFloat(event.maxPrice.toString()) : 0,
      };
    } catch (error: any) {
      if (error instanceof EventNotFoundError) {
        throw error;
      }
      logger.error("Database error getting event:", error);
      throw new DatabaseError("Failed to retrieve event");
    }
  }

  async updateEvent(id: string, data: UpdateEventRequest) {
    try {
      const event = await prisma.event.update({
        where: { id },
        data,
        include: {
          sections: true,
        },
      });

      logger.info(`Event updated: ${id}`);
      return event;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new EventNotFoundError(id);
      }
      logger.error("Database error updating event:", error);
      throw new DatabaseError("Failed to update event");
    }
  }

  async deleteEvent(id: string) {
    try {
      await prisma.event.delete({
        where: { id },
      });

      logger.info(`Event deleted: ${id}`);
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new EventNotFoundError(id);
      }
      logger.error("Database error deleting event:", error);
      throw new DatabaseError("Failed to delete event");
    }
  }

  async getEventStats(eventId: string) {
    const [stats, averageOfferPrice, averageListingPrice] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              offers: true,
              listings: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.offer.aggregate({
        where: { eventId },
        _avg: { maxPrice: true },
      }),
      prisma.listing.aggregate({
        where: { eventId },
        _avg: { price: true },
      }),
    ]);

    return {
      totalOffers: stats?._count.offers || 0,
      totalListings: stats?._count.listings || 0,
      totalTransactions: stats?._count.transactions || 0,
      averageOfferPrice: averageOfferPrice._avg.maxPrice || 0,
      averageListingPrice: averageListingPrice._avg.price || 0,
    };
  }

  async getEventSections(eventId: string) {
    const sections = await prisma.section.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
    });

    // Map database fields to frontend expected fields
    return sections.map((section) => ({
      ...section,
      capacity: section.seatCount || 0,
      minPrice: 0, // Sections don't have price in the current schema
      maxPrice: 0, // Sections don't have price in the current schema
      isActive: true, // Default to active
    }));
  }

  async createSection(data: any) {
    const section = await prisma.section.create({
      data,
      include: { event: true },
    });

    logger.info(`Section created: ${section.id} for event: ${data.eventId}`);
    return section;
  }

  async updateSection(sectionId: string, data: any) {
    const section = await prisma.section.update({
      where: { id: sectionId },
      data,
      include: { event: true },
    });

    logger.info(`Section updated: ${sectionId}`);
    return section;
  }

  async deleteSection(sectionId: string) {
    await prisma.section.delete({
      where: { id: sectionId },
    });

    logger.info(`Section deleted: ${sectionId}`);
  }

  async searchEvents(params: {
    query: string;
    city?: string;
    state?: string;
    eventType?: string;
    limit: number;
  }) {
    const { query, city, state, eventType, limit } = params;

    const where: any = {
      isActive: true,
      eventDate: { gte: new Date() },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { venue: { contains: query, mode: "insensitive" } },
      ],
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = { contains: state, mode: "insensitive" };
    if (eventType) where.eventType = eventType;

    const events = await prisma.event.findMany({
      where,
      take: limit,
      orderBy: { eventDate: "asc" },
      include: {
        sections: true,
        _count: {
          select: {
            offers: true,
            listings: true,
          },
        },
      },
    });

    // Map database fields to frontend expected fields
    return events.map((event) => ({
      ...event,
      date: event.eventDate.toISOString(),
      time: event.eventDate.toISOString(),
      totalCapacity: event.totalSeats || 0,
      ticketsAvailable: event.availableSeats || 0,
      minPrice: event.minPrice ? parseFloat(event.minPrice.toString()) : 0,
      maxPrice: event.maxPrice ? parseFloat(event.maxPrice.toString()) : 0,
    }));
  }

  async getPopularEvents(limit: number) {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        eventDate: { gte: new Date() },
      },
      take: limit,
      orderBy: [
        { offers: { _count: "desc" } },
        { listings: { _count: "desc" } },
      ],
      include: {
        sections: true,
        _count: {
          select: {
            offers: true,
            listings: true,
          },
        },
      },
    });

    // Map database fields to frontend expected fields
    return events.map((event) => ({
      ...event,
      date: event.eventDate.toISOString(),
      time: event.eventDate.toISOString(),
      totalCapacity: event.totalSeats || 0,
      ticketsAvailable: event.availableSeats || 0,
      minPrice: event.minPrice ? parseFloat(event.minPrice.toString()) : 0,
      maxPrice: event.maxPrice ? parseFloat(event.maxPrice.toString()) : 0,
    }));
  }

  async getUpcomingEvents(params: {
    limit: number;
    city?: string;
    state?: string;
  }) {
    const { limit, city, state } = params;

    const where: any = {
      isActive: true,
      eventDate: { gte: new Date() },
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = { contains: state, mode: "insensitive" };

    const events = await prisma.event.findMany({
      where,
      take: limit,
      orderBy: { eventDate: "asc" },
      include: {
        sections: true,
        _count: {
          select: {
            offers: true,
            listings: true,
          },
        },
      },
    });

    // Map database fields to frontend expected fields
    return events.map((event) => ({
      ...event,
      date: event.eventDate.toISOString(),
      time: event.eventDate.toISOString(),
      totalCapacity: event.totalSeats || 0,
      ticketsAvailable: event.availableSeats || 0,
      minPrice: event.minPrice ? parseFloat(event.minPrice.toString()) : 0,
      maxPrice: event.maxPrice ? parseFloat(event.maxPrice.toString()) : 0,
    }));
  }

  async getAllEventsAdmin(params: {
    skip: number;
    take: number;
    status?: string;
    eventType?: string;
    city?: string;
    state?: string;
  }) {
    const { skip, take, status, eventType, city, state } = params;

    const where: any = {};

    if (status) where.status = status;
    if (eventType) where.eventType = eventType;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = { contains: state, mode: "insensitive" };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          sections: true,
          _count: {
            select: {
              offers: true,
              listings: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  }
}

export const eventService = new EventService();