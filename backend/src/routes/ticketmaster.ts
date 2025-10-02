import { Router } from 'express';
import { ticketmasterController } from '../controllers/ticketmasterController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TicketmasterEvent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Ticketmaster event ID
 *         name:
 *           type: string
 *           description: Event name
 *         type:
 *           type: string
 *           description: Event type
 *         url:
 *           type: string
 *           description: Ticketmaster event URL
 *         dates:
 *           type: object
 *           properties:
 *             start:
 *               type: object
 *               properties:
 *                 localDate:
 *                   type: string
 *                   format: date
 *                 localTime:
 *                   type: string
 *                   format: time
 *                 dateTime:
 *                   type: string
 *                   format: date-time
 *         _embedded:
 *           type: object
 *           properties:
 *             venues:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   city:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                   state:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       stateCode:
 *                         type: string
 */

/**
 * @swagger
 * /api/ticketmaster/search:
 *   get:
 *     summary: Search events from Ticketmaster
 *     tags: [Ticketmaster]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State code or name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *           default: US
 *         description: Country code
 *       - in: query
 *         name: classificationName
 *         schema:
 *           type: string
 *         description: Event classification (music, sports, etc.)
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page number
 *     responses:
 *       200:
 *         description: Events found successfully
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
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TicketmasterEvent'
 *                     pagination:
 *                       type: object
 *       500:
 *         description: Server error
 */
router.get('/search', ticketmasterController.searchEvents);

/**
 * @swagger
 * /api/ticketmaster/events/{eventId}:
 *   get:
 *     summary: Get specific event from Ticketmaster
 *     tags: [Ticketmaster]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticketmaster event ID
 *     responses:
 *       200:
 *         description: Event found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TicketmasterEvent'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get('/events/:eventId', ticketmasterController.getEventById);

/**
 * @swagger
 * /api/ticketmaster/search/keyword/{keyword}:
 *   get:
 *     summary: Search events by keyword
 *     tags: [Ticketmaster]
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State code or name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *           default: US
 *         description: Country code
 *       - in: query
 *         name: classificationName
 *         schema:
 *           type: string
 *         description: Event classification
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results
 *     responses:
 *       200:
 *         description: Events found successfully
 */
router.get('/search/keyword/:keyword', ticketmasterController.searchEventsByKeyword);

/**
 * @swagger
 * /api/ticketmaster/search/city/{city}:
 *   get:
 *     summary: Get events by city
 *     tags: [Ticketmaster]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *           default: US
 *         description: Country code
 *       - in: query
 *         name: classificationName
 *         schema:
 *           type: string
 *         description: Event classification
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Events found successfully
 */
router.get('/search/city/:city', ticketmasterController.getEventsByCity);

/**
 * @swagger
 * /api/ticketmaster/search/classification/{classification}:
 *   get:
 *     summary: Get events by classification
 *     tags: [Ticketmaster]
 *     parameters:
 *       - in: path
 *         name: classification
 *         required: true
 *         schema:
 *           type: string
 *         description: Event classification (music, sports, etc.)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State code or name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *           default: US
 *         description: Country code
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results
 *     responses:
 *       200:
 *         description: Events found successfully
 */
router.get('/search/classification/:classification', ticketmasterController.getEventsByClassification);

// Protected routes requiring authentication
/**
 * @swagger
 * /api/ticketmaster/import/{eventId}:
 *   post:
 *     summary: Import a specific event from Ticketmaster
 *     tags: [Ticketmaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticketmaster event ID
 *     responses:
 *       200:
 *         description: Event imported successfully
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event already exists
 *       500:
 *         description: Server error
 */
router.post('/import/:eventId', authenticate, authorize('ADMIN', 'BROKER'), ticketmasterController.importEvent);

/**
 * @swagger
 * /api/ticketmaster/import/multiple:
 *   post:
 *     summary: Import multiple events from Ticketmaster
 *     tags: [Ticketmaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Ticketmaster event IDs
 *     responses:
 *       200:
 *         description: Events imported successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
router.post('/import/multiple', authenticate, authorize('ADMIN', 'BROKER'), ticketmasterController.importMultipleEvents);

/**
 * @swagger
 * /api/ticketmaster/sync:
 *   post:
 *     summary: Sync events from Ticketmaster with optional auto-import
 *     tags: [Ticketmaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keyword:
 *                 type: string
 *                 description: Search keyword
 *               city:
 *                 type: string
 *                 description: City name
 *               state:
 *                 type: string
 *                 description: State code or name
 *               countryCode:
 *                 type: string
 *                 default: US
 *                 description: Country code
 *               classificationName:
 *                 type: string
 *                 description: Event classification
 *               size:
 *                 type: integer
 *                 default: 100
 *                 description: Number of events to fetch
 *               autoImport:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to automatically import found events
 *     responses:
 *       200:
 *         description: Events synced successfully
 *       500:
 *         description: Server error
 */
router.post('/sync', authenticate, authorize('ADMIN', 'BROKER'), ticketmasterController.syncEvents);

export default router;