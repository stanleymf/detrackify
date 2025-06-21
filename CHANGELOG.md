# Changelog

All notable changes to this project will be documented in this file.

## [0.13.12] - 2025-06-20

### Fixed
- **Logout URL Persistence** - Fixed issue where clicking logout would show login page but URL remained at `/dashboard`
- **Refresh Authentication** - Fixed issue where refreshing on login page without credentials would redirect back to dashboard
- **Session Cleanup** - Improved logout process to clear all cached authentication data and force page reload
- **Auth Check Logic** - Enhanced authentication status checking to properly handle session validation

### Changed
- **Logout Process** - Added proper session cleanup and page reload on logout to clear cached state
- **Authentication Check** - Improved `checkAuthStatus` to parse response data correctly and handle errors
- **State Management** - Added localStorage cleanup for stale authentication tokens
- **Error Handling** - Enhanced error handling in authentication flow with proper console logging

### Technical Improvements
- **Session Management** - Better session token cleanup and validation
- **Route Protection** - Improved authentication state management for protected routes
- **User Experience** - Fixed confusing authentication flow where users could access dashboard without proper login

## [0.13.11] - 2025-06-20

### Added
- **AND/OR Logic for Tag Filtering** - Added support for both OR and AND logic when filtering orders by multiple tags
- **Filter Mode Selector** - New UI dropdown to choose between OR and AND logic for tag filtering
- **Advanced Tag Filtering** - Orders can now be filtered to match ALL tags (AND) or ANY tags (OR)

### Changed
- **Tag Filtering Logic** - Enhanced backend to support both OR and AND filtering modes
- **API Enhancement** - Added `filterMode` parameter to `/api/fetch-orders` endpoint
- **UI Enhancement** - Added filter mode selector next to tag input field

### Technical Improvements
- **Client-Side Filtering** - AND logic implemented with client-side filtering for orders that match ALL specified tags
- **Shopify API Optimization** - Uses first tag for initial API filtering, then applies additional client-side filtering
- **Backward Compatibility** - Defaults to OR logic for existing functionality

### User Experience
- **Flexible Filtering** - Users can now choose between:
  - **OR Logic**: Orders with ANY of the specified tags (e.g., "urgent" OR "express")
  - **AND Logic**: Orders with ALL of the specified tags (e.g., "urgent" AND "express")

## [0.13.10] - 2025-06-20

### Fixed
- **Multiple Tag Filtering** - Fixed issue where multiple comma-separated tags were not working in order fetching
- **Shopify API Integration** - Updated tag filtering to use correct Shopify API format with multiple &tag= parameters
- **Tag Parameter Handling** - Each tag is now sent as a separate parameter instead of comma-separated values

### Changed
- **Tag Filtering Logic** - Changed from comma-separated tag parameter to multiple individual tag parameters
- **API URL Construction** - Updated to use Shopify's proper multiple tag format: `&tag=tag1&tag=tag2&tag=tag3`
- **Debug Logging** - Enhanced logging to show all tags being applied

### Technical Improvements
- **Shopify API Compliance** - Now follows Shopify's official API documentation for multiple tag filtering
- **OR Logic Support** - Multiple tags now properly use OR logic (orders with ANY of the specified tags)
- **URL Encoding** - Proper URL encoding for each individual tag parameter

## [0.13.9] - 2025-06-20

### Fixed
- **Flower Stands Card Integration** - Fixed Flower Stands card to use Saved Products system instead of Product Labels system
- **Label System Sync** - Flower Stands card now properly reads labels from Saved Products where users actually configure them
- **Data Source Alignment** - Aligned Flower Stands filtering with the actual labeling system being used

### Changed
- **Flower Stands Data Source** - Now loads from `/api/saved-products` instead of `/api/config/product-labels`
- **Product Name Matching** - Uses `product.title` from Saved Products instead of `product.productName` from Product Labels
- **Debug Information** - Updated debug logging to show Saved Products data instead of Product Labels

### Technical Improvements
- **System Consistency** - Eliminated confusion between two separate labeling systems
- **User Experience** - Flower Stands card now works with labels applied in Saved Products section
- **Data Integrity** - Single source of truth for product labels and filtering

## [0.13.8] - 2025-06-20

### Changed
- **Flower Stands Label** - Updated Flower Stands card to check for label 'stands' instead of 'stand'
- **Product Label Matching** - Flower Stands filtering now uses 'stands' label for better consistency
- **Debug Logging** - Added console logging to help diagnose Flower Stands card functionality

### Technical Improvements
- **Label Consistency** - Aligned Flower Stands card with 'stands' label naming convention
- **Debug Information** - Enhanced logging to show product labels and matching results

## [0.13.7] - 2025-06-20

### Changed
- **Flower Stands Label** - Updated Flower Stands card to check for label 'stands' instead of 'stand'
- **Product Label Matching** - Flower Stands filtering now uses 'stands' label for better consistency
- **Debug Logging** - Added console logging to help diagnose Flower Stands card functionality

