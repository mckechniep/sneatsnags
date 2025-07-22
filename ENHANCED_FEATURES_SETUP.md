# Enhanced Features Setup Guide

This guide covers the implementation of enhanced Stripe configuration, AutoMatch engine, and notifications system for SneatSnags.

## 🚀 Overview

The enhanced features include:

1. **Enhanced Stripe Integration**
   - Marketplace payments with connected accounts
   - Automated webhook handling
   - Comprehensive refund management
   - Real-time payment processing

2. **AutoMatch Engine**
   - AI-powered buyer-seller matching
   - Intelligent scoring algorithms
   - Price alerts and notifications
   - Buyer preference management

3. **Enhanced Notifications System**
   - Real-time WebSocket notifications
   - Multi-channel delivery (Email, Push, SMS)
   - Smart scheduling and user preferences
   - Rich email templates

## 📋 Prerequisites

- Node.js 18+
- MySQL/PostgreSQL database
- Redis (for caching and sessions)
- Stripe account with Connect enabled
- Email service (SendGrid, AWS SES, etc.)

## 🔧 Installation Steps

### 1. Database Migration

Run the enhanced schema migration:

```sql
-- Execute the migration file
mysql -u username -p database_name < backend/prisma/migrations/enhanced_features.sql
```

Or use Prisma:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Enhanced Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# AutoMatch Engine
AUTOMATCH_ENABLED=true
AUTOMATCH_SCHEDULE_CRON=0 */6 * * *  # Every 6 hours
AUTOMATCH_MAX_MATCHES_PER_USER=10

# Enhanced Notifications
NOTIFICATION_EMAIL_FROM=noreply@sneatsnags.com
NOTIFICATION_SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Push Notifications (Firebase)
FIREBASE_SERVER_KEY=AAAA...
FIREBASE_PROJECT_ID=sneatsnags-...

# WebSocket
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000
```

### 3. Install Dependencies

```bash
cd backend
npm install stripe socket.io twilio @firebase/admin-sdk
```

### 4. Update Main App File

Add the enhanced routes to your main app:

```typescript
// backend/src/app.ts
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import enhancedRoutes from './routes/enhanced';
import { enhancedNotificationService } from './services/enhancedNotificationService';

const app = express();
const server = createServer(app);

// Setup WebSocket server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN,
    credentials: true,
  },
});

// Initialize notification service with WebSocket
const notificationService = new enhancedNotificationService(io);

