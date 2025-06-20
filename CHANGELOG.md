# Changelog

All notable changes to this project will be documented in this file.

## [0.13.5] - 2025-06-20

### Fixed
- **Analytics Authentication** - Fixed 404 error when fetching Detrack job types due to missing authentication credentials
- **API Endpoint Access** - Added `credentials: 'include'` to fetchJobTypes and fetchDetrackJobs functions
- **Protected Routes** - Ensured all Detrack API endpoints properly send authentication cookies

### Technical Improvements
- **Authentication Consistency** - All API calls now consistently include authentication credentials
- **Error Handling** - Better error handling for authenticated API endpoints

## [0.13.4] - 2025-06-20

### Added
- **Time Window Toggle** - Added toggle functionality to Part-Time Pay section for filtering by time windows
- **Enhanced Analytics** - Users can now switch between Morning, Afternoon, Night, and Total views in Part-Time Pay
- **Dynamic Labels** - Summary cards and table headers now update based on selected time window
- **Visual Indicators** - Added colored clock icons for each time window button for better UX

### Changed
- **Part-Time Pay UI** - Enhanced interface with time window filter buttons above summary cards
- **Pay Calculation** - Pay calculations now respect selected time window filter
- **Summary Statistics** - Summary cards show time-specific data when a time window is selected

### Technical Improvements
- **Component State Management** - Added state management for time window selection in PartTimePay component
- **Job Filtering** - Implemented job filtering logic based on time_window field
- **Responsive Design** - Time window toggle buttons are responsive and work on mobile devices

## [0.13.3] - 2025-06-20

### Changed
- **Project Structure** - Comprehensive reorganization of codebase for better maintainability
- **File Organization** - Moved files to dedicated directories:
  - `scripts/` - Utility scripts, database files, and configuration scripts
  - `tests/` - Test files and debugging utilities
  - `docs/` - Documentation and development notes
- **Code Cleanup** - Removed debug console.log statements from production code
- **Documentation** - Added comprehensive README.md with project overview and setup instructions

### Added
- **Development Setup** - Added `scripts/dev-setup.sh` for automated development environment setup
- **Enhanced .gitignore** - Added exclusions for database files, temporary files, and build artifacts
- **Project Documentation** - Complete project structure documentation and setup guide

### Removed
- **Temporary Files** - Removed `cookies.txt` and `detrackify.db` from repository
- **Debug Logging** - Cleaned up excessive console.log statements from frontend components
- **Unused Files** - Organized and moved scattered files to appropriate directories

### Technical Improvements
- **Code Organization** - Better separation of concerns with dedicated directories
- **Maintainability** - Improved project structure for easier development and maintenance
- **Documentation** - Enhanced documentation for new developers and project overview

## [0.13.2] - 2025-06-20

### Fixed
- **Clear All Orders** - Fixed routing conflict that prevented "Clear All Orders" functionality from working
- **Route Priority** - Moved specific `/api/orders/clear-all` route before general `/api/orders/` route to prevent incorrect matching
- **Order Deletion** - Resolved 404 "Order not found" error when attempting to clear all orders

### Changed
- **Route Ordering** - Reordered API routes to ensure specific endpoints are matched before general patterns
- **Error Handling** - Enhanced logging for debugging order clearing operations

### Technical Improvements
- **Route Matching** - Fixed route matching logic to prevent conflicts between specific and general patterns
- **Debug Logging** - Added comprehensive logging for order clearing operations in both frontend and backend

## [0.13.1] - 2025-06-20

### Fixed
- **Webhook Processing** - Enhanced error handling for webhooks with deleted or invalid orders
- **Order Fetching** - Improved error messages when Shopify orders are not found during webhook processing
- **Webhook Resilience** - Webhook handler now gracefully skips orders that cannot be fetched from Shopify API

### Changed
- **Error Handling** - Better error reporting for webhook processing failures
- **Logging** - Enhanced logging to identify webhook processing issues

### Technical Improvements
- **Webhook Validation** - Added checks for order existence before processing
- **API Error Handling** - Improved handling of 404 errors from Shopify API
- **Debug Information** - Added detailed error messages for troubleshooting

