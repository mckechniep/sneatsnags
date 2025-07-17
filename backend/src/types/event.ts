import { PaginationQuery } from "./api";

export interface CreateEventRequest {
  name: string;
  description?: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  eventDate: Date;
  doors?: Date;
  eventType: "SPORTS" | "CONCERT" | "THEATER" | "COMEDY" | "OTHER";
  category?: string;
  subcategory?: string;
  imageUrl?: string;
  minPrice?: number;
  maxPrice?: number;
  totalSeats?: number;
  sections?: CreateSectionRequest[];
}

export interface CreateSectionRequest {
  name: string;
  description?: string;
  rowCount?: number;
  seatCount?: number;
  priceLevel?: number;
}

export type UpdateEventRequest = Partial<Omit<CreateEventRequest, "sections">>;

export interface EventSearchQuery extends PaginationQuery {
  city?: string;
  state?: string;
  eventType?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
