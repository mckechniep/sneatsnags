import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { 
  CreateEventRequest,
  UpdateEventRequest, 
  EventSearchQuery
} from "../validations/eventValidation";
import {
  EventNotFoundError,
  EventAlreadyExistsError,
  EventBusinessLogicError,
  EventCapacityError,
  EventDateConflictError,
  handleEventError,
} from "../errors/eventErrors";
import { Prisma } from "@prisma/client";

// Event DTO for consistent data transformation
export interface EventDTO {
  id: string;
  name: string;
  description?: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  eventDate: string;
  doors?: string;
  eventType: string;
  category?: string;
  subcategory?: string;
  imageUrl?: string;
  minPrice: number;
  maxPrice: number;
  totalSeats: number;
  availableSeats: number;
  ticketmasterId?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sections?: SectionDTO[];
  stats?: EventStatsDTO;
}

export interface SectionDTO {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  rowCount?: number;
  seatCount?: number;
  priceLevel?: number;
  capacity: number;
  isActive: boolean;
}

export interface EventStatsDTO {
  totalOffers: number;
  totalListings: number;
  totalTransactions: number;
  averageOfferPrice: number;
  averageListingPrice: number;
  popularityScore: number;
  bookingRate: number;
}

export class EventServiceV2 {
  private readonly MAX_SECTIONS_PER_EVENT = 50;
  private readonly MAX_EVENTS_PER_VENUE_PER_DAY = 10;

  /**
   * Creates a new event with full transaction support and rollback capability
   */
  async createEvent(data: CreateEventRequest, userId?: string): Promise<EventDTO> {
    const startTime = Date.now();
    logger.info("EventService: Starting event creation", { 
      eventName: data.name, 
      userId, 
      timestamp: new Date().toISOString() 
    });

    try {
      // Pre-validation checks
      await this.validateEventCreation(data);

      // Use transaction for atomic operation
      const result = await prisma.$transaction(async (tx) => {
        // Create the event
        const event = await tx.event.create({
          data: {
            name: data.name,
            description: data.description,
            venue: data.venue,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country || "US",
            eventDate: data.eventDate,
            doors: data.doors,
            eventType: data.eventType,
            category: data.category,
            subcategory: data.subcategory,
            imageUrl: data.imageUrl,
            minPrice: data.minPrice ? new Prisma.Decimal(data.minPrice) : null,
            maxPrice: data.maxPrice ? new Prisma.Decimal(data.maxPrice) : null,
            totalSeats: data.totalSeats,
            availableSeats: data.availableSeats || data.totalSeats,
            ticketmasterId: data.ticketmasterId,
            status: data.status,
            isActive: data.isActive,
          },
          include: {
            sections: true,
          },
        });

        // Create sections
        const sections = await Promise.all(
          data.sections.map(async (sectionData: any) => {
            const section = await tx.section.create({
              data: {
                eventId: event.id,
                name: sectionData.name,
                description: sectionData.description,
                rowCount: sectionData.rowCount,
                seatCount: sectionData.seatCount,
                priceLevel: sectionData.priceLevel,
              },
            });
            return section;
          })
        );

        // Validate total capacity consistency
        const totalSectionCapacity = sections.reduce((sum: number, section: any) => 
          sum + (section.seatCount || 0), 0
        );

        if (data.totalSeats && totalSectionCapacity > data.totalSeats) {
          throw new EventCapacityError(
            "Total section capacity exceeds event capacity",
            {
              eventCapacity: data.totalSeats,
              sectionCapacity: totalSectionCapacity,
            }
          );
        }

        // Update event with calculated capacity if not provided
        if (!data.totalSeats && totalSectionCapacity > 0) {
          await tx.event.update({
            where: { id: event.id },
            data: {
              totalSeats: totalSectionCapacity,
              availableSeats: totalSectionCapacity,
            },
          });
        }

        return { ...event, sections };
      });

      const duration = Date.now() - startTime;
      logger.info("EventService: Event created successfully", {
        eventId: result.id,
        eventName: result.name,
        sectionsCount: result.sections.length,
        duration: `${duration}ms`,
        userId,
      });

      return this.mapEventToDTO(result);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("EventService: Event creation failed", {
        eventName: data.name,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        userId,
      });

      handleEventError(error, "createEvent");
    }
  }

