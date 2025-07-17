import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").transform((val: string) => val.trim()),
  lastName: z.string().min(1, "Last name is required").transform((val: string) => val.trim()),
  phone: z.string().optional().nullable().transform((val: string | null | undefined) => val?.trim() || undefined),
  role: z.enum(["BUYER", "SELLER", "BROKER", "ADMIN"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
});

export const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["BUYER", "SELLER", "BROKER", "ADMIN"]),
});
export const createOfferSchema = z.object({
  eventId: z.string(),
  maxPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  sectionIds: z.array(z.string()).nonempty(),
  message: z.string().optional(),
  expiresAt: z.coerce.date(),
});

export const updateOfferSchema = createOfferSchema.partial();

export const offerSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["createdAt", "maxPrice", "expiresAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  eventId: z.string().cuid().optional(),
  status: z.enum(["ACTIVE", "ACCEPTED", "EXPIRED", "CANCELLED"]).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
});

export const eventSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["eventDate", "name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  eventType: z
    .enum(["SPORTS", "CONCERT", "THEATER", "COMEDY", "OTHER"])
    .optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(100, "Section name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  rowCount: z.number().int().positive().optional(),
  seatCount: z.number().int().positive().optional(),
  priceLevel: z.number().int().min(1).max(10).optional(),
});

const baseEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200, "Event name is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  venue: z.string().min(1, "Venue is required").max(200, "Venue name is too long"),
  address: z.string().min(1, "Address is required").max(300, "Address is too long"),
  city: z.string().min(1, "City is required").max(100, "City name is too long"),
  state: z.string().min(1, "State is required").max(100, "State name is too long"),
  zipCode: z.string().min(1, "Zip code is required").max(20, "Zip code is too long"),
  country: z.string().max(100, "Country name is too long").optional().default("US"),
  eventDate: z.coerce.date().refine((date) => date > new Date(), {
    message: "Event date must be in the future",
  }),
  doors: z.coerce.date().optional(),
  eventType: z.enum(["SPORTS", "CONCERT", "THEATER", "COMEDY", "OTHER"], {
    required_error: "Event type is required",
  }),
  category: z.string().max(100, "Category name is too long").optional(),
  subcategory: z.string().max(100, "Subcategory name is too long").optional(),
  ticketmasterId: z.string().max(100, "Ticketmaster ID is too long").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  minPrice: z.coerce.number().positive("Minimum price must be positive").optional(),
  maxPrice: z.coerce.number().positive("Maximum price must be positive").optional(),
  totalSeats: z.coerce.number().int().positive("Total seats must be a positive integer").optional(),
  availableSeats: z.coerce.number().int().positive("Available seats must be a positive integer").optional(),
  sections: z.array(createSectionSchema).min(1, "At least one section is required").optional(),
});

export const createEventSchema = baseEventSchema.refine((data) => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "Minimum price must be less than or equal to maximum price",
  path: ["minPrice"],
}).refine((data) => {
  if (data.doors && data.eventDate) {
    return data.doors < data.eventDate;
  }
  return true;
}, {
  message: "Doors open time must be before event start time",
  path: ["doors"],
});

export const updateEventSchema = baseEventSchema.partial().omit({ sections: true });

export const createEventSectionSchema = z.object({
  eventId: z.string().cuid("Invalid event ID"),
  ...createSectionSchema.shape,
});

export const updateEventSectionSchema = createSectionSchema.partial();
