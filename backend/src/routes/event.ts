import { Router } from "express";
import { eventController } from "../controllers/eventController";
import { authenticate } from "../middlewares/auth";
import { validateRole } from "../middlewares/validation";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with comprehensive filtering and pagination
 *     tags: [Events]
 *     parameters:
 *       # Pagination
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 200
 *         description: Number of events per page
 *
 *       # Location filters
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state code or name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *           default: US
 *         description: Filter by country code
 *       - in: query
 *         name: postalCode
 *         schema:
 *           type: string
 *         description: Filter by postal code
 *       - in: query
 *         name: radius
 *         schema:
 *           type: string
 *         description: Search radius from location
 *       - in: query
 *         name: unit
 *         schema:
 *           type: string
 *           enum: [miles, km]
 *         description: Unit for radius (miles or km)
 *       - in: query
 *         name: dmaId
 *         schema:
 *           type: string
 *         description: Designated Market Area ID
 *
 *       # Classification filters
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Event classification (music, sports, arts, etc.)
 *       - in: query
 *         name: classificationName
 *         schema:
 *           type: string
 *         description: Alternative to eventType
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *         description: Event segment (Music, Sports, Arts & Theatre, etc.)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Event genre (Rock, Pop, Football, etc.)
 *       - in: query
 *         name: subGenre
 *         schema:
 *           type: string
 *         description: Event sub-genre
 *       - in: query
 *         name: segmentId
 *         schema:
 *           type: string
 *         description: Segment ID for filtering
 *       - in: query
 *         name: genreId
 *         schema:
 *           type: string
 *         description: Genre ID for filtering
 *       - in: query
 *         name: subGenreId
 *         schema:
 *           type: string
 *         description: Sub-genre ID for filtering
 *
 *       # Search and keyword
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for event names
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Alternative to search parameter
 *
 *       # Date and time filters
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events starting from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events ending before this date
 *       - in: query
 *         name: startDateTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events starting from this datetime
 *       - in: query
 *         name: endDateTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events ending before this datetime
 *
 *       # Price filters
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum ticket price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum ticket price
 *
 *       # Source and availability
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Event source (ticketmaster, universe, etc.)
 *       - in: query
 *         name: includeTBD
 *         schema:
 *           type: string
 *           enum: [yes, no]
 *           default: yes
 *         description: Include events with TBD dates
 *       - in: query
 *         name: includeTBA
 *         schema:
 *           type: string
 *           enum: [yes, no]
 *           default: yes
 *         description: Include events with TBA dates
 *       - in: query
 *         name: includeTest
 *         schema:
 *           type: string
 *           enum: [yes, no]
 *           default: no
 *         description: Include test events
 *       - in: query
 *         name: ageRestrictions
 *         schema:
 *           type: string
 *         description: Age restriction requirements
 *
 *       # Venue and attraction filters
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *         description: Filter by specific venue ID
 *       - in: query
 *         name: attractionId
 *         schema:
 *           type: string
 *         description: Filter by specific attraction ID
 *       - in: query
 *         name: promoterId
 *         schema:
 *           type: string
 *         description: Filter by specific promoter ID
 *
 *       # Sorting and display
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date,asc, date,desc, name,asc, name,desc, relevance,desc, distance,asc, venueName,asc, random]
 *           default: date,asc
 *         description: Sort order for results
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *           default: en
 *         description: Response locale
 *
 *       # Sale date filters
 *       - in: query
 *         name: onSaleStartFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by on-sale start date from
 *       - in: query
 *         name: onSaleEndFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by on-sale end date from
 *     responses:
 *       200:
 *         description: Events retrieved successfully with pagination and metadata
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
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                         filteredTotal:
 *                           type: integer
 *                         maxPages:
 *                           type: integer
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         searchCriteria:
 *                           type: object
 *                         responseInfo:
 *                           type: object
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get("/", eventController.getEvents);

/**
 * @swagger
 * /api/events/search:
 *   get:
 *     summary: Search events by query
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get("/search", eventController.searchEvents);

/**
 * @swagger
 * /api/events/popular:
 *   get:
 *     summary: Get popular events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular events retrieved successfully
 */
router.get("/popular", eventController.getPopularEvents);

/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upcoming events retrieved successfully
 */
router.get("/upcoming", eventController.getUpcomingEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get("/:id", eventController.getEventById);

/**
 * @swagger
 * /api/events/{id}/sections:
 *   get:
 *     summary: Get event sections
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event sections retrieved successfully
 */
router.get("/:id/sections", eventController.getEventSections);

/**
 * @swagger
 * /api/events/{id}/stats:
 *   get:
 *     summary: Get event statistics
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event statistics retrieved successfully
 */
router.get("/:id/stats", eventController.getEventStats);

// Admin-only routes
router.use(authenticate);
router.use(validateRole([UserRole.ADMIN]));

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - venue
 *               - address
 *               - city
 *               - state
 *               - zipCode
 *               - eventDate
 *               - eventType
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               venue:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               doors:
 *                 type: string
 *                 format: date-time
 *               eventType:
 *                 type: string
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               minPrice:
 *                 type: number
 *               maxPrice:
 *                 type: number
 *               totalSeats:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post("/", eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event (Admin only)
 *     tags: [Events]
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
 *         description: Event updated successfully
 */
router.put("/:id", eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (Admin only)
 *     tags: [Events]
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
 *         description: Event deleted successfully
 */
router.delete("/:id", eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/sections:
 *   post:
 *     summary: Create event section (Admin only)
 *     tags: [Events]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               rowCount:
 *                 type: integer
 *               seatCount:
 *                 type: integer
 *               priceLevel:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Section created successfully
 */
router.post("/:id/sections", eventController.createSection);

/**
 * @swagger
 * /api/events/sections/{sectionId}:
 *   put:
 *     summary: Update event section (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section updated successfully
 */
router.put("/sections/:sectionId", eventController.updateSection);

/**
 * @swagger
 * /api/events/sections/{sectionId}:
 *   delete:
 *     summary: Delete event section (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted successfully
 */
router.delete("/sections/:sectionId", eventController.deleteSection);

export { router as eventRoutes };