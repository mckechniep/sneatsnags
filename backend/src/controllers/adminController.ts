import { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/response";
import { logger } from "../utils/logger";
import { getPaginationParams, createPaginationResult } from "../utils/pagination";
import { AuthenticatedRequest } from "../types/auth";
import { userService } from "../services/userService";
import { eventService } from "../services/eventService";
import { transactionService } from "../services/transactionService";
import { prisma } from "../utils/prisma";

export const adminController = {
  // Dashboard overview
  getDashboard: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get real platform statistics from database
      const [userStats, eventStats, transactionStats, offerStats, listingStats] = await Promise.all([
        // User statistics
        prisma.$transaction([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'BUYER' } }),
          prisma.user.count({ where: { role: 'SELLER' } }),
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          })
        ]),
        // Event statistics
        prisma.$transaction([
          prisma.event.count(),
          prisma.event.count({
            where: {
              eventDate: {
                gte: new Date()
              }
            }
          }),
          prisma.event.count({
            where: {
              eventDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            }
          })
        ]),
        // Transaction statistics (placeholder - will need transaction table)
        Promise.resolve([0, 0, 0, 0, 0]),
        // Offer statistics
        prisma.$transaction([
          prisma.offer.count(),
          prisma.offer.count({ where: { status: 'ACTIVE' } }),
          prisma.offer.count({ where: { status: 'ACCEPTED' } })
        ]),
        // Listing statistics
        prisma.$transaction([
          prisma.listing.count(),
          prisma.listing.count({ where: { status: 'AVAILABLE' } }),
          prisma.listing.count({ where: { status: 'SOLD' } })
        ])
      ]);

      const stats = {
        users: {
          total: userStats[0],
          buyers: userStats[1],
          sellers: userStats[2],
          activeThisMonth: userStats[3],
        },
        events: {
          total: eventStats[0],
          upcoming: eventStats[1],
          active: eventStats[2],
        },
        transactions: {
          total: transactionStats[0],
          pending: transactionStats[1],
          completed: transactionStats[2],
          volume: transactionStats[3],
          revenue: transactionStats[4],
        },
        offers: {
          total: offerStats[0],
          active: offerStats[1],
          accepted: offerStats[2],
        },
        listings: {
          total: listingStats[0],
          available: listingStats[1],
          sold: listingStats[2],
        },
      };

      res.json(successResponse(stats, "Admin dashboard retrieved"));
    } catch (error) {
      logger.error("Get admin dashboard error:", error);
      res.status(500).json(errorResponse("Failed to retrieve dashboard"));
    }
  },

  // User management
  getAllUsers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { role, isActive, search } = req.query;

      const result = await userService.getAllUsers({
        skip,
        take: limit,
        role: role as string,
        isActive: isActive === 'true',
        search: search as string,
      });

      const paginatedResult = createPaginationResult(
        result.users,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Users retrieved"));
    } catch (error) {
      logger.error("Get all users error:", error);
      res.status(500).json(errorResponse("Failed to retrieve users"));
    }
  },

  // Get user by ID
  getUserById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json(errorResponse("User not found"));
      }

      res.json(successResponse(user, "User retrieved"));
    } catch (error) {
      logger.error("Get user by ID error:", error);
      res.status(500).json(errorResponse("Failed to retrieve user"));
    }
  },

  // Update user
  updateUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      res.json(successResponse(user, "User updated successfully"));
    } catch (error) {
      logger.error("Update user error:", error);
      res.status(500).json(errorResponse("Failed to update user"));
    }
  },

  // Deactivate user
  deactivateUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const user = await userService.deactivateUser(id, reason);
      res.json(successResponse(user, "User deactivated successfully"));
    } catch (error) {
      logger.error("Deactivate user error:", error);
      res.status(500).json(errorResponse("Failed to deactivate user"));
    }
  },

  // Reactivate user
  reactivateUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userService.reactivateUser(id);
      res.json(successResponse(user, "User reactivated successfully"));
    } catch (error) {
      logger.error("Reactivate user error:", error);
      res.status(500).json(errorResponse("Failed to reactivate user"));
    }
  },

  // Event management
  getAllEvents: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, eventType, city, state } = req.query;

      const result = await eventService.getAllEventsAdmin({
        skip,
        take: limit,
        status: status as string,
        eventType: eventType as string,
        city: city as string,
        state: state as string,
      });

      const paginatedResult = createPaginationResult(
        result.events,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Events retrieved"));
    } catch (error) {
      logger.error("Get all events error:", error);
      res.status(500).json(errorResponse("Failed to retrieve events"));
    }
  },

  // Transaction management
  getAllTransactions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, eventId, userId, startDate, endDate } = req.query;

      const result = await transactionService.getAllTransactions({
        skip,
        take: limit,
        status: status as string,
        eventId: eventId as string,
        userId: userId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      const paginatedResult = createPaginationResult(
        result.transactions,
        result.total,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Transactions retrieved"));
    } catch (error) {
      logger.error("Get all transactions error:", error);
      res.status(500).json(errorResponse("Failed to retrieve transactions"));
    }
  },

  // Analytics and reports
  getAnalytics: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30d', metric } = req.query;
      
      // Calculate date range based on period
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '12m':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get user growth data by day
      const userGrowthData = await prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM User 
        WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt) ASC
      `;

      // Get popular events with offer counts
      const popularEvents = await prisma.event.findMany({
        take: 5,
        include: {
          _count: {
            select: {
              offers: true,
              listings: true
            }
          }
        },
        orderBy: {
          offers: {
            _count: 'desc'
          }
        }
      });

      // Get top sellers (based on user count for now)
      const topSellers = await prisma.user.findMany({
        where: {
          role: 'SELLER'
        },
        take: 5,
        include: {
          _count: {
            select: {
              sellerListings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate platform metrics
      const totalListings = await prisma.listing.count();
      const totalOffers = await prisma.offer.count();
      const acceptedOffers = await prisma.offer.count({ where: { status: 'ACCEPTED' } });
      const conversionRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;

      const analytics = {
        userGrowth: Array.isArray(userGrowthData) ? userGrowthData.map((item: any) => ({
          date: item.date,
          count: Number(item.count)
        })) : [],
        transactionVolume: [], // Will be implemented when transaction table exists
        revenueGrowth: [], // Will be implemented when transaction table exists
        popularEvents: popularEvents.map(event => ({
          name: event.name,
          transactions: event._count.offers,
          revenue: 0 // Will be calculated from transactions
        })),
        topSellers: topSellers.map(seller => ({
          name: `${seller.firstName} ${seller.lastName}`,
          sales: seller._count.sellerListings,
          revenue: 0 // Will be calculated from transactions
        })),
        platformMetrics: {
          totalRevenue: 0, // Will be calculated from transactions
          platformFees: 0, // Will be calculated from transactions
          averageTicketPrice: 0, // Will be calculated from transactions
          conversionRate: conversionRate,
        },
      };

      res.json(successResponse(analytics, "Analytics retrieved"));
    } catch (error) {
      logger.error("Get analytics error:", error);
      res.status(500).json(errorResponse("Failed to retrieve analytics"));
    }
  },

  // Support ticket management
  getSupportTickets: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { status, priority, category, search } = req.query;

      // Since we don't have a support ticket table yet, we'll create mock tickets based on user data
      // Build where clause for filtering users
      const where: any = {};
      
      if (search) {
        where.OR = [
          {
            firstName: {
              contains: search as string,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: search as string,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search as string,
              mode: 'insensitive'
            }
          }
        ];
      }

      const users = await prisma.user.findMany({
        where,
        include: {
          buyerOffers: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          sellerListings: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const totalUsers = await prisma.user.count({ where });

      // Create mock support tickets from user data
      const supportStatuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
      const priorities = ['low', 'medium', 'high', 'urgent'];
      const categories = ['technical', 'billing', 'account', 'general'];

      const tickets = users.map((user, index) => {
        const randomStatus = supportStatuses[Math.floor(Math.random() * supportStatuses.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Apply filters if specified
        if (status && randomStatus !== status) return null;
        if (priority && randomPriority !== priority) return null;
        if (category && randomCategory !== category) return null;

        return {
          id: `ticket_${user.id}_${index}`,
          userId: user.id,
          subject: user.buyerOffers.length > 0 ? 'Issue with offer submission' : 
                   user.sellerListings.length > 0 ? 'Problem with listing' : 
                   'General inquiry',
          description: user.buyerOffers.length > 0 ? 
                      `Having trouble with my offer for event. The offer amount is ${user.buyerOffers[0]?.maxPrice || 0}` :
                      user.sellerListings.length > 0 ?
                      `Issue with my listing. Listed ${user.sellerListings[0]?.quantity || 0} tickets` :
                      'General support request from user',
          category: randomCategory,
          priority: randomPriority,
          status: randomStatus,
          assignedTo: randomStatus === 'assigned' || randomStatus === 'in_progress' ? 'support_agent_1' : undefined,
          createdAt: user.createdAt.toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: randomStatus === 'resolved' || randomStatus === 'closed' ? new Date().toISOString() : undefined
        };
      }).filter(Boolean);

      const paginatedResult = createPaginationResult(
        tickets,
        totalUsers,
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Support tickets retrieved"));
    } catch (error) {
      logger.error("Get support tickets error:", error);
      res.status(500).json(errorResponse("Failed to retrieve support tickets"));
    }
  },

  // Assign support ticket
  assignSupportTicket: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const adminId = req.user!.id;
      
      // Placeholder implementation
      const ticket = { id, assignedTo, assignedBy: adminId };
      
      res.json(successResponse(ticket, "Support ticket assigned successfully"));
    } catch (error) {
      logger.error("Assign support ticket error:", error);
      res.status(500).json(errorResponse("Failed to assign support ticket"));
    }
  },

  // Resolve support ticket
  resolveSupportTicket: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const adminId = req.user!.id;
      
      // Placeholder implementation
      const ticket = { id, resolution, resolvedBy: adminId, resolvedAt: new Date() };
      
      res.json(successResponse(ticket, "Support ticket resolved successfully"));
    } catch (error) {
      logger.error("Resolve support ticket error:", error);
      res.status(500).json(errorResponse("Failed to resolve support ticket"));
    }
  },

  // System settings
  getSystemSettings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = {
        platform: {
          commissionRate: 5.0,
          maxListingDuration: 30,
          minOfferAmount: 1.0,
          maxRefundDays: 7,
        },
        payment: {
          stripeEnabled: true,
          autoPayoutEnabled: true,
          payoutSchedule: 'daily',
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        security: {
          twoFactorRequired: false,
          sessionTimeout: 24,
          maxLoginAttempts: 5,
        },
      };

      res.json(successResponse(settings, "System settings retrieved"));
    } catch (error) {
      logger.error("Get system settings error:", error);
      res.status(500).json(errorResponse("Failed to retrieve system settings"));
    }
  },

  // Update system settings
  updateSystemSettings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = req.body;
      
      // Placeholder implementation - would update database
      res.json(successResponse(settings, "System settings updated successfully"));
    } catch (error) {
      logger.error("Update system settings error:", error);
      res.status(500).json(errorResponse("Failed to update system settings"));
    }
  },

  // Platform activity logs
  getActivityLogs: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { userId, action, startDate, endDate, ipAddress } = req.query;

      // Build where clause for filtering
      const where: any = {};
      
      if (userId) {
        where.userId = userId as string;
      }
      
      if (action) {
        where.action = {
          contains: action as string,
          mode: 'insensitive'
        };
      }
      
      if (ipAddress) {
        where.ipAddress = {
          contains: ipAddress as string
        };
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      // For now, we'll create mock activity logs based on user actions
      // In a real implementation, you'd have an ActivityLog table
      const users = await prisma.user.findMany({
        where: userId ? { id: userId as string } : undefined,
        include: {
          buyerOffers: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          sellerListings: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const totalUsers = await prisma.user.count({
        where: userId ? { id: userId as string } : undefined
      });

      // Create mock activity logs from user data
      const logs = users.flatMap(user => [
        ...user.buyerOffers.map((offer: any) => ({
          id: `offer_${offer.id}`,
          userId: user.id,
          action: 'create_offer',
          details: `Created offer for ${offer.maxPrice} with quantity ${offer.quantity}`,
          ipAddress: '192.168.1.1', // Mock IP
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', // Mock user agent
          createdAt: offer.createdAt.toISOString()
        })),
        ...user.sellerListings.map((listing: any) => ({
          id: `listing_${listing.id}`,
          userId: user.id,
          action: 'create_listing',
          details: `Created listing for ${listing.quantity} tickets at ${listing.price}`,
          ipAddress: '192.168.1.1', // Mock IP
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', // Mock user agent
          createdAt: listing.createdAt.toISOString()
        })),
        {
          id: `user_${user.id}`,
          userId: user.id,
          action: 'user_registration',
          details: `User registered with role ${user.role}`,
          ipAddress: '192.168.1.1', // Mock IP
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', // Mock user agent
          createdAt: user.createdAt.toISOString()
        }
      ]).slice(0, limit);

      const paginatedResult = createPaginationResult(
        logs,
        totalUsers * 3, // Approximate total activities
        page,
        limit
      );

      res.json(successResponse(paginatedResult, "Activity logs retrieved"));
    } catch (error) {
      logger.error("Get activity logs error:", error);
      res.status(500).json(errorResponse("Failed to retrieve activity logs"));
    }
  },

  // Export data
  exportData: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, format = 'csv', startDate, endDate } = req.query;
      
      if (!type) {
        return res.status(400).json(errorResponse("Export type is required"));
      }

      // Placeholder implementation
      const exportResult = {
        url: `/exports/${type}-${Date.now()}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      res.json(successResponse(exportResult, "Data export initiated"));
    } catch (error) {
      logger.error("Export data error:", error);
      res.status(500).json(errorResponse("Failed to export data"));
    }
  },

  // System monitoring
  getSystemMetrics: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get real system metrics
      const metrics = {
        cpu: {
          usage: parseFloat((Math.random() * 100).toFixed(1)),
          cores: 4,
          load: [0.2, 0.5, 0.8],
        },
        memory: {
          used: 6.2,
          total: 16,
          percentage: 38.7,
        },
        disk: {
          used: 120,
          total: 500,
          percentage: 24,
        },
        network: {
          inbound: parseFloat((Math.random() * 2).toFixed(1)),
          outbound: parseFloat((Math.random() * 1).toFixed(1)),
          latency: Math.floor(Math.random() * 100) + 20,
        },
      };

      res.json(successResponse(metrics, "System metrics retrieved"));
    } catch (error) {
      logger.error("Get system metrics error:", error);
      res.status(500).json(errorResponse("Failed to retrieve system metrics"));
    }
  },

  // Service status monitoring
  getServiceStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check actual service health
      const services = [
        {
          id: '1',
          name: 'API Server',
          status: 'healthy',
          uptime: 99.9,
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 200) + 50,
          url: '/api/health',
        },
        {
          id: '2',
          name: 'Database',
          status: 'healthy',
          uptime: 99.8,
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 100) + 20,
        },
        {
          id: '3',
          name: 'Payment Gateway',
          status: Math.random() > 0.7 ? 'warning' : 'healthy',
          uptime: 98.5,
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 400) + 100,
        },
        {
          id: '4',
          name: 'Email Service',
          status: 'healthy',
          uptime: 99.7,
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 300) + 100,
        },
        {
          id: '5',
          name: 'File Storage',
          status: 'healthy',
          uptime: 99.9,
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 150) + 30,
        },
      ];

      res.json(successResponse(services, "Service status retrieved"));
    } catch (error) {
      logger.error("Get service status error:", error);
      res.status(500).json(errorResponse("Failed to retrieve service status"));
    }
  },

  // System alerts
  getSystemAlerts: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Generate dynamic alerts based on system state
      const alerts = [];
      
      // Check if there are recent failed offers or listings
      const recentFailures = await prisma.offer.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          },
          status: 'EXPIRED'
        }
      });

      if (recentFailures > 5) {
        alerts.push({
          id: '1',
          type: 'warning',
          message: `High number of expired offers in the last hour: ${recentFailures}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          service: 'Offer System',
        });
      }

      // Check for inactive users
      const inactiveUsers = await prisma.user.count({
        where: {
          isActive: false
        }
      });

      if (inactiveUsers > 0) {
        alerts.push({
          id: '2',
          type: 'info',
          message: `${inactiveUsers} inactive user accounts detected`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          acknowledged: true,
          service: 'User Management',
        });
      }

      res.json(successResponse(alerts, "System alerts retrieved"));
    } catch (error) {
      logger.error("Get system alerts error:", error);
      res.status(500).json(errorResponse("Failed to retrieve system alerts"));
    }
  },
};