## [0.13.0] - 2025-06-20

### Added
- **Enhanced Detrack Export** - Orders with multiple line items now export as single jobs with multiple items
- **Line Item Grouping** - Automatic grouping of line items by base order ID during export
- **Multi-Item Support** - Detrack jobs now include all line item descriptions in a single order
- **Improved Export Logic** - New `convertMultipleLineItemsToDetrackFormat()` function for better order handling

### Changed
- **Export Behavior** - Orders like #WF76530 with 2 line items now create 1 Detrack job instead of 2 separate jobs
- **Status Management** - Base order status is updated when all line items are successfully exported
- **Export Results** - Better tracking of line item success/failure during bulk exports

### Technical Improvements
- **Order Grouping Algorithm** - Intelligent grouping of line items by base order ID
- **Enhanced Logging** - Detailed logs showing order grouping and conversion process
- **Error Handling** - Improved error handling for multi-line item exports

## [0.12.0] - 2025-06-20

### Fixed
- **Database Schema Mismatch** - Fixed critical issue where orders were not being saved due to schema mismatch between code and database
- **Orders Table Schema** - Updated remote D1 database schema to match code expectations with `processed_data` and `raw_shopify_data` JSON columns
- **Order Processing** - Resolved `NOT NULL constraint failed: orders.order_number` error that prevented order saves
- **Webhook Processing** - Orders from Shopify fulfillment webhooks now save successfully to database
- **Dashboard Order Display** - Orders now appear in dashboard after fulfillment events
- **Order Deletion** - Fixed individual order deletion functionality in dashboard

### Changed
- **Database Schema** - Migrated from old field-by-field orders table to new JSON-based schema for better flexibility
- **TypeScript Interfaces** - Added proper `DatabaseOrder` interface and updated type definitions
- **Authentication** - Moved order deletion route to protected routes section for proper authentication

### Technical Improvements
- **Database Migration** - Direct schema update to remote D1 database to resolve migration system limitations
- **Error Handling** - Enhanced error handling and debugging for order operations
- **Frontend Logic** - Fixed line item ID to base order ID conversion for proper deletion

## [0.11.0] - 2025-06-19

### Added
- **Product Management System** - Complete product sync, filtering, and labeling functionality
- **Tag-Based Filtering** - Filter products by Shopify tags with custom tag filters
- **Title-Based Filtering** - Filter products by title patterns with custom title filters
- **Product Labeling** - Apply custom labels to products for better organization
- **Bulk Operations** - Bulk save and label application for multiple products
- **Product Sync Status** - Track sync status and progress for product operations

### Changed
- **Enhanced Product Processing** - Improved product data extraction and processing
- **Better Error Handling** - More robust error handling for product operations
- **UI Improvements** - Enhanced product management interface

## [0.10.0] - 2025-06-18

### Added
- **Detrack Integration** - Complete Detrack API v2 integration for delivery job management
- **Detrack Configuration** - Configurable API key, base URL, and connection settings
- **Detrack Testing** - Multiple test endpoints for connection validation and API testing
- **Job Export** - Export processed orders to Detrack as delivery jobs
- **Job Management** - View and manage Detrack jobs through the API

### Changed
- **Order Processing** - Enhanced order processing to support Detrack export format
- **API Structure** - Updated API endpoints to support Detrack operations
- **Configuration Management** - Improved configuration storage and retrieval

## [0.9.0] - 2025-06-17

### Added
- **Global Field Mappings** - Configurable field mappings for order processing
- **Extract Processing Mappings** - Advanced field extraction and processing rules
- **Order Reprocessing** - Reprocess existing orders with updated mappings
- **Enhanced Order Display** - Better order data presentation in dashboard

### Changed
- **Order Processing Logic** - Improved order data extraction and transformation
- **Mapping System** - More flexible and powerful field mapping capabilities
- **Data Validation** - Enhanced validation for order data processing

## [0.8.0] - 2025-06-16

### Added
- **Shopify Webhook Integration** - Real-time order fulfillment webhook processing
- **Webhook Registration** - Automatic webhook registration for Shopify stores
- **Order Status Tracking** - Track order status from fulfillment to export
- **Webhook Security** - HMAC validation for webhook authenticity

