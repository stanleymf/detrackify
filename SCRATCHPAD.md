# Scratchpad

## Project Overview
- **Goal**: Create a Shopify app that captures orders via webhooks and exports them to Detrack for fulfillment
- **Architecture**: Multi-store support with configurable field mapping
- **Tech Stack**: React + TypeScript + Vite + shadcn/ui + Cloudflare Workers + D1 + KV

## Current Project Analysis

### Existing Structure
- ✅ React + TypeScript + Vite setup
- ✅ shadcn/ui components library
- ✅ Cloudflare Workers deployment setup
- ✅ Basic types defined for Order, ShopifyStore, FieldMapping
- ✅ Dashboard and Settings components structure
- ✅ Mock data system in place
- ✅ Shopify API and crypto-js dependencies
- ✅ Comprehensive Shopify webhook types
- ✅ Order processing logic with field mapping
- ✅ Cloudflare D1 database with complete schema
- ✅ Cloudflare KV namespace for sessions
- ✅ Database service layer with full CRUD operations
- ✅ Authentication system with login/register
- ✅ Session management with secure cookies
- ✅ Cloudflare Worker with API endpoints
- ✅ Shopify webhook endpoint with HMAC verification
- ✅ Field mapping persistence and auto-saving
- ✅ Extract Processing Fields UI protection
- ✅ Backend Database Integration for Stores
- ✅ Comprehensive Shopify Order Fields Integration

### Missing Components
- ❌ Shopify OAuth flow for store connection
- ❌ Order dashboard with real-time data
- ❌ Detrack API integration

## Comprehensive Shopify Order Fields Integration ✅ (v0.4.0)

### Problem Identified
- **Issue**: Limited field mapping options - only a subset of Shopify fields were available
- **Symptom**: Users couldn't map to many official Shopify Order fields they needed
- **Root Cause**: SHOPIFY_FIELDS array contained only basic fields, missing official Shopify Order API fields

### Implementation Details
- **Complete Shopify Field Coverage**: Added all official Shopify Order API fields (2024-01) for maximum mapping flexibility
- **Enhanced Settings UI**: Grouped Shopify fields in dropdown by category for better organization
- **Official Field Names**: Replaced custom prefixes with official Shopify field names (e.g., "name" instead of "order.name")
- **Advanced Field Support**: Added support for metafields, discount_applications, shipping_lines, and other advanced fields
- **Improved UX**: Clear visual grouping and labeling makes field selection easier

### User Experience
- **Complete Field Coverage**: Users can now map to any official Shopify Order field
- **Organized Field Selection**: Fields grouped by category (Order, Customer, Shipping Address, Billing Address, Line Items, Fulfillments, Advanced)
- **Clear Visual Hierarchy**: Section headers and separators make field selection intuitive
- **Maximum Flexibility**: No more missing fields that users might need for their specific use cases

### Technical Implementation
- **Updated SHOPIFY_FIELDS Array**: Now includes all official Shopify Order API fields:
  - Order root fields: id, name, order_number, email, phone, created_at, financial_status, etc.
  - Customer fields: customer.id, customer.first_name, customer.last_name, etc.
  - Address fields: shipping_address.*, billing_address.*
  - Line item fields: line_items.*
  - Fulfillment fields: fulfillments.*
  - Advanced fields: metafields, discount_applications, shipping_lines
- **Enhanced Settings Component**: Dropdown now groups fields by category with clear section headers
- **Official Field Names**: All field mappings now use official Shopify field names and paths
- **Backward Compatibility**: Existing mappings continue to work with new field structure

### Field Categories Added
- **Order Fields**: id, name, order_number, email, phone, created_at, updated_at, processed_at, canceled_at, cancel_reason, currency, subtotal_price, total_price, total_tax, financial_status, fulfillment_status, tags, note, customer_locale, status_url, tracking_number, tracking_company, tracking_url
- **Customer Fields**: customer.id, customer.first_name, customer.last_name, customer.email, customer.phone
- **Shipping Address Fields**: shipping_address.* (all address components)
- **Billing Address Fields**: billing_address.* (all address components)
- **Line Item Fields**: line_items.id, line_items.sku, line_items.title, line_items.variant_title, line_items.quantity, line_items.price, line_items.product_id, line_items.variant_id
- **Fulfillment Fields**: fulfillments.id, fulfillments.status, fulfillments.tracking_number, fulfillments.tracking_company, fulfillments.tracking_url, fulfillments.created_at, fulfillments.updated_at
- **Advanced Fields**: metafields, discount_applications, shipping_lines

