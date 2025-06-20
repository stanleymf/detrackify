# Detrackify Scratchpad

## Recent Updates (v0.13.1) - 2025-06-20

### ✅ Webhook Processing Issue: Order Not Found

#### Problem Identified
- **Issue**: Webhook received for order #WF76382.34 but Shopify API returned 404 Not Found
- **Impact**: Webhook processing fails when trying to fetch order data from Shopify
- **Root Cause**: Order may have been deleted from Shopify or order ID is incorrect
- **Status**: ✅ Handled gracefully - webhook skipped to avoid errors

#### Error Details from Logs
```
Processing webhook for order: #WF76382.34
Fetching complete order data from Shopify API...
Fetching order 5614722482400 from windflowerflorist.myshopify.com...
Failed to fetch order from Shopify API: 404 Not Found
Order 5614722482400 not found - it may have been deleted or the ID is incorrect
```

#### Possible Causes
1. **Order Deleted**: Order was deleted from Shopify after webhook was sent
2. **Incorrect Order ID**: Webhook contains wrong order ID
3. **Permissions Issue**: Access token doesn't have sufficient permissions
4. **Store Mismatch**: Order belongs to different store
5. **API Timing**: Order not yet available in Shopify API

#### Current Handling
- **Graceful Skip**: Webhook handler skips processing when order not found
- **Error Logging**: Detailed error messages for troubleshooting
- **No Database Impact**: Failed webhooks don't affect existing orders
- **System Stability**: Prevents webhook processing errors from breaking the system

#### Future Improvements
- **Retry Logic**: Implement retry mechanism for temporary API issues
- **Order Validation**: Pre-validate order existence before processing
- **Webhook Queue**: Queue failed webhooks for later retry
- **Monitoring**: Add alerts for webhook processing failures

---

## Recent Updates (v0.13.0) - 2025-06-20

### ✅ Enhanced Detrack Export: Multi-Line Item Grouping