### Changed
- **Order Processing** - Real-time order processing from Shopify webhooks
- **Database Schema** - Updated to support webhook data and order status tracking
- **Error Handling** - Enhanced error handling for webhook processing

## [0.7.0] - 2025-06-15

### Added
- **Store Management** - Complete Shopify store management system
- **Store Configuration** - Configurable store settings and API credentials
- **Multi-Store Support** - Support for multiple Shopify stores
- **Store-Specific Mappings** - Individual field mappings per store

### Changed
- **Database Schema** - Added stores table and related configurations
- **API Structure** - Updated to support multi-store operations
- **Authentication** - Enhanced authentication for store management

## [0.6.0] - 2025-06-14

### Added
- **Order Management** - Complete order processing and management system
- **Order Dashboard** - Visual order management interface
- **Order Export** - Export orders to external systems
- **Order Filtering** - Filter orders by various criteria

### Changed
- **Database Schema** - Added orders table and related structures
- **API Endpoints** - Added order management endpoints
- **UI Components** - Enhanced dashboard with order management features

## [0.5.0] - 2025-06-13

### Added
- **Authentication System** - Complete user authentication and session management
- **User Registration** - User registration and account creation
- **Login/Logout** - Secure login and logout functionality
- **Session Management** - Persistent session handling

### Changed
- **Security** - Enhanced security with JWT tokens and session management
- **Database Schema** - Added users table and authentication structures
- **API Protection** - Protected API endpoints with authentication

## [0.4.0] - 2025-06-12

### Added
- **Database Integration** - D1 database integration for data persistence
- **Data Models** - Structured data models for application entities
- **Database Operations** - CRUD operations for all data entities
- **Data Validation** - Input validation and data integrity checks

### Changed
- **Data Storage** - Migrated from local storage to database storage
- **API Structure** - Updated API to use database operations
- **Error Handling** - Enhanced error handling for database operations

## [0.3.0] - 2025-06-11

### Added
- **API Endpoints** - Complete REST API for application functionality
- **Request Handling** - Proper request routing and handling
- **Response Formatting** - Standardized API response formats
- **Error Handling** - Comprehensive error handling and status codes

### Changed
- **Architecture** - Updated to use proper API architecture
- **Data Flow** - Improved data flow between frontend and backend
- **Security** - Enhanced security with proper request validation

## [0.2.0] - 2025-06-10

### Added
- **UI Components** - Complete set of reusable UI components
- **Dashboard Interface** - Main application dashboard
- **Settings Panel** - Configuration and settings interface
- **Responsive Design** - Mobile-responsive design implementation

### Changed
- **User Interface** - Complete UI overhaul with modern design
- **Component Structure** - Organized component hierarchy
- **Styling** - Updated styling with Tailwind CSS

## [0.1.0] - 2025-06-09

### Added
- **Initial Setup** - Basic project structure and configuration
- **Cloudflare Workers** - Worker-based backend infrastructure
- **React Frontend** - React-based frontend application
- **Build System** - Vite-based build and deployment system

### Changed
- **Project Structure** - Organized project structure for scalability
- **Development Environment** - Configured development and production environments

## [0.12.0] - 2025-06-20

### Fixed
- **Database Schema Mismatch** - Fixed critical issue where orders were not being saved due to schema mismatch between code and database
- **Orders Table Schema** - Updated remote D1 database schema to match code expectations with `processed_data` and `raw_shopify_data` JSON columns
- **Order Processing** - Resolved `NOT NULL constraint failed: orders.order_number` error that prevented order saves
- **Webhook Processing** - Orders from Shopify fulfillment webhooks now save successfully to database
- **Dashboard Order Display** - Orders now appear in dashboard after fulfillment events

### Changed
- **Database Schema** - Migrated from old field-by-field orders table to new JSON-based schema for better flexibility
- **Order Storage Format** - Orders now stored as JSON strings (`processed_data` and `raw_shopify_data`) instead of individual columns
- **Database Migration** - Applied direct schema update to remote D1 database to resolve migration system limitations