### Benefits
- **Complete Shopify Compatibility**: All field mappings now use official Shopify field names
- **Maximum Flexibility**: Users can map to any field available in the Shopify Order API
- **Better Organization**: Grouped fields make it easier to find the right field for mapping
- **Future-Proof**: Supports all current and future Shopify Order API fields
- **Professional UX**: Clear visual hierarchy and organization improves user experience

## Frontend-Backend Store Disconnect Fix ✅ (v0.3.0)

### Problem Identified
- **Issue**: Stores added in Settings were only saved to localStorage, not backend database
- **Symptom**: "Fetch Orders" found 0 stores in database, even when stores were configured in frontend
- **Root Cause**: Disconnect between frontend store management and backend database persistence

### Implementation Details
- **Backend Database Integration**: Stores now saved to and loaded from D1 database instead of localStorage
- **Enhanced Logging**: Detailed logging throughout fetch orders process for better debugging
- **Store Management API Integration**: Frontend communicates with backend store management endpoints
- **Automatic Store Loading**: Stores loaded from database when Settings page loads
- **Store Creation/Deletion API Calls**: Add and remove stores use backend API endpoints

### User Experience
- **Seamless Store Management**: Add stores in Settings and they persist in database
- **Fetch Orders Works**: Click "Fetch Orders" and it finds stores in database
- **Data Consistency**: Frontend and backend share the same store data
- **Better Error Handling**: Clear feedback when store operations fail

### Technical Implementation
- **Database Schema**: Uses existing `stores` table with proper field mapping
- **API Endpoints**: 
  - `GET /api/stores` - Load all stores from database
  - `POST /api/stores` - Create new store in database
  - `DELETE /api/stores/{id}` - Delete store from database
- **Field Mapping**: Frontend fields mapped to database schema:
  - `name` → `store_name`
  - `url` → `shopify_domain`
  - `apiKey` → `access_token`
- **Enhanced Logging**: Detailed console logs show:
  - Number of stores found in database
  - Store details being processed
  - Shopify API calls and responses
  - Order processing results

### Data Flow
1. **Add Store**: User adds store in Settings → API call to create store in database
2. **Load Stores**: Settings page loads stores from database on mount
3. **Fetch Orders**: Backend finds stores in database and fetches from Shopify
4. **Process Orders**: Orders processed and saved to database
5. **Display Orders**: Dashboard loads orders from database

### Enhanced Logging Details
- **Store Discovery**: Logs number of stores found and their details
- **API Calls**: Logs Shopify API URLs and response status
- **Order Processing**: Logs each order being processed and saved
- **Error Handling**: Detailed error messages for debugging
- **Results Summary**: Clear summary of fetch results for each store

## Extract Processing Fields UI Protection ✅ (v0.2.0)

### Implementation Details
- **Protected Fields**: deliveryDate, processingDate, jobReleaseTime, deliveryCompletionTimeWindow, description, itemCount, noOfShippingLabels
- **Visual Indicators**: Auto-processed badges with info icons
- **Read-only Configuration**: Dropdown selectors removed for protected fields
- **Clear Explanations**: Each field shows how it's automatically processed
- **Type Safety**: Updated to use GlobalFieldMapping and ExtractProcessingMapping interfaces

### User Experience
- Users cannot manually configure Extract Processing Fields
- Clear visual distinction between configurable and auto-processed fields
- Explanatory text shows the processing logic for each field
- Maintains full configuration capability for all other dashboard fields

### Technical Changes
- Updated Settings component to detect and protect Extract Processing Fields
- Enhanced type system with proper interfaces
- Fixed storage layer property names and types
- Improved UI with info badges and explanatory boxes

## Auto-Save Dashboard Configuration ✅ (v0.2.0)

### Implementation Details
- **Persistent Column Preferences**: Column visibility and width settings are automatically saved
- **Auto-save on Change**: Any column configuration change triggers immediate save
- **Load on Mount**: Dashboard loads saved configuration when component mounts
- **Default Configuration**: Provides sensible defaults for first-time users

### User Experience
- Column visibility changes (hide/show) persist across page refreshes
- Column width resizing preferences are maintained
- No manual save required - all changes are automatic
- Seamless experience with no data loss

### Technical Implementation
- Added `DashboardColumnConfig` interface for type safety
- Extended `AppSettings` to include dashboard configuration
- New storage functions: `getDashboardConfig()`, `saveDashboardConfig()`, `updateDashboardConfig()`
- Auto-save useEffect hook that triggers on column configuration changes
- Migration support for existing users

