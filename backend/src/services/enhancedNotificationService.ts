import { prisma } from "../utils/prisma";
import { sendEmail } from "../utils/email";
import { logger } from "../utils/logger";
// import { Server as SocketIOServer } from 'socket.io';
type SocketIOServer = any; // Placeholder until socket.io is installed

export interface NotificationTemplate {
  type: NotificationType;
  title: (data: any) => string;
  message: (data: any) => string;
  emailTemplate: (data: any) => string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channels: ('IN_APP' | 'EMAIL' | 'SMS' | 'PUSH')[];
}

export type NotificationType =
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "OFFER_EXPIRED"
  | "OFFER_COUNTER"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "TICKET_DELIVERED"
  | "TICKET_SOLD"
  | "LISTING_EXPIRED"
  | "LISTING_FEATURED"
  | "AUTOMATCH_FOUND"
  | "PRICE_ALERT"
  | "EVENT_REMINDER"
  | "SYSTEM_ALERT"
  | "INVENTORY_LOW"
  | "INVENTORY_OUT_OF_STOCK"
  | "ACCOUNT_VERIFIED"
  | "SECURITY_ALERT"
  | "PROMOTION"
  | "WEEKLY_REPORT"
  | "MONTHLY_REPORT";

export interface EnhancedNotificationRequest {
  userId: string;
  type: NotificationType;
  data: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channels?: ('IN_APP' | 'EMAIL' | 'SMS' | 'PUSH')[];
  scheduleFor?: Date;
  expiresAt?: Date;
  actionable?: boolean;
  actionUrl?: string;
  groupId?: string; // For grouping related notifications
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  offerNotifications: boolean;
  paymentNotifications: boolean;
  marketingNotifications: boolean;
  autoMatchNotifications: boolean;
  priceAlerts: boolean;
  eventReminders: boolean;
  weeklyReports: boolean;
  quietHoursStart?: string; // Format: "HH:MM"
  quietHoursEnd?: string;
  timezone?: string;
}

export class EnhancedNotificationService {
  private io?: SocketIOServer;
  private templates: Map<NotificationType, NotificationTemplate> = new Map();

  constructor(io?: SocketIOServer) {
    this.io = io;
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Offer-related templates
    this.templates.set("OFFER_ACCEPTED", {
      type: "OFFER_ACCEPTED",
      title: (_data) => "🎉 Your offer has been accepted!",
      message: (_data) => `Great news! Your offer of $${_data.amount} for ${_data.eventName} has been accepted. Payment will be processed shortly.`,
      emailTemplate: (_data) => this.renderEmailTemplate("offer-accepted", _data),
      priority: "HIGH",
      channels: ["IN_APP", "EMAIL", "PUSH"],
    });

    this.templates.set("OFFER_REJECTED", {
      type: "OFFER_REJECTED",
      title: (_data) => "Offer not accepted",
      message: (_data) => `Your offer of $${_data.amount} for ${_data.eventName} was not accepted. You can make a new offer or browse other listings.`,
      emailTemplate: (_data) => this.renderEmailTemplate("offer-rejected", _data),
      priority: "MEDIUM",
      channels: ["IN_APP", "EMAIL"],
    });

    this.templates.set("OFFER_COUNTER", {
      type: "OFFER_COUNTER",
      title: (_data) => "💰 Counter offer received",
      message: (_data) => `The seller has made a counter offer of $${_data.counterAmount} for ${_data.eventName} (your original offer: $${_data.originalAmount}).`,
      emailTemplate: (_data) => this.renderEmailTemplate("offer-counter", _data),
      priority: "HIGH",
      channels: ["IN_APP", "EMAIL", "PUSH"],
    });

    // AutoMatch template
    this.templates.set("AUTOMATCH_FOUND", {
      type: "AUTOMATCH_FOUND",
      title: (_data) => "🎯 Perfect ticket match found!",
      message: (_data) => `AutoMatch found ${_data.matchCount} tickets matching your criteria for ${_data.eventName}. Confidence: ${_data.confidence}`,
      emailTemplate: (_data) => this.renderEmailTemplate("automatch-found", _data),
      priority: "HIGH",
      channels: ["IN_APP", "EMAIL", "PUSH"],
    });

    // Price alert template
    this.templates.set("PRICE_ALERT", {
      type: "PRICE_ALERT",
      title: (_data) => "📉 Price drop alert!",
      message: (_data) => `Tickets for ${_data.eventName} dropped to $${_data.newPrice} (was $${_data.oldPrice}). ${_data.availableCount} tickets available.`,
      emailTemplate: (_data) => this.renderEmailTemplate("price-alert", _data),
      priority: "HIGH",
      channels: ["IN_APP", "EMAIL", "PUSH"],
    });

    // Payment templates
    this.templates.set("PAYMENT_RECEIVED", {
      type: "PAYMENT_RECEIVED",
      title: (_data) => "💰 Payment received!",
      message: (_data) => `You've received $${_data.amount} for your ${_data.eventName} tickets. Funds will be transferred to your account.`,
      emailTemplate: (_data) => this.renderEmailTemplate("payment-received", _data),
      priority: "HIGH",
      channels: ["IN_APP", "EMAIL"],
    });

    this.templates.set("PAYMENT_FAILED", {
      type: "PAYMENT_FAILED",
      title: (_data) => "❌ Payment failed",
      message: (_data) => `Your payment of $${_data.amount} for ${_data.eventName} could not be processed. Please update your payment method.`,
      emailTemplate: (_data) => this.renderEmailTemplate("payment-failed", _data),
      priority: "URGENT",
      channels: ["IN_APP", "EMAIL", "PUSH"],
    });

    // Event reminders
    this.templates.set("EVENT_REMINDER", {
      type: "EVENT_REMINDER",
      title: (_data) => "📅 Event reminder",
      message: (_data) => `${_data.eventName} is ${_data.daysUntil} days away! Don't forget to bring your tickets.`,
      emailTemplate: (_data) => this.renderEmailTemplate("event-reminder", _data),
      priority: "MEDIUM",
      channels: ["IN_APP", "EMAIL", "PUSH"],
    });

    // Security alerts
    this.templates.set("SECURITY_ALERT", {
      type: "SECURITY_ALERT",
      title: (_data) => "🔒 Security alert",
      message: (_data) => `${_data.action} detected on your account from ${_data.location}. If this wasn't you, please contact support immediately.`,
      emailTemplate: (_data) => this.renderEmailTemplate("security-alert", _data),
      priority: "URGENT",
      channels: ["IN_APP", "EMAIL", "SMS"],
    });

    // Weekly reports
    this.templates.set("WEEKLY_REPORT", {
      type: "WEEKLY_REPORT",
      title: (_data) => "📊 Your weekly report",
      message: (_data) => `This week: ${_data.salesCount} sales, $${_data.revenue} earned, ${_data.viewCount} listing views.`,
      emailTemplate: (_data) => this.renderEmailTemplate("weekly-report", _data),
      priority: "LOW",
      channels: ["EMAIL"],
    });
  }