### Technical Improvements
- **Label Consistency** - Aligned Flower Stands card with 'stands' label naming convention
- **Debug Information** - Enhanced logging to show product labels and matching results

## [0.13.6] - 2025-06-20

### Added
- **Tag-Based Order Fetching** - Added ability to filter orders by Shopify tags when fetching from Shopify
- **Enhanced Fetch Orders** - Orders can now be fetched with specific tag filters (comma-separated)
- **Tag Filter Input** - Added tag filter input field in Dashboard for specifying order tags
- **Multi-Tag Support** - Support for multiple tags separated by commas (e.g., "urgent,express,same-day")

### Changed
- **Fetch Orders API** - Modified `/api/fetch-orders` endpoint to accept optional `tags` parameter in request body
- **Shopify API Integration** - Enhanced `fetchOrdersFromShopify` function to use Shopify's tag filtering
- **Dashboard UI** - Added tag filter input field before the "Fetch Orders from Shopify" button

### Technical Improvements
- **Backend Enhancement** - Modified `handleFetchOrders` to parse and validate tag filters from request
- **API Flexibility** - Fetch orders now supports both unfiltered (all orders) and tag-filtered requests
- **Error Handling** - Improved error handling for tag filtering with proper validation

### Usage
- **Tag Filtering**: Enter tags separated by commas in the tag filter input (e.g., "urgent,express")
- **All Orders**: Leave tag filter empty to fetch all orders (existing behavior)
- **Shopify Integration**: Uses Shopify's native tag filtering API for efficient order retrieval

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

## [2024-12-19] - Authentication Flow Fixes

### Fixed
- **Logout URL Persistence**: Fixed issue where clicking logout would show login page but URL remained at `/dashboard`
- **Refresh Authentication**: Fixed issue where refreshing on login page without credentials would redirect back to dashboard
- **Session Cleanup**: Improved logout process to clear all cached authentication data and force page reload
- **Auth Check Logic**: Enhanced authentication status checking to properly handle session validation

### Technical Changes
- Added proper session cleanup in `handleLogout` function
- Improved `checkAuthStatus` to parse response data correctly
- Added localStorage cleanup for stale authentication tokens
- Force page reload on logout to clear any cached React state

## [2024-12-19] - Custom Domain Setup

### Added
- **Custom Domain**: Configured `detrackify.dand3.com` subdomain
- **Cloudflare Integration**: Set up DNS routing through Cloudflare for the new domain
- **SSL Certificate**: Automatic SSL certificate provision through Cloudflare

### Technical Changes
- Updated `wrangler.jsonc` with custom domain route configuration
- Added CNAME record for `detrackify.dand3.com` pointing to Workers deployment
- Configured Cloudflare Workers to respond to custom domain requests

## [2024-12-19] - Multi-Tag Filtering Enhancement

### Added
- **AND Logic Support**: Added client-side filtering for orders that have ALL specified tags
- **OR/AND Mode Toggle**: UI option to choose between OR (any tag) and AND (all tags) filtering
- **Enhanced Tag Input**: Improved tag input handling for multiple tags

### Technical Changes
- Modified backend to support multiple `&tag=` parameters for OR logic
- Implemented client-side filtering for AND logic by fetching with first tag and filtering locally
- Added UI toggle between OR and AND filtering modes
- Updated order fetching logic to handle both filtering modes

## [2024-12-19] - Flower Stands Card Fix

### Fixed
- **Flower Stands Card**: Fixed card not working due to empty product labels
- **Product Labels Integration**: Updated card to use Saved Products system instead of old product labels

### Technical Changes
- Modified Flower Stands card to query Saved Products with "stand" label
- Removed dependency on deprecated product labels system
- Updated card logic to work with current Saved Products architecture

## [2024-12-19] - Tag Filtering for Order Fetching

### Added
- **Tag-Based Order Fetching**: Added ability to fetch orders by specific tags
- **Tag Input UI**: Added input field for specifying tags when fetching orders
- **Enhanced Order Processing**: Improved order fetching with tag filtering support

### Technical Changes
- Enhanced backend `/api/fetch-orders` endpoint to accept tag parameters
- Added tag filtering logic in order fetching process
- Updated frontend to include tag input in order fetching form
- Modified Shopify API calls to include tag filtering

## [2024-12-19] - Pay Stats Time Window Toggle

### Added
- **Time Window Toggle**: Added toggle to filter pay stats by Morning, Afternoon, Night, and Total
- **Enhanced Analytics**: Improved pay statistics display with time-based filtering
- **Real-time Updates**: Pay stats update automatically when time window changes

### Technical Changes
- Added time window state management in Analytics component
- Implemented filtering logic for different time periods
- Updated pay calculation functions to support time-based filtering
- Enhanced UI with toggle buttons for time window selection

