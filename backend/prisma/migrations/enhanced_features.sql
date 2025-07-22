-- Enhanced Stripe Integration Schema
ALTER TABLE User ADD COLUMN IF NOT EXISTS stripeCustomerId VARCHAR(255);
ALTER TABLE User ADD COLUMN IF NOT EXISTS stripeConnectedAccountId VARCHAR(255);
ALTER TABLE User ADD COLUMN IF NOT EXISTS stripeAccountStatus ENUM('PENDING', 'ACTIVE', 'RESTRICTED', 'INACTIVE') DEFAULT 'PENDING';
ALTER TABLE Transaction ADD COLUMN IF NOT EXISTS stripePaymentIntentId VARCHAR(255);
ALTER TABLE Transaction ADD COLUMN IF NOT EXISTS platformFee DECIMAL(10,2);
ALTER TABLE Transaction ADD COLUMN IF NOT EXISTS status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED') DEFAULT 'PENDING';

-- AutoMatch Engine Schema
CREATE TABLE IF NOT EXISTS BuyerPreference (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  eventId VARCHAR(36),
  maxPrice DECIMAL(10,2) NOT NULL,
  minPrice DECIMAL(10,2),
  maxQuantity INT NOT NULL DEFAULT 1,
  minQuantity INT DEFAULT 1,
  preferredSections JSON,
  keywords JSON,
  instantBuyEnabled BOOLEAN DEFAULT FALSE,
  notificationEnabled BOOLEAN DEFAULT TRUE,
  isActive BOOLEAN DEFAULT TRUE,
  lastMatchRun DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MatchResult (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  buyerId VARCHAR(36) NOT NULL,
  sellerId VARCHAR(36) NOT NULL,
  listingId VARCHAR(36) NOT NULL,
  eventId VARCHAR(36) NOT NULL,
  matchScore DECIMAL(3,2) NOT NULL,
  confidence ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
  recommendedPrice DECIMAL(10,2) NOT NULL,
  matchCriteria JSON,
  reasons JSON,
  autoApproveEligible BOOLEAN DEFAULT FALSE,
  viewed BOOLEAN DEFAULT FALSE,
  actedUpon BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  FOREIGN KEY (buyerId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (sellerId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (listingId) REFERENCES Listing(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  INDEX idx_buyer_match (buyerId, createdAt),
  INDEX idx_listing_match (listingId, createdAt),
  INDEX idx_match_score (matchScore DESC)
);

-- Enhanced Notifications Schema
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM';
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS channels JSON;
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS scheduleFor DATETIME;
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS expiresAt DATETIME;
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS actionable BOOLEAN DEFAULT FALSE;
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS actionUrl VARCHAR(512);
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS groupId VARCHAR(36);
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS deliveredAt DATETIME;
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS emailSentAt DATETIME;
ALTER TABLE Notification ADD COLUMN IF NOT EXISTS pushSentAt DATETIME;

CREATE TABLE IF NOT EXISTS NotificationPreference (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL UNIQUE,
  emailEnabled BOOLEAN DEFAULT TRUE,
  smsEnabled BOOLEAN DEFAULT FALSE,
  pushEnabled BOOLEAN DEFAULT TRUE,
  inAppEnabled BOOLEAN DEFAULT TRUE,
  offerNotifications BOOLEAN DEFAULT TRUE,
  paymentNotifications BOOLEAN DEFAULT TRUE,
  marketingNotifications BOOLEAN DEFAULT FALSE,
  autoMatchNotifications BOOLEAN DEFAULT TRUE,
  priceAlerts BOOLEAN DEFAULT TRUE,
  eventReminders BOOLEAN DEFAULT TRUE,
  weeklyReports BOOLEAN DEFAULT TRUE,
  quietHoursStart TIME,
  quietHoursEnd TIME,
  timezone VARCHAR(64) DEFAULT 'UTC',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Price Alert System
CREATE TABLE IF NOT EXISTS PriceAlert (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  eventId VARCHAR(36) NOT NULL,
  sectionId VARCHAR(36),
  targetPrice DECIMAL(10,2) NOT NULL,
  currentPrice DECIMAL(10,2),
  isActive BOOLEAN DEFAULT TRUE,
  lastChecked DATETIME,
  alertsSent INT DEFAULT 0,
  maxAlerts INT DEFAULT 5,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  FOREIGN KEY (sectionId) REFERENCES Section(id) ON DELETE CASCADE,
  INDEX idx_user_alerts (userId, isActive),
  INDEX idx_event_alerts (eventId, targetPrice)
);

-- Enhanced User Analytics
CREATE TABLE IF NOT EXISTS UserAnalytics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  listingViews INT DEFAULT 0,
  offersMade INT DEFAULT 0,
  offersReceived INT DEFAULT 0,
  salesCompleted INT DEFAULT 0,
  purchasesCompleted INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  loginCount INT DEFAULT 0,
  timeSpentMinutes INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (userId, date),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_date (userId, date),
  INDEX idx_date_analytics (date)
);

-- Event Performance Metrics
CREATE TABLE IF NOT EXISTS EventMetrics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  eventId VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  totalListings INT DEFAULT 0,
  activeListings INT DEFAULT 0,
  totalOffers INT DEFAULT 0,
  acceptedOffers INT DEFAULT 0,
  averagePrice DECIMAL(10,2),
  lowestPrice DECIMAL(10,2),
  highestPrice DECIMAL(10,2),
  totalSales INT DEFAULT 0,
  totalRevenue DECIMAL(10,2) DEFAULT 0,
  viewCount INT DEFAULT 0,
  searchCount INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event_date (eventId, date),
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  INDEX idx_event_date (eventId, date),
  INDEX idx_event_performance (eventId, totalSales DESC, averagePrice)
);

-- Automated Matching Jobs
CREATE TABLE IF NOT EXISTS MatchingJob (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
  jobType ENUM('SCHEDULED', 'MANUAL', 'TRIGGERED') DEFAULT 'SCHEDULED',
  usersProcessed INT DEFAULT 0,
  matchesFound INT DEFAULT 0,
  notificationsSent INT DEFAULT 0,
  startedAt DATETIME,
  completedAt DATETIME,
  errorMessage TEXT,
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_status (status, createdAt),
  INDEX idx_job_type (jobType, createdAt)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON Notification(userId, readAt, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_notification_type_priority ON Notification(type, priority, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_notification_schedule ON Notification(scheduleFor) WHERE scheduleFor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_stripe_customer ON User(stripeCustomerId) WHERE stripeCustomerId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_stripe_connected ON User(stripeConnectedAccountId) WHERE stripeConnectedAccountId IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_stripe_intent ON Transaction(stripePaymentIntentId) WHERE stripePaymentIntentId IS NOT NULL;