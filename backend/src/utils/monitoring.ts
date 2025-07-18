import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log request details
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding, cb);
  };
  
  next();
};

// Error tracking
export const errorTracking = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorId = generateErrorId();
  
  logger.error('Application error', {
    errorId,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // In production, don't expose error details
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorId,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      success: false,
      message: error.message,
      errorId,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

// Generate unique error ID
function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// System metrics collection
export const collectSystemMetrics = () => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
    platform: process.platform,
    nodeEnv: process.env.NODE_ENV
  };
  
  logger.info('System metrics', metrics);
  return metrics;
};

// Database connection monitoring
export const monitorDatabaseConnection = async (prisma: any) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const end = Date.now();
    
    logger.info('Database connection check', {
      status: 'connected',
      responseTime: `${end - start}ms`,
      timestamp: new Date().toISOString()
    });
    
    return { status: 'connected', responseTime: end - start };
  } catch (error) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return { status: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Initialize monitoring
export const initializeMonitoring = () => {
  // Collect system metrics every 5 minutes
  setInterval(() => {
    collectSystemMetrics();
  }, 5 * 60 * 1000);
  
  // Monitor for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date().toISOString()
    });
  });
  
  // Monitor for uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
  logger.info('Monitoring initialized', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
};