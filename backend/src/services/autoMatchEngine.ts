import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';

export interface BuyerPreferences {
  userId: string;
  eventId?: string;
  maxPrice: number;
  minPrice?: number;
  preferredSections?: string[];
  maxQuantity: number;
  minQuantity?: number;
  eventDate?: Date;
  venue?: string;
  category?: string;
  keywords?: string[];
  instantBuyEnabled?: boolean;
  notificationEnabled?: boolean;
}

export interface MatchCriteria {
  priceMatch: number;        // Weight: 0-1 for price compatibility
  sectionMatch: number;      // Weight: 0-1 for section preference match
  quantityMatch: number;     // Weight: 0-1 for quantity compatibility
  timeMatch: number;         // Weight: 0-1 for timing preference
  sellerRating: number;      // Weight: 0-1 for seller reliability
  overallScore: number;      // Combined weighted score
}

export interface MatchResult {
  listingId: string;
  sellerId: string;
  buyerId: string;
  eventId: string;
  matchScore: number;
  matchCriteria: MatchCriteria;
  recommendedPrice: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  autoApproveEligible: boolean;
}

export class AutoMatchEngine {
  private readonly weights = {
    price: 0.35,
    section: 0.25,
    quantity: 0.20,
    timing: 0.10,
    seller: 0.10,
  };

  private readonly confidenceThresholds = {
    HIGH: 0.85,
    MEDIUM: 0.65,
    LOW: 0.45,
  };

  async findMatches(buyerPreferences: BuyerPreferences): Promise<MatchResult[]> {
    try {
      logger.info(`Starting AutoMatch for buyer: ${buyerPreferences.userId}`);

      // Build search criteria
      const searchCriteria = this.buildSearchCriteria(buyerPreferences);
      
      // Find potential listings
      const listings = await this.findPotentialListings(searchCriteria);
      
      // Score each listing
      const matches: MatchResult[] = [];
      
      for (const listing of listings) {
        const matchResult = await this.scoreListing(listing, buyerPreferences);
        if (matchResult.matchScore >= this.confidenceThresholds.LOW) {
          matches.push(matchResult);
        }
      }

      // Sort by match score (highest first)
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Limit to top 10 matches
      const topMatches = matches.slice(0, 10);

      logger.info(`Found ${topMatches.length} matches for buyer: ${buyerPreferences.userId}`);

      // Send notifications if enabled
      if (buyerPreferences.notificationEnabled && topMatches.length > 0) {
        await this.notifyBuyerOfMatches(buyerPreferences.userId, topMatches);
      }

      return topMatches;
    } catch (error) {
      logger.error('Error in AutoMatch engine:', error);
      throw new Error('Failed to find matches');
    }
  }

  private buildSearchCriteria(preferences: BuyerPreferences) {
    return {
      eventId: preferences.eventId,
      priceRange: {
        min: preferences.minPrice || 0,
        max: preferences.maxPrice,
      },
      sections: preferences.preferredSections,
      quantityRange: {
        min: preferences.minQuantity || 1,
        max: preferences.maxQuantity,
      },
      eventDate: preferences.eventDate,
      venue: preferences.venue,
      category: preferences.category,
      keywords: preferences.keywords,
    };
  }

