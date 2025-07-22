import { Request, Response } from 'express';
import { autoMatchEngine, BuyerPreferences } from '../services/autoMatchEngine';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';
import { prisma } from '../utils/prisma';

export class AutoMatchController {
  async findMatches(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        eventId,
        maxPrice,
        minPrice,
        preferredSections,
        maxQuantity = 1,
        minQuantity = 1,
        instantBuyEnabled = false,
        notificationEnabled = true
      } = req.body;

      if (!maxPrice || maxPrice <= 0) {
        return res.status(400).json({ error: 'Valid max price is required' });
      }

      const preferences: BuyerPreferences = {
        userId,
        eventId,
        maxPrice,
        minPrice,
        preferredSections,
        maxQuantity,
        minQuantity,
        instantBuyEnabled,
        notificationEnabled,
      };

      const matches = await autoMatchEngine.findMatches(preferences);

      res.json({
        matches,
        totalFound: matches.length,
        highConfidenceMatches: matches.filter(m => m.confidence === 'HIGH').length,
        autoApproveEligible: matches.filter(m => m.autoApproveEligible).length,
      });
    } catch (error) {
      logger.error('Error finding matches:', error);
      res.status(500).json({ error: 'Failed to find matches' });
    }
  }

  async createBuyerPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const preferences = { ...req.body, userId };

      const savedPreferences = await autoMatchEngine.createBuyerPreferences(preferences);

      res.status(201).json(savedPreferences);
    } catch (error) {
      logger.error('Error creating buyer preferences:', error);
      res.status(500).json({ error: 'Failed to create buyer preferences' });
    }
  }

  async getBuyerPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const preferences = await prisma.buyerPreference.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              venue: true,
              eventDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(preferences);
    } catch (error) {
      logger.error('Error retrieving buyer preferences:', error);
      res.status(500).json({ error: 'Failed to retrieve preferences' });
    }
  }

  async updateBuyerPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updateData = req.body;

      const preferences = await prisma.buyerPreference.updateMany({
        where: { 
          id, 
          userId // Ensure user owns this preference
        },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      if (preferences.count === 0) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      const updatedPreferences = await prisma.buyerPreference.findUnique({
        where: { id },
      });

      res.json(updatedPreferences);
    } catch (error) {
      logger.error('Error updating buyer preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  async deleteBuyerPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await prisma.buyerPreference.deleteMany({
        where: { 
          id, 
          userId // Ensure user owns this preference
        },
      });

      if (deleted.count === 0) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json({ message: 'Preferences deleted successfully' });
    } catch (error) {
      logger.error('Error deleting buyer preferences:', error);
      res.status(500).json({ error: 'Failed to delete preferences' });
    }
  }

  async getMatchHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const matches = await prisma.matchResult.findMany({
        where: { buyerId: userId },
        include: {
          listing: {
            include: {
              event: {
                select: {
                  name: true,
                  venue: true,
                  eventDate: true,
                },
              },
              section: {
                select: {
                  name: true,
                },
              },
              seller: {
                select: {
                  firstName: true,
                  rating: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit),
      });

      const total = await prisma.matchResult.count({
        where: { buyerId: userId },
      });

      res.json({
        matches,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error retrieving match history:', error);
      res.status(500).json({ error: 'Failed to retrieve match history' });
    }
  }

  async markMatchViewed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { matchId } = req.params;

      const updated = await prisma.matchResult.updateMany({
        where: { 
          id: matchId, 
          buyerId: userId 
        },
        data: { 
          isViewed: true,
        },
      });

      if (updated.count === 0) {
        return res.status(404).json({ error: 'Match not found' });
      }

      res.json({ message: 'Match marked as viewed' });
    } catch (error) {
      logger.error('Error marking match as viewed:', error);
      res.status(500).json({ error: 'Failed to update match status' });
    }
  }

  async createPriceAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { eventId, sectionId, maxPrice } = req.body;

      if (!eventId || !maxPrice || maxPrice <= 0) {
        return res.status(400).json({ 
          error: 'Event ID and valid target price are required' 
        });
      }

      // Check if alert already exists
      const existingAlert = await prisma.priceAlert.findFirst({
        where: {
          userId,
          eventId,
          sectionId: sectionId || null,
          isActive: true,
        },
      });

      if (existingAlert) {
        return res.status(400).json({ 
          error: 'Price alert already exists for this event and section' 
        });
      }

      const alert = await prisma.priceAlert.create({
        data: {
          userId,
          eventId,
          sectionId,
          maxPrice,
        },
      });

      res.status(201).json(alert);
    } catch (error) {
      logger.error('Error creating price alert:', error);
      res.status(500).json({ error: 'Failed to create price alert' });
    }
  }

  async getPriceAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const alerts = await prisma.priceAlert.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              name: true,
              venue: true,
              eventDate: true,
            },
          },
          section: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(alerts);
    } catch (error) {
      logger.error('Error retrieving price alerts:', error);
      res.status(500).json({ error: 'Failed to retrieve price alerts' });
    }
  }

  async deleteAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { alertId } = req.params;

      const deleted = await prisma.priceAlert.deleteMany({
        where: { 
          id: alertId, 
          userId 
        },
      });

      if (deleted.count === 0) {
        return res.status(404).json({ error: 'Price alert not found' });
      }

      res.json({ message: 'Price alert deleted successfully' });
    } catch (error) {
      logger.error('Error deleting price alert:', error);
      res.status(500).json({ error: 'Failed to delete price alert' });
    }
  }

  // Admin endpoint to trigger manual matching
  async triggerMatching(req: AuthenticatedRequest, res: Response) {
    try {
      // Only allow admin users to trigger manual matching
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Run matching in background
      autoMatchEngine.runScheduledMatching()
        .catch(error => logger.error('Manual matching failed:', error));

      res.json({ message: 'Manual matching triggered successfully' });
    } catch (error) {
      logger.error('Error triggering manual matching:', error);
      res.status(500).json({ error: 'Failed to trigger matching' });
    }
  }
}

export const autoMatchController = new AutoMatchController();