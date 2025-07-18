import { Router } from 'express';
import { testimonialService } from '../services/testimonialService';
import { logger } from '../utils/logger';

const router = Router();

// Get featured testimonials (public)
router.get('/featured', async (req, res) => {
  try {
    const testimonials = await testimonialService.getFeaturedTestimonials();
    res.json({
      success: true,
      message: 'Featured testimonials retrieved successfully',
      data: testimonials
    });
  } catch (error) {
    logger.error('Error fetching featured testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured testimonials'
    });
  }
});

// Get all testimonials (public)
router.get('/', async (req, res) => {
  try {
    const testimonials = await testimonialService.getAllTestimonials();
    res.json({
      success: true,
      message: 'Testimonials retrieved successfully',
      data: testimonials
    });
  } catch (error) {
    logger.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    });
  }
});

export default router;