## [2024-12-19] - Codebase Cleanup

### Changed
- **Test Files Organization**: Moved test files to dedicated `tests/` directory
- **Scripts Organization**: Organized utility scripts in `scripts/` directory
- **Documentation Cleanup**: Removed temporary files and organized documentation

### Removed
- **Temporary Files**: Cleaned up scratch files and temporary documentation
- **Duplicate Files**: Removed redundant test and script files

## [2024-12-19] - Clear All Orders Bug Fix

### Fixed
- **Clear All Orders Button**: Fixed 404 error when clicking "Clear All Orders" button
- **Route Order Issue**: Resolved backend route ordering problem causing 404 errors

### Technical Changes
- Reordered routes in backend to ensure `/api/orders/clear-all` is matched before `/api/orders`
- Updated route handling to properly process DELETE requests for clearing all orders

## [2024-12-19] - Initial Release

### Added
- **Core Application**: Complete Shopify to Detrack order management system
- **Authentication**: User registration and login system
- **Dashboard**: Main interface for viewing and managing orders
- **Settings**: Configuration management for stores and field mappings
- **Analytics**: Pay statistics and performance metrics
- **Info**: Product labels and driver information management
- **Order Processing**: Automated order fetching and processing from Shopify
- **Detrack Integration**: Export functionality to Detrack delivery system
- **Webhook Support**: Real-time order updates via Shopify webhooks

## [Unreleased]

### Changed
- Updated webhook endpoint URLs from `https://detrackify.stanleytan92.workers.dev` to `https://detrackify.dand3.com`
- Updated all test scripts and documentation to use the new domain
- Deployed with new domain configuration

### Enhanced
- **Mobile-Friendly Navigation**: Completely redesigned navigation tabs for better mobile experience
  - Added responsive design with mobile-first approach
  - Implemented touch-friendly interactions with scale animations
  - Added emoji icons for mobile view (📊📈ℹ️⚙️) and full text for desktop
  - Enhanced accessibility with proper ARIA labels
  - Improved touch targets and spacing for mobile devices
  - Added active state animations and hover effects
  - Optimized layout for different screen sizes

### Cleaned Up
- **Debug Log Removal**: Removed excessive console.log statements from production code
  - Cleaned up debug logs from worker/index.ts (webhook handler, API routes)
  - Removed debug logs from Dashboard component (export, flower stands filtering)
  - Cleaned up debug logs from Info component (product fetching, store loading)
  - Removed debug logs from Login and Settings components
  - Cleaned up debug logs from orderProcessor.ts and database.ts
  - Kept essential error logging (console.error) for debugging issues
  - Improved code readability and reduced console noise

### Fixed
- **Export to Detrack 500 Error**: Fixed missing variable declarations in handleExportToDetrack function
  - Added missing `exportResults`, `errorCount`, and `successCount` variable declarations
  - Resolved 500 Internal Server Error when exporting orders to Detrack
  - Export functionality now works correctly with proper error tracking and success reporting

## [2024-12-19] - Fixed Editable Fields Not Saving & Preserved Manual Edits

### Fixed
- **Dashboard Cell Editing**: Fixed issue where editable fields in the dashboard table were not saving changes to the database
- **Order ID Resolution**: Fixed 404 error when editing fields by properly extracting base order ID from line item IDs
- **Extract Processing Mapping Preservation**: Fixed issue where manually edited fields were being overwritten by Extract Processing Mapping logic
- Added new PUT `/api/orders/:id` endpoint to handle order field updates
- Updated `handleCellSave` function to call the API endpoint instead of just refreshing data
- Made `handleCellSave` and `handleKeyDown` functions async to properly handle API calls
- Added proper error handling and user feedback for failed saves

### Enhanced
- **Manual Edit Tracking**: Added system to track which fields have been manually edited
- **Field Preservation**: Implemented logic to preserve manually edited fields during order reprocessing
- **Database Schema**: Added `manually_edited_fields` column to orders table to track edited fields
- **Processing Logic**: Created `reprocessShopifyOrder` function that preserves manual edits during reprocessing

### Technical Details
- Created `handleUpdateOrder` function in worker to process order updates
- Updates are applied to the processed_data JSON field in the database
- Local state is updated immediately after successful API call for better UX
- Added validation to ensure order exists before attempting update
- Fixed order ID resolution by using `getBaseOrderId` function to extract base ID from line item IDs (e.g., "orderId-0" → "orderId")
- Properly calculates lineItemIndex from the order ID suffix for accurate field updates
- Added `manually_edited_fields` column to database schema (migration 016)
- Updated `DatabaseOrder` interface to include the new column
- Modified order processing logic to skip Extract Processing for manually edited fields
- Created `reprocessShopifyOrder` function that preserves manual edits during reprocessing
- Updated database service to handle the new column in create and update operations 