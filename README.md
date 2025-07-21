# SeatSnags - Ticket Marketplace Platform

A comprehensive reverse marketplace for ticket resales where buyers post offers and sellers accept them. Built with modern technologies and integrated with Stripe for secure payment processing.

## 🌟 Features

### Core Platform
- 🔐 **Complete Authentication System** - Registration, login, email verification, password reset
- 💳 **Stripe Payment Integration** - Secure payments, seller payouts, refunds, and dispute handling
- 🎫 **Reverse Marketplace Model** - Buyers post offers, sellers accept
- 👥 **Multi-Role System** - Buyers, Sellers, Brokers, and Admins
- 🏢 **Broker Integration** - External ticket provider connections
- 📊 **Comprehensive Analytics** - Transaction stats, user metrics, platform insights

### Technical Features
- 🚀 **Express.js with TypeScript** - Type-safe backend development
- 📊 **PostgreSQL with Prisma ORM** - Robust database management
- 📝 **Swagger API Documentation** - Interactive API documentation
- 🐳 **Docker Containerization** - Easy deployment and scaling
- 🛡️ **Enterprise Security** - JWT auth, rate limiting, input validation
- 📧 **Email Service Integration** - Notifications and communications
- 🪝 **Webhook Support** - Real-time event processing
- 📋 **Role-Based Access Control** - Granular permission management

## 🏗️ Architecture

### Payment Flow Architecture
```
Buyer Creates Offer → Seller Accepts → Transaction Created → 
Payment Intent → Stripe Processing → Seller Payout → 
Ticket Delivery → Transaction Complete
```

### User Roles & Permissions
- **👤 Buyers**: Create offers, make payments, manage payment methods
- **🏪 Sellers**: Accept offers, receive payouts, manage listings
- **🏢 Brokers**: Integrate external systems, sync inventory
- **⚙️ Admins**: Full platform management, analytics, dispute resolution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL database
- Stripe account (for payment processing)

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd sneatsnags
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure your environment variables (see Environment Variables section)
   ```

3. **Database Setup**
   ```bash
   # Start services with Docker
   docker-compose up -d
   
   # Run database migrations
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Access Points
- **API Server**: `http://localhost:5001`
- **API Documentation**: `http://localhost:5001/api-docs`
- **Health Check**: `http://localhost:5001/health`

## 📋 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sneatsnags"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=5001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@sneatsnags.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗃️ Database Schema

### Core Models
```prisma
User          // User accounts with role-based access
Event         // Ticket events (concerts, sports, etc.)
Section       // Event venue sections
Offer         // Buyer offers for tickets
Listing       // Seller ticket listings
Transaction   // Payment transactions with Stripe integration
Notification  // User notifications
```

### Broker Integration Models
```prisma
BrokerIntegration  // External broker connections
BrokerSyncLog      // Synchronization history
```

### Key Relationships
- Users can be Buyers, Sellers, Brokers, or Admins
- Events have multiple Sections
- Offers target specific Events and Sections
- Transactions link Offers and Listings
- Stripe integration tracks payments, refunds, and payouts

## 🛣️ API Endpoints

### Authentication & User Management
```http
POST   /api/auth/register           # User registration
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
GET    /api/auth/verify-email       # Email verification
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Password reset confirmation

GET    /api/users/profile           # Get user profile
PUT    /api/users/profile           # Update user profile
POST   /api/users/change-password   # Change password
DELETE /api/users/account           # Delete account
```

### Buyer Operations
```http
GET    /api/buyers/dashboard        # Buyer dashboard
POST   /api/offers                  # Create offer
GET    /api/offers/my-offers        # Get buyer's offers
PUT    /api/offers/{id}             # Update offer
DELETE /api/offers/{id}             # Cancel offer
```

### Seller Operations
```http
GET    /api/sellers/dashboard       # Seller dashboard
POST   /api/listings                # Create listing
GET    /api/listings/my-listings    # Get seller's listings
PUT    /api/listings/{id}           # Update listing
POST   /api/offers/{id}/accept      # Accept offer
```

### Event Management
```http
GET    /api/events                  # Browse events
GET    /api/events/{id}             # Get event details
GET    /api/events/popular          # Popular events
GET    /api/events/search           # Search events
GET    /api/events/{id}/sections    # Get event sections
```

### Payment & Transactions
```http
POST   /api/transactions/{id}/create-payment-intent    # Initialize payment
POST   /api/transactions/{id}/process-payment          # Process payment
GET    /api/transactions/my-transactions               # User transactions
POST   /api/transactions/seller/create-account        # Create Stripe account
POST   /api/transactions/seller/onboarding-link       # Seller onboarding
POST   /api/transactions/{id}/seller-payout           # Process payout (Admin)
POST   /api/transactions/{id}/process-refund          # Process refund (Admin)
```

### Broker Integration
```http
GET    /api/brokers/integrations    # List integrations
POST   /api/brokers/integrations    # Create integration
PUT    /api/brokers/integrations/{id} # Update integration
POST   /api/brokers/integrations/{id}/sync # Trigger sync
GET    /api/brokers/integrations/{id}/logs # Sync logs
```

### Admin Operations
```http
GET    /api/admin/dashboard         # Admin dashboard
GET    /api/admin/users             # User management
GET    /api/admin/transactions      # Transaction management
GET    /api/admin/analytics         # Platform analytics
POST   /api/admin/users/{id}/deactivate # Deactivate user
```

### Webhooks
```http
POST   /api/webhooks/stripe         # Stripe webhook events
```

