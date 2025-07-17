import { prisma } from "../utils/prisma";
import { TransactionSearchQuery } from "../types/transaction";
import { $Enums } from "@prisma/client";
import { PaginationResponse } from "../types/api";

type TransactionStatus = $Enums.TransactionStatus;
import { logger } from "../utils/logger";
import { stripeService } from "./stripeService";
import { notificationService } from "./notificationService";

export class TransactionService {
  async getTransactions(
    query: TransactionSearchQuery
  ): Promise<PaginationResponse<any>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      buyerId,
      sellerId,
      eventId,
      status,
      dateFrom,
      dateTo,
    } = query;

    const offset = (page - 1) * limit;

    const where: any = {};

    if (buyerId) where.buyerId = buyerId;
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;
    if (sellerId) {
      where.listing = { sellerId };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          listing: {
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              section: {
                select: {
                  name: true,
                },
              },
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
          offer: {
            select: {
              id: true,
              maxPrice: true,
              quantity: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
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

  async getTransactionById(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            section: {
              select: {
                name: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            address: true,
            city: true,
            state: true,
            eventDate: true,
          },
        },
        offer: {
          select: {
            id: true,
            maxPrice: true,
            quantity: true,
            message: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Check if user is authorized to view this transaction
    if (
      transaction.buyerId !== userId &&
      transaction.listing.sellerId !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return transaction;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    notes?: string
  ) {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        notes,
        ...(status === "COMPLETED" && {
          ticketsDelivered: true,
          ticketsDeliveredAt: new Date(),
        }),
        ...(status === "REFUNDED" && { refundedAt: new Date() }),
      },
      include: {
        buyer: true,
        listing: { include: { seller: true } },
        event: true,
      },
    });

    logger.info(`Transaction ${transactionId} status updated to ${status}`);
    return transaction;
  }

  async getUserTransactionStats(userId: string) {
    const [buyerStats, sellerStats] = await Promise.all([
      prisma.transaction.aggregate({
        where: { buyerId: userId, status: "COMPLETED" },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { listing: { sellerId: userId }, status: "COMPLETED" },
        _count: { id: true },
        _sum: { sellerAmount: true },
      }),
    ]);

    return {
      buyer: {
        totalTransactions: buyerStats._count.id,
        totalSpent: buyerStats._sum.amount || 0,
      },
      seller: {
        totalTransactions: sellerStats._count.id,
        totalEarned: sellerStats._sum.sellerAmount || 0,
      },
    };
  }

  async getAllTransactions(params: {
    skip: number;
    take: number;
    status?: string;
    eventId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { skip, take, status, eventId, userId, startDate, endDate } = params;
    
    const where: any = {};
    
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
    if (userId) {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId },
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: true,
          offer: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  eventDate: true,
                  venue: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
          listing: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async getTransactionByIdAdmin(id: string, userId: string, userRole: string) {
    const where: any = { id };
    
    if (userRole !== "ADMIN") {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId },
      ];
    }

    return await prisma.transaction.findFirst({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: true,
        offer: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                eventDate: true,
                venue: true,
                city: true,
                state: true,
              },
            },
          },
        },
        listing: true,
      },
    });
  }

  async getUserTransactions(userId: string, params: {
    skip: number;
    take: number;
    status?: string;
    role?: 'buyer' | 'seller';
  }) {
    const { skip, take, status, role } = params;
    
    const where: any = {};
    
    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId },
      ];
    }
    
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: true,
          offer: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  eventDate: true,
                  venue: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
          listing: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async createTransaction(data: {
    offerId: string;
    listingId: string;
    sellerId: string;
    quantityPurchased?: number;
  }) {
    return await prisma.$transaction(async (tx: any) => {
      const offer = await tx.offer.findUnique({
        where: { id: data.offerId },
        include: { buyer: true, event: true },
      });

      const listing = await tx.listing.findUnique({
        where: { id: data.listingId },
        include: { seller: true },
      });

      if (!offer || !listing) {
        throw new Error("Offer or listing not found");
      }

      if (offer.status !== "ACTIVE") {
        throw new Error("Offer is not active");
      }

      if (listing.status !== "AVAILABLE") {
        throw new Error("Listing is not available");
      }

      // Validate seller owns the listing
      if (listing.sellerId !== data.sellerId) {
        throw new Error("Unauthorized: Seller does not own this listing");
      }

      // Check for concurrent transactions on the same listing
      const pendingTransactions = await tx.transaction.findMany({
        where: {
          listingId: data.listingId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        select: { quantity: true },
      });

      const reservedQuantity = pendingTransactions.reduce((sum: number, t: any) => sum + t.quantity, 0);
      const availableQuantity = listing.quantity - reservedQuantity;

      if (availableQuantity <= 0) {
        throw new Error("No tickets available for purchase due to pending transactions");
      }

      // Determine quantity to purchase (default to offer quantity, max available in listing)
      const quantityToPurchase = Math.min(
        data.quantityPurchased || offer.quantity,
        availableQuantity
      );

      if (quantityToPurchase <= 0) {
        throw new Error("No tickets available for purchase");
      }

      // Additional validation: ensure we don't exceed offer quantity
      if (quantityToPurchase > offer.quantity) {
        throw new Error("Cannot purchase more tickets than requested in offer");
      }

      // Calculate total amount based on quantity purchased
      const totalAmount = Number(offer.maxPrice) * quantityToPurchase;
      const platformFee = totalAmount * 0.05; // 5% platform fee
      const sellerAmount = totalAmount - platformFee;

      const transaction = await tx.transaction.create({
        data: {
          buyerId: offer.buyerId,
          sellerId: data.sellerId,
          offerId: data.offerId,
          listingId: data.listingId,
          eventId: offer.eventId,
          amount: totalAmount,
          platformFee,
          sellerAmount,
          quantity: quantityToPurchase,
        },
        include: {
          buyer: true,
          event: true,
          offer: true,
          listing: true,
        },
      });

      // Update offer status
      await tx.offer.update({
        where: { id: data.offerId },
        data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedBy: data.sellerId },
      });

      // Update listing inventory
      const newQuantity = listing.quantity - quantityToPurchase;
      const newStatus = newQuantity <= 0 ? "SOLD" : "AVAILABLE";

      await tx.listing.update({
        where: { id: data.listingId },
        data: { 
          quantity: newQuantity,
          status: newStatus,
        },
      });

      logger.info(`Transaction created: ${transaction.id}, purchased ${quantityToPurchase} tickets, remaining: ${newQuantity}`);

      // Send inventory notifications if needed
      if (newQuantity <= 5) {
        await notificationService.notifyLowInventory(data.sellerId, data.listingId, newQuantity, 5);
      }

      return transaction;
    });
  }

  async createPaymentIntent(transactionId: string, buyerId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, buyerId },
      include: {
        buyer: true,
        listing: {
          include: {
            seller: true,
          },
        },
        event: true,
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "PENDING") {
      throw new Error("Transaction is not in pending status");
    }

    try {
      // Ensure buyer has a Stripe customer ID
      let stripeCustomerId = transaction.buyer.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          transaction.buyer.email,
          `${transaction.buyer.firstName} ${transaction.buyer.lastName}`,
          { userId: transaction.buyer.id }
        );
        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: buyerId },
          data: { stripeCustomerId },
        });
      }

      // Calculate application fee (platform fee)
      const applicationFee = await stripeService.calculateApplicationFee(Number(transaction.amount));

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        Number(transaction.amount),
        'usd',
        stripeCustomerId,
        {
          transactionId: transaction.id,
          eventName: transaction.event.name,
          buyerId: transaction.buyerId,
          sellerId: transaction.listing.sellerId,
        }
      );

      // Update transaction with payment intent
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          stripePaymentIntent: paymentIntent.id,
          status: "PROCESSING",
        },
      });

      logger.info(`Payment intent created for transaction: ${transactionId}`);
      
      return {
        transaction: updatedTransaction,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error(`Error creating payment intent for transaction ${transactionId}:`, error);
      throw new Error("Failed to create payment intent");
    }
  }

  async processPayment(transactionId: string, buyerId: string, paymentMethodId?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, buyerId },
      include: {
        listing: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (!transaction.stripePaymentIntent) {
      throw new Error("No payment intent found for this transaction");
    }

    try {
      // Confirm the payment intent
      const paymentIntent = await stripeService.confirmPaymentIntent(
        transaction.stripePaymentIntent,
        paymentMethodId
      );

      if (paymentIntent.status === 'succeeded') {
        // Update transaction status to completed
        const updatedTransaction = await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });

        logger.info(`Payment processed successfully for transaction: ${transactionId}`);
        return updatedTransaction;
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
    } catch (error) {
      logger.error(`Error processing payment for transaction ${transactionId}:`, error);
      
      // Update transaction status to failed
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "FAILED",
          notes: error instanceof Error ? error.message : "Payment processing failed",
        },
      });

      throw new Error("Payment processing failed");
    }
  }

  async confirmPayment(transactionId: string, paymentIntentId: string) {
    return await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        stripePaymentIntent: paymentIntentId,
      },
    });
  }

  async markTicketsDelivered(transactionId: string, sellerId: string) {
    return await prisma.transaction.update({
      where: { id: transactionId, sellerId },
      data: {
        ticketsDelivered: true,
        ticketsDeliveredAt: new Date(),
      },
    });
  }

  async confirmTicketReceipt(transactionId: string, buyerId: string) {
    return await prisma.transaction.update({
      where: { id: transactionId, buyerId },
      data: {
        status: "COMPLETED",
      },
    });
  }

  async requestRefund(transactionId: string, buyerId: string, reason: string) {
    return await prisma.transaction.update({
      where: { id: transactionId, buyerId },
      data: {
        disputeReason: reason,
        status: "DISPUTED",
      },
    });
  }

  async processRefund(transactionId: string, amount?: number, reason?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (!transaction.stripePaymentIntent) {
      throw new Error("No payment intent found for this transaction");
    }

    if (transaction.status !== "COMPLETED" && transaction.status !== "DISPUTED") {
      throw new Error("Transaction must be completed or disputed to process refund");
    }

    try {
      // Create refund in Stripe
      const refund = await stripeService.createRefund(
        transaction.stripePaymentIntent,
        amount,
        reason as any,
        {
          transactionId: transaction.id,
          reason: reason || "Requested by customer",
        }
      );

      // Update transaction in database
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "REFUNDED",
          refundAmount: amount || Number(transaction.amount),
          refundedAt: new Date(),
          notes: reason,
          stripeRefundId: refund.id,
        },
      });

      logger.info(`Refund processed for transaction: ${transactionId}, refund ID: ${refund.id}`);
      return updatedTransaction;
    } catch (error) {
      logger.error(`Error processing refund for transaction ${transactionId}:`, error);
      throw new Error("Failed to process refund");
    }
  }

  async disputeTransaction(transactionId: string, userId: string, reason: string) {
    return await prisma.transaction.update({
      where: {
        id: transactionId,
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      data: {
        status: "DISPUTED",
        disputeReason: reason,
      },
    });
  }

  async resolveDispute(transactionId: string, resolution: string, refundAmount?: number) {
    const updateData: any = {
      status: "COMPLETED",
      notes: resolution,
    };

    if (refundAmount) {
      updateData.status = "REFUNDED";
      updateData.refundAmount = refundAmount;
      updateData.refundedAt = new Date();
    }

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });
  }

  async getTransactionStats(params: {
    period?: string;
    eventId?: string;
  }) {
    const { period, eventId } = params;
    
    const where: any = {};
    if (eventId) where.eventId = eventId;
    
    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      where.createdAt = { gte: startDate };
    }

    const [totalTransactions, totalVolume, platformRevenue, completedTransactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { platformFee: true },
      }),
      prisma.transaction.count({
        where: { ...where, status: "COMPLETED" },
      }),
    ]);

    return {
      totalTransactions,
      totalVolume: totalVolume._sum.amount || 0,
      platformRevenue: platformRevenue._sum.platformFee || 0,
      completedTransactions,
      conversionRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
    };
  }

  async getTransactionsByEvent(eventId: string, params: {
    skip: number;
    take: number;
    status?: string;
  }) {
    const { skip, take, status } = params;
    
    const where: any = { eventId };
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: true,
          offer: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  eventDate: true,
                  venue: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
          listing: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async cancelTransaction(transactionId: string, userId: string, userRole: string, reason: string) {
    const where: any = { id: transactionId };
    
    if (userRole !== "ADMIN") {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId },
      ];
    }

    return await prisma.transaction.update({
      where,
      data: {
        status: "FAILED",
        notes: reason,
      },
    });
  }

  async getSellerTransactions(sellerId: string, params: {
    skip: number;
    take: number;
    status?: string;
  }) {
    const { skip, take, status } = params;
    
    const where: any = { sellerId };
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: true,
          offer: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  eventDate: true,
                  venue: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
          listing: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async acceptOffer(offerId: string, listingId: string, sellerId: string, quantityPurchased?: number) {
    return this.createTransaction({ offerId, listingId, sellerId, quantityPurchased });
  }

  async createSellerAccount(sellerId: string, email: string) {
    try {
      // Create Stripe connected account for seller
      const account = await stripeService.createConnectedAccount(email);

      // Update seller with Stripe account ID
      await prisma.user.update({
        where: { id: sellerId },
        data: { stripeAccountId: account.id },
      });

      logger.info(`Stripe connected account created for seller: ${sellerId}`);
      return account;
    } catch (error) {
      logger.error(`Error creating seller account for ${sellerId}:`, error);
      throw new Error("Failed to create seller account");
    }
  }

  async createSellerOnboardingLink(sellerId: string, refreshUrl: string, returnUrl: string) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller || !seller.stripeAccountId) {
      throw new Error("Seller must have a connected account first");
    }

    try {
      const accountLink = await stripeService.createAccountLink(
        seller.stripeAccountId,
        refreshUrl,
        returnUrl
      );

      logger.info(`Onboarding link created for seller: ${sellerId}`);
      return accountLink;
    } catch (error) {
      logger.error(`Error creating onboarding link for seller ${sellerId}:`, error);
      throw new Error("Failed to create onboarding link");
    }
  }

  async processSellerPayout(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "COMPLETED") {
      throw new Error("Transaction must be completed before payout");
    }

    if (!transaction.listing.seller.stripeAccountId) {
      throw new Error("Seller must have a connected Stripe account");
    }

    if (transaction.sellerPaidOut) {
      throw new Error("Seller has already been paid out for this transaction");
    }

    try {
      // Transfer funds to seller's connected account
      const transfer = await stripeService.createTransfer(
        Number(transaction.sellerAmount),
        transaction.listing.seller.stripeAccountId,
        {
          transactionId: transaction.id,
          sellerId: transaction.listing.sellerId,
        }
      );

      // Update transaction to mark as paid out
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          sellerPaidOut: true,
          sellerPaidOutAt: new Date(),
          stripeTransferId: transfer.id,
        },
      });

      logger.info(`Seller payout processed for transaction: ${transactionId}, transfer ID: ${transfer.id}`);
      return updatedTransaction;
    } catch (error) {
      logger.error(`Error processing seller payout for transaction ${transactionId}:`, error);
      throw new Error("Failed to process seller payout");
    }
  }

  async getListingAvailableInventory(listingId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { quantity: true, status: true },
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.status !== "AVAILABLE") {
      return 0;
    }

    // Get pending transactions that might reserve inventory
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        listingId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      select: { quantity: true },
    });

    const reservedQuantity = pendingTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
    return Math.max(0, listing.quantity - reservedQuantity);
  }

  async validateInventoryAvailability(listingId: string, requestedQuantity: number) {
    const availableQuantity = await this.getListingAvailableInventory(listingId);
    
    if (availableQuantity < requestedQuantity) {
      throw new Error(`Insufficient inventory: ${availableQuantity} available, ${requestedQuantity} requested`);
    }
    
    return availableQuantity;
  }

  async setupCustomerPaymentMethod(customerId: string) {
    try {
      const setupIntent = await stripeService.createSetupIntent(customerId, {
        purpose: "ticket_purchase",
      });

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    } catch (error) {
      logger.error(`Error creating setup intent for customer ${customerId}:`, error);
      throw new Error("Failed to setup payment method");
    }
  }

  async getCustomerPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await stripeService.listCustomerPaymentMethods(customerId);
      return paymentMethods;
    } catch (error) {
      logger.error(`Error retrieving payment methods for customer ${customerId}:`, error);
      throw new Error("Failed to retrieve payment methods");
    }
  }
}

export const transactionService = new TransactionService();