### Technical Improvements
- **Type Safety** - Added `DatabaseOrder` interface to properly type database operations
- **Error Handling** - Improved error handling in database operations with proper TypeScript types
- **Schema Consistency** - Ensured local and remote database schemas are now aligned
- **Migration System** - Created migration file for future reference (015_update_orders_schema.sql)

### Root Cause Analysis
- **Issue**: Remote D1 database had old schema with `order_number` column, but code expected new schema with JSON columns
- **Impact**: All order saves failed silently with constraint errors
- **Solution**: Direct schema update to remote database to match code expectations
- **Prevention**: Future migrations should use proper D1 migration system when available

## [0.11.0] - 2024-12-19

### Added
- **Bulk Save Upsert Logic** - Implemented INSERT OR REPLACE functionality to handle duplicate products during bulk save operations
- **Product Label Support** - Added label column to saved_products table and implemented label application functionality
- **Bulk Label Application** - New endpoint `/api/saved-products/bulk-label` for applying labels to multiple saved products
- **Enhanced Save Logging** - Added detailed logging for bulk save operations with counts of saved, skipped, and total processed products

### Changed
- **Bulk Save Behavior** - Changed from simple INSERT to upsert logic to prevent unique constraint violations
- **Database Schema** - Added `label` column to `saved_products` table via migration `011_add_label_to_saved_products.sql`
- **Save Product Method** - Added `saveProductUpsert` method to handle duplicate products gracefully
- **Product Response** - Updated saved products API to include label field in responses

### Fixed
- **Bulk Save Duplicate Issue** - Fixed issue where only 7 out of 21 products were saved due to unique constraint violations on duplicate products
- **Label Application Not Working** - Implemented missing `/api/saved-products/bulk-label` endpoint that was being called by frontend
- **Product Label Persistence** - Labels are now properly saved to database and displayed in the UI
- **Database Constraint Handling** - Proper handling of `UNIQUE(product_id, user_id)` constraint during bulk operations

### Technical Improvements
- **Database Migration** - Added migration to support product labels in saved_products table
- **Error Handling** - Enhanced error handling in bulk operations with detailed logging
- **API Response Enhancement** - Bulk save now returns detailed statistics about the operation
- **Database Service Updates** - Added `updateProductLabel` method for label management

## [0.10.0] - 2024-12-19

### Added
- **Enhanced Product Search** - Search bar now searches through product titles, variant titles, and tags for comprehensive filtering
- **Real-time Search Filtering** - Search results update instantly as you type for better user experience
- **Automatic Page Reset** - Search automatically resets to page 1 when search term changes to prevent empty pages
- **Improved Product Pagination** - Fixed pagination to work correctly with search filtering

### Changed
- **Search Algorithm** - Enhanced search to use substring matching across multiple product fields
- **Pagination Logic** - Updated pagination to use filtered results instead of all products
- **Product Count Display** - Now shows filtered count vs total count for better user feedback
- **Search Performance** - Optimized search filtering with proper memoization and dependency management

### Fixed
- **Search Bar Not Working** - Fixed issue where search bar wouldn't filter products properly
- **Pagination with Search** - Resolved pagination showing wrong products when search was active
- **Product Count Accuracy** - Fixed display to show correct filtered product counts
- **Search Across Tags** - Now properly searches through product tags in addition to titles
- **Page Navigation** - Fixed pagination to work correctly with search results

### Technical Improvements
- **Filtered Product Logic** - Implemented proper filtered product handling with useMemo optimization
- **Search State Management** - Added useEffect to reset page when search term changes
- **Component Architecture** - Improved search and pagination component structure
- **Performance Optimization** - Enhanced memoization for better search performance

## [0.9.0] - 2024-12-19

### Added
- **Enhanced Tag Filtering** - Improved product tag filtering to use substring matching instead of exact matching for better search results
- **Debug Logging for Tag Filtering** - Added comprehensive debug logging to help troubleshoot tag filtering issues
- **Collapsible UI Components** - Fixed Collapsible component hierarchy issues and improved Saved Products section UI