## Field Mapping Database Integration ✅ (v0.2.0)

### Implementation Details
- **Save Button**: Added "Save Mappings" button with visual feedback (success/error states)
- **Database Persistence**: Field mappings are saved to D1 database with global scope
- **API Integration**: New `/api/field-mappings` endpoints for GET/POST operations
- **Order Processing Integration**: Shopify orders are processed using saved database mappings
- **Global Mapping System**: Single configuration applies to all stores

### User Experience
- Configure field mappings in Settings > Field Mappings
- Click "Save Mappings" to persist configuration to database
- Visual feedback shows save status (success/error)
- Mappings are automatically loaded when Settings page opens
- Orders from Shopify are processed using saved mappings

### Technical Implementation
- **Database Schema**: Uses existing `global_field_mappings` and `extract_processing_mappings` tables
- **Global Store ID**: Uses special 'global' store ID for system-wide mappings
- **API Endpoints**: 
  - `GET /api/field-mappings` - Load mappings from database
  - `POST /api/field-mappings` - Save mappings to database
- **Order Processing**: Webhook handler now uses database mappings instead of hardcoded logic
- **Frontend Integration**: Settings component loads from and saves to database

### Data Flow
1. **Configuration**: User configures field mappings in Settings
2. **Save**: Click "Save Mappings" → API call to database
3. **Persistence**: Mappings stored in database with 'global' store ID
4. **Order Processing**: Shopify webhook uses database mappings to process orders
5. **Dashboard Display**: Processed orders appear with mapped fields

## Dashboard Filtering & Layout ✅ (v0.2.0)

### Implementation Details
- **Date Filter**: Dropdown selector filtering by Delivery Date field
- **Timeslot Filter**: Dropdown selector filtering by Delivery Completion Time Window
- **Dynamic Filter Options**: Automatically populated from available order data
- **Improved Table Layout**: Fixed horizontal scrolling with proper flex properties
- **Filter-Aware Stats**: Statistics cards update based on active filters

### User Experience
- **Date Filtering**: Select specific delivery dates to focus on particular days
- **Timeslot Filtering**: Filter by Morning, Afternoon, or Night delivery windows
- **Combined Filtering**: Use both filters simultaneously for precise filtering
- **Clear Visual Feedback**: Empty state shows when no orders match filters
- **Smooth Scrolling**: Horizontal scrolling works properly without layout breaking

### Technical Implementation
- **Filter State Management**: React state for selected date and timeslot
- **Dynamic Filter Options**: Extracted unique values from order data
- **Filter Logic**: Real-time filtering of orders based on selected criteria
- **Layout Improvements**: 
  - Replaced ScrollArea with overflow-x-auto for better control
  - Added flex-shrink-0 to prevent column compression
  - Proper min-width calculation for table container
- **Stats Integration**: All statistics now reflect filtered data

### Filter Options
- **Date Filter**: Shows all unique delivery dates from orders
- **Timeslot Filter**: Shows all unique delivery time windows (Morning/Afternoon/Night)
- **Clear Filters**: "All Dates" and "All Timeslots" options to reset filters

## Field Mapping Implementation ✅

### Two Types of Mapping Implemented

#### 1. Global Field Mappings
- Maps multiple Shopify fields to one Dashboard field
- Supports separators for combining multiple values
- Can be set to "no mapping" to return empty values
- Example: `address` field maps to `shipping_address.address1, shipping_address.address2, shipping_address.city`

#### 2. Extract Processing Mappings
Special fields that require logic processing:

- **Delivery Date**: Extracts from `order.tags` with format `delivery_date:dd/mm/yyyy`
- **Processing Date**: Extracts from `order.tags` with format `processing_date:dd/mm/yyyy`
- **Job Release Time**: Extracts from `order.tags` with format `time_window:hh:mm-hh:mm`
  - `10:00-14:00` → `8:45am`
  - `14:00-18:00` → `1:45pm`
  - `18:00-22:00` → `5:15pm`
- **Delivery Completion Time Window**: Extracts from `order.tags` with format `time_window:hh:mm-hh:mm`
  - `10:00-14:00` → `Morning`
  - `14:00-18:00` → `Afternoon`
  - `18:00-22:00` → `Night`
- **Description**: Combines `line_items.title` and `line_items.variant_title`
- **Item Count & No. of Shipping Labels**: Sums all line item quantities