  private async findPotentialListings(criteria: any) {
    const whereClause: any = {
      status: 'ACTIVE',
      availableQuantity: { gt: 0 },
    };

    if (criteria.eventId) {
      whereClause.eventId = criteria.eventId;
    }

    if (criteria.priceRange) {
      whereClause.price = {
        gte: criteria.priceRange.min,
        lte: criteria.priceRange.max,
      };
    }

    if (criteria.quantityRange) {
      whereClause.availableQuantity = {
        ...whereClause.availableQuantity,
        gte: criteria.quantityRange.min,
      };
    }

    if (criteria.sections && criteria.sections.length > 0) {
      whereClause.section = {
        name: { in: criteria.sections },
      };
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            eventDate: true,
            category: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            rating: true,
            totalSales: true,
            memberSince: true,
          },
        },
      },
      take: 50, // Limit for performance
    });

    return listings;
  }

  private async scoreListing(listing: any, preferences: BuyerPreferences): Promise<MatchResult> {
    const criteria: MatchCriteria = {
      priceMatch: this.calculatePriceMatch(listing.price, preferences),
      sectionMatch: this.calculateSectionMatch(listing.section, preferences),
      quantityMatch: this.calculateQuantityMatch(listing.availableQuantity, preferences),
      timeMatch: this.calculateTimeMatch(listing.event.eventDate, preferences),
      sellerRating: this.calculateSellerScore(listing.seller),
      overallScore: 0,
    };

    // Calculate weighted overall score
    criteria.overallScore = 
      criteria.priceMatch * this.weights.price +
      criteria.sectionMatch * this.weights.section +
      criteria.quantityMatch * this.weights.quantity +
      criteria.timeMatch * this.weights.timing +
      criteria.sellerRating * this.weights.seller;

    const confidence = this.determineConfidence(criteria.overallScore);
    const reasons = this.generateMatchReasons(criteria, listing, preferences);
    const recommendedPrice = this.calculateRecommendedPrice(listing, preferences, criteria);
    
    return {
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerId: preferences.userId,
      eventId: listing.eventId,
      matchScore: criteria.overallScore,
      matchCriteria: criteria,
      recommendedPrice,
      confidence,
      reasons,
      autoApproveEligible: this.isAutoApproveEligible(criteria, preferences),
    };
  }

  private calculatePriceMatch(listingPrice: number, preferences: BuyerPreferences): number {
    const maxPrice = preferences.maxPrice;
    const minPrice = preferences.minPrice || 0;
    
    if (listingPrice > maxPrice) return 0;
    if (listingPrice < minPrice) return 0.5; // Below minimum is still good
    
    // Optimal price range is 70-90% of max budget
    const optimalMin = maxPrice * 0.7;
    const optimalMax = maxPrice * 0.9;
    
    if (listingPrice >= optimalMin && listingPrice <= optimalMax) {
      return 1.0;
    } else if (listingPrice < optimalMin) {
      // Linear scale from 0.8 to 1.0 as price approaches optimal range
      return 0.8 + (listingPrice / optimalMin) * 0.2;
    } else {
      // Linear scale from 1.0 to 0.6 as price approaches max budget
      return 1.0 - ((listingPrice - optimalMax) / (maxPrice - optimalMax)) * 0.4;
    }
  }

  private calculateSectionMatch(section: any, preferences: BuyerPreferences): number {
    if (!preferences.preferredSections || preferences.preferredSections.length === 0) {
      return 0.7; // Neutral score if no preference
    }

    if (preferences.preferredSections.includes(section.name)) {
      return 1.0;
    }

    // Check for similar sections (e.g., "Section A" matches "A")
    for (const preferredSection of preferences.preferredSections) {
      if (section.name.toLowerCase().includes(preferredSection.toLowerCase()) ||
          preferredSection.toLowerCase().includes(section.name.toLowerCase())) {
        return 0.8;
      }
    }

    return 0.3; // Low but not zero for non-matching sections
  }

  private calculateQuantityMatch(availableQuantity: number, preferences: BuyerPreferences): number {
    const minQuantity = preferences.minQuantity || 1;
    const maxQuantity = preferences.maxQuantity;

    if (availableQuantity >= maxQuantity) {
      return 1.0; // Perfect match - seller has enough tickets
    } else if (availableQuantity >= minQuantity) {
      // Linear scale based on how close to desired quantity
      return 0.6 + (availableQuantity / maxQuantity) * 0.4;
    } else {
      return 0.2; // Low score if not enough tickets available
    }
  }

  private calculateTimeMatch(eventDate: Date, preferences: BuyerPreferences): number {
    if (!preferences.eventDate) return 0.7; // Neutral if no date preference

    const preferredDate = new Date(preferences.eventDate);
    const listingDate = new Date(eventDate);
    
    const daysDifference = Math.abs(
      (listingDate.getTime() - preferredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 0) return 1.0;
    if (daysDifference <= 1) return 0.9;
    if (daysDifference <= 7) return 0.7;
    if (daysDifference <= 30) return 0.5;
    
    return 0.2;
  }

  private calculateSellerScore(seller: any): number {
    let score = 0.5; // Base score

    // Rating component (0-5 stars to 0-0.3 score)
    if (seller.rating && seller.rating > 0) {
      score += (seller.rating / 5) * 0.3;
    }

    // Sales history component (0-0.2 score)
    if (seller.totalSales) {
      if (seller.totalSales >= 50) score += 0.2;
      else if (seller.totalSales >= 20) score += 0.15;
      else if (seller.totalSales >= 10) score += 0.1;
      else if (seller.totalSales >= 5) score += 0.05;
    }

    // Account age component (0-0.2 score)
    if (seller.memberSince) {
      const accountAgeMonths = Math.floor(
        (Date.now() - new Date(seller.memberSince).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      
      if (accountAgeMonths >= 12) score += 0.2;
      else if (accountAgeMonths >= 6) score += 0.15;
      else if (accountAgeMonths >= 3) score += 0.1;
      else if (accountAgeMonths >= 1) score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  private determineConfidence(overallScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (overallScore >= this.confidenceThresholds.HIGH) return 'HIGH';
    if (overallScore >= this.confidenceThresholds.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  private generateMatchReasons(criteria: MatchCriteria, listing: any, preferences: BuyerPreferences): string[] {
    const reasons: string[] = [];

    if (criteria.priceMatch >= 0.8) {
      reasons.push(`Great price match within your budget of $${preferences.maxPrice}`);
    } else if (criteria.priceMatch >= 0.6) {
      reasons.push(`Good value at $${listing.price}`);
    }

    if (criteria.sectionMatch >= 0.8) {
      reasons.push(`Matches your preferred section: ${listing.section.name}`);
    }

    if (criteria.quantityMatch >= 0.8) {
      reasons.push(`Has ${listing.availableQuantity} tickets available`);
    }

    if (criteria.sellerRating >= 0.8) {
      reasons.push(`Highly rated seller (${listing.seller.rating}/5 stars)`);
    }

    if (criteria.timeMatch >= 0.8) {
      reasons.push(`Event date matches your preferences`);
    }

    if (listing.seller.totalSales >= 20) {
      reasons.push(`Experienced seller with ${listing.seller.totalSales} successful sales`);
    }

    return reasons;
  }

  private calculateRecommendedPrice(listing: any, preferences: BuyerPreferences, criteria: MatchCriteria): number {
    const basePrice = listing.price;
    
    // Adjust based on match quality
    if (criteria.overallScore >= this.confidenceThresholds.HIGH) {
      return basePrice; // Fair price for high-quality match
    } else if (criteria.overallScore >= this.confidenceThresholds.MEDIUM) {
      return Math.max(basePrice * 0.95, preferences.minPrice || basePrice * 0.8);
    } else {
      return Math.max(basePrice * 0.90, preferences.minPrice || basePrice * 0.7);
    }
  }

  private isAutoApproveEligible(criteria: MatchCriteria, preferences: BuyerPreferences): boolean {
    return (
      preferences.instantBuyEnabled === true &&
      criteria.overallScore >= this.confidenceThresholds.HIGH &&
      criteria.priceMatch >= 0.9 &&
      criteria.sellerRating >= 0.8
    );
  }

  private async notifyBuyerOfMatches(buyerId: string, matches: MatchResult[]): Promise<void> {
    const topMatch = matches[0];
    const matchCount = matches.length;

    let message = `Found ${matchCount} ticket matches for you! `;
    
    if (topMatch.confidence === 'HIGH') {
      message += `Top match: ${topMatch.matchScore.toFixed(1)}/10 confidence score.`;
    } else {
      message += `Best match has a ${topMatch.matchScore.toFixed(1)}/10 confidence score.`;
    }

    await notificationService.createNotification({
      userId: buyerId,
      type: 'SYSTEM_ALERT',
      title: 'New Ticket Matches Found!',
      message,
      data: {
        matchCount,
        topMatchId: topMatch.listingId,
        matches: matches.slice(0, 3), // Include top 3 matches
      },
      sendEmail: true,
    });
  }

  async createBuyerPreferences(preferences: BuyerPreferences): Promise<any> {
    try {
      const savedPreferences = await prisma.buyerPreference.create({
        data: {
          userId: preferences.userId,
          eventId: preferences.eventId,
          maxPrice: preferences.maxPrice,
          minPrice: preferences.minPrice,
          maxQuantity: preferences.maxQuantity,
          minQuantity: preferences.minQuantity,
          preferredSections: preferences.preferredSections || [],
          keywords: preferences.keywords || [],
          instantBuyEnabled: preferences.instantBuyEnabled || false,
          notificationEnabled: preferences.notificationEnabled !== false,
        },
      });

      logger.info(`Buyer preferences created for user: ${preferences.userId}`);
      return savedPreferences;
    } catch (error) {
      logger.error('Error creating buyer preferences:', error);
      throw new Error('Failed to create buyer preferences');
    }
  }

  async runScheduledMatching(): Promise<void> {
    try {
      logger.info('Starting scheduled AutoMatch run...');

      // Find all active buyer preferences
      const activePreferences = await prisma.buyerPreference.findMany({
        where: {
          isActive: true,
          notificationEnabled: true,
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true },
          },
        },
      });

      let totalMatches = 0;

      for (const pref of activePreferences) {
        try {
          const matches = await this.findMatches({
            userId: pref.userId,
            eventId: pref.eventId || undefined,
            maxPrice: pref.maxPrice,
            minPrice: pref.minPrice || undefined,
            preferredSections: pref.preferredSections,
            maxQuantity: pref.maxQuantity,
            minQuantity: pref.minQuantity || undefined,
            eventDate: pref.eventDate || undefined,
            venue: pref.venue || undefined,
            category: pref.category || undefined,
            keywords: pref.keywords,
            instantBuyEnabled: pref.instantBuyEnabled,
            notificationEnabled: pref.notificationEnabled,
          });

          totalMatches += matches.length;

          // Update last run timestamp
          await prisma.buyerPreference.update({
            where: { id: pref.id },
            data: { lastMatchRun: new Date() },
          });
        } catch (error) {
          logger.error(`Error processing matches for user ${pref.userId}:`, error);
        }
      }

      logger.info(`Scheduled AutoMatch completed. Found ${totalMatches} total matches across ${activePreferences.length} users.`);
    } catch (error) {
      logger.error('Error in scheduled matching:', error);
    }
  }
}

export const autoMatchEngine = new AutoMatchEngine();