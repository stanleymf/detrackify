# Deployment Guide

## Overview

This guide will help you deploy the Detrackify app to Cloudflare Workers with D1 database and KV storage.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install with `npm install -g wrangler`
3. **Node.js**: Version 18 or higher
4. **pnpm**: Package manager (recommended)

## Step 1: Cloudflare Setup

### 1.1 Login to Wrangler
```bash
wrangler login
```

### 1.2 Create D1 Database
```bash
npx wrangler d1 create detrackify-db
```

### 1.3 Create KV Namespaces
```bash
npx wrangler kv namespace create SESSIONS
npx wrangler kv namespace create SESSIONS --preview
```

### 1.4 Update Configuration
Update `wrangler.jsonc` with your database and KV IDs:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "detrackify-db",
      "database_id": "YOUR_D1_DATABASE_ID"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "SESSIONS",
      "id": "YOUR_KV_NAMESPACE_ID",
      "preview_id": "YOUR_PREVIEW_KV_NAMESPACE_ID"
    }
  ],
  "vars": {
    "JWT_SECRET": "your-secure-jwt-secret-here",
    "SHOPIFY_API_KEY": "your-shopify-api-key",
    "SHOPIFY_API_SECRET": "your-shopify-api-secret"
  }
}
```

### 1.5 Apply Database Schema
```bash
npx wrangler d1 execute detrackify-db --file=schema.sql
```

## Step 2: Environment Variables

### 2.1 Set Production Variables
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put SHOPIFY_API_KEY
npx wrangler secret put SHOPIFY_API_SECRET
```

### 2.2 Set Development Variables
Create `.dev.vars` file:
```
JWT_SECRET=your-dev-jwt-secret
SHOPIFY_API_KEY=your-dev-shopify-api-key
SHOPIFY_API_SECRET=your-dev-shopify-api-secret
```

## Step 3: Build and Deploy

### 3.1 Install Dependencies
```bash
pnpm install
```

### 3.2 Build the Application
```bash
pnpm build
```

### 3.3 Deploy to Cloudflare
```bash
pnpm deploy
```

## Step 4: Shopify App Setup

### 4.1 Create Shopify App
1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app
3. Set app URL to your Cloudflare Worker URL
4. Configure webhook endpoints

### 4.2 Webhook Configuration
Set up these webhook endpoints in your Shopify app:
- **URL**: `https://your-worker.your-subdomain.workers.dev/api/webhooks/shopify`
- **Topics**:
  - `orders/create`
  - `orders/updated`
  - `orders/fulfilled`
  - `orders/cancelled`
  - `fulfillments/create`
  - `fulfillments/update`

### 4.3 App Permissions
Request these scopes:
- `read_orders`
- `write_orders`
- `read_fulfillments`
- `write_fulfillments`

## Step 5: Initial Setup

### 5.1 Create Admin User
1. Visit your deployed app
2. Register a new account
3. This will be your admin user

### 5.2 Add Shopify Store
1. Go to Settings tab
2. Add your first Shopify store
3. Configure field mappings
4. Set webhook secret

### 5.3 Test Webhook
1. Create a test order in Shopify
2. Check the dashboard for the processed order
3. Verify field mappings are working

## Step 6: Production Configuration

### 6.1 Custom Domain (Optional)
```bash
npx wrangler custom-domain add your-domain.com
```

### 6.2 SSL Certificate
Cloudflare automatically provides SSL certificates.

### 6.3 Monitoring
Set up monitoring in Cloudflare dashboard:
- Worker analytics
- D1 database metrics
- KV storage usage

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check authentication status

### Stores
- `GET /api/stores` - List all stores
- `POST /api/stores` - Create new store
- `GET /api/stores/{id}` - Get store details
- `PUT /api/stores/{id}` - Update store
- `DELETE /api/stores/{id}` - Delete store

### Orders
- `GET /api/orders` - List orders (with filters)

### Field Mappings
- `GET /api/stores/{id}/mappings` - Get field mappings
- `POST /api/stores/{id}/mappings` - Save field mappings

### Webhooks
- `POST /api/webhooks/shopify` - Shopify webhook endpoint

## Database Schema

### Tables
- `stores` - Shopify store configurations
- `orders` - Processed orders
- `global_field_mappings` - Field mapping configurations
- `extract_processing_mappings` - Special processing mappings
- `users` - User accounts
- `user_sessions` - User sessions
- `webhook_events` - Webhook event tracking

## Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules
pnpm install
pnpm build
```

#### 2. Database Connection Issues
```bash
# Check database status
npx wrangler d1 execute detrackify-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

#### 3. Webhook Not Working
- Check webhook URL in Shopify app
- Verify HMAC secret is correct
- Check worker logs: `npx wrangler tail`

#### 4. Authentication Issues
- Verify JWT_SECRET is set
- Check cookie settings
- Clear browser cookies

### Debug Mode
Enable debug logging in the worker:
```typescript
// Add to worker/index.ts
console.log('Debug info:', { url: request.url, method: request.method })
```

### Local Development
```bash
# Start local development server
pnpm dev

# Test with local database
npx wrangler d1 execute detrackify-db --local --file=schema.sql
```

## Security Considerations

### 1. Environment Variables
- Never commit secrets to version control
- Use different secrets for development and production
- Rotate secrets regularly

### 2. Webhook Security
- Always verify HMAC signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting

### 3. Database Security
- Use parameterized queries (already implemented)
- Implement proper access controls
- Regular backups

### 4. Session Security
- Use secure cookies
- Implement session expiration
- Clean up expired sessions

## Performance Optimization

### 1. Database Indexes
Already configured in schema.sql

### 2. Caching
- Use KV for session data
- Consider caching frequently accessed data

### 3. Worker Optimization
- Minimize bundle size
- Use efficient data structures
- Implement proper error handling

## Monitoring and Maintenance

### 1. Regular Tasks
- Monitor worker performance
- Check database usage
- Review webhook delivery rates
- Clean up expired sessions

### 2. Updates
- Keep dependencies updated
- Monitor Cloudflare updates
- Test webhook functionality regularly

### 3. Backups
- Export database schema
- Backup field mapping configurations
- Document custom configurations

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Cloudflare documentation
3. Check worker logs with `npx wrangler tail`
4. Verify database state with D1 queries 