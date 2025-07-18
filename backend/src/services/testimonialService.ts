import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export class TestimonialService {
  async getFeaturedTestimonials() {
    try {
      const testimonials = await prisma.testimonial.findMany({
        where: {
          isActive: true,
          isFeatured: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 6
      });

      return testimonials;
    } catch (error) {
      logger.error('Error fetching featured testimonials:', error);
      throw error;
    }
  }

  async getAllTestimonials() {
    try {
      const testimonials = await prisma.testimonial.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return testimonials;
    } catch (error) {
      logger.error('Error fetching testimonials:', error);
      throw error;
    }
  }

  async createTestimonial(data: {
    name: string;
    role: string;
    company?: string;
    content: string;
    rating: number;
    avatar?: string;
    isVerified?: boolean;
    isFeatured?: boolean;
  }) {
    try {
      const testimonial = await prisma.testimonial.create({
        data
      });

      logger.info(`Testimonial created: ${testimonial.id}`);
      return testimonial;
    } catch (error) {
      logger.error('Error creating testimonial:', error);
      throw error;
    }
  }

  async updateTestimonial(id: string, data: Partial<{
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    avatar: string;
    isVerified: boolean;
    isFeatured: boolean;
    isActive: boolean;
  }>) {
    try {
      const testimonial = await prisma.testimonial.update({
        where: { id },
        data
      });

      logger.info(`Testimonial updated: ${testimonial.id}`);
      return testimonial;
    } catch (error) {
      logger.error('Error updating testimonial:', error);
      throw error;
    }
  }

  async deleteTestimonial(id: string) {
    try {
      await prisma.testimonial.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info(`Testimonial deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting testimonial:', error);
      throw error;
    }
  }
}

export const testimonialService = new TestimonialService();