// Add enhanced routes
app.use('/api/v1/enhanced', enhancedRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { app, server, io };
```

### 5. Stripe Webhook Configuration

1. Go to your Stripe Dashboard
2. Navigate to Developers > Webhooks
3. Add endpoint: `https://yourdomain.com/api/v1/enhanced/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
   - `payout.paid`

### 6. Setup Scheduled Jobs

Create a job scheduler for AutoMatch:

```typescript
// backend/src/jobs/scheduler.ts
import cron from 'node-cron';
import { autoMatchEngine } from '../services/autoMatchEngine';

// Run AutoMatch every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled AutoMatch...');
  await autoMatchEngine.runScheduledMatching();
});

// Price alert checker every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking price alerts...');
  // TODO: Implement price alert checker
});
```

## 🎯 Usage Examples

### Enhanced Stripe Integration

```typescript
// Create a marketplace payment
const paymentResult = await enhancedStripeService.processTicketPurchase(
  buyerId: 'user123',
  sellerId: 'seller456',
  listingId: 'listing789',
  amount: 150.00,
  quantity: 2
);

// Setup seller onboarding
const onboarding = await enhancedStripeService.setupConnectedAccountOnboarding({
  userId: 'seller456',
  email: 'seller@example.com',
  firstName: 'John',
  lastName: 'Doe',
  businessType: 'individual',
  country: 'US',
  returnUrl: 'https://app.com/onboarding/return',
  refreshUrl: 'https://app.com/onboarding/refresh',
});
```

### AutoMatch Engine

```typescript
// Find matches for a buyer
const matches = await autoMatchEngine.findMatches({
  userId: 'buyer123',
  eventId: 'event456',
  maxPrice: 200,
  minPrice: 50,
  preferredSections: ['Section A', 'VIP'],
  maxQuantity: 4,
  instantBuyEnabled: true,
  notificationEnabled: true,
});

// Create buyer preferences
const preferences = await autoMatchEngine.createBuyerPreferences({
  userId: 'buyer123',
  eventId: 'event456',
  maxPrice: 150,
  preferredSections: ['Section A'],
  maxQuantity: 2,
  notificationEnabled: true,
});
```

### Enhanced Notifications

```typescript
// Send a rich notification
await enhancedNotificationService.createNotification({
  userId: 'user123',
  type: 'AUTOMATCH_FOUND',
  data: {
    eventName: 'Taylor Swift Concert',
    matchCount: 5,
    confidence: 'HIGH',
    topMatch: matchData,
  },
  priority: 'HIGH',
  channels: ['IN_APP', 'EMAIL', 'PUSH'],
  actionUrl: '/matches/view/12345',
});

// Bulk notifications
await enhancedNotificationService.createBulkNotifications([
  { userId: 'user1', type: 'PRICE_ALERT', data: alertData1 },
  { userId: 'user2', type: 'PRICE_ALERT', data: alertData2 },
]);
```

## 🔍 API Endpoints

### Stripe Endpoints

```
POST   /api/v1/enhanced/stripe/payment-intent
POST   /api/v1/enhanced/stripe/seller-account
POST   /api/v1/enhanced/stripe/webhook
POST   /api/v1/enhanced/stripe/refund
GET    /api/v1/enhanced/stripe/balance
GET    /api/v1/enhanced/stripe/fees?amount=100
```

### AutoMatch Endpoints

```
POST   /api/v1/enhanced/automatch/find
POST   /api/v1/enhanced/automatch/preferences
GET    /api/v1/enhanced/automatch/preferences
PUT    /api/v1/enhanced/automatch/preferences/:id
DELETE /api/v1/enhanced/automatch/preferences/:id
GET    /api/v1/enhanced/automatch/history
PUT    /api/v1/enhanced/automatch/matches/:matchId/view
POST   /api/v1/enhanced/automatch/price-alerts
GET    /api/v1/enhanced/automatch/price-alerts
DELETE /api/v1/enhanced/automatch/price-alerts/:alertId
POST   /api/v1/enhanced/automatch/trigger-matching (Admin only)
```

## 🚦 Testing

### Unit Tests

```bash
cd backend
npm run test:enhanced
```

### Integration Tests

```bash
# Test Stripe integration
npm run test:stripe

# Test AutoMatch engine
npm run test:automatch

# Test notifications
npm run test:notifications
```

### Manual Testing

1. **Stripe Integration**:
   - Test payment flow with test cards
   - Verify webhook handling
   - Test refund processing

2. **AutoMatch Engine**:
   - Create buyer preferences
   - Add matching listings
   - Verify match scoring and notifications

3. **Notifications**:
   - Test real-time WebSocket delivery
   - Verify email template rendering
   - Check notification preferences

## 🎨 Frontend Integration

### WebSocket Client

```typescript
// frontend/src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useNotifications = (userId: string) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL);
    
    newSocket.emit('join-user-room', userId);
    
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Show toast notification
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [userId]);

  return { socket, notifications };
};
```

### AutoMatch Component

```typescript
// frontend/src/components/AutoMatch.tsx
import React, { useState } from 'react';
import { autoMatchService } from '../services/autoMatchService';

export const AutoMatch = () => {
  const [preferences, setPreferences] = useState({
    maxPrice: 200,
    preferredSections: [],
    maxQuantity: 2,
  });
  
  const [matches, setMatches] = useState([]);

  const findMatches = async () => {
    const results = await autoMatchService.findMatches(preferences);
    setMatches(results.matches);
  };

  return (
    <div className="automatch">
      <h2>AutoMatch Settings</h2>
      {/* Preference form */}
      
      <div className="matches">
        {matches.map(match => (
          <MatchCard key={match.listingId} match={match} />
        ))}
      </div>
    </div>
  );
};
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Stripe Integration**:
   - Payment success rate
   - Average processing time
   - Refund rate
   - Connected account onboarding completion

2. **AutoMatch Engine**:
   - Match accuracy rate
   - User engagement with matches
   - Conversion from matches to purchases
   - Algorithm performance metrics

3. **Notifications**:
   - Delivery rates by channel
   - User engagement rates
   - Opt-out rates
   - Performance by notification type

### Logging and Alerts

```typescript
// Setup comprehensive logging
import { logger } from './utils/logger';

// Log key events
logger.info('AutoMatch found', { userId, matchCount, confidence });
logger.error('Stripe payment failed', { paymentIntentId, error });
logger.warn('Notification delivery failed', { userId, channel, error });
```

## 🔒 Security Considerations

1. **Stripe Webhooks**: Always verify webhook signatures
2. **User Data**: Encrypt sensitive user preferences
3. **Rate Limiting**: Implement on all API endpoints
4. **Input Validation**: Validate all user inputs
5. **Access Control**: Ensure users can only access their own data

## 📈 Performance Optimization

1. **Database Indexing**: Ensure proper indexes on match queries
2. **Caching**: Cache frequent AutoMatch results
3. **Background Jobs**: Process heavy operations asynchronously
4. **Connection Pooling**: Use connection pools for database and Redis

## 🎉 Conclusion

The enhanced features provide a robust foundation for:
- Scalable marketplace payments
- Intelligent ticket matching
- Comprehensive user engagement

Follow the implementation steps carefully and test thoroughly before deploying to production.

For support or questions, refer to the individual service documentation or contact the development team.