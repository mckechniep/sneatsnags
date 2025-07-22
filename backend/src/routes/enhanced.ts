import { Router } from 'express';
import { enhancedStripeController } from '../controllers/enhancedStripeController';
import { autoMatchController } from '../controllers/autoMatchController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body, param, query } from 'express-validator';

const router = Router();

// Enhanced Stripe Routes
router.post('/stripe/payment-intent',
  auth,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('listingId').isUUID().withMessage('Valid listing ID required'),
    body('sellerId').isUUID().withMessage('Valid seller ID required'),
  ],
  validate,
  enhancedStripeController.createPaymentIntent
);

router.post('/stripe/seller-account',
  auth,
  [
    body('businessType').optional().isIn(['individual', 'company']),
    body('country').optional().isLength({ min: 2, max: 2 }),
    body('returnUrl').optional().isURL(),
    body('refreshUrl').optional().isURL(),
  ],
  validate,
  enhancedStripeController.setupSellerAccount
);

router.post('/stripe/webhook',
  enhancedStripeController.handleWebhook
);

router.post('/stripe/refund',
  auth,
  [
    body('transactionId').isUUID().withMessage('Valid transaction ID required'),
    body('reason').optional().isString(),
  ],
  validate,
  enhancedStripeController.createRefund
);

router.get('/stripe/balance',
  auth,
  enhancedStripeController.getAccountBalance
);

router.get('/stripe/fees',
  [
    query('amount').isNumeric().withMessage('Amount must be a number'),
  ],
  validate,
  enhancedStripeController.calculateFees
);

// AutoMatch Engine Routes
router.post('/automatch/find',
  auth,
  [
    body('maxPrice').isNumeric().withMessage('Max price must be a number'),
    body('minPrice').optional().isNumeric().withMessage('Min price must be a number'),
    body('maxQuantity').optional().isInt({ min: 1 }).withMessage('Max quantity must be at least 1'),
    body('minQuantity').optional().isInt({ min: 1 }).withMessage('Min quantity must be at least 1'),
    body('eventId').optional().isUUID().withMessage('Valid event ID required'),
    body('preferredSections').optional().isArray(),
  ],
  validate,
  autoMatchController.findMatches
);

router.post('/automatch/preferences',
  auth,
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
  validate,
  autoMatchController.createBuyerPreferences
);

router.get('/automatch/preferences',
  auth,
  autoMatchController.getBuyerPreferences
);

router.put('/automatch/preferences/:id',
  auth,
  [
    param('id').isUUID().withMessage('Valid preference ID required'),
  ],
  validate,
  autoMatchController.updateBuyerPreferences
);

router.delete('/automatch/preferences/:id',
  auth,
  [
    param('id').isUUID().withMessage('Valid preference ID required'),
  ],
  validate,
  autoMatchController.deleteBuyerPreferences
);

router.get('/automatch/history',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  autoMatchController.getMatchHistory
);

router.put('/automatch/matches/:matchId/view',
  auth,
  [
    param('matchId').isUUID().withMessage('Valid match ID required'),
  ],
  validate,
  autoMatchController.markMatchViewed
);

// Price Alert Routes
router.post('/automatch/price-alerts',
  auth,
  [
    body('eventId').isUUID().withMessage('Valid event ID required'),
    body('targetPrice').isNumeric().withMessage('Target price must be a number'),
    body('sectionId').optional().isUUID(),
  ],
  validate,
  autoMatchController.createPriceAlert
);

router.get('/automatch/price-alerts',
  auth,
  autoMatchController.getPriceAlerts
);

router.delete('/automatch/price-alerts/:alertId',
  auth,
  [
    param('alertId').isUUID().withMessage('Valid alert ID required'),
  ],
  validate,
  autoMatchController.deleteAlert
);

// Admin Routes
router.post('/automatch/trigger-matching',
  auth,
  autoMatchController.triggerMatching
);

export default router;