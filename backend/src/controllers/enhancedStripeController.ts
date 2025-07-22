import { Request, Response } from 'express';
import { enhancedStripeService } from '../services/enhancedStripeService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth';

export class EnhancedStripeController {
  async createPaymentIntent(req: AuthRequest, res: Response) {
    try {
      const { amount, listingId, sellerId } = req.body;
      const buyerId = req.user!.id;

      if (!amount || !listingId || !sellerId) {
        return res.status(400).json({
          error: 'Missing required fields: amount, listingId, sellerId'
        });
      }

      const result = await enhancedStripeService.processTicketPurchase(
        buyerId,
        sellerId,
        listingId,
        amount
      );

      res.json({
        paymentIntent: {
          id: result.paymentIntent.id,
          clientSecret: result.clientSecret,
          amount: result.paymentIntent.amount,
          status: result.paymentIntent.status,
        },
        transaction: {
          id: result.transaction.id,
          status: result.transaction.status,
          buyerAmount: result.transaction.buyerAmount,
          sellerAmount: result.transaction.sellerAmount,
          platformFee: result.transaction.platformFee,
        }
      });
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  async setupSellerAccount(req: AuthRequest, res: Response) {
    try {
      const {
        businessType = 'individual',
        country = 'US',
        returnUrl,
        refreshUrl
      } = req.body;

      const user = req.user!;

      const result = await enhancedStripeService.setupConnectedAccountOnboarding({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessType,
        country,
        returnUrl: returnUrl || `${process.env.FRONTEND_URL}/seller/onboarding/return`,
        refreshUrl: refreshUrl || `${process.env.FRONTEND_URL}/seller/onboarding/refresh`,
      });

      res.json({
        accountId: result.accountId,
        onboardingUrl: result.onboardingUrl,
      });
    } catch (error) {
      logger.error('Error setting up seller account:', error);
      res.status(500).json({ error: 'Failed to setup seller account' });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }

      const payload = req.body;
      const result = await enhancedStripeService.handleWebhookEvent(payload, signature);

      res.json(result);
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }

  async createRefund(req: AuthRequest, res: Response) {
    try {
      const { transactionId, reason } = req.body;

      if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      const refund = await enhancedStripeService.createRefundForTransaction(
        transactionId,
        reason
      );

      res.json({
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
      });
    } catch (error) {
      logger.error('Error creating refund:', error);
      res.status(500).json({ error: 'Failed to create refund' });
    }
  }

  async getAccountBalance(req: AuthRequest, res: Response) {
    try {
      const user = req.user!;
      
      if (!user.stripeConnectedAccountId) {
        return res.status(400).json({ error: 'No connected account found' });
      }

      const balance = await enhancedStripeService.getAccountBalance(
        user.stripeConnectedAccountId
      );

      res.json({
        available: balance.available,
        pending: balance.pending,
        connectReserved: balance.connect_reserved,
      });
    } catch (error) {
      logger.error('Error retrieving account balance:', error);
      res.status(500).json({ error: 'Failed to retrieve balance' });
    }
  }

  async calculateFees(req: Request, res: Response) {
    try {
      const { amount } = req.query;

      if (!amount || isNaN(Number(amount))) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const fees = await enhancedStripeService.calculatePlatformFees(Number(amount));

      res.json(fees);
    } catch (error) {
      logger.error('Error calculating fees:', error);
      res.status(500).json({ error: 'Failed to calculate fees' });
    }
  }
}

export const enhancedStripeController = new EnhancedStripeController();