import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getProfileStats,
  getNotificationSettings,
  updateNotificationSettings,
  deleteAccount,
  requestEmailVerification,
} from "../controllers/profileController";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [BUYER, SELLER, ADMIN]
 *         isEmailVerified:
 *           type: boolean
 *         profileImage:
 *           type: string
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProfileStats:
 *       type: object
 *       properties:
 *         buyer:
 *           type: object
 *           properties:
 *             activeOffers:
 *               type: integer
 *             acceptedOffers:
 *               type: integer
 *             totalSpent:
 *               type: number
 *         seller:
 *           type: object
 *           properties:
 *             activeListings:
 *               type: integer
 *             soldListings:
 *               type: integer
 *             totalEarned:
 *               type: number
 *         broker:
 *           type: object
 *           properties:
 *             integrations:
 *               type: integer
 *             lastSyncSuccess:
 *               type: integer
 *             syncErrors:
 *               type: integer
 *     NotificationSettings:
 *       type: object
 *       properties:
 *         emailNotifications:
 *           type: boolean
 *         smsNotifications:
 *           type: boolean
 *         marketingEmails:
 *           type: boolean
 *         eventReminders:
 *           type: boolean
 *         offerAlerts:
 *           type: boolean
 *         transactionUpdates:
 *           type: boolean
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.get("/", authenticate, getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *               phone:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: Unauthorized
 */
router.put("/", authenticate, updateProfile);

/**
 * @swagger
 * /api/profile/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid current password or validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /api/profile/upload-image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profileImage:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/upload-image",
  authenticate,
  upload.single("profileImage"),
  uploadProfileImage
);

/**
 * @swagger
 * /api/profile/stats:
 *   get:
 *     summary: Get profile statistics
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProfileStats'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.get("/stats", authenticate, getProfileStats);

/**
 * @swagger
 * /api/profile/notifications:
 *   get:
 *     summary: Get notification settings
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.get("/notifications", authenticate, getNotificationSettings);

/**
 * @swagger
 * /api/profile/notifications:
 *   put:
 *     summary: Update notification settings
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *                 description: Enable email notifications
 *               smsNotifications:
 *                 type: boolean
 *                 description: Enable SMS notifications
 *               marketingEmails:
 *                 type: boolean
 *                 description: Enable marketing emails
 *               eventReminders:
 *                 type: boolean
 *                 description: Enable event reminders
 *               offerAlerts:
 *                 type: boolean
 *                 description: Enable offer alerts
 *               transactionUpdates:
 *                 type: boolean
 *                 description: Enable transaction updates
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: Unauthorized
 */
router.put("/notifications", authenticate, updateNotificationSettings);

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete user account
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete account with active transactions
 *       401:
 *         description: Unauthorized
 */
router.delete("/", authenticate, deleteAccount);

/**
 * @swagger
 * /api/profile/verify-email:
 *   post:
 *     summary: Request email verification
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email to verify (optional, uses current user email if not provided)
 *     responses:
 *       200:
 *         description: Email verification request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/verify-email", authenticate, requestEmailVerification);

export { router as profileRoutes };