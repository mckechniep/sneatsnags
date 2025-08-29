import { Router } from "express";
import { brokerController } from "../controllers/brokerController";
import { authenticate } from "../middlewares/auth";
import { validateRole } from "../middlewares/validation";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * /api/brokers/types:
 *   get:
 *     summary: Get supported broker integration types
 *     tags: [Brokers]
 *     responses:
 *       200:
 *         description: Supported types retrieved successfully
 */
router.get("/types", brokerController.getSupportedTypes);

/**
 * @swagger
 * /api/brokers/validate-credentials:
 *   post:
 *     summary: Validate broker credentials
 *     tags: [Brokers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationType
 *               - credentials
 *             properties:
 *               integrationType:
 *                 type: string
 *                 enum: [SKYBOX, AUTOPROCESSOR, TICKET_EVOLUTION, CUSTOM_FTP]
 *               credentials:
 *                 type: object
 *     responses:
 *       200:
 *         description: Credentials validated successfully
 */
router.post("/validate-credentials", authenticate, validateRole([UserRole.SELLER, UserRole.ADMIN]), brokerController.validateCredentials);

// All other broker routes require authentication and appropriate roles
router.use(authenticate);
router.use(validateRole([UserRole.SELLER, UserRole.ADMIN]));

/**
 * @swagger
 * /api/brokers/integrations:
 *   get:
 *     summary: Get broker integrations for current user
 *     tags: [Brokers]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: integrationType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Broker integrations retrieved successfully
 */
router.get("/integrations", brokerController.getBrokerIntegrations);

/**
 * @swagger
 * /api/brokers/integrations:
 *   post:
 *     summary: Create new broker integration
 *     tags: [Brokers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationType
 *               - name
 *               - credentials
 *             properties:
 *               integrationType:
 *                 type: string
 *                 enum: [SKYBOX, AUTOPROCESSOR, TICKET_EVOLUTION, CUSTOM_FTP]
 *               name:
 *                 type: string
 *               credentials:
 *                 type: object
 *               syncSchedule:
 *                 type: string
 *                 description: Cron expression for sync schedule
 *               fieldMappings:
 *                 type: object
 *               syncPreferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Broker integration created successfully
 */
router.post("/integrations", brokerController.createBrokerIntegration);

/**
 * @swagger
 * /api/brokers/integrations/{id}:
 *   get:
 *     summary: Get broker integration by ID
 *     tags: [Brokers]
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
 *         description: Broker integration retrieved successfully
 *       404:
 *         description: Broker integration not found
 */
router.get("/integrations/:id", brokerController.getBrokerIntegrationById);

/**
 * @swagger
 * /api/brokers/integrations/{id}:
 *   put:
 *     summary: Update broker integration
 *     tags: [Brokers]
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
 *         description: Broker integration updated successfully
 */
router.put("/integrations/:id", brokerController.updateBrokerIntegration);

/**
 * @swagger
 * /api/brokers/integrations/{id}:
 *   delete:
 *     summary: Delete broker integration
 *     tags: [Brokers]
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
 *         description: Broker integration deleted successfully
 */
router.delete("/integrations/:id", brokerController.deleteBrokerIntegration);

/**
 * @swagger
 * /api/brokers/integrations/{id}/test-connection:
 *   post:
 *     summary: Test broker connection
 *     tags: [Brokers]
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
 *         description: Connection test completed
 */
router.post("/integrations/:id/test-connection", brokerController.testBrokerConnection);

/**
 * @swagger
 * /api/brokers/integrations/{id}/trigger-sync:
 *   post:
 *     summary: Trigger manual sync
 *     tags: [Brokers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               syncType:
 *                 type: string
 *                 enum: [FULL, INCREMENTAL, MANUAL]
 *                 default: INCREMENTAL
 *     responses:
 *       200:
 *         description: Sync triggered successfully
 */
router.post("/integrations/:id/trigger-sync", brokerController.triggerSync);

/**
 * @swagger
 * /api/brokers/integrations/{id}/sync-logs:
 *   get:
 *     summary: Get sync logs for integration
 *     tags: [Brokers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       - in: query
 *         name: syncType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sync logs retrieved successfully
 */
router.get("/integrations/:id/sync-logs", brokerController.getSyncLogs);

/**
 * @swagger
 * /api/brokers/integrations/{id}/stats:
 *   get:
 *     summary: Get sync statistics for integration
 *     tags: [Brokers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
 *     responses:
 *       200:
 *         description: Sync statistics retrieved successfully
 */
router.get("/integrations/:id/stats", brokerController.getSyncStats);

/**
 * @swagger
 * /api/brokers/integrations/{id}/schedule:
 *   put:
 *     summary: Update sync schedule
 *     tags: [Brokers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - syncSchedule
 *             properties:
 *               syncSchedule:
 *                 type: string
 *                 description: Cron expression for sync schedule
 *     responses:
 *       200:
 *         description: Sync schedule updated successfully
 */
router.put("/integrations/:id/schedule", brokerController.updateSyncSchedule);

/**
 * @swagger
 * /api/brokers/integrations/{id}/toggle-status:
 *   post:
 *     summary: Toggle integration active status
 *     tags: [Brokers]
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
 *         description: Integration status updated successfully
 */
router.post("/integrations/:id/toggle-status", brokerController.toggleIntegrationStatus);

export { router as brokerRoutes };