## 💳 Stripe Payment Integration

### Features
- **Payment Processing**: Secure credit card payments via Stripe
- **Seller Payouts**: Automatic transfers to seller accounts via Stripe Connect
- **Refund Management**: Full and partial refunds
- **Payment Methods**: Save and manage customer payment methods
- **Webhook Processing**: Real-time payment event handling
- **Dispute Handling**: Comprehensive dispute resolution workflow

### Payment Flow
1. **Offer Acceptance**: Seller accepts buyer's offer, creating a transaction
2. **Payment Intent**: System creates Stripe Payment Intent
3. **Payment Processing**: Buyer completes payment via Stripe Elements
4. **Automatic Payout**: Seller receives funds via Stripe Connect
5. **Notification**: Both parties receive confirmation

### Webhook Events
- `payment_intent.succeeded` - Payment completion
- `payment_intent.payment_failed` - Payment failure handling
- `refund.created` - Refund processing
- `transfer.created` - Seller payout confirmation

For detailed Stripe integration documentation, see [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md).

## 🏢 Broker Integration

### Supported Integrations
- **SkyBox** - FTP-based inventory sync
- **AutoProcessor** - Automated ticket processing
- **Ticket Evolution** - Real-time API integration
- **Custom FTP** - Flexible file-based integrations

### Integration Features
- **Real-time Sync** - Automatic inventory updates
- **Field Mapping** - Flexible data transformation
- **Error Handling** - Comprehensive error tracking
- **Audit Logs** - Complete sync history
- **Multiple Formats** - Support for various data formats

## 🛡️ Security

### Authentication & Authorization
- **JWT-based Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Password Security** with bcrypt hashing
- **Email Verification** for account activation
- **Password Reset** with secure token validation

### API Security
- **Rate Limiting** to prevent abuse
- **Input Validation** with comprehensive schemas
- **CORS Protection** for cross-origin requests
- **Helmet.js** for security headers
- **Request Sanitization** to prevent XSS

### Payment Security
- **PCI Compliance** via Stripe integration
- **Webhook Verification** with signature validation
- **Secure API Keys** management
- **Amount Validation** server-side verification

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Database Management
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:migrate:dev   # Create and apply new migration
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database and apply migrations

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run typecheck        # Run TypeScript type checking
npm run test             # Run test suite
npm run test:watch       # Run tests in watch mode

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs      # View service logs
```

## 🐳 Docker Deployment

### Development
```bash
# Start all services (app, database, redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# Rebuild after changes
docker-compose up --build
```

### Production
```bash
# Build production image
docker build -t sneatsnags-api .

# Run with environment variables
docker run -p 5001:5001 --env-file .env sneatsnags-api
```

## 📈 Monitoring & Logging

### Structured Logging
- **Winston Logger** for structured logging
- **Request Logging** for API calls
- **Error Tracking** with stack traces
- **Performance Metrics** for optimization

### Health Monitoring
- **Health Check Endpoint**: `/health`
- **Database Connection Monitoring**
- **Redis Connection Monitoring**
- **Stripe Service Monitoring**

### Log Levels
```javascript
logger.error("Critical errors requiring immediate attention")
logger.warn("Warning conditions that should be monitored")
logger.info("General operational information")
logger.debug("Detailed debugging information")
```

## 🧪 Testing

### Test Categories
- **Unit Tests** - Individual function testing
- **Integration Tests** - API endpoint testing
- **Payment Tests** - Stripe integration testing
- **Authentication Tests** - Security flow testing

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test suite
npm run test -- --grep "Authentication"

# Generate coverage report
npm run test:coverage
```

### Test Data
- Use Stripe test cards for payment testing
- Sample events and users provided via seed script
- Isolated test database for integration tests

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Stripe account configured with live keys
- [ ] Webhook endpoints configured
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented

### Deployment Steps
1. **Build Application**
   ```bash
   npm run build
   ```

2. **Database Migration**
   ```bash
   npm run db:migrate
   ```

3. **Start Production Server**
   ```bash
   npm run start
   ```

4. **Health Check**
   ```bash
   curl https://your-domain.com/health
   ```

### Environment-Specific Configurations
- **Development**: Test Stripe keys, local database
- **Staging**: Test Stripe keys, staging database
- **Production**: Live Stripe keys, production database

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test`)
6. Run linting (`npm run lint:fix`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Standards
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Test Coverage** for new features

### Pull Request Guidelines
- Provide clear description of changes
- Include relevant tests
- Update documentation as needed
- Ensure CI/CD pipeline passes
- Request review from maintainers

## 📞 Support & Documentation

### Additional Documentation
- [Stripe Integration Guide](./STRIPE_INTEGRATION.md)
- [API Documentation](http://localhost:5001/api-docs) (when running)
- [Database Schema](./prisma/schema.prisma)
- [Environment Configuration](./.env.example)

### Getting Help
- 📖 Check the API documentation at `/api-docs`
- 🐛 Report bugs via GitHub Issues
- 💡 Request features via GitHub Discussions
- 📧 Contact support for critical issues

### Troubleshooting
- **Database Connection Issues**: Check `DATABASE_URL` configuration
- **Stripe Payment Failures**: Verify API keys and webhook configuration
- **Authentication Problems**: Ensure JWT secrets are properly configured
- **Email Delivery Issues**: Verify SMTP configuration

## 📄 License

This project is proprietary software for SeatSnags Platform.

---

Built with ❤️ using TypeScript, Express.js, Prisma, and Stripe.