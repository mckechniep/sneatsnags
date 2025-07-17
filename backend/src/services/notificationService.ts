import { prisma } from "../utils/prisma";
import { sendEmail } from "../utils/email";
import { logger } from "../utils/logger";

export interface CreateNotificationRequest {
  userId: string;
  type:
    | "OFFER_ACCEPTED"
    | "OFFER_EXPIRED"
    | "PAYMENT_RECEIVED"
    | "TICKET_DELIVERED"
    | "SYSTEM_ALERT"
    | "INVENTORY_LOW"
    | "INVENTORY_OUT_OF_STOCK";
  title: string;
  message: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
}

export class NotificationService {
  async createNotification(data: CreateNotificationRequest) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
      },
    });

    // Send email notification if requested
    if (data.sendEmail) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true, firstName: true },
        });

        if (user) {
          await this.sendEmailNotification(
            user.email,
            user.firstName,
            data.title,
            data.message
          );
        }
      } catch (error) {
        logger.error("Failed to send email notification:", error);
      }
    }

    logger.info(
      `Notification created: ${notification.id} for user: ${data.userId}`
    );
    return notification;
  }

  private async sendEmailNotification(
    email: string,
    firstName: string,
    title: string,
    message: string
  ) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2>Hi ${firstName}!</h2>
        <h3>${title}</h3>
        <p>${message}</p>
        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View in Dashboard
          </a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated message from AutoMatch Tickets.
        </p>
      </div>
    `;

    await sendEmail(email, title, html);
  }

  async notifyOfferAccepted(offerId: string) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        buyer: { select: { id: true, firstName: true } },
        event: { select: { name: true, venue: true, eventDate: true } },
      },
    });

    if (!offer) return;

    await this.createNotification({
      userId: offer.buyer.id,
      type: "OFFER_ACCEPTED",
      title: "Your offer has been accepted!",
      message: `Great news! Your offer for ${offer.event.name} at ${offer.event.venue} has been accepted. Payment will be processed shortly.`,
      data: { offerId, eventId: offer.eventId },
      sendEmail: true,
    });
  }

  async notifyOfferExpired(offerId: string) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        buyer: { select: { id: true, firstName: true } },
        event: { select: { name: true, venue: true } },
      },
    });

    if (!offer) return;

    await this.createNotification({
      userId: offer.buyer.id,
      type: "OFFER_EXPIRED",
      title: "Your offer has expired",
      message: `Your offer for ${offer.event.name} at ${offer.event.venue} has expired. You can create a new offer if tickets are still available.`,
      data: { offerId, eventId: offer.eventId },
      sendEmail: false,
    });
  }

  async notifyPaymentReceived(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: {
          include: {
            seller: { select: { id: true, firstName: true } },
            event: { select: { name: true, venue: true } },
          },
        },
      },
    });

    if (!transaction) return;

    await this.createNotification({
      userId: transaction.listing.seller.id,
      type: "PAYMENT_RECEIVED",
      title: "Payment received!",
      message: `You've received ${transaction.sellerAmount} for your tickets to ${transaction.listing.event.name}. Funds will be transferred to your account.`,
      data: { transactionId, eventId: transaction.eventId },
      sendEmail: true,
    });
  }

  async notifyTicketDelivered(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { select: { id: true, firstName: true } },
        event: { select: { name: true, venue: true, eventDate: true } },
      },
    });

    if (!transaction) return;

    await this.createNotification({
      userId: transaction.buyerId,
      type: "TICKET_DELIVERED",
      title: "Your tickets have been delivered!",
      message: `Your tickets for ${transaction.event.name} at ${transaction.event.venue} have been delivered. Check your email for ticket details.`,
      data: { transactionId, eventId: transaction.eventId },
      sendEmail: true,
    });
  }

  async notifyLowInventory(sellerId: string, listingId: string, currentQuantity: number, threshold: number) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        event: { select: { name: true, venue: true, eventDate: true } },
        section: { select: { name: true } },
      },
    });

    if (!listing) return;

    const urgencyLevel = currentQuantity === 0 ? "critical" : currentQuantity <= 2 ? "high" : "medium";
    const title = currentQuantity === 0 ? "Out of Stock Alert" : "Low Inventory Alert";
    
    const message = currentQuantity === 0
      ? `Your listing for ${listing.event.name} - ${listing.section.name} is now out of stock. Consider creating a new listing if you have more tickets.`
      : `Your listing for ${listing.event.name} - ${listing.section.name} has only ${currentQuantity} tickets remaining (threshold: ${threshold}).`;

    await this.createNotification({
      userId: sellerId,
      type: currentQuantity === 0 ? "INVENTORY_OUT_OF_STOCK" : "INVENTORY_LOW",
      title,
      message,
      data: { 
        listingId, 
        eventId: listing.eventId,
        currentQuantity,
        threshold,
        urgencyLevel,
        eventName: listing.event.name,
        sectionName: listing.section.name,
        eventDate: listing.event.eventDate
      },
      sendEmail: urgencyLevel === "critical" || urgencyLevel === "high",
    });
  }

  async notifyInventoryUpdated(sellerId: string, listingId: string, oldQuantity: number, newQuantity: number) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        event: { select: { name: true, venue: true } },
        section: { select: { name: true } },
      },
    });

    if (!listing) return;

    const quantityChange = newQuantity - oldQuantity;
    const action = quantityChange > 0 ? "increased" : "decreased";
    const title = "Inventory Updated";
    
    const message = `Your inventory for ${listing.event.name} - ${listing.section.name} has been ${action} from ${oldQuantity} to ${newQuantity} tickets.`;

    await this.createNotification({
      userId: sellerId,
      type: "SYSTEM_ALERT",
      title,
      message,
      data: { 
        listingId, 
        eventId: listing.eventId,
        oldQuantity,
        newQuantity,
        quantityChange,
        eventName: listing.event.name,
        sectionName: listing.section.name
      },
      sendEmail: false,
    });
  }

  async sendInventoryReportNotification(sellerId: string, reportData: any) {
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { firstName: true, email: true },
    });

    if (!user) return;

    const title = "Weekly Inventory Report";
    const message = `Your weekly inventory report is ready. Total listings: ${reportData.summary.totalListings}, Available inventory: ${reportData.summary.availableInventory}, Sold this week: ${reportData.summary.soldInventory}`;

    await this.createNotification({
      userId: sellerId,
      type: "SYSTEM_ALERT",
      title,
      message,
      data: { 
        reportType: "weekly",
        reportData,
      },
      sendEmail: true,
    });
  }
}

export const notificationService = new NotificationService();
