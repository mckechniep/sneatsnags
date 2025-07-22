import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import { notificationService } from './notificationService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface PaymentIntentMetadata {
  userId: string;
  listingId?: string;
  offerId?: string;
  transactionId?: string;
  type: 'ticket_purchase' | 'seller_payout' | 'refund';
}

export interface ConnectedAccountOnboardingData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  businessType: 'individual' | 'company';
  country: string;
  returnUrl: string;
  refreshUrl: string;
}

export class EnhancedStripeService {
  private stripe: Stripe;
  private readonly applicationFeePercentage = 0.05; // 5% platform fee
  private readonly webhookSecret: string;

  constructor() {
    this.stripe = stripe;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async createCustomerWithProfile(userId: string, email: string, firstName?: string, lastName?: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: firstName && lastName ? `${firstName} ${lastName}` : undefined,
        metadata: {
          userId,
          platform: 'sneatsnags'
        },
      });

      // Store Stripe customer ID in database
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      logger.info(`Enhanced Stripe customer created: ${customer.id} for user: ${userId}`);
      return customer;
    } catch (error) {
      logger.error('Error creating enhanced Stripe customer:', error);
      throw new Error('Failed to create customer profile');
    }
  }

  async createPaymentIntentWithMetadata(
    amount: number,
    metadata: PaymentIntentMetadata,
    applicationFeeAmount?: number,
    onBehalfOf?: string,
    transferGroup?: string
  ) {
    try {
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Add application fee for marketplace transactions
      if (applicationFeeAmount) {
        paymentIntentData.application_fee_amount = Math.round(applicationFeeAmount * 100);
      }

      // Add connected account details
      if (onBehalfOf) {
        paymentIntentData.on_behalf_of = onBehalfOf;
        paymentIntentData.transfer_data = {
          destination: onBehalfOf,
        };
      }

      if (transferGroup) {
        paymentIntentData.transfer_group = transferGroup;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      logger.info(`Enhanced payment intent created: ${paymentIntent.id} for amount: $${amount}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating enhanced payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async setupConnectedAccountOnboarding(data: ConnectedAccountOnboardingData) {
    try {
      // Create connected account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: data.country,
        email: data.email,
        business_type: data.businessType,
        individual: data.businessType === 'individual' ? {
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
        } : undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          mcc: '7922', // Entertainment/Recreation services
          url: process.env.FRONTEND_URL,
          product_description: 'Ticket resale marketplace services',
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
        },
        metadata: {
          userId: data.userId,
          platform: 'sneatsnags',
          onboardingStarted: new Date().toISOString(),
        },
      });

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: data.refreshUrl,
        return_url: data.returnUrl,
        type: 'account_onboarding',
      });

      // Store connected account ID in database
      await prisma.user.update({
        where: { id: data.userId },
        data: { stripeConnectedAccountId: account.id },
      });

      logger.info(`Connected account setup initiated: ${account.id} for user: ${data.userId}`);
      
      return {
        account,
        onboardingUrl: accountLink.url,
        accountId: account.id,
      };
    } catch (error) {
      logger.error('Error setting up connected account onboarding:', error);
      throw new Error('Failed to setup seller account');
    }
  }

  async processTicketPurchase(
    buyerId: string,
    sellerId: string,
    listingId: string,
    amount: number,
    quantity: number = 1,
    paymentMethodId?: string
  ) {
    try {
      const applicationFee = amount * this.applicationFeePercentage;
      const sellerAmount = amount - applicationFee;

      // Get listing with eventId
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { eventId: true, sellerId: true, price: true },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Get seller's connected account
      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: { stripeConnectedAccountId: true, email: true, firstName: true },
      });

      if (!seller?.stripeConnectedAccountId) {
        throw new Error('Seller account not properly configured');
      }

      // Create a temporary offer for this purchase
      const offer = await prisma.offer.create({
        data: {
          id: `offer_${Date.now()}`,
          buyerId,
          eventId: listing.eventId,
          quantity,
          maxPrice: amount,
          status: 'ACCEPTED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      const transferGroup = `listing_${listingId}_${Date.now()}`;

      const paymentIntent = await this.createPaymentIntentWithMetadata(
        amount,
        {
          userId: buyerId,
          listingId,
          type: 'ticket_purchase',
        },
        applicationFee,
        seller.stripeConnectedAccountId,
        transferGroup
      );

      // Confirm payment if payment method is provided
      if (paymentMethodId) {
        await this.stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: paymentMethodId,
        });
      }

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          id: `txn_${Date.now()}`,
          buyerId,
          sellerId,
          offerId: offer.id,
          listingId,
          eventId: listing.eventId,
          quantity,
          amount: sellerAmount,
          buyerAmount: amount,
          sellerAmount,
          platformFee: applicationFee,
          status: 'PENDING',
          stripePaymentIntent: paymentIntent.id,
        },
      });

      logger.info(`Ticket purchase initiated: ${transaction.id} for listing: ${listingId}`);
      
      return {
        paymentIntent,
        transaction,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      logger.error('Error processing ticket purchase:', error);
      throw new Error('Failed to process purchase');
    }
  }

  async handleWebhookEvent(payload: string | Buffer, signature: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'transfer.created':
          await this.handleTransferCreated(event.data.object as Stripe.Transfer);
          break;

        case 'payout.paid':
          await this.handlePayoutPaid(event.data.object as Stripe.Payout);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true, eventType: event.type };
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      throw new Error('Webhook processing failed');
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { listingId, type } = paymentIntent.metadata;

    if (type === 'ticket_purchase' && listingId) {
      await prisma.transaction.updateMany({
        where: { stripePaymentIntent: paymentIntent.id },
        data: { status: 'COMPLETED' },
      });

      // Update listing quantity
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          availableQuantity: {
            decrement: 1,
          },
        },
      });

      // Send notifications
      const transaction = await prisma.transaction.findFirst({
        where: { stripePaymentIntent: paymentIntent.id },
      });

      if (transaction) {
        await notificationService.notifyPaymentReceived(transaction.id);
      }
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    await prisma.transaction.updateMany({
      where: { stripePaymentIntent: paymentIntent.id },
      data: { status: 'FAILED' },
    });

    // Notify buyer of failed payment
    const transaction = await prisma.transaction.findFirst({
      where: { stripePaymentIntent: paymentIntent.id },
    });

    if (transaction) {
      await notificationService.createNotification({
        userId: transaction.buyerId,
        type: 'SYSTEM_ALERT',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again or contact support.',
        sendEmail: true,
      });
    }
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    const userId = account.metadata?.userId;
    if (!userId) return;

    const isOnboardingComplete = account.details_submitted && account.charges_enabled;

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeAccountStatus: isOnboardingComplete ? 'ACTIVE' : 'PENDING',
      },
    });

    if (isOnboardingComplete) {
      await notificationService.createNotification({
        userId,
        type: 'SYSTEM_ALERT',
        title: 'Seller Account Activated',
        message: 'Your seller account has been activated! You can now start listing tickets and receiving payments.',
        sendEmail: true,
      });
    }
  }

  private async handleTransferCreated(transfer: Stripe.Transfer) {
    logger.info(`Transfer created: ${transfer.id} for amount: $${transfer.amount / 100}`);
  }

  private async handlePayoutPaid(payout: Stripe.Payout) {
    logger.info(`Payout completed: ${payout.id} for amount: $${payout.amount / 100}`);
  }

  async createRefundForTransaction(transactionId: string, reason?: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { buyer: true, seller: true },
      });

      if (!transaction?.stripePaymentIntent) {
        throw new Error('Transaction not found or invalid');
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntent,
        reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer',
        metadata: {
          transactionId,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
        },
      });

      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REFUNDED' },
      });

      // Notify both parties
      await Promise.all([
        notificationService.createNotification({
          userId: transaction.buyerId,
          type: 'SYSTEM_ALERT',
          title: 'Refund Processed',
          message: `Your refund of $${transaction.buyerAmount} has been processed and will appear in your account within 5-10 business days.`,
          sendEmail: true,
        }),
        notificationService.createNotification({
          userId: transaction.sellerId,
          type: 'SYSTEM_ALERT',
          title: 'Transaction Refunded',
          message: `A refund has been issued for transaction ${transactionId}. The amount will be deducted from your next payout.`,
          sendEmail: true,
        }),
      ]);

      return refund;
    } catch (error) {
      logger.error('Error creating refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  async getAccountBalance(connectedAccountId: string) {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: connectedAccountId,
      });
      return balance;
    } catch (error) {
      logger.error('Error retrieving account balance:', error);
      throw new Error('Failed to retrieve balance');
    }
  }

  async calculatePlatformFees(amount: number) {
    return {
      subtotal: amount,
      platformFee: amount * this.applicationFeePercentage,
      total: amount * (1 + this.applicationFeePercentage),
      sellerReceives: amount * (1 - this.applicationFeePercentage),
    };
  }
}

export const enhancedStripeService = new EnhancedStripeService();