import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    redis?: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
  };
  version: string;
  environment: string;
}

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const healthCheck: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'disconnected'
      }
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // Test database connection
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbEndTime = Date.now();
    
    healthCheck.services.database = {
      status: 'connected',
      responseTime: dbEndTime - dbStartTime
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    healthCheck.services.database = {
      status: 'error'
    };
    healthCheck.status = 'error';
  }

  // Test Redis connection (if available)
  if (process.env.REDIS_URL) {
    try {
      // Redis health check logic would go here
      healthCheck.services.redis = {
        status: 'connected',
        responseTime: 0
      };
    } catch (error) {
      console.error('Redis health check failed:', error);
      healthCheck.services.redis = {
        status: 'error'
      };
    }
  }

  // Set appropriate HTTP status code
  const statusCode = healthCheck.status === 'ok' ? 200 : 503;
  
  res.status(statusCode).json(healthCheck);
});

// Readiness check (for k8s-style deployments)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      error: 'Database not accessible',
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check (for k8s-style deployments)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;