### Processing Logic
- Created `OrderProcessor` class for handling special field extraction
- Supports date parsing and formatting to dd/mm/yyyy
- Handles time window conversions
- Combines line item data for descriptions
- Calculates total item counts
- Webhook-friendly functions that work with Shopify order data

## Cloudflare Deployment ✅

### Database Setup
- **D1 Database**: SQLite-based relational database
- **Schema**: Complete tables for stores, orders, mappings, users, sessions, webhook events
- **Relationships**: Foreign keys for data integrity
- **Indexes**: Optimized for performance

### Storage Strategy
- **D1**: Relational data (stores, orders, mappings, users, sessions)
- **KV**: Session caching and temporary data
- **Auto-save**: Field mappings automatically persist to database

### Authentication System
- **User Registration**: Email/password with secure hashing
- **Session Management**: Secure cookies with expiration
- **Protected Routes**: Middleware for API protection
- **Logout**: Proper session cleanup

### API Endpoints
- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/check`
- **Stores**: `/api/stores` (CRUD operations)
- **Orders**: `/api/orders` (list with filtering)
- **Mappings**: `/api/stores/{id}/mappings` (get/save field mappings)
- **Webhooks**: `/api/webhooks/shopify` (Shopify webhook processing)

## Shopify Webhook Research

### Key Webhook Events for Orders
Based on Shopify documentation, we need to listen to these webhook events:

1. **orders/create** - When a new order is created
2. **orders/updated** - When an order is modified
3. **orders/fulfilled** - When an order is fulfilled
4. **orders/cancelled** - When an order is cancelled
5. **fulfillments/create** - When a fulfillment is created
6. **fulfillments/update** - When a fulfillment is updated

### Webhook Implementation ✅
- Use Shopify's official webhook system, not custom implementations
- Implement proper webhook verification using HMAC
- Handle webhook retries and failures gracefully
- Store webhook events in database for processing
- Use Cloudflare Workers for webhook endpoint

### Shopify API Requirements
- Admin API access for webhook management
- OAuth flow for store authentication
- Webhook endpoint URL (Cloudflare Workers)
- API rate limiting considerations

## Multi-Store Architecture

### Store Management ✅
- Each store needs its own configuration
- Store-specific field mappings
- Separate webhook endpoints per store (or single endpoint with store identification)
- Store authentication and API access management

### Data Structure Considerations ✅
- Store table with shopify_domain, access_token, webhook_config
- Order table with store_id, shopify_order_id, status, data
- Field mapping table for store-specific configurations

## Detrack Integration

### API Requirements
- Research Detrack API documentation
- Understand order export format
- Handle authentication and rate limiting
- Implement error handling and retry logic

## Implementation Priority

1. **Phase 1**: Shopify webhook setup and order capture ✅
   - ✅ Implement webhook endpoint in Cloudflare Workers
   - ✅ Add webhook verification
   - ✅ Set up data storage (KV/D1)
   - ❌ Create OAuth flow for store connection

2. **Phase 2**: Multi-store configuration management ✅
   - ✅ Store connection interface
   - ✅ Field mapping configuration
   - ✅ Webhook registration per store

3. **Phase 3**: Dashboard with order display and field mapping
   - Order listing and filtering
   - Field mapping preview
   - Order status tracking

4. **Phase 4**: Detrack API integration and export functionality
   - Detrack API client
   - Order export workflow
   - Error handling and retries

## Technical Decisions

### Storage Strategy ✅
- Use Cloudflare D1 (SQLite) for relational data (stores, orders, mappings)
- Use Cloudflare KV for caching and session data
- Consider R2 for file attachments if needed

### Webhook Endpoint Design ✅
- Single endpoint: `/api/webhooks/shopify`
- Use HMAC verification for security
- Store identification via webhook topic or custom headers
- Implement idempotency to prevent duplicate processing

### Authentication Flow ✅
- Basic email/password authentication
- Store access tokens securely in D1
- Implement session management with cookies
- Handle logout gracefully

### Field Mapping Strategy ✅
- Global mappings for simple field-to-field relationships
- Extract processing for complex logic (dates, times, calculations)
- Store-specific configurations in database
- Real-time processing on webhook receipt
- Auto-save functionality for configuration persistence

## Questions to Resolve
- Detrack API documentation and authentication method
- Specific field mapping requirements between Shopify and Detrack
- Shopify OAuth flow implementation details
- Order export workflow design 