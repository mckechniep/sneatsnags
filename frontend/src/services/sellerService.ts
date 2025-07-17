import { api } from './api';

export interface CreateListingRequest {
  eventId: string;
  sectionId: string;
  row?: string;
  seats: string[];
  price: number;
  quantity: number;
  notes?: string;
  ticketFiles?: string[];
}

export interface UpdateListingRequest {
  price?: number;
  notes?: string;
  status?: string;
}

export interface SellerListing {
  id: string;
  eventId: string;
  sectionId: string;
  sellerId: string;
  price: number;
  quantity: number;
  row?: string;
  seats: string[];
  notes?: string;
  status: string;
  ticketFiles: string[];
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    name: string;
    eventDate: string;
    venue: string;
    city: string;
    state: string;
  };
  section: {
    id: string;
    name: string;
  };
}

export interface SellerStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalRevenue: number;
}

export interface SellerTransaction {
  id: string;
  buyerId: string;
  sellerId: string;
  offerId: string;
  listingId: string;
  eventId: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: string;
  paidAt?: string;
  ticketsDelivered: boolean;
  ticketsDeliveredAt?: string;
  sellerPaidOut: boolean;
  sellerPaidOutAt?: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  offer: {
    id: string;
    maxPrice: number;
    quantity: number;
    message?: string;
    event: {
      id: string;
      name: string;
      eventDate: string;
      venue: string;
      city: string;
      state: string;
    };
  };
  listing: {
    id: string;
    price: number;
    seats: string[];
    row?: string;
  };
}

export interface AvailableOffer {
  id: string;
  eventId: string;
  buyerId: string;
  maxPrice: number;
  quantity: number;
  message?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  event: {
    id: string;
    name: string;
    eventDate: string;
    venue: string;
    city: string;
    state: string;
  };
  sections: Array<{
    id: string;
    offerId: string;
    sectionId: string;
    section: {
      id: string;
      name: string;
    };
  }>;
}

class SellerService {
  async getDashboard(): Promise<SellerStats> {
    try {
      console.log('Calling seller dashboard API...');
      const response = await api.get('/sellers/dashboard');
      console.log('Seller dashboard response:', response);
      return response.data;
    } catch (error) {
      console.error('Seller dashboard API error:', error);
      throw error;
    }
  }

  async getListings(query?: {
    page?: number;
    limit?: number;
    status?: string;
    eventId?: string;
  }): Promise<{
    data: SellerListing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get('/sellers/listings', query);
    
    // Backend returns: { success: true, data: { data: SellerListing[], pagination: {...} } }
    // We need to extract the nested data structure
    if (response.data?.data && response.data?.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    }
    
    // Fallback for different response structures
    return {
      data: response.data?.data?.data || response.data?.data || response.data || [],
      pagination: response.data?.data?.pagination || response.data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      }
    };
  }

  async createListing(listingData: CreateListingRequest): Promise<SellerListing> {
    const response = await api.post('/sellers/listings', listingData);
    return response.data;
  }

  async updateListing(listingId: string, updates: UpdateListingRequest): Promise<SellerListing> {
    const response = await api.put(`/sellers/listings/${listingId}`, updates);
    return response.data;
  }

  async deleteListing(listingId: string): Promise<void> {
    await api.delete(`/sellers/listings/${listingId}`);
  }

  async getTransactions(query?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    data: SellerTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get('/sellers/transactions', query);
    return response.data;
  }

  async acceptOffer(offerId: string, listingId: string, quantity?: number): Promise<SellerTransaction> {
    const response = await api.post(`/sellers/offers/${offerId}/accept`, { 
      listingId,
      quantity 
    });
    return response.data;
  }

  async markTicketsDelivered(transactionId: string): Promise<SellerTransaction> {
    const response = await api.post(`/sellers/transactions/${transactionId}/deliver`);
    return response.data;
  }

  async uploadTicketFiles(listingId: string, files: File[]): Promise<SellerListing> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('tickets', file);
    });

    const response = await api.post(`/sellers/listings/${listingId}/upload-tickets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getListingOffers(listingId: string, query?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    data: AvailableOffer[];
    listing: SellerListing;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get(`/sellers/listings/${listingId}/offers`, query);
    return response.data;
  }

  async getAvailableOffers(query?: {
    page?: number;
    limit?: number;
    eventId?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{
    data: AvailableOffer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get('/sellers/offers', query);
    return response.data;
  }
}

export const sellerService = new SellerService();