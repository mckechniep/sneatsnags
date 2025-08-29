import { Router } from "express";
import { sellerController } from "../controllers/sellerController";
import { authenticate } from "../middlewares/auth";
import { validateRole } from "../middlewares/validation";
import { upload } from "../middlewares/upload";
import { UserRole } from "@prisma/client";

const router = Router();

// All seller routes require authentication and seller role
router.use(authenticate);
router.use(validateRole([UserRole.SELLER, UserRole.ADMIN]));

/**
 * @swagger
 * /api/sellers/dashboard:
 *   get:
 *     summary: Get seller dashboard statistics
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/dashboard", sellerController.getDashboard);

/**
 * @swagger
 * /api/sellers/listings:
 *   get:
 *     summary: Get seller's listings
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
 */
router.get("/listings", sellerController.getListings);

/**
 * @swagger
 * /api/sellers/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - sectionId
 *               - price
 *               - seats
 *             properties:
 *               eventId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               price:
 *                 type: number
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *               row:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Listing created successfully
 */
router.post("/listings", sellerController.createListing);

/**
 * @swagger
 * /api/sellers/listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing updated successfully
 */
router.put("/listings/:id", sellerController.updateListing);

/**
 * @swagger
 * /api/sellers/listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 */
router.delete("/listings/:id", sellerController.deleteListing);

/**
 * @swagger
 * /api/sellers/listings/{listingId}/upload-tickets:
 *   post:
 *     summary: Upload ticket files for a listing
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               tickets:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Ticket files uploaded successfully
 */
router.post("/listings/:listingId/upload-tickets", upload.array("tickets", 10), sellerController.uploadTicketFiles);

/**
 * @swagger
 * /api/sellers/listings/{listingId}/offers:
 *   get:
 *     summary: Get offers for a specific listing
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing offers retrieved successfully
 */
router.get("/listings/:listingId/offers", sellerController.getListingOffers);

/**
 * @swagger
 * /api/sellers/transactions:
 *   get:
 *     summary: Get seller's transactions
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get("/transactions", sellerController.getTransactions);

/**
 * @swagger
 * /api/sellers/offers/{offerId}/accept:
 *   post:
 *     summary: Accept an offer
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *             properties:
 *               listingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer accepted successfully
 */
router.post("/offers/:offerId/accept", sellerController.acceptOffer);

/**
 * @swagger
 * /api/sellers/transactions/{transactionId}/deliver:
 *   post:
 *     summary: Mark tickets as delivered
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tickets marked as delivered
 */
router.post("/transactions/:transactionId/deliver", sellerController.markTicketsDelivered);

/**
 * @swagger
 * /api/sellers/offers:
 *   get:
 *     summary: Get available offers that sellers can accept
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Available offers retrieved successfully
 */
router.get("/offers", sellerController.getAvailableOffers);

// Broker Integration Routes
router.get("/integrations", sellerController.getBrokerIntegrations);
router.get("/integrations/:id", sellerController.getBrokerIntegrationById);
router.post("/integrations", sellerController.createBrokerIntegration);
router.put("/integrations/:id", sellerController.updateBrokerIntegration);
router.delete("/integrations/:id", sellerController.deleteBrokerIntegration);
router.post("/integrations/:id/test", sellerController.testBrokerConnection);
router.post("/integrations/:id/sync", sellerController.triggerSync);
router.get("/integrations/:id/logs", sellerController.getSyncLogs);
router.get("/integrations/:id/stats", sellerController.getSyncStats);
router.put("/integrations/:id/schedule", sellerController.updateSyncSchedule);
router.put("/integrations/:id/toggle", sellerController.toggleIntegrationStatus);
router.get("/integration-types", sellerController.getSupportedTypes);
router.post("/validate-credentials", sellerController.validateCredentials);

export { router as sellerRoutes };