  async createNotification(request: EnhancedNotificationRequest) {
    try {
      const template = this.templates.get(request.type);
      if (!template) {
        throw new Error(`Unknown notification type: ${request.type}`);
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(request.userId);
      
      // Check if notification type is allowed
      if (!this.isNotificationAllowed(request.type, preferences)) {
        logger.info(`Notification ${request.type} blocked by user preferences for user: ${request.userId}`);
        return null;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences) && request.priority !== 'URGENT') {
        request.scheduleFor = this.getNextAllowedTime(preferences);
      }

      const title = template.title(request.data);
      const message = template.message(request.data);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: request.userId,
          type: request.type,
          title,
          message,
          data: request.data,
        },
      });

      // Send through appropriate channels
      await this.sendThroughChannels(notification, template, preferences);

      logger.info(`Enhanced notification created: ${notification.id} for user: ${request.userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating enhanced notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  private async sendThroughChannels(notification: any, template: NotificationTemplate, preferences: NotificationPreferences) {
    const channels = notification.channels || template.channels;

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'IN_APP':
            if (preferences.inAppEnabled) {
              await this.sendInAppNotification(notification);
            }
            break;
          case 'EMAIL':
            if (preferences.emailEnabled) {
              await this.sendEmailNotification(notification, template);
            }
            break;
          case 'PUSH':
            if (preferences.pushEnabled) {
              await this.sendPushNotification(notification);
            }
            break;
          case 'SMS':
            if (preferences.smsEnabled) {
              await this.sendSMSNotification(notification);
            }
            break;
        }
      } catch (error) {
        logger.error(`Error sending notification through ${channel}:`, error);
      }
    }
  }

  private async sendInAppNotification(notification: any) {
    // Send through WebSocket if connected
    if (this.io) {
      this.io.to(`user:${notification.userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt,
        actionable: notification.actionable,
        actionUrl: notification.actionUrl,
      });
    }

    // Update notification as delivered
    await prisma.notification.update({
      where: { id: notification.id },
      data: { deliveredAt: new Date() },
    });
  }

  private async sendEmailNotification(notification: any, template: NotificationTemplate) {
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, firstName: true },
    });

    if (!user) return;

    const htmlContent = template.emailTemplate({
      ...notification.data,
      userName: user.firstName,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });

    await sendEmail(user.email, notification.title, htmlContent);

    // Update notification as sent via email
    await prisma.notification.update({
      where: { id: notification.id },
      data: { emailSentAt: new Date() },
    });
  }

  private async sendPushNotification(notification: any) {
    // TODO: Implement push notification service (Firebase, OneSignal, etc.)
    logger.info(`Push notification would be sent: ${notification.id}`);
  }

  private async sendSMSNotification(notification: any) {
    // TODO: Implement SMS service (Twilio, AWS SNS, etc.)
    logger.info(`SMS notification would be sent: ${notification.id}`);
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Return defaults if no preferences found
    if (!prefs) {
      return {
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        offerNotifications: true,
        paymentNotifications: true,
        marketingNotifications: false,
        autoMatchNotifications: true,
        priceAlerts: true,
        eventReminders: true,
        weeklyReports: true,
      };
    }

    // Convert Prisma model to interface (null to undefined)
    return {
      userId: prefs.userId,
      emailEnabled: prefs.emailEnabled,
      smsEnabled: prefs.smsEnabled,
      pushEnabled: prefs.pushEnabled,
      inAppEnabled: prefs.inAppEnabled,
      offerNotifications: prefs.offerNotifications,
      paymentNotifications: prefs.paymentNotifications,
      marketingNotifications: prefs.marketingNotifications,
      autoMatchNotifications: prefs.autoMatchNotifications,
      priceAlerts: prefs.priceAlerts,
      eventReminders: prefs.eventReminders,
      weeklyReports: prefs.weeklyReports,
      quietHoursStart: prefs.quietHoursStart || undefined,
      quietHoursEnd: prefs.quietHoursEnd || undefined,
      timezone: prefs.timezone || undefined,
    };
  }

  private isNotificationAllowed(type: NotificationType, preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'OFFER_ACCEPTED':
      case 'OFFER_REJECTED':
      case 'OFFER_COUNTER':
        return preferences.offerNotifications;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_FAILED':
        return preferences.paymentNotifications;
      case 'AUTOMATCH_FOUND':
        return preferences.autoMatchNotifications;
      case 'PRICE_ALERT':
        return preferences.priceAlerts;
      case 'EVENT_REMINDER':
        return preferences.eventReminders;
      case 'WEEKLY_REPORT':
      case 'MONTHLY_REPORT':
        return preferences.weeklyReports;
      case 'PROMOTION':
        return preferences.marketingNotifications;
      case 'SECURITY_ALERT':
        return true; // Always allow security alerts
      default:
        return true;
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    // TODO: Use timezone for proper timezone checking
    // const timezone = preferences.timezone || 'UTC';
    
    // TODO: Implement proper timezone checking
    const currentHour = now.getHours();
    const startHour = parseInt(preferences.quietHoursStart.split(':')[0]);
    const endHour = parseInt(preferences.quietHoursEnd.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private getNextAllowedTime(preferences: NotificationPreferences): Date {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    
    if (preferences.quietHoursEnd) {
      const [hours, minutes] = preferences.quietHoursEnd.split(':');
      nextDay.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      nextDay.setHours(8, 0, 0, 0); // Default to 8 AM
    }

    return nextDay;
  }

  private renderEmailTemplate(templateName: string, data: any): string {
    // Basic email template - in production, use a proper templating engine
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SneatSnags</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ticket marketplace</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">${data.title}</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">${data.message}</p>
          
          ${data.actionUrl ? `
            <div style="margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Details
              </a>
            </div>
          ` : ''}
          
          ${this.getTemplateSpecificContent(templateName, data)}
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; 
                      font-size: 12px; color: #999;">
            <p>This is an automated message from SneatSnags. 
               <a href="${process.env.FRONTEND_URL}/settings/notifications">Manage your notification preferences</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getTemplateSpecificContent(templateName: string, data: any): string {
    switch (templateName) {
      case 'automatch-found':
        return `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">Match Details</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Event: ${data.eventName}</li>
              <li>Price: $${data.price}</li>
              <li>Section: ${data.section}</li>
              <li>Confidence: ${data.confidence}</li>
            </ul>
          </div>
        `;
      case 'weekly-report':
        return `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Weekly Summary</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Sales:</span>
              <strong>${data.salesCount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Revenue:</span>
              <strong>$${data.revenue}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Views:</span>
              <strong>${data.viewCount}</strong>
            </div>
          </div>
        `;
      default:
        return '';
    }
  }

  // Bulk operations
  async createBulkNotifications(requests: EnhancedNotificationRequest[]) {
    const results = await Promise.allSettled(
      requests.map(request => this.createNotification(request))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`Bulk notifications: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: { 
        id: notificationId, 
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { 
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
        // Note: expiresAt field filtering temporarily removed until schema is updated
      },
    });
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();