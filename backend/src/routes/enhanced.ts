import { Router } from 'express';
import { enhancedStripeController } from '../controllers/enhancedStripeController';
import { autoMatchController } from '../controllers/autoMatchController';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Enhanced Stripe Routes
router.post('/stripe/payment-intent',
  authenticate,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('listingId').isUUID().withMessage('Valid listing ID required'),
    body('sellerId').isUUID().withMessage('Valid seller ID required'),
  ],
  validateBody,
  enhancedStripeController.createPaymentIntent
);

router.post('/stripe/seller-account',
  authenticate,
  [
    body('businessType').optional().isIn(['individual', 'company']),
    body('country').optional().isLength({ min: 2, max: 2 }),
    body('returnUrl').optional().isURL(),
    body('refreshUrl').optional().isURL(),
  ],
  validateBody,
  enhancedStripeController.setupSellerAccount
);

router.post('/stripe/webhook',
  enhancedStripeController.handleWebhook
);

router.post('/stripe/refund',
  authenticate,
  [
    body('transactionId').isUUID().withMessage('Valid transaction ID required'),
    body('reason').optional().isString(),
  ],
  validateBody,
  enhancedStripeController.createRefund
);

router.get('/stripe/balance',
  authenticate,
  enhancedStripeController.getAccountBalance
);

router.get('/stripe/fees',
  [
    query('amount').isNumeric().withMessage('Amount must be a number'),
  ],
  validateBody,
  enhancedStripeController.calculateFees
);

// AutoMatch Engine Routes
router.post('/automatch/find',
  authenticate,
  [
    body('maxPrice').isNumeric().withMessage('Max price must be a number'),
    body('minPrice').optional().isNumeric().withMessage('Min price must be a number'),
    body('maxQuantity').optional().isInt({ min: 1 }).withMessage('Max quantity must be at least 1'),
    body('minQuantity').optional().isInt({ min: 1 }).withMessage('Min quantity must be at least 1'),
    body('eventId').optional().isUUID().withMessage('Valid event ID required'),
    body('preferredSections').optional().isArray(),
  ],
  validateBody,
  autoMatchController.findMatches
);

router.post('/automatch/preferences',
  authenticate,
  [
    body('maxPrice').isNumeric().withMessage('Max price must be a number'),
    body('minPrice').optional().isNumeric(),
    body('maxQuantity').optional().isInt({ min: 1 }),
    body('minQuantity').optional().isInt({ min: 1 }),
    body('eventId').optional().isUUID(),
    body('preferredSections').optional().isArray(),
    body('keywords').optional().isArray(),
    body('instantBuyEnabled').optional().isBoolean(),
    body('notificationEnabled').optional().isBoolean(),
  ],
  validateBody,
  autoMatchController.createBuyerPreferences
);

router.get('/automatch/preferences',
  authenticate,
  autoMatchController.getBuyerPreferences
);

router.put('/automatch/preferences/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid preference ID required'),
  ],
  validateBody,
  autoMatchController.updateBuyerPreferences
);

router.delete('/automatch/preferences/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Valid preference ID required'),
  ],
  validateBody,
  autoMatchController.deleteBuyerPreferences
);

router.get('/automatch/history',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateBody,
  autoMatchController.getMatchHistory
);

router.put('/automatch/matches/:matchId/view',
  authenticate,
  [
    param('matchId').isUUID().withMessage('Valid match ID required'),
  ],
  validateBody,
  autoMatchController.markMatchViewed
);

// Price Alert Routes
router.post('/automatch/price-alerts',
  authenticate,
  [
    body('eventId').isUUID().withMessage('Valid event ID required'),
    body('targetPrice').isNumeric().withMessage('Target price must be a number'),
    body('sectionId').optional().isUUID(),
  ],
  validateBody,
  autoMatchController.createPriceAlert
);

router.get('/automatch/price-alerts',
  authenticate,
  autoMatchController.getPriceAlerts
);

router.delete('/automatch/price-alerts/:alertId',
  authenticate,
  [
    param('alertId').isUUID().withMessage('Valid alert ID required'),
  ],
  validateBody,
  autoMatchController.deleteAlert
);

// Admin Routes
router.post('/automatch/trigger-matching',
  authenticate,
  autoMatchController.triggerMatching
);

export default router;