#### Problem Solved
- **Issue**: Orders with multiple line items (like #WF76530) were being exported as separate Detrack jobs
- **Impact**: Created duplicate orders in Detrack instead of single orders with multiple items
- **Solution**: Implemented intelligent line item grouping by base order ID

#### Technical Implementation

**New Function**: `convertMultipleLineItemsToDetrackFormat()`
```typescript
function convertMultipleLineItemsToDetrackFormat(lineItems: any[], orderName: string): any {
  // Groups multiple line items into single Detrack job
  // Uses first line item for common fields (address, recipient, etc.)
  // Creates items array with all line item descriptions
}
```

**Export Logic Enhancement**:
```typescript
// Group line items by base order ID
const orderGroups = new Map<string, { order: any, lineItems: any[], lineItemIds: string[] }>()

// Process each order group
for (const [baseOrderId, group] of orderGroups) {
  const payload = convertMultipleLineItemsToDetrackFormat(group.lineItems, group.order.shopify_order_name)
  jobs.push(payload.data[0])
}
```

#### Before vs After

**Before (Old Behavior)**:
```
Order #WF76530 → 2 separate Detrack jobs:
- Job 1: "Lavender Scent - Bouquet / Double Down"
- Job 2: "Happy Birthday Candle Balloon"
```

**After (New Behavior)**:
```
Order #WF76530 → 1 Detrack job with 2 items:
- Job: #WF76530
  - Item 1: "Lavender Scent - Bouquet / Double Down" (qty: 1)
  - Item 2: "Happy Birthday Candle Balloon" (qty: 1)
```

#### Key Features
- **Automatic Grouping**: Line items automatically grouped by base order ID
- **Common Field Usage**: Uses first line item for address, recipient, delivery details
- **Multi-Item Support**: All line item descriptions included in single job
- **Status Management**: Updates base order status when all line items exported
- **Enhanced Logging**: Detailed logs showing grouping and conversion process

#### Testing
- **Test Case**: Order #WF76530 with 2 line items
- **Expected Result**: 1 Detrack job with 2 items
- **Status**: ✅ Deployed and ready for testing

---

## Recent Updates (v0.12.0) - 2025-06-20

### ✅ Critical Fix: Database Schema Mismatch

#### Issue Resolution
- **Root Cause**: Remote D1 database had old schema with `order_number` column, but code expected new schema with JSON columns
- **Impact**: All order saves failed silently with `NOT NULL constraint failed: orders.order_number` errors
- **Solution**: Direct schema update to remote D1 database to match code expectations
- **Result**: Orders now save successfully from Shopify fulfillment webhooks

#### Database Schema Migration
- **Old Schema**: Field-by-field storage with individual columns like `order_number`, `deliveryOrderNo`, etc.
- **New Schema**: JSON-based storage with `processed_data` and `raw_shopify_data` columns
- **Migration Method**: Direct D1 execute command due to migration system limitations

#### Technical Implementation

**Database Schema Update**:
```sql
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  shopify_order_id INTEGER NOT NULL,
  shopify_order_name TEXT NOT NULL,
  status TEXT DEFAULT 'Ready for Export',
  processed_data TEXT NOT NULL, -- JSON string of processed order data
  raw_shopify_data TEXT NOT NULL, -- JSON string of original Shopify data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  exported_at DATETIME,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, shopify_order_id)
);
```

**TypeScript Interfaces**:
```typescript
// Database interface for orders
export interface DatabaseOrder {
  id: string
  store_id: string
  shopify_order_id: number
  shopify_order_name: string
  status: string
  processed_data: string // JSON string
  raw_shopify_data: string // JSON string
  created_at: string
  updated_at: string
  exported_at?: string
}

// Frontend interface for display
export interface Order {
  id: string
  deliveryOrderNo: string
  // ... other display fields
}
```

#### Migration System Issues
- **Problem**: Wrangler migration system couldn't handle existing schema conflicts
- **Solution**: Direct D1 execute commands to update schema
- **Future**: Consider using `mark-applied` command when available in newer Wrangler versions

#### Order Deletion Fix
- **Issue**: Individual order deletion route was in public section, causing authentication mismatches
- **Solution**: Moved route to protected section with proper authentication
- **Additional Fix**: Added line item ID to base order ID conversion for proper deletion

#### Frontend Logic Enhancement
```typescript
// Helper function to extract base order ID from line item ID
const getBaseOrderId = (lineItemId: string): string => {
  // Line item IDs have format: "orderId-index" (e.g., "cf3d7af2-2675-4cd4-99bc-dade2374cf6f-0")
  // We need to extract just the orderId part
  return lineItemId.includes('-') ? lineItemId.split('-').slice(0, -1).join('-') : lineItemId
}
```

---

## Previous Updates

### v0.11.0 - Product Management System
- Complete product sync, filtering, and labeling functionality
- Tag-based and title-based filtering
- Bulk operations for product management
- Product sync status tracking

### v0.10.0 - Detrack Integration
- Complete Detrack API v2 integration
- Configurable API settings and testing
- Job export and management functionality

### v0.9.0 - Field Mappings
- Global field mappings for order processing
- Extract processing mappings
- Order reprocessing capabilities

### v0.8.0 - Shopify Webhooks
- Real-time order fulfillment webhook processing
- Webhook registration and security
- Order status tracking

### v0.7.0 - Store Management
- Multi-store support
- Store configuration and API credentials
- Store-specific mappings

### v0.6.0 - Order Management
- Complete order processing system
- Order dashboard and export functionality
- Order filtering and management

### v0.5.0 - Authentication
- User authentication and session management
- JWT tokens and secure login/logout
- Protected API endpoints

### v0.4.0 - Database Integration
- D1 database integration
- Structured data models
- CRUD operations and validation

### v0.3.0 - API Endpoints
- Complete REST API
- Request handling and routing
- Standardized response formats

### v0.2.0 - UI Components
- Modern UI with Tailwind CSS
- Responsive design
- Dashboard and settings interfaces

### v0.1.0 - Initial Setup
- Cloudflare Workers backend
- React frontend
- Build and deployment system

---

## Technical Notes

### Database Schema Evolution
The database schema has evolved significantly:
1. **v0.4.0**: Basic tables for users, stores, orders
2. **v0.8.0**: Added webhook support and order status tracking
3. **v0.12.0**: Migrated to JSON-based order storage for flexibility

### API Architecture
- **Backend**: Cloudflare Workers with D1 database
- **Frontend**: React with Vite build system
- **Authentication**: JWT tokens with session management
- **Real-time**: Webhook processing for immediate order updates

### Deployment Process
1. Build frontend with Vite
2. Deploy to Cloudflare Workers
3. Update database schema as needed
4. Test functionality and monitor logs

### Key Features
- **Multi-store Support**: Handle multiple Shopify stores
- **Real-time Processing**: Webhook-based order processing
- **Flexible Mapping**: Configurable field mappings
- **External Integration**: Detrack API integration
- **Product Management**: Complete product sync and filtering
- **Enhanced Export**: Multi-line item grouping for Detrack

### Future Considerations
- **Migration System**: Improve migration handling for schema updates
- **Performance**: Optimize for larger order volumes
- **Monitoring**: Add comprehensive logging and monitoring
- **Scaling**: Plan for multi-tenant architecture

---

*Last updated: January 2024 - v0.6.0* 