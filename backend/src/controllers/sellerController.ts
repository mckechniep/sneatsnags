import { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/response";
import { logger } from "../utils/logger";
import { listingService } from "../services/listingService";
import { transactionService } from "../services/transactionService";
import { brokerService } from "../services/brokerService";
import { getPaginationParams, createPaginationResult } from "../utils/pagination";
import { AuthenticatedRequest } from "../types/auth";

export const sellerController = {
  // Get seller dashboard stats
  getDashboard: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const stats = await listingService.getSellerStats(sellerId);
      res.json(successResponse(stats, "Dashboard stats retrieved"));
    } catch (error) {
      logger.error("Get seller dashboard error:", error);
      res.status(500).json(errorResponse("Failed to retrieve dashboard"));
    }
  },

  // Get seller's listings
  getListings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, eventId } = req.query;

      const result = await listingService.getSellerListings(sellerId, {
        skip,
        take: limit,
        status: status as string,
        eventId: eventId as string,
      });

      const paginatedResult = createPaginationResult(
        result.listings,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Listings retrieved"));
    } catch (error) {
      logger.error("Get seller listings error:", error);
      res.status(500).json(errorResponse("Failed to retrieve listings"));
    }
  },

  // Create a new listing
  createListing: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const listingData = { ...req.body, sellerId };
      
      const listing = await listingService.createListing(sellerId, listingData);
      res.status(201).json(successResponse(listing, "Listing created successfully"));
    } catch (error) {
      logger.error("Create listing error:", error);
      res.status(500).json(errorResponse("Failed to create listing"));
    }
  },

  // Update a listing
  updateListing: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;
      
      const listing = await listingService.updateListing(id, sellerId, req.body);
      res.json(successResponse(listing, "Listing updated successfully"));
    } catch (error) {
      logger.error("Update listing error:", error);
      res.status(500).json(errorResponse("Failed to update listing"));
    }
  },

  // Delete a listing
  deleteListing: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;
      
      await listingService.deleteListing(id, sellerId);
      res.json(successResponse(null, "Listing deleted successfully"));
    } catch (error) {
      logger.error("Delete listing error:", error);
      res.status(500).json(errorResponse("Failed to delete listing"));
    }
  },

  // Get seller's transactions
  getTransactions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status } = req.query;

      const result = await transactionService.getSellerTransactions(sellerId, {
        skip,
        take: limit,
        status: status as string,
      });

      const paginatedResult = createPaginationResult(
        result.transactions,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Transactions retrieved"));
    } catch (error) {
      logger.error("Get seller transactions error:", error);
      res.status(500).json(errorResponse("Failed to retrieve transactions"));
    }
  },

  // Accept an offer
  acceptOffer: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { offerId } = req.params;
      const { listingId, quantity } = req.body;
      
      // Validate inventory availability before accepting offer
      if (quantity) {
        await transactionService.validateInventoryAvailability(listingId, quantity);
      }
      
      const transaction = await transactionService.acceptOffer(offerId, listingId, sellerId, quantity);
      res.json(successResponse(transaction, "Offer accepted successfully"));
    } catch (error) {
      logger.error("Accept offer error:", error);
      res.status(500).json(errorResponse("Failed to accept offer"));
    }
  },

  // Mark tickets as delivered
  markTicketsDelivered: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { transactionId } = req.params;
      
      const transaction = await transactionService.markTicketsDelivered(transactionId, sellerId);
      res.json(successResponse(transaction, "Tickets marked as delivered"));
    } catch (error) {
      logger.error("Mark tickets delivered error:", error);
      res.status(500).json(errorResponse("Failed to mark tickets as delivered"));
    }
  },

  // Upload ticket files
  uploadTicketFiles: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { listingId } = req.params;
      const files = req.files as Express.Multer.File[];
      
      logger.info(`Upload request: sellerId=${sellerId}, listingId=${listingId}, files=${files?.length || 0}`);
      
      if (!files || files.length === 0) {
        return res.status(400).json(errorResponse("No files uploaded"));
      }

      // Log file details
      files.forEach((file, index) => {
        logger.info(`File ${index}: ${file.filename}, path: ${file.path}, size: ${file.size}`);
      });

      const fileUrls = files.map(file => `/uploads/${file.filename}`);
      logger.info(`Generated file URLs: ${JSON.stringify(fileUrls)}`);
      
      const listing = await listingService.addTicketFiles(listingId, sellerId, fileUrls);
      
      res.json(successResponse(listing, "Ticket files uploaded successfully"));
    } catch (error) {
      logger.error("Upload ticket files error:", error);
      res.status(500).json(errorResponse("Failed to upload ticket files"));
    }
  },

  // Get offers for a specific listing
  getListingOffers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { listingId } = req.params!;
      const { page, limit, skip } = getPaginationParams(req.query!);
      const { status } = req.query!;
      const sellerId = req.user!.id;

      const result = await listingService.getListingOffers(listingId, sellerId, {
        skip,
        take: limit,
        status: status as string,
      });

      const paginatedResult = createPaginationResult(
        result.offers,
        result.total,
        page,
        limit
      );

      res.json(successResponse({
        ...paginatedResult,
        listing: result.listing,
      }, "Listing offers retrieved"));
    } catch (error) {
      logger.error("Get listing offers error:", error);
      res.status(500).json(errorResponse("Failed to retrieve listing offers"));
    }
  },

  // Get available offers for seller
  getAvailableOffers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query!);
      const { eventId, minPrice, maxPrice } = req.query!;
      const sellerId = req.user!.id;

      const result = await listingService.getAvailableOffers({
        skip,
        take: limit,
        sellerId,
        eventId: eventId as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      });

      const paginatedResult = createPaginationResult(
        result.offers,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Available offers retrieved"));
    } catch (error) {
      logger.error("Get available offers error:", error);
      res.status(500).json(errorResponse("Failed to retrieve offers"));
    }
  },

  // Bulk update inventory
  bulkUpdateInventory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json(errorResponse("Updates must be an array"));
      }

      const updatesWithSeller = updates.map(update => ({
        ...update,
        sellerId,
      }));

      const result = await listingService.bulkUpdateInventory(updatesWithSeller);
      res.json(successResponse(result, "Inventory updated successfully"));
    } catch (error) {
      logger.error("Bulk update inventory error:", error);
      res.status(500).json(errorResponse("Failed to update inventory"));
    }
  },

  // Adjust inventory for a specific listing
  adjustInventory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { listingId } = req.params;
      const { adjustment } = req.body;
      
      if (typeof adjustment !== 'number') {
        return res.status(400).json(errorResponse("Adjustment must be a number"));
      }

      const listing = await listingService.adjustInventory(listingId, sellerId, adjustment);
      res.json(successResponse(listing, "Inventory adjusted successfully"));
    } catch (error) {
      logger.error("Adjust inventory error:", error);
      res.status(500).json(errorResponse("Failed to adjust inventory"));
    }
  },

  // Get low stock alerts
  getLowStockAlerts: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { threshold } = req.query;
      
      const alerts = await listingService.getInventoryLowStockAlerts(
        sellerId,
        threshold ? parseInt(threshold as string) : undefined
      );
      
      res.json(successResponse(alerts, "Low stock alerts retrieved"));
    } catch (error) {
      logger.error("Get low stock alerts error:", error);
      res.status(500).json(errorResponse("Failed to retrieve alerts"));
    }
  },

  // Get inventory report
  getInventoryReport: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { eventId, dateFrom, dateTo } = req.query;
      
      const report = await listingService.getInventoryReport(sellerId, {
        eventId: eventId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });
      
      res.json(successResponse(report, "Inventory report retrieved"));
    } catch (error) {
      logger.error("Get inventory report error:", error);
      res.status(500).json(errorResponse("Failed to retrieve inventory report"));
    }
  },

  // Get available inventory for a listing
  getListingInventory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { listingId } = req.params;
      const availableQuantity = await transactionService.getListingAvailableInventory(listingId);
      
      res.json(successResponse({ availableQuantity }, "Available inventory retrieved"));
    } catch (error) {
      logger.error("Get listing inventory error:", error);
      res.status(500).json(errorResponse("Failed to retrieve available inventory"));
    }
  },

  // ===== BROKER INTEGRATION METHODS =====

  // Get all broker integrations for current seller
  getBrokerIntegrations: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { page, limit, skip } = getPaginationParams(req.query);
      const { isActive, integrationType } = req.query;

      const result = await brokerService.getBrokerIntegrations(userId, {
        skip,
        take: limit,
        isActive: isActive === 'true',
        integrationType: integrationType as string,
      });

      const paginatedResult = createPaginationResult(
        result.integrations,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Broker integrations retrieved"));
    } catch (error) {
      logger.error("Get broker integrations error:", error);
      res.status(500).json(errorResponse("Failed to retrieve broker integrations"));
    }
  },

  // Get single broker integration by ID
  getBrokerIntegrationById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const integration = await brokerService.getBrokerIntegrationById(id, userId);
      
      if (!integration) {
        return res.status(404).json(errorResponse("Broker integration not found"));
      }

      res.json(successResponse(integration, "Broker integration retrieved"));
    } catch (error) {
      logger.error("Get broker integration by ID error:", error);
      res.status(500).json(errorResponse("Failed to retrieve broker integration"));
    }
  },

  // Create new broker integration
  createBrokerIntegration: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const integrationData = { ...req.body, userId };
      
      const integration = await brokerService.createBrokerIntegration(integrationData);
      
      res.status(201).json(successResponse(integration, "Broker integration created successfully"));
    } catch (error) {
      logger.error("Create broker integration error:", error);
      res.status(500).json(errorResponse("Failed to create broker integration"));
    }
  },

  // Update broker integration
  updateBrokerIntegration: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const integration = await brokerService.updateBrokerIntegration(id, userId, req.body);
      
      res.json(successResponse(integration, "Broker integration updated successfully"));
    } catch (error) {
      logger.error("Update broker integration error:", error);
      res.status(500).json(errorResponse("Failed to update broker integration"));
    }
  },

  // Delete broker integration
  deleteBrokerIntegration: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      await brokerService.deleteBrokerIntegration(id, userId);
      
      res.json(successResponse(null, "Broker integration deleted successfully"));
    } catch (error) {
      logger.error("Delete broker integration error:", error);
      res.status(500).json(errorResponse("Failed to delete broker integration"));
    }
  },

  // Test broker connection
  testBrokerConnection: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const result = await brokerService.testBrokerConnection(id, userId);
      
      res.json(successResponse(result, "Broker connection tested"));
    } catch (error) {
      logger.error("Test broker connection error:", error);
      res.status(500).json(errorResponse("Failed to test broker connection"));
    }
  },

  // Trigger manual sync
  triggerSync: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { syncType = 'INCREMENTAL' } = req.body;
      
      const syncLog = await brokerService.triggerSync(id, userId, syncType);
      
      res.json(successResponse(syncLog, "Sync triggered successfully"));
    } catch (error) {
      logger.error("Trigger sync error:", error);
      res.status(500).json(errorResponse("Failed to trigger sync"));
    }
  },

  // Get sync logs for integration
  getSyncLogs: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, syncType } = req.query;

      const result = await brokerService.getSyncLogs(id, userId, {
        skip,
        take: limit,
        status: status as string,
        syncType: syncType as string,
      });

      const paginatedResult = createPaginationResult(
        result.logs,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Sync logs retrieved"));
    } catch (error) {
      logger.error("Get sync logs error:", error);
      res.status(500).json(errorResponse("Failed to retrieve sync logs"));
    }
  },

  // Get sync statistics
  getSyncStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { period = '30d' } = req.query;
      
      const stats = await brokerService.getSyncStats(id, userId, period as string);
      
      res.json(successResponse(stats, "Sync statistics retrieved"));
    } catch (error) {
      logger.error("Get sync stats error:", error);
      res.status(500).json(errorResponse("Failed to retrieve sync statistics"));
    }
  },

  // Update sync schedule
  updateSyncSchedule: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { syncSchedule } = req.body;
      
      if (!syncSchedule) {
        return res.status(400).json(errorResponse("Sync schedule is required"));
      }
      
      const integration = await brokerService.updateSyncSchedule(id, userId, syncSchedule);
      
      res.json(successResponse(integration, "Sync schedule updated successfully"));
    } catch (error) {
      logger.error("Update sync schedule error:", error);
      res.status(500).json(errorResponse("Failed to update sync schedule"));
    }
  },

  // Toggle integration active status
  toggleIntegrationStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const integration = await brokerService.toggleIntegrationStatus(id, userId);
      
      res.json(successResponse(integration, "Integration status updated successfully"));
    } catch (error) {
      logger.error("Toggle integration status error:", error);
      res.status(500).json(errorResponse("Failed to update integration status"));
    }
  },

  // Get supported integration types
  getSupportedTypes: async (req: Request, res: Response) => {
    try {
      const types = [
        {
          type: 'SKYBOX',
          name: 'SkyBox',
          description: 'SkyBox ticket broker integration',
          requirements: ['FTP credentials', 'API key'],
          features: ['Inventory sync', 'Price updates', 'Order management'],
        },
        {
          type: 'AUTOPROCESSOR',
          name: 'AutoProcessor',
          description: 'AutoProcessor ticket broker integration',
          requirements: ['FTP credentials', 'Account ID'],
          features: ['Inventory sync', 'Automated processing'],
        },
        {
          type: 'TICKET_EVOLUTION',
          name: 'Ticket Evolution',
          description: 'Ticket Evolution broker integration',
          requirements: ['API credentials', 'Office ID'],
          features: ['Real-time inventory', 'Order tracking'],
        },
        {
          type: 'CUSTOM_FTP',
          name: 'Custom FTP',
          description: 'Custom FTP-based integration',
          requirements: ['FTP credentials', 'File format specification'],
          features: ['File-based sync', 'Custom mapping'],
        },
      ];
      
      res.json(successResponse(types, "Supported integration types retrieved"));
    } catch (error) {
      logger.error("Get supported types error:", error);
      res.status(500).json(errorResponse("Failed to retrieve supported types"));
    }
  },

  // Validate broker credentials
  validateCredentials: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { integrationType, credentials } = req.body;
      
      if (!integrationType || !credentials) {
        return res.status(400).json(errorResponse("Integration type and credentials are required"));
      }
      
      const result = await brokerService.validateCredentials(integrationType, credentials);
      
      res.json(successResponse(result, "Credentials validated"));
    } catch (error) {
      logger.error("Validate credentials error:", error);
      res.status(500).json(errorResponse("Failed to validate credentials"));
    }
  },
};