### Changed
- **Tag Matching Algorithm** - Changed from exact tag matching to substring matching for more flexible product filtering
- **Product Filter Logic** - Enhanced filtering to match partial tag names (e.g., "Condolences Stand" now matches products tagged with "Condolences Stand")
- **UI Component Structure** - Fixed Radix UI Collapsible component nesting to prevent "white screen of death" errors

### Fixed
- **Tag Filter Not Working** - Fixed issue where searching for "Condolences Stand" wouldn't find products with that exact tag
- **Collapsible Component Error** - Resolved "CollapsibleTrigger must be used within Collapsible" error that caused white screen
- **Product Search Accuracy** - Improved search accuracy for products with multi-word tags or partial tag matches
- **UI Rendering Issues** - Fixed component hierarchy issues that prevented proper UI rendering

### Technical Improvements
- **API Route Optimization** - Improved tag filtering logic in handleFetchStoreProducts function
- **Debug Logging** - Added detailed console logging for tag filtering operations to aid troubleshooting
- **Component Architecture** - Fixed Radix UI component nesting and improved overall component structure

## [0.8.0] - 2024-06-19

### Added
- **Multi-Store Order Fetching** - Fetch orders now processes all configured stores automatically instead of requiring individual store selection
- **Increased Dashboard Capacity** - Dashboard now displays up to 200 orders per page instead of 50 for better data visibility
- **Phone Number Normalization** - Automatic phone number cleaning for Singapore (+65/65) and international numbers (removes + prefix)
- **Enhanced Order Refresh** - Improved order refresh after fetch operations with automatic page reset and timing optimizations
- **Phone Field Processing** - Added phone normalization for `senderNumberOnApp`, `senderPhoneNo`, and `recipientPhoneNo` fields
- **Detrack API Integration** - Complete API integration with correct v2 endpoint and payload structure
- **API Testing Framework** - Comprehensive testing suite for Detrack API endpoints and payload variations
- **Real Data Export Testing** - Testing export functionality with actual dashboard order data
- **API Permission Analysis** - Identified read-only vs write permissions for API key
- **Map dashboard field 'Sender's Number To Appear on App' to Detrack's 'order_number' payload field**
- **Map dashboard field 'Sender's name to appear on app' to Detrack's 'invoice_number' payload field**
- **Map dashboard field 'First Name' to Detrack's 'deliver_to_collect_from' payload field**
- **Map dashboard field 'Last Name' to Detrack's 'last_name' payload field**
- **Removed unsupported or misnamed fields from Detrack payload**
- **Confirmed successful end-to-end export and field mapping with Detrack API**
- **Improved Mobile Layout** - Enhanced header layout for better mobile responsiveness with stacked navigation and view mode controls

### Changed
- **Dashboard Default Limit** - Increased from 50 to 200 orders per page across all database queries and frontend display
- **Fetch Orders Behavior** - Now automatically processes all stores in sequence and shows combined results
- **Order Refresh Logic** - All order-modifying operations now reset to page 1 to show newest orders first
- **Phone Number Formatting** - Singapore numbers now display without country code, international numbers without + prefix
- **Database Query Limits** - All order retrieval methods now default to 200 records instead of 50
- **Detrack Test Endpoint** - Fixed main test endpoint to use correct v2 API format instead of v1
- **API Payload Structure** - Standardized on v2 API format with proper data wrapping structure
- **Error Handling** - Enhanced error reporting for API permission and configuration issues
- **Mobile Navigation** - Reorganized header layout to use a two-row design for better mobile visibility
- **View Mode Controls** - Simplified view mode buttons on mobile to use icons only for better space efficiency

### Fixed
- **Order Refresh After Fetch** - Fixed issue where orders wouldn't appear after fetching until manual page refresh
- **Multi-Store Fetch Display** - Orders from all stores now appear in dashboard after fetch operation
- **Phone Number Consistency** - Standardized phone number format across all phone-related fields
- **Dashboard Pagination** - Ensures newest orders are always visible after operations that modify order data
- **API Endpoint Consistency** - All test endpoints now use the correct v2 API format
- **Payload Format** - Fixed payload structure to match successful GET response format
- **Test Endpoint Routing** - Corrected main test endpoint to use proper v2 implementation
- **Detrack Jobs API Endpoint** - Updated Analytics page to use correct Detrack API endpoint format (`type=DeliveryParameters` instead of `type=Delivery&date=`)
- **Mobile Layout** - Fixed issue where view mode buttons were being cut off on mobile devices

