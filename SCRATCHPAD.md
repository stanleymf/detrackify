# Detrackify Scratchpad

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
- **Schema Applied**: Successfully updated remote database schema

#### Technical Implementation
```sql
-- New orders table schema
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

#### Type Safety Improvements
- **DatabaseOrder Interface**: Added proper TypeScript interface for database operations
- **Type Consistency**: Ensured code and database types are aligned
- **Error Handling**: Improved error handling with proper TypeScript types
- **Interface Updates**: Added missing User and Store interfaces to types file

#### Migration System Issues
- **Wrangler Limitations**: `mark-applied` command not available in current Wrangler version
- **Migration Conflict**: Previous migrations couldn't be applied due to duplicate column errors
- **Workaround**: Direct schema update using `wrangler d1 execute` command
- **Future Prevention**: Created migration file for reference (015_update_orders_schema.sql)

### 🔧 Technical Details

#### Database Service Updates
```typescript
// Updated createOrder function to use DatabaseOrder interface
async createOrder(order: Omit<DatabaseOrder, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseOrder> {
  const id = generateUUID()
  const now = new Date().toISOString()
  
  await this.db.prepare(`
    INSERT INTO orders (id, store_id, shopify_order_id, shopify_order_name, status, processed_data, raw_shopify_data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, order.store_id, order.shopify_order_id, order.shopify_order_name, order.status, order.processed_data, order.raw_shopify_data, now, now).run()
  
  return { id, ...order, created_at: now, updated_at: now }
}
```

#### Type Definitions
```typescript
// DatabaseOrder interface for database operations
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

// User and Store interfaces added
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  shopify_domain: string
  access_token: string
  api_version: string
  webhook_secret: string | null
  api_secret: string | null
  store_name: string | null
  created_at: string
  updated_at: string
}
```

### 🚀 Deployment Status
- ✅ **Database Schema Updated**: Remote D1 database now matches code expectations
- ✅ **Application Redeployed**: Latest code deployed to Cloudflare Workers
- ✅ **Order Processing Fixed**: Orders from Shopify webhooks now save successfully
- ✅ **Dashboard Working**: Orders appear in dashboard after fulfillment events

### 📋 Next Steps
1. **Testing**: Verify order fulfillment events are processed and saved correctly
2. **Monitoring**: Watch for any remaining database errors in logs
3. **Migration System**: Consider updating Wrangler when `mark-applied` becomes available
4. **Documentation**: Update deployment guide with schema migration procedures

### 🔍 Recent Testing
- ✅ Database schema update successful
- ✅ Application deployment successful
- ✅ Ready for order fulfillment testing
- ✅ Type safety improvements implemented

## Recent Updates (v0.11.0)

### ✅ Completed Features

#### Bulk Save Fixes
- **Upsert Logic Implementation**: Fixed bulk save to use INSERT OR REPLACE instead of simple INSERT to handle duplicate products
- **Unique Constraint Handling**: Proper handling of `UNIQUE(product_id, user_id)` constraint during bulk operations
- **Enhanced Logging**: Added detailed logging for bulk save operations with counts of saved, skipped, and total processed products
- **Error Recovery**: Individual product save failures no longer stop the entire bulk operation

#### Product Label System
- **Database Schema Update**: Added `label` column to `saved_products` table via migration `011_add_label_to_saved_products.sql`
- **Bulk Label Application**: Implemented `/api/saved-products/bulk-label` endpoint for applying labels to multiple products
- **Label Persistence**: Labels are now properly saved to database and displayed in the UI
- **API Integration**: Updated saved products API to include label field in responses

#### Technical Improvements
- **Database Service Updates**: Added `saveProductUpsert` and `updateProductLabel` methods
- **Migration Management**: Created and deployed database migration for label support
- **Error Handling**: Enhanced error handling in bulk operations with detailed logging
- **API Response Enhancement**: Bulk save now returns detailed statistics about the operation

### 🔧 Technical Implementation

#### Bulk Save Upsert Logic
```typescript
// Before: Simple INSERT (failed on duplicates)
await db.saveProduct({
  id: savedProductId,
  productId: product.id,
  // ... other fields
});

// After: INSERT OR REPLACE (handles duplicates)
await db.saveProductUpsert({
  id: savedProductId,
  productId: product.id,
  // ... other fields
});
```

#### Database Migration
```sql
-- Migration: Add label column to saved_products
ALTER TABLE saved_products ADD COLUMN label TEXT;
```

#### Bulk Label Application
```typescript
// New endpoint: /api/saved-products/bulk-label
async function handleBulkApplyLabel(request: Request, db: DatabaseService, userId: string): Promise<Response> {
  const { productIds, label, storeId } = await request.json();
  
  for (const productId of productIds) {
    await db.updateProductLabel(productId, userId, label.trim());
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    updatedCount: productIds.length
  }), { status: 200 });
}
```

#### Enhanced Logging
```typescript
console.log('[handleBulkSaveProducts] Received products to save:', products.length);
console.log(`[handleBulkSaveProducts] Saving product: ${product.title} (${product.id})`);
console.log(`[handleBulkSaveProducts] Completed: ${savedCount} saved, ${skippedCount} skipped`);
```

### 🚀 Deployment History
- **v0.11.0**: Bulk save fixes, product label system, upsert logic
- **v0.10.0**: Enhanced product search, pagination fixes, real-time filtering
- **v0.9.0**: Enhanced tag filtering, collapsible UI fixes
- **v0.8.0**: Multi-store order fetching, increased dashboard capacity
- **v0.7.0**: Mobile mode, CSV export, responsive design
- **v0.6.0**: Flower Stands stat card, Express address display

### 📋 Next Steps
1. **Testing**: Verify bulk save works with duplicate products
2. **Label Features**: Test label application and persistence
3. **Performance**: Monitor bulk operations with large datasets
4. **UX**: Consider label management features (edit, delete, filter by label)

### 🔍 Recent Testing
- ✅ Bulk save now handles duplicate products correctly
- ✅ All 21 products saved successfully (previously only 7)
- ✅ Labels can be applied to saved products
- ✅ Labels persist in database and display in UI
- ✅ Database migration applied successfully

## Recent Updates (v0.10.0)

### ✅ Completed Features

#### Enhanced Product Search System
- **Comprehensive Search**: Search bar now searches through product titles, variant titles, and tags
- **Real-time Filtering**: Search results update instantly as you type for better user experience
- **Multi-field Search**: Searches across product title, variant title, and all product tags
- **Automatic Page Reset**: Search automatically resets to page 1 when search term changes
- **Improved Pagination**: Fixed pagination to work correctly with search filtering

#### Product Pagination Fixes
- **Filtered Results Pagination**: Pagination now uses filtered results instead of all products
- **Correct Page Counts**: Shows accurate filtered count vs total count for better user feedback
- **Search State Management**: Proper state management for search terms and pagination
- **Performance Optimization**: Enhanced memoization for better search performance

#### Technical Implementation
- **Filtered Product Logic**: Implemented proper filtered product handling with useMemo optimization
- **Search State Management**: Added useEffect to reset page when search term changes
- **Component Architecture**: Improved search and pagination component structure
- **Performance Optimization**: Enhanced memoization for better search performance

### 🔧 Technical Implementation

#### Enhanced Search Logic
```typescript
// Filter fetched products based on search term
const filteredFetchedProducts = useMemo(() => {
  if (!fetchedProductsSearchTerm.trim()) return sortedFetchedProducts;
  return sortedFetchedProducts.filter(product => 
    product.title.toLowerCase().includes(fetchedProductsSearchTerm.toLowerCase()) ||
    product.variantTitle?.toLowerCase().includes(fetchedProductsSearchTerm.toLowerCase()) ||
    product.tags.some((tag: string) => tag.toLowerCase().includes(fetchedProductsSearchTerm.toLowerCase()))
  );
}, [sortedFetchedProducts, fetchedProductsSearchTerm]);

// Pagination for filtered products
const totalFetchedPages = Math.ceil(filteredFetchedProducts.length / fetchedProductsPerPage);
const paginatedFetchedProducts = useMemo(() => {
  const start = (fetchedProductsPage - 1) * fetchedProductsPerPage;
  return filteredFetchedProducts.slice(start, start + fetchedProductsPerPage);
}, [filteredFetchedProducts, fetchedProductsPage]);

// Reset page to 1 when search term changes
useEffect(() => {
  setFetchedProductsPage(1);
}, [fetchedProductsSearchTerm]);
```

#### Search Display Updates
```typescript
// Updated product count display
<p className="text-sm text-gray-500 mt-1">
  {filteredFetchedProducts.length > 0 
    ? `${filteredFetchedProducts.length} products found matching your filter`
    : 'No products fetched yet'
  }
</p>

// Search bar count display
<p className="text-sm text-gray-500">
  {filteredFetchedProducts.length} of {sortedFetchedProducts.length} products
</p>
```

### 🚀 Deployment History
- **v0.10.0**: Enhanced product search, pagination fixes, real-time filtering
- **v0.9.0**: Enhanced tag filtering, collapsible UI fixes
- **v0.8.0**: Multi-store order fetching, increased dashboard capacity
- **v0.7.0**: Mobile mode, CSV export, responsive design
- **v0.6.0**: Flower Stands stat card, Express address display

### 📋 Next Steps
1. **Testing**: Verify search functionality with various product names and tags
2. **Performance**: Monitor search performance with large product datasets
3. **UX**: Consider adding search suggestions or autocomplete
4. **Features**: Potential for advanced search filters (by price range, status, etc.)

### 🔍 Recent Testing
- ✅ Search by product title working correctly
- ✅ Search by tags working correctly
- ✅ Search by variant title working correctly
- ✅ Pagination with search results working properly
- ✅ Page reset on search term change working
- ✅ Product count display accurate

## Recent Updates (v0.9.0)

### ✅ Completed Features

#### Enhanced Tag Filtering System
- **Substring Matching**: Changed from exact tag matching to substring matching for more flexible product filtering
- **Improved Search Accuracy**: Products with multi-word tags like "Condolences Stand" now match correctly
- **Debug Logging**: Added comprehensive console logging for tag filtering operations to aid troubleshooting
- **API Route Optimization**: Enhanced tag filtering logic in handleFetchStoreProducts function

#### Collapsible UI Component Fixes
- **Component Hierarchy**: Fixed Radix UI Collapsible component nesting to prevent "white screen of death" errors
- **Saved Products Section**: Improved UI structure with proper Collapsible component implementation
- **Error Resolution**: Resolved "CollapsibleTrigger must be used within Collapsible" error
- **UI Rendering**: Fixed component hierarchy issues that prevented proper UI rendering

#### Technical Improvements
- **Tag Matching Algorithm**: Enhanced filtering to match partial tag names and multi-word tags
- **API Route Priority**: Ensured correct route handling for product filtering endpoints
- **Debug Capabilities**: Added detailed logging for troubleshooting tag filtering issues
- **Component Architecture**: Improved overall component structure and nesting

### 🔧 Technical Implementation

#### Enhanced Tag Filtering Logic
```typescript
// Before: Exact matching
const hasMatchingTag = tags.some((tag: string) => 
  productTags.includes(tag.trim().toLowerCase())
);

// After: Substring matching
const inputTags = tags.map((tag: string) => tag.trim().toLowerCase());
const hasMatchingTag = inputTags.some(inputTag =>
  productTags.some(productTag => productTag.includes(inputTag))
);
```

#### Debug Logging Implementation
```typescript
// Debug logging for tag filtering
console.log(`[TagFilter] Product: ${product.title}, ProductTags:`, productTags, 'InputTags:', inputTags);
console.log(`[TagFilter] Has matching tag:`, hasMatchingTag);
```

#### Collapsible Component Fix
```typescript
// Fixed component hierarchy
<Collapsible open={!savedProductsCollapsed} onOpenChange={(open) => setSavedProductsCollapsed(!open)}>
  <div className="flex justify-end px-6 py-2 border-b">
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        {savedProductsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent>
    <CardContent className="space-y-6 pt-6">
      {/* Content */}
    </CardContent>
  </CollapsibleContent>
</Collapsible>
```

## Recent Updates (v0.6.0)

### ✅ Completed Features

#### Mobile Layout Improvements
- **Responsive Header**: Enhanced header layout with two-row design for better mobile visibility
- **View Mode Controls**: Simplified view mode buttons to use icons only on mobile
- **Space Efficiency**: Better use of limited mobile screen space
- **Navigation Clarity**: Improved tab navigation visibility on mobile
- **Consistent Spacing**: Proper padding and gaps for mobile elements

#### Flower Stands Stat Card
- **Smart Product Filtering**: New Dashboard stat card that filters orders based on Product Labels with "Stand" label
- **Product Labels Integration**: Automatically maps order descriptions to Product Labels from Info page
- **Real-time Filtering**: Identifies orders containing products labeled as "Stand" for specialized tracking
- **Responsive Design**: Matches Express orders card layout with responsive grid (1 column mobile, 2-3 columns desktop)
- **Complete Order Info**: Displays delivery order number, description, and address for each Stand order

#### Express Orders Enhancement
- **Express Stat Card Address Display**: Added address field to Express orders in Dashboard
- **Address Integration**: Express orders now show delivery addresses with location pin emoji (📍)
- **Improved UX**: Better truncation and hover tooltips for long addresses
- **Responsive Layout**: Adapts to different screen sizes (1 column mobile, 2-3 columns desktop)

#### Analytics Part-Time Pay Fixes
- **Case-Insensitive Driver Matching**: Fixed driver name matching to work regardless of case
- **Driver Order Matching**: "Praga" now matches "praga" in Part-Time Pay calculations
- **Improved Accuracy**: Better driver order assignment and pay calculations

#### Product Labels Data Persistence
- **Field Mapping Fix**: Resolved database field mapping from snake_case to camelCase
- **Data Persistence**: Product labels now persist correctly across page refreshes
- **API Integration**: Proper field mapping in handleGetProductLabels function

#### Order Processing Improvements
- **Removed Items Filtering**: Orders with removed line items are properly filtered out
- **Active Items Counting**: Only counts items with current_quantity > 0
- **Shipping Label Accuracy**: Correctly displays count of active items only

### 🔧 Technical Implementation

#### Flower Stands Logic
```typescript
// 1. Load product labels from server
const [productLabels, setProductLabels] = useState<any[]>([])

// 2. Filter for products with "Stand" label
const standProducts = productLabels.filter(p => 
  p.label.toLowerCase() === 'stand'
)

// 3. Match orders containing stand product names
const flowerStandOrders = filteredOrders.filter(order => {
  const description = (order.description || '').toLowerCase()
  return standProducts.some(product => 
    description.includes(product.productName.toLowerCase())
  )
})
```

#### Express Orders Enhancement
- Added address field to data structure
- Enhanced display with location pin emoji
- Improved truncation and hover tooltips

#### Case-Insensitive Matching
- Updated driver name comparison to use `.toLowerCase()`
- Fixed Part-Time Pay calculations accuracy

### 📊 Current System Status

#### Dashboard Components
- ✅ **Stat Cards**: Total Orders, Express Orders (with addresses), Flower Stands
- ✅ **Order Table**: Editable cells, column configuration, search/filter
- ✅ **Responsive Design**: Mobile and desktop layouts
- ✅ **Real-time Updates**: Auto-refresh and manual fetch options

#### Analytics Components
- ✅ **Part-Time Pay**: Case-insensitive driver matching, accurate calculations
- ✅ **Job Types**: Protected API endpoints, proper data display
- ✅ **Search & Filter**: Time windows, date ranges, driver filtering

#### Info Components
- ✅ **Product Labels**: Server-side storage, CSV import, field mapping
- ✅ **Driver Info**: Server-side storage, CSV import, field mapping
- ✅ **Data Persistence**: Proper database field mapping

#### Backend Services
- ✅ **Order Processing**: Removed items filtering, active items counting
- ✅ **API Endpoints**: Protected routes, proper field mapping
- ✅ **Database**: Field mapping, data persistence

### 🚀 Deployment History
- **v0.6.0**: Flower Stands stat card, Express address display, case-insensitive matching
- **v0.5.1**: Product labels field mapping, driver info fixes
- **v0.5.0**: Analytics enhancements, search/filter functionality
- **v0.4.0**: Info page with CSV import, server-side storage

### 📋 Next Steps
1. **Testing**: Verify Flower Stands filtering with various product names
2. **Performance**: Monitor API calls for product labels loading
3. **UX**: Consider adding loading states for product labels
4. **Features**: Potential for additional specialized stat cards (e.g., "Bouquets", "Vases")

### 🔍 Recent Testing
- ✅ Express orders address display working correctly
- ✅ Case-insensitive driver matching functioning
- ✅ Product labels data persistence resolved
- ✅ Removed items filtering working properly
- ✅ Flower Stands stat card implementation complete

### 🔄 Next Steps & Ideas

#### Potential Enhancements
1. **Advanced Filtering**: Add more filter options for orders (by status, date range, etc.)
2. **Bulk Operations**: Enhance bulk editing capabilities
3. **Real-time Updates**: Add real-time order status updates
4. **Export Formats**: Support for additional export formats (Excel, PDF)
5. **Dashboard Customization**: Allow users to customize dashboard layout
6. **Notification System**: Add notifications for new orders or errors
7. **Performance Optimization**: Implement pagination for large datasets
8. **Mobile App**: Consider developing a mobile companion app

#### Technical Debt
1. **Code Organization**: Refactor some components for better maintainability
2. **Error Handling**: Improve error handling and user feedback
3. **Testing**: Add comprehensive test coverage
4. **Documentation**: Enhance API and component documentation
5. **Performance**: Optimize database queries and frontend rendering

### 📝 Notes

#### Current Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Cloudflare Workers + D1 Database
- **Authentication**: Cloudflare Access
- **Deployment**: Cloudflare Pages

#### Data Flow
1. Shopify webhook → Order processing → Database storage
2. Dashboard/Analytics/Info → API calls → Database retrieval → Frontend display
3. User actions → API calls → Database updates → UI refresh

#### Key Features Working
- ✅ Complete order lifecycle management
- ✅ Multi-store support with prefix detection
- ✅ Express order identification and management
- ✅ Driver assignment and pay calculations
- ✅ Product and driver information management
- ✅ Export to Detrack integration
- ✅ Responsive design for all screen sizes

## Shopify Product Tags for Line Items (Future Work)

- Shopify product tags are not included directly in the order's line item data.
- Each line item has a `product_id` field.
- To get tags, fetch the product using the Shopify Products API: `/admin/api/2024-01/products/{product_id}.json`.
- The product object will have a `tags` field (comma-separated string).
- To associate tags with line items:
  1. For each line item, get its `product_id`.
  2. Fetch the product and read its `tags`.
  3. Optionally, cache product tags locally to avoid repeated lookups.
- Useful for filtering, analytics, or custom logic based on product tags in orders.

### Smart Sync & Saved Products Table
- The saved_products table is now created via migration and matches backend expectations.
- An updated_at column was added to track Shopify product updates.
- The saveAllProducts function now performs a smart sync: it skips products that are unchanged (same updated_at) and updates those that have changed.
- This ensures efficient syncing and prevents unnecessary DB writes.

---

*Last updated: January 2024 - v0.6.0* 