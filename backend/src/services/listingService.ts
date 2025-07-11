import { prisma } from "../utils/prisma";
import {
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchQuery,
} from "../types/listing";
import { PaginationResponse } from "../types/api";
import { logger } from "../utils/logger";

export class ListingService {
  async createListing(sellerId: string, data: CreateListingRequest) {
    // Validate event and section
    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
      include: { event: true },
    });

    if (!section || section.eventId !== data.eventId) {
      throw new Error("Invalid event or section");
    }

    if (!section.event.isActive) {
      throw new Error("Event is not active");
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        eventId: data.eventId,
        sectionId: data.sectionId,
        row: data.row,
        seats: data.seats,
        price: data.price,
        quantity: data.quantity,
        notes: data.notes,
        ticketFiles: data.ticketFiles || [],
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            eventDate: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info(`Listing created: ${listing.id} by seller: ${sellerId}`);
    return listing;
  }

  async getListingById(id: string) {
    return await prisma.listing.findUnique({
      where: { id },
      include: {
        event: true,
        section: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateListing(id: string, sellerId: string, data: UpdateListingRequest) {
    const listing = await prisma.listing.update({
      where: { id, sellerId },
      data,
      include: {
        event: true,
        section: true,
      },
    });

    logger.info(`Listing updated: ${id}`);
    return listing;
  }

  async deleteListing(id: string, sellerId: string) {
    await prisma.listing.delete({
      where: { id, sellerId },
    });

    logger.info(`Listing deleted: ${id}`);
  }

  async getListings(params: {
    skip: number;
    take: number;
    eventId?: string;
    sectionId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    city?: string;
    state?: string;
  }) {
    const { skip, take, eventId, sectionId, minPrice, maxPrice, status, city, state } = params;
    
    const where: any = {};
    
    if (eventId) where.eventId = eventId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }
    
    if (city || state) {
      where.event = {};
      if (city) where.event.city = { contains: city, mode: "insensitive" };
      if (state) where.event.state = { contains: state, mode: "insensitive" };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          event: true,
          section: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return { listings, total };
  }

  async getListingsByEvent(eventId: string, params: {
    skip: number;
    take: number;
    sectionId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }) {
    const { skip, take, sectionId, minPrice, maxPrice, status } = params;
    
    const where: any = { eventId };
    
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { price: "asc" },
        include: {
          event: true,
          section: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return { listings, total };
  }

  async getListingsBySection(sectionId: string, params: {
    skip: number;
    take: number;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }) {
    const { skip, take, minPrice, maxPrice, status } = params;
    
    const where: any = { sectionId };
    
    if (status) where.status = status;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { price: "asc" },
        include: {
          event: true,
          section: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return { listings, total };
  }

  async getListingStats(params: {
    eventId?: string;
    sectionId?: string;
  }) {
    const { eventId, sectionId } = params;
    
    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (sectionId) where.sectionId = sectionId;

    const [stats, priceStats] = await Promise.all([
      prisma.listing.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.listing.aggregate({
        where,
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      totalListings: stats.reduce((sum: number, stat: any) => sum + stat._count, 0),
      byStatus: stats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      priceStats: {
        average: priceStats._avg.price || 0,
        min: priceStats._min.price || 0,
        max: priceStats._max.price || 0,
      },
    };
  }

  async searchListings(params: {
    query: string;
    eventId?: string;
    sectionId?: string;
    minPrice?: number;
    maxPrice?: number;
    limit: number;
  }) {
    const { query, eventId, sectionId, minPrice, maxPrice, limit } = params;
    
    const where: any = {
      status: "AVAILABLE",
      OR: [
        { notes: { contains: query, mode: "insensitive" } },
        { seats: { has: query } },
        { event: { name: { contains: query, mode: "insensitive" } } },
      ],
    };
    
    if (eventId) where.eventId = eventId;
    if (sectionId) where.sectionId = sectionId;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    return await prisma.listing.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: true,
        section: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getRecentListings(params: {
    limit: number;
    eventId?: string;
    city?: string;
    state?: string;
  }) {
    const { limit, eventId, city, state } = params;
    
    const where: any = {
      status: "AVAILABLE",
    };
    
    if (eventId) where.eventId = eventId;
    
    if (city || state) {
      where.event = {};
      if (city) where.event.city = { contains: city, mode: "insensitive" };
      if (state) where.event.state = { contains: state, mode: "insensitive" };
    }

    return await prisma.listing.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: true,
        section: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getSimilarListings(listingId: string, limit: number) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { event: true, section: true },
    });

    if (!listing) return [];

    return await prisma.listing.findMany({
      where: {
        id: { not: listingId },
        eventId: listing.eventId,
        status: "AVAILABLE",
        price: {
          gte: Number(listing.price) * 0.8,
          lte: Number(listing.price) * 1.2,
        },
      },
      take: limit,
      orderBy: { price: "asc" },
      include: {
        event: true,
        section: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async addTicketFiles(listingId: string, sellerId: string, fileUrls: string[]) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId, sellerId },
    });

    if (!listing) {
      throw new Error("Listing not found or not owned by seller");
    }

    return await prisma.listing.update({
      where: { id: listingId },
      data: {
        ticketFiles: [...listing.ticketFiles, ...fileUrls],
      },
    });
  }

  async markAsSold(listingId: string, sellerId: string) {
    return await prisma.listing.update({
      where: { id: listingId, sellerId },
      data: { status: "SOLD" },
    });
  }

  async getSellerListings(sellerId: string, params: {
    skip: number;
    take: number;
    status?: string;
    eventId?: string;
  }) {
    const { skip, take, status, eventId } = params;
    
    const where: any = { sellerId };
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          event: true,
          section: true,
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // For each listing, get matching offers from the event
    const listingsWithOffers = await Promise.all(
      listings.map(async (listing) => {
        const matchingOffers = await prisma.offer.findMany({
          where: {
            eventId: listing.eventId,
            status: 'ACTIVE',
            expiresAt: { gte: new Date() },
            // Check if the offer's sections match the listing's section
            sections: {
              some: {
                sectionId: listing.sectionId,
              },
            },
          },
          include: {
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            sections: {
              include: {
                section: true,
              },
            },
          },
          orderBy: { maxPrice: 'desc' },
        });

        return {
          ...listing,
          matchingOffers,
          offerCount: matchingOffers.length,
        };
      })
    );

    return { listings: listingsWithOffers, total };
  }

  async getSellerStats(sellerId: string) {
    const [totalListings, activeListings, soldListings, totalRevenue] = await Promise.all([
      prisma.listing.count({ where: { sellerId } }),
      prisma.listing.count({ where: { sellerId, status: "AVAILABLE" } }),
      prisma.listing.count({ where: { sellerId, status: "SOLD" } }),
      prisma.transaction.aggregate({
        where: { listing: { sellerId } },
        _sum: { sellerAmount: true },
      }),
    ]);

    return {
      totalListings,
      activeListings,
      soldListings,
      totalRevenue: totalRevenue._sum.sellerAmount || 0,
    };
  }

  async getListingOffers(listingId: string, sellerId: string, params: {
    skip: number;
    take: number;
    status?: string;
  }) {
    const { skip, take, status } = params;
    
    // Verify the listing belongs to the seller
    const listing = await prisma.listing.findUnique({
      where: { id: listingId, sellerId },
      include: {
        event: true,
        section: true,
      },
    });

    if (!listing) {
      throw new Error("Listing not found or not owned by seller");
    }

    // Get offers for this event that match the listing's section
    const where: any = {
      eventId: listing.eventId,
      sections: {
        some: {
          sectionId: listing.sectionId,
        },
      },
    };
    if (status) where.status = status;

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take,
        orderBy: { maxPrice: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              venue: true,
              eventDate: true,
            },
          },
          sections: {
            include: {
              section: true,
            },
          },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    return { offers, total, listing };
  }

  async getAvailableOffers(params: {
    skip: number;
    take: number;
    sellerId: string;
    eventId?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const { skip, take, sellerId, eventId, minPrice, maxPrice } = params;
    
    // First, get the seller's available listings to determine which offers they can fulfill
    const sellerListings = await prisma.listing.findMany({
      where: {
        sellerId,
        status: "AVAILABLE",
      },
      select: {
        eventId: true,
        sectionId: true,
        price: true,
      },
    });

    // If seller has no available listings, return empty result
    if (sellerListings.length === 0) {
      return { offers: [], total: 0 };
    }

    // Extract event IDs and section IDs from seller's listings
    const sellerEventIds = [...new Set(sellerListings.map((l: any) => l.eventId))];
    const sellerSectionIds = [...new Set(sellerListings.map((l: any) => l.sectionId))];
    
    const where: any = {
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
      // Only show offers for events where seller has listings
      eventId: { in: sellerEventIds },
    };
    
    // Apply additional filters if provided
    if (eventId) {
      where.eventId = eventId;
    }
    
    if (minPrice || maxPrice) {
      where.maxPrice = {};
      if (minPrice) where.maxPrice.gte = minPrice;
      if (maxPrice) where.maxPrice.lte = maxPrice;
    }

    const offers = await prisma.offer.findMany({
      where,
      skip,
      take,
      orderBy: { maxPrice: "desc" },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        event: true,
        sections: {
          include: {
            section: true,
          },
        },
      },
    });

    // Further filter offers to only show those where seller has matching sections
    const filteredOffers = offers.filter((offer: any) => {
      // If offer doesn't specify sections, seller can fulfill it with any section
      if (!offer.sections || offer.sections.length === 0) {
        return true;
      }
      
      // Check if seller has at least one matching section for this offer
      const offerSectionIds = offer.sections.map((s: any) => s.sectionId);
      const hasMatchingSection = offerSectionIds.some((sectionId: string) => 
        sellerSectionIds.includes(sectionId)
      );
      
      return hasMatchingSection;
    });

    // Count total offers that match the criteria (for pagination)
    const totalOffers = await prisma.offer.count({ where });

    return { offers: filteredOffers, total: totalOffers };
  }
}

export const listingService = new ListingService();