### Technical Improvements
- **Database Service Updates** - Updated all order retrieval methods to use 200 as default limit
- **Frontend State Management** - Improved order refresh timing and page state management
- **Phone Processing Logic** - Added phone normalization in OrderProcessor class with comprehensive test coverage
- **Migration Support** - Added database migration for phone normalization field mappings
- **API Authentication** - Confirmed API key is valid and can authenticate successfully
- **GET Request Success** - Successfully retrieving delivery jobs from Detrack API
- **Data Structure Analysis** - Analyzed real Detrack job data structure for proper payload formatting
- **Permission Investigation** - Identified that API key has read-only permissions (GET works, POST fails with 500)

### Known Issues
- **POST Request 500 Error** - All POST requests to create jobs return 500 Internal Server Error
- **API Key Permissions** - Current API key appears to have read-only permissions only
- **Write Access Required** - Need Detrack support to grant write permissions for job creation

### Next Steps
- Contact Detrack support to request write permissions for API key
- Test export functionality with real dashboard order data
- Implement export UI in dashboard for when permissions are granted

## [Unreleased]
- Added smart sync for products: only new or updated products are saved to the database on each sync.
- Fixed saved_products table creation and schema alignment with backend logic.
- Added updated_at column to saved_products for Shopify product update tracking.

## [0.7.0] - 2024-01-XX

### Added
- **Mobile Mode** - Comprehensive mobile responsiveness with card-based order view, collapsible controls menu, and mobile-optimized layouts
- **Mobile Card View** - Orders display as cards on mobile devices with key information and easy selection
- **Mobile Controls Menu** - Collapsible menu for filters and actions on mobile devices
- **Mobile Layout Optimizations** - Responsive stats cards, Express orders grid, and header layout for mobile screens
- **View Mode Toggle** - Manual toggle between Auto (responsive), Mobile (card view), and Desktop (table view) modes
- **CSV Export** - Export filtered orders to CSV file with all visible columns and proper data formatting

### Fixed
- **Store Breakdown Calculation** - Fixed store breakdown stat card to count unique orders instead of line items per store prefix

### Planned
- Shopify OAuth flow for store connection
- Order dashboard with real-time data
- Detrack API integration
- Shopify app installation flow
- Webhook registration automation
- Order export to Detrack
- Advanced field mapping UI
- Order status tracking and management

## [0.6.0] - 2024-01-XX

### Added
- **Flower Stands Stat Card** - New Dashboard stat card that filters orders based on Product Labels with "Stand" label
- **Product Labels Integration** - Flower Stands card automatically maps order descriptions to Product Labels from Info page
- **Smart Order Filtering** - Identifies orders containing products labeled as "Stand" for specialized tracking
- **Express Orders Address Display** - Enhanced Express stat card in Dashboard to show delivery addresses alongside order numbers and line items
- **Address Field Integration** - Express orders now display complete delivery information including addresses with location pin emoji (📍)
- **Improved Express Order Visibility** - Better identification and management of Express deliveries with full address context

### Changed
- **Flower Stands Data Processing** - Real-time filtering of orders based on Product Labels configuration
- **Express Stat Card Layout** - Updated Express orders display to include address field for better delivery management
- **Express Order Data Structure** - Enhanced data collection to capture and display delivery addresses
- **Dashboard Stat Cards** - Added new Flower Stands section with responsive grid layout matching Express orders design

### Fixed
- **Case-Insensitive Driver Matching** - Fixed driver name matching in Analytics Part-Time Pay to work regardless of case sensitivity
- **Product Labels Field Mapping** - Resolved field mapping issue causing product labels to disappear on page refresh
- **Driver Order Assignment** - Improved accuracy of driver order matching and pay calculations
- **Product Labels Data Persistence** - Fixed database field mapping from snake_case to camelCase for frontend compatibility