  /**
   * Updates an event with transaction support
   */
  async updateEvent(id: string, data: UpdateEventRequest, userId?: string): Promise<EventDTO> {
    const startTime = Date.now();
    logger.info("EventService: Starting event update", { eventId: id, userId });

    try {
      // Check if event exists
      const existingEvent = await this.getEventById(id);
      if (!existingEvent) {
        throw new EventNotFoundError(id);
      }

      // Validate update
      await this.validateEventUpdate(id, data);

      const result = await prisma.$transaction(async (tx) => {
        const updatedEvent = await tx.event.update({
          where: { id },
          data: {
            ...data,
            minPrice: data.minPrice ? new Prisma.Decimal(data.minPrice) : undefined,
            maxPrice: data.maxPrice ? new Prisma.Decimal(data.maxPrice) : undefined,
          },
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

        return updatedEvent;
      });

      const duration = Date.now() - startTime;
      logger.info("EventService: Event updated successfully", {
        eventId: id,
        duration: `${duration}ms`,
        userId,
      });

      return this.mapEventToDTO(result);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("EventService: Event update failed", {
        eventId: id,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        userId,
      });

      handleEventError(error, "updateEvent");
    }
  }

  /**
   * Deletes an event with proper cleanup
   */
  async deleteEvent(id: string, userId?: string): Promise<void> {
    const startTime = Date.now();
    logger.info("EventService: Starting event deletion", { eventId: id, userId });

    try {
      // Check if event exists
      const existingEvent = await this.getEventById(id);
      if (!existingEvent) {
        throw new EventNotFoundError(id);
      }

      // Validate deletion
      await this.validateEventDeletion(id);

      await prisma.$transaction(async (tx) => {
        // Delete related records first
        await tx.offerSection.deleteMany({
          where: {
            section: {
              eventId: id,
            },
          },
        });

        await tx.section.deleteMany({
          where: { eventId: id },
        });

        // Delete the event
        await tx.event.delete({
          where: { id },
        });
      });

      const duration = Date.now() - startTime;
      logger.info("EventService: Event deleted successfully", {
        eventId: id,
        duration: `${duration}ms`,
        userId,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("EventService: Event deletion failed", {
        eventId: id,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        userId,
      });

      handleEventError(error, "deleteEvent");
    }
  }

  /**
   * Gets an event by ID with comprehensive data
   */
  async getEventById(id: string, includeStats = false): Promise<EventDTO | null> {
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
        return null;
      }

      const eventDTO = this.mapEventToDTO(event);

      if (includeStats) {
        eventDTO.stats = await this.getEventStats(id);
      }

      return eventDTO;

    } catch (error) {
      handleEventError(error, "getEventById");
    }
  }

  /**
   * Gets events with advanced filtering and pagination
   */
  async getEvents(query: EventSearchQuery): Promise<{
    data: EventDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "eventDate",
        sortOrder = "asc",
        city,
        state,
        eventType,
        category,
        subcategory,
        dateFrom,
        dateTo,
        minPrice,
        maxPrice,
        search,
        status,
        isActive,
      } = query;

      const offset = (page - 1) * limit;

      const where: Prisma.EventWhereInput = {};

      // Apply filters
      if (isActive !== undefined) where.isActive = isActive;
      if (status) where.status = status;
      if (city) where.city = { contains: city, mode: "insensitive" };
      if (state) where.state = { contains: state, mode: "insensitive" };
      if (eventType) where.eventType = eventType;
      if (category) where.category = { contains: category, mode: "insensitive" };
      if (subcategory) where.subcategory = { contains: subcategory, mode: "insensitive" };

      // Date range filter
      if (dateFrom || dateTo) {
        where.eventDate = {};
        if (dateFrom) where.eventDate.gte = new Date(dateFrom);
        if (dateTo) where.eventDate.lte = new Date(dateTo);
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.OR = [
          {
            minPrice: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          },
          {
            maxPrice: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          },
        ];
      }

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { venue: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
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
                transactions: true,
              },
            },
          },
        }),
        prisma.event.count({ where }),
      ]);

      const data = events.map(event => this.mapEventToDTO(event));

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

    } catch (error) {
      handleEventError(error, "getEvents");
    }
  }

  /**
   * Gets event statistics
   */
  async getEventStats(eventId: string): Promise<EventStatsDTO> {
    try {
      const [
        offerStats,
        listingStats,
        transactionStats,
        offerPriceStats,
        listingPriceStats,
      ] = await Promise.all([
        prisma.offer.count({ where: { eventId } }),
        prisma.listing.count({ where: { eventId } }),
        prisma.transaction.count({ where: { eventId } }),
        prisma.offer.aggregate({
          where: { eventId },
          _avg: { maxPrice: true },
        }),
        prisma.listing.aggregate({
          where: { eventId },
          _avg: { price: true },
        }),
      ]);

      const totalActivity = offerStats + listingStats + transactionStats;
      const popularityScore = Math.min(totalActivity * 0.1, 100);
      const bookingRate = listingStats > 0 ? (transactionStats / listingStats) * 100 : 0;

      return {
        totalOffers: offerStats,
        totalListings: listingStats,
        totalTransactions: transactionStats,
        averageOfferPrice: parseFloat(offerPriceStats._avg.maxPrice?.toString() || "0"),
        averageListingPrice: parseFloat(listingPriceStats._avg.price?.toString() || "0"),
        popularityScore,
        bookingRate,
      };

    } catch (error) {
      handleEventError(error, "getEventStats");
    }
  }

  /**
   * Private validation methods
   */
  private async validateEventCreation(data: CreateEventRequest): Promise<void> {
    // Check for duplicate events
    const existingEvent = await prisma.event.findFirst({
      where: {
        name: data.name,
        venue: data.venue,
        eventDate: data.eventDate,
      },
    });

    if (existingEvent) {
      throw new EventAlreadyExistsError(
        `${data.name} at ${data.venue} on ${data.eventDate.toISOString()}`
      );
    }

    // Check venue capacity limits
    const sameDayEvents = await prisma.event.count({
      where: {
        venue: data.venue,
        eventDate: {
          gte: new Date(data.eventDate.getFullYear(), data.eventDate.getMonth(), data.eventDate.getDate()),
          lt: new Date(data.eventDate.getFullYear(), data.eventDate.getMonth(), data.eventDate.getDate() + 1),
        },
      },
    });

    if (sameDayEvents >= this.MAX_EVENTS_PER_VENUE_PER_DAY) {
      throw new EventDateConflictError(
        "Maximum events per venue per day exceeded",
        {
          venue: data.venue,
          date: data.eventDate,
          maxEvents: this.MAX_EVENTS_PER_VENUE_PER_DAY,
          currentEvents: sameDayEvents,
        }
      );
    }

    // Validate sections
    if (data.sections.length > this.MAX_SECTIONS_PER_EVENT) {
      throw new EventCapacityError(
        "Too many sections for event",
        {
          maxSections: this.MAX_SECTIONS_PER_EVENT,
          providedSections: data.sections.length,
        }
      );
    }
  }

  private async validateEventUpdate(id: string, data: UpdateEventRequest): Promise<void> {
    // Check if event has active transactions
    const activeTransactions = await prisma.transaction.count({
      where: {
        eventId: id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (activeTransactions > 0 && (data.eventDate || data.status === "CANCELLED")) {
      throw new EventBusinessLogicError(
        "Cannot modify event with active transactions",
        {
          eventId: id,
          activeTransactions,
          attemptedChanges: Object.keys(data),
        }
      );
    }
  }

  private async validateEventDeletion(id: string): Promise<void> {
    const relatedData = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            offers: true,
            listings: true,
            transactions: true,
          },
        },
      },
    });

    if (relatedData && relatedData._count.transactions > 0) {
      throw new EventBusinessLogicError(
        "Cannot delete event with transactions",
        {
          eventId: id,
          transactionCount: relatedData._count.transactions,
        }
      );
    }
  }

  /**
   * Maps database model to DTO
   */
  private mapEventToDTO(event: any): EventDTO {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      zipCode: event.zipCode,
      country: event.country,
      eventDate: event.eventDate.toISOString(),
      doors: event.doors?.toISOString(),
      eventType: event.eventType,
      category: event.category,
      subcategory: event.subcategory,
      imageUrl: event.imageUrl,
      minPrice: parseFloat(event.minPrice?.toString() || "0"),
      maxPrice: parseFloat(event.maxPrice?.toString() || "0"),
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      ticketmasterId: event.ticketmasterId,
      status: event.status,
      isActive: event.isActive,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      sections: event.sections?.map(this.mapSectionToDTO) || [],
    };
  }

  private mapSectionToDTO(section: any): SectionDTO {
    return {
      id: section.id,
      eventId: section.eventId,
      name: section.name,
      description: section.description,
      rowCount: section.rowCount,
      seatCount: section.seatCount,
      priceLevel: section.priceLevel,
      capacity: section.seatCount || 0,
      isActive: true,
    };
  }
}

export const eventServiceV2 = new EventServiceV2();