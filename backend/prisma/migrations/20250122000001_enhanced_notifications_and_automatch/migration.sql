-- Add missing fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeConnectedAccountId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeAccountStatus" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalSales" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "memberSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing fields to listings table  
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "availableQuantity" INTEGER NOT NULL DEFAULT 1;

-- Add missing fields to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "buyerAmount" DECIMAL(10,2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "sellerPaidOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "sellerPaidOutAt" TIMESTAMP(3);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;

-- Add missing fields to notifications table
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "offerNotifications" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingNotifications" BOOLEAN NOT NULL DEFAULT false,
    "autoMatchNotifications" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId for notification_preferences
CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- Add foreign key constraint for notification_preferences
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create match_results table
CREATE TABLE IF NOT EXISTS "match_results" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for match_results
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create price_alerts table
CREATE TABLE IF NOT EXISTS "price_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sectionId" TEXT,
    "maxPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for price_alerts
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update NotificationType enum to include new values
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFER_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFER_COUNTER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TICKET_SOLD';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_FEATURED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AUTOMATCH_FOUND';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PRICE_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SECURITY_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROMOTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WEEKLY_REPORT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MONTHLY_REPORT';

-- Create buyer_preferences table
CREATE TABLE IF NOT EXISTS "buyer_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION,
    "maxQuantity" INTEGER NOT NULL,
    "minQuantity" INTEGER,
    "preferredSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "category" TEXT,
    "instantBuyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastMatchRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_preferences_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for buyer_preferences
ALTER TABLE "buyer_preferences" ADD CONSTRAINT "buyer_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_preferences" ADD CONSTRAINT "buyer_preferences_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "offerAlerts" BOOLEAN NOT NULL DEFAULT true,
    "transactionUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId for user_preferences
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_userId_key" ON "user_preferences"("userId");

-- Add foreign key constraint for user_preferences
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create testimonials table
CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "avatar" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);