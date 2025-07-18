import { api } from './api';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const testimonialService = {
  getFeaturedTestimonials: async (): Promise<Testimonial[]> => {
    const response = await api.get('/testimonials/featured');
    return response.data.data;
  },

  getAllTestimonials: async (): Promise<Testimonial[]> => {
    const response = await api.get('/testimonials');
    return response.data.data;
  }
};