## [0.5.1] - 2024-01-XX

### Fixed
- **Removed Line Items Filtering** - Fixed order processing to properly filter out line items with `current_quantity === 0` (removed items)
- **Item Count Calculation** - Updated `calculateItemCount()` method to only count active line items (current_quantity > 0)
- **Description Field Accuracy** - Fixed description field to show actual product names instead of blank values
- **Shipping Labels Count** - Corrected shipping labels count to reflect actual number of active items
- **Order Processing Logic** - Improved filtering to distinguish between fulfilled items and actually removed items

### Changed
- **Line Item Processing** - Modified order processing to skip line items with current_quantity of 0
- **Item Counting Logic** - Updated counting method to use same filtering logic as line item processing
- **Data Accuracy** - Enhanced order data accuracy by properly handling removed line items

## [0.5.0] - 2024-01-XX

### Added
- **Enhanced Dashboard Statistics** - Fixed order counting to show unique orders instead of line items
- **Store Breakdown Stat Card** - New stat card showing orders by store prefix (e.g., WF, FL, SG) with top store count and additional store breakdown
- **Express Orders Stat Card** - Specialized stat card that identifies and displays Express delivery orders with full line item details
- **Improved Stats Layout** - Expanded dashboard grid from 4 to 6 columns to accommodate new stat cards
- **Smart Order Deduplication** - Stats now correctly count unique orders rather than individual line items
- **Express Order Detection** - Automatic detection of Express orders by searching line item descriptions for "express" keyword
- **Store Prefix Extraction** - Intelligent extraction of store prefixes from order numbers (e.g., "WF" from "#WF10000")

### Changed
- **Stats Calculation Logic** - Modified all stat calculations to count unique orders instead of total line items
- **Dashboard Grid Layout** - Updated from 4-column to 6-column grid for better stat card organization
- **Express Orders Display** - Shows delivery order number and complete line item title + variant title for Express orders
- **Store Breakdown Display** - Shows top store count with additional stores listed below in compact format
- **Color Coding** - Added purple color scheme for Express orders card and blue for store breakdown card

### Fixed
- **Incorrect Order Counts** - Fixed issue where stats showed line item counts instead of unique order counts
- **Duplicate Order Counting** - Orders with multiple line items now count as 1 order instead of multiple
- **Status Count Accuracy** - Status-based stats (Ready for Export, Exported, Errors) now correctly count unique orders
- **Express Order Visibility** - Express orders are now prominently displayed for easy identification and management

## [0.4.0] - 2024-01-XX

### Added
- Comprehensive Shopify Order Fields Integration - Added all official Shopify Order API fields (2024-01) for complete field mapping coverage
- Enhanced Settings UI - Grouped Shopify fields in dropdown by category (Order, Customer, Shipping Address, Billing Address, Line Items, Fulfillments, Advanced)
- Official Shopify Field Support - Added support for all standard Shopify order fields including id, name, order_number, email, phone, created_at, financial_status, fulfillment_status, etc.
- Advanced Field Categories - Added support for metafields, discount_applications, shipping_lines, and other advanced Shopify fields
- Improved Field Mapping UX - Clear visual grouping and labeling of Shopify fields in the mapping dropdown for easier configuration

### Changed
- Updated SHOPIFY_FIELDS array to include all official Shopify Order API fields instead of limited subset
- Enhanced Settings component dropdown to group fields by category with clear section headers
- Improved field mapping organization - Fields are now logically grouped for better user experience
- Updated field mapping system to support all Shopify order data types and structures
- Replaced custom field prefixes (e.g., "order.name") with official Shopify field names (e.g., "name")

### Fixed
- Limited field mapping options - Now supports all official Shopify Order fields for maximum flexibility
- Field mapping confusion - Clear grouping and labeling makes it easier to find and map the right fields
- Shopify API compatibility - All field mappings now use official Shopify field names and paths
- Field mapping completeness - No more missing fields that users might need for their specific use cases

## [0.3.0] - 2024-01-XX

### Added
- Backend Database Integration for Stores - Stores are now saved to and loaded from the backend database instead of localStorage
- Enhanced Logging for Order Fetching - Detailed logging throughout the fetch orders process for better debugging
- Store Management API Integration - Frontend now communicates with backend store management endpoints
- Automatic Store Loading - Stores are automatically loaded from database when Settings page loads
- Store Creation/Deletion API Calls - Add and remove stores now use backend API endpoints

### Changed
- Settings component now saves stores to backend database instead of localStorage
- Store data format mapping between frontend and backend schemas
- Store management functions are now async and handle API responses
- Enhanced error handling for store operations with user feedback
- Improved store data consistency between frontend and backend

### Fixed
- Frontend-backend store disconnect - Stores added in Settings now persist in database
- Fetch Orders functionality - Now finds stores in database and can fetch orders from Shopify
- Store data synchronization - Frontend and backend now share the same store data
- Order fetching process - Detailed logging shows exactly what happens during fetch operations

## [0.2.0] - 2024-01-XX

### Added
- Extract Processing Fields UI protection
- Auto-processed field indicators with info badges
- Read-only configuration for special processing fields
- Clear explanations for each auto-processed field
- Type system improvements for field mapping structure
- Auto-save dashboard configuration - Column visibility and resizing preferences now persist across page refreshes
- Dashboard column configuration storage and retrieval system
- Field Mapping Save Button - Save field mappings to database with visual feedback
- Database Integration for Field Mappings - Frontend configuration now communicates with database
- Global Field Mapping System - Centralized field mapping configuration for all stores
- Order Processing with Database Mappings - Orders are processed using saved field mappings from database
- Dashboard Date Filter - Filter orders by Delivery Date field with dropdown selector
- Dashboard Timeslot Filter - Filter orders by Delivery Completion Time Window (Morning/Afternoon/Night)
- Improved Dashboard Layout - Fixed horizontal scrolling with proper table structure

### Changed
- Updated Settings component to prevent manual configuration of Extract Processing Fields
- Enhanced field mapping UI with visual indicators for auto-processed fields
- Improved type safety with GlobalFieldMapping and ExtractProcessingMapping interfaces
- Updated storage layer to use correct property names and types
- Dashboard component now loads saved column configuration on mount
- Column visibility and width changes are automatically saved to localStorage
- Field mappings now persist in database - No longer lost on page refresh
- Order processing uses database mappings - Shopify orders are processed through configured field mappings
- Database service updated to support global field mappings with special 'global' store ID
- Dashboard filtering logic - Stats cards and selection now respect active filters
- Table layout improvements - Added flex-shrink-0 to prevent column compression

### Fixed
- Type inconsistencies between frontend and backend field mapping structures
- Storage layer property name mismatches
- Import/export type definitions
- Settings page crash due to localStorage data migration issues
- Added defensive programming to handle undefined values in Settings component
- Automatic migration from old fieldMappings to new globalFieldMappings property
- Horizontal scrolling issues - Table now properly scrolls horizontally without breaking layout
- Column width preservation - Columns maintain their widths during scrolling
- Select component error - Fixed empty string value issue in dashboard filters
- Field mappings authentication - Made field mappings endpoints public for configuration access

## [0.1.0] - 2024-01-XX

### Added
- Initial project setup with React + TypeScript + Vite
- UI components using shadcn/ui
- Basic project structure
- Shopify API and crypto-js dependencies
- Comprehensive Shopify webhook types and interfaces
- Order processing logic with field mapping system
- Two types of field mapping: Global Field Mappings and Extract Processing Mappings
- Special field processing for dates, times, descriptions, and item counts
- Test order processor with sample data
- Cloudflare D1 database setup with complete schema
- Cloudflare KV namespace for session management
- Comprehensive database service layer with CRUD operations
- Authentication system with login/register functionality
- Session management with secure cookies
- Cloudflare Worker with full API endpoints
- Shopify webhook endpoint with HMAC verification
- Field mapping persistence and auto-saving
- Login/Register UI components
- Protected routes and authentication middleware
- Project initialization
- Basic UI framework setup
- Development environment configuration
- Shopify API integration foundation
- Field mapping system architecture
- Cloudflare deployment infrastructure
- Database persistence layer
- Authentication and session management 