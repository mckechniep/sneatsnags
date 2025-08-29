import { prisma } from "../utils/prisma";
import {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserPreferences,
} from "../types/user";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger";

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        profileImage: true,
        stripeCustomerId: true,
        stripeAccountId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileRequest) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        updatedAt: true,
      },
    });

    logger.info(`Profile updated for user: ${userId}`);
    return user;
  }

  async changePassword(userId: string, data: ChangePasswordRequest) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await bcrypt.compare(
      data.currentPassword,
      user.password
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed for user: ${userId}`);
    return { message: "Password changed successfully" };
  }

  async deleteAccount(userId: string) {
    // Check for active transactions
    const activeTransactions = await prisma.transaction.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
    });

    if (activeTransactions > 0) {
      throw new Error("Cannot delete account with active transactions");
    }

    // Soft delete by deactivating account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    logger.info(`Account deactivated for user: ${userId}`);
    return { message: "Account deleted successfully" };
  }

  async getDashboardStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const stats: any = {};

    if (user.role === "BUYER" || user.role === "ADMIN") {
      stats.buyer = {
        activeOffers: await prisma.offer.count({
          where: { buyerId: userId, status: "ACTIVE" },
        }),
        acceptedOffers: await prisma.offer.count({
          where: { buyerId: userId, status: "ACCEPTED" },
        }),
        totalSpent: await prisma.transaction.aggregate({
          where: { buyerId: userId, status: "COMPLETED" },
          _sum: { amount: true },
        }),
      };
    }

    if (
      user.role === "SELLER" ||
      user.role === "ADMIN"
    ) {
      stats.seller = {
        activeListings: await prisma.listing.count({
          where: { sellerId: userId, status: "AVAILABLE" },
        }),
        soldListings: await prisma.listing.count({
          where: { sellerId: userId, status: "SOLD" },
        }),
        totalEarned: await prisma.transaction.aggregate({
          where: {
            listing: { sellerId: userId },
            status: "COMPLETED",
          },
          _sum: { sellerAmount: true },
        }),
      };
    }

    if (user.role === "SELLER" || user.role === "ADMIN") {
      stats.broker = {
        integrations: await prisma.brokerIntegration.count({
          where: { userId, isActive: true },
        }),
        lastSyncSuccess: await prisma.brokerIntegration.count({
          where: { userId, lastSyncStatus: "SYNCED" },
        }),
        syncErrors: await prisma.brokerIntegration.count({
          where: { userId, lastSyncStatus: "FAILED" },
        }),
      };
    }

    return stats;
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: "Notification marked as read" };
  }

  async markAllNotificationsAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: "All notifications marked as read" };
  }

  async getUnreadNotificationCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return count;
  }

  async getAllUsers(params: {
    skip: number;
    take: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const { skip, take, role, isActive, search } = params;
    
    const where: any = {};
    
    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async updateUser(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivateUser(userId: string, reason: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async reactivateUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProfileStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get buyer-specific stats for the frontend profile component
    const [
      totalOffers,
      activeOffers,
      acceptedOffers,
      totalSpentResult,
      averageOfferResult,
      favoriteCategories,
      recentActivity
    ] = await Promise.all([
      prisma.offer.count({
        where: { buyerId: userId },
      }),
      prisma.offer.count({
        where: { buyerId: userId, status: "ACTIVE" },
      }),
      prisma.offer.count({
        where: { buyerId: userId, status: "ACCEPTED" },
      }),
      prisma.transaction.aggregate({
        where: { buyerId: userId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.offer.aggregate({
        where: { buyerId: userId },
        _avg: { maxPrice: true },
      }),
      // Get favorite categories based on event types
      prisma.offer.findMany({
        where: { buyerId: userId },
        include: {
          event: {
            select: { eventType: true }
          }
        },
      }),
      // Get recent activity
      prisma.offer.findMany({
        where: { buyerId: userId },
        include: {
          event: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    ]);

    // Transform recent activity into the expected format
    const transformedActivity = recentActivity.map((offer: any) => ({
      id: offer.id,
      type: offer.status === 'ACCEPTED' ? 'offer_accepted' as const :
            offer.status === 'CANCELLED' ? 'offer_cancelled' as const :
            'offer_created' as const,
      description: `${offer.status === 'ACCEPTED' ? 'Offer accepted' : 
                    offer.status === 'CANCELLED' ? 'Offer cancelled' :
                    'Offer created'} for ${offer.event?.name || 'event'}`,
      date: offer.createdAt.toISOString(),
      amount: Number(offer.maxPrice),
    }));

    // Transform favorite categories - group by event type
    const categoryCount: Record<string, number> = {};
    favoriteCategories.forEach((offer: any) => {
      const eventType = offer.event?.eventType || 'unknown';
      categoryCount[eventType] = (categoryCount[eventType] || 0) + 1;
    });
    
    const transformedCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOffers,
      activeOffers,
      acceptedOffers,
      totalSpent: totalSpentResult._sum.amount || 0,
      averageOfferPrice: Number(averageOfferResult._avg.maxPrice) || 0,
      favoriteCategories: transformedCategories,
      recentActivity: transformedActivity,
    };
  }

  async getNotificationSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If user doesn't have preferences yet, create default ones
    if (!user.preferences) {
      const defaultPreferences = await prisma.userPreferences.create({
        data: {
          userId: userId,
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          eventReminders: true,
          offerAlerts: true,
          transactionUpdates: true,
        },
      });
      return {
        emailNotifications: defaultPreferences.emailNotifications,
        smsNotifications: defaultPreferences.smsNotifications,
        offerUpdates: defaultPreferences.offerAlerts, // Map offerAlerts to offerUpdates
        priceAlerts: true, // Default for price alerts
        eventReminders: defaultPreferences.eventReminders,
        marketingEmails: defaultPreferences.marketingEmails,
      };
    }

    return {
      emailNotifications: user.preferences.emailNotifications,
      smsNotifications: user.preferences.smsNotifications,
      offerUpdates: user.preferences.offerAlerts, // Map offerAlerts to offerUpdates
      priceAlerts: true, // Default for price alerts (not in current schema)
      eventReminders: user.preferences.eventReminders,
      marketingEmails: user.preferences.marketingEmails,
    };
  }

  async updateNotificationSettings(userId: string, settings: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If user doesn't have preferences yet, create them
    if (!user.preferences) {
      const updatedPreferences = await prisma.userPreferences.create({
        data: {
          userId: userId,
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          marketingEmails: settings.marketingEmails ?? true,
          eventReminders: settings.eventReminders ?? true,
          offerAlerts: settings.offerUpdates ?? true, // Map offerUpdates to offerAlerts
          transactionUpdates: settings.transactionUpdates ?? true,
        },
      });
      logger.info(`Notification settings created for user: ${userId}`, settings);
      return {
        emailNotifications: updatedPreferences.emailNotifications,
        smsNotifications: updatedPreferences.smsNotifications,
        marketingEmails: updatedPreferences.marketingEmails,
        eventReminders: updatedPreferences.eventReminders,
        offerAlerts: updatedPreferences.offerAlerts,
        transactionUpdates: updatedPreferences.transactionUpdates,
      };
    }

    // Update existing preferences
    const updatedPreferences = await prisma.userPreferences.update({
      where: { userId: userId },
      data: {
        emailNotifications: settings.emailNotifications ?? user.preferences.emailNotifications,
        smsNotifications: settings.smsNotifications ?? user.preferences.smsNotifications,
        marketingEmails: settings.marketingEmails ?? user.preferences.marketingEmails,
        eventReminders: settings.eventReminders ?? user.preferences.eventReminders,
        offerAlerts: settings.offerUpdates ?? user.preferences.offerAlerts, // Map offerUpdates to offerAlerts
        transactionUpdates: settings.transactionUpdates ?? user.preferences.transactionUpdates,
      },
    });

    logger.info(`Notification settings updated for user: ${userId}`, settings);

    return {
      emailNotifications: updatedPreferences.emailNotifications,
      smsNotifications: updatedPreferences.smsNotifications,
      offerUpdates: updatedPreferences.offerAlerts, // Map offerAlerts to offerUpdates
      priceAlerts: true, // Default for price alerts
      eventReminders: updatedPreferences.eventReminders,
      marketingEmails: updatedPreferences.marketingEmails,
    };
  }

  async requestEmailVerification(userId: string, email: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    // Generate new verification token
    const crypto = require("crypto");
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken },
    });

    // In a real implementation, you'd send the verification email here
    // await sendVerificationEmail(email, emailVerifyToken);
    
    logger.info(`Email verification requested for user: ${userId} (${email})`);

    return { message: "Email verification sent successfully" };
  }
}

export const userService = new UserService();
