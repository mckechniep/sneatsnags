# How to Deploy Database Changes to Render

## Option 1: Automatic Deployment (Recommended)

The Dockerfile has been updated to automatically push database changes when the app starts:

```dockerfile
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
```

**Steps:**
1. Commit and push your changes to GitHub
2. Render will automatically redeploy
3. During startup, `prisma db push` will update the database schema
4. The app will start with the new schema

## Option 2: Manual Database Migration

If you need to run the migration manually:

### 2a. Using Render Shell (Recommended)
1. Go to your Render service dashboard
2. Click on "Shell" tab
3. Run: `npx prisma db push --accept-data-loss`
4. Restart your service

### 2b. Using PostgreSQL Admin Tools
1. Go to your Render PostgreSQL database
2. Click "Connect" to get connection info
3. Use a PostgreSQL client (TablePlus, pgAdmin, psql)
4. Run the SQL script from `scripts/migrate-production.sql`

### 2c. Using psql command line
```bash
# Get your DATABASE_URL from Render dashboard
psql "your-database-url-here" < scripts/migrate-production.sql
```

## Option 3: Environment Variable Control

Add this to your Render environment variables:
- `AUTO_MIGRATE=true`

Then update the Dockerfile start command to:
```dockerfile
CMD ["sh", "-c", "if [ \"$AUTO_MIGRATE\" = \"true\" ]; then npx prisma db push --accept-data-loss; fi && node dist/index.js"]
```

## Verification

After deployment, check the logs to confirm:
1. ✅ Database schema updated successfully
2. ✅ Prisma client generated
3. ✅ Application started without errors
4. ✅ Login functionality works

## Rollback Plan

If something goes wrong:
1. Revert the Docker image to the previous version in Render
2. The database changes are backward compatible, so old code should still work
3. If needed, you can manually drop the new columns/tables

## Current Changes Being Applied

- **New Tables**: `notification_preferences`, `match_results`, `price_alerts`, `buyer_preferences`, `user_preferences`, `testimonials`
- **New User Fields**: `stripeConnectedAccountId`, `stripeAccountStatus`, `rating`, `totalSales`, `memberSince`
- **New Listing Fields**: `availableQuantity`
- **New Transaction Fields**: `quantity`, `buyerAmount`, `paidAt`, `sellerPaidOut`, `sellerPaidOutAt`, `stripeRefundId`
- **New Notification Fields**: `deliveredAt`, `emailSentAt`, `expiresAt`

These changes are all additive and won't break existing functionality.