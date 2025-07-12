# Changelog

All notable changes to this project will be documented in this file.

## [0.22.3] - 2025-01-28

### Fixed
- **Analytics Driver List Display** - Fixed driver list truncation in stats containers
- Removed 5-driver limit and "+X more drivers" message that prevented viewing complete driver lists
- All drivers now display in Morning, Afternoon, Night, and Total time window cards
- Added scrollable container (max-height: 16rem) to handle long driver lists without breaking layout
- Improved user experience by showing complete driver breakdown with order counts and status indicators

### Technical Improvements
- Removed `.slice(0, 5)` limitation in Analytics component driver breakdown display
- Enhanced driver list rendering to show all drivers instead of truncated view
- Added `overflow-y-auto` and `max-h-64` classes for better list management
- Improved driver statistics visibility across all time windows

## [0.22.2] - 2025-01-28

### Fixed
- **Removed Items Logic** - Fixed quantity calculations to properly exclude removed items (current_quantity = 0) from shipping labels and total count
- **Item Count Accuracy** - Item count now correctly sums only active line items, excluding those that were removed/cancelled after fulfillment
- **Shipping Labels Count** - Number of shipping labels now reflects only active items, not including removed items in the count
- **Description Generation** - Order descriptions now only include active items, providing cleaner and more accurate item listings

### Technical Improvements
- **Consistent Filtering Logic** - Added `getActiveLineItems()` helper method to ensure consistent removed items filtering across all quantity calculations
- **Enhanced Order Processing** - Updated `calculateItemCount()`, `processLineItems()`, and `generateDescription()` methods to exclude removed items
- **Detrack Export Accuracy** - Export to Detrack now uses correct item counts and shipping labels, improving delivery accuracy
- **Code Quality** - Reduced code duplication by centralizing removed items filtering logic

### Impact on Detrack Export
- **number_of_shipping_labels**: Now correctly excludes removed items from count
- **Individual item quantities**: Already correct, continues to use only active items
- **Total item count**: Now accurately reflects only fulfilled items

## [0.22.1] - 2025-01-28

### Fixed
- **Container Display Text Wrapping** - Fixed text truncation issue in Express Orders and Flower Stands cards
- Replaced `truncate` CSS class with `break-words` to allow text to wrap properly
- Order numbers like SGF1613 and long descriptions now display fully without being cut off with "..."
- Improved readability of order information in both Dashboard and Manual Orders Dashboard
- Fixed text wrapping for addresses and descriptions in mobile card views

## [0.22.0] - 2025-01-28

### Added
- **Multi-Item Manual Order Creation** - Enhanced manual order creation to support multiple items within a single order
- Dynamic item management interface with add/remove functionality for line items
- Each item can have its own SKU, description, and quantity
- Automatic total quantity calculation across all items
- Backend support for processing multi-item manual orders
- **Guaranteed Detrack Export Compatibility** - Multi-item manual orders export correctly to Detrack as single jobs with multiple items
- **Order Transfer System** - Manual orders can be transferred to main dashboard for export
- Database migration to support transferred manual orders (`store_id = 'transferred'`)

### Changed
- Updated AddOrder component with new multi-item interface
- Enhanced backend manual order processing to create multiple line item rows
- **Fixed manual orders dashboard separation** - Manual orders no longer appear in main dashboard until transferred
- **Fixed transfer functionality** - Manual orders now group properly by base order ID during transfer
- Improved export debugging with detailed logging of line items and conversion process

### Fixed
- **Transfer foreign key constraint** - Added 'transferred' store to database schema
- **Multi-item export validation** - Fixed empty items array issue in Detrack export
- **Order grouping logic** - Manual orders with multiple line items now export as single jobs
- **Database filtering** - Main dashboard correctly excludes `store_id = 'manual'` orders

### Technical Improvements
- Multi-item orders generate proper line item IDs (e.g., `order-uuid-0`, `order-uuid-1`)
- Order-level data is duplicated across line items for consistent export behavior
- Export process groups line items by order ID and creates single Detrack jobs
- Enhanced manual order form with improved UX for item management
- Database migration `002_add_transferred_store.sql` for transfer functionality
- Enhanced manual order transfer logic to group line items by base order ID
- **VERIFIED**: Multi-item manual orders successfully export to Detrack with all line items intact

## [0.21.1] - 22/06/2025

### Fixed
- **Detrack Export Company Name Field** - Fixed missing company name field in Detrack export payload
- Added proper mapping of companyName field to Detrack API company_name field
- Company information now correctly exports to Detrack delivery jobs

## [0.21.0] - 22/06/2025

### Fixed
- **Manual Orders Dashboard Column Resizing** - Fixed horizontal column resizing functionality
- **Manual Orders Dashboard Column Visibility** - Added dropdown menu to hide/unhide field columns
- **Manual Orders Dashboard Transfer Functionality** - Fixed transfer to main dashboard button
- **Manual Orders Dashboard UI** - Cleaned up and matched main dashboard styling

### Changed
- Updated Manual Orders Dashboard to use proper resize handlers with useCallback
- Improved column visibility controls with dropdown menu matching main dashboard
- Enhanced table structure to use flexbox layout like main dashboard
- Updated cell rendering to match main dashboard styling and behavior
- Improved mobile card view with orange color scheme for manual orders
- Fixed status badge styling to match main dashboard

### Technical
- Implemented proper resize event handling with cleanup
- Added column visibility state management
- Fixed transfer functionality with proper localStorage operations
- Updated table structure to use CSS Grid/Flexbox instead of HTML table
- Enhanced mobile responsiveness and styling consistency

## [0.20.0] - 22/06/2025

### Added
- **Manual Orders Dashboard** - Separate dashboard for managing manually created orders
- Independent storage system for manual orders (separate from Shopify orders)
- Transfer functionality to move manual orders to main dashboard
- Manual orders are not affected by "Clear All Orders" or "Export to Detrack" operations
- Dedicated navigation tab for Manual Orders Dashboard
- Manual orders have their own column configuration and filtering
- Transfer confirmation dialog with order count display
- Manual orders maintain their own stats and filtering options

### Changed
- Updated AddOrder component to save orders to manual orders storage
- Enhanced navigation to include Manual Orders tab with orange color scheme
- Manual orders are now completely separate from Shopify orders workflow
- Stat cards on main dashboard remain unchanged and only read from Shopify orders

### Technical
- Created new ManualOrdersDashboard component with full functionality
- Implemented separate localStorage keys for manual orders and configuration
- Added transfer mechanism between manual and main order storage
- Updated routing to include /manual-orders path

## [0.19.0] - 22/06/2025

### Added
- **Auto-Clear Feature with Time Delay** - Automatically clear all orders from the dashboard after successful export to Detrack
- Configurable time delay (1-1440 minutes, default 30 minutes) before clearing orders
- Settings page with auto-clear configuration options
- Enable/disable auto-clear functionality
- Optional confirmation dialog before clearing orders
- Immediate clear option during export process
- Enhanced user experience with clear feedback on export and clear operations

### Changed
- Modified export to Detrack workflow to include configurable auto-clear functionality
- Added auto-clear settings to the Settings page
- Improved success messaging to include auto-clear status
- Enhanced error handling for clear operations with fallback messaging
- Updated storage system to support auto-clear settings persistence

## [0.18.0] - 22/06/2025

### Added
- Automatic prioritization of today's date when extracting dates from order tags
- Today's date is now the second priority after filter criteria in date extraction
- Enhanced console logging to track date extraction priority (filter → today → fallback)
- Improved date processing for orders with multiple date tags

### Changed
- Updated date extraction logic to automatically prioritize today's date
- Enhanced order processing to work with today's date prioritization
- Maintained compatibility with existing filter-based prioritization

## [0.17.1] - 22/06/2025

### Fixed
- Corrected date filtering logic in `extractFromTags` method to work with actual processing flow
- Fixed date prioritization to properly extract dates that match filter criteria
- Added console logging to track when matching dates are found
- Simplified filter logic to look for any tag containing filter dates

## [0.17.0] - 22/06/2025

### Added
- Enhanced order processing to prioritize matching dates when filtering by delivery/processing dates
- Order processor now accepts filter criteria to ensure extracted dates match filter input
- Frontend automatically extracts date information from tag filters for better date matching
- Backend API passes filter criteria to order processing for improved accuracy

### Changed
- Modified `extractDateFromTags` method to prioritize dates that match filter criteria
- Updated order processing flow to handle filter criteria parameter
- Enhanced tag filtering to include date-specific criteria

## [0.16.0] - 22/06/2025

### Added
- Search bar functionality to filter orders on the dashboard
- Real-time search filtering for order names, descriptions, and other fields

### Changed
- Changed default tag filter mode from "OR" to "AND" for more precise filtering
- Improved order filtering logic for better accuracy

## [0.15.0] - 21/06/2025

### Added
- Manual order creation functionality
- Bulk product management features
- Enhanced product synchronization
- Driver information management
- Tag and title filtering systems

### Changed
- Improved order processing and export logic
- Enhanced UI/UX for better user experience
- Updated field mapping system

## [0.14.0] - 20/06/2025

### Added
- Extract processing mappings for advanced field extraction
- Enhanced order processing with multiple line item support
- Improved date and time extraction from order tags
- Better error handling and logging

### Changed
- Refactored order processor for better maintainability
- Updated field mapping system to support complex extractions
- Enhanced tag-based filtering and processing

## [0.13.0] - 19/06/2025

### Added
- Advanced field mapping system
- Global field mappings for consistent data processing
- Enhanced order processing with better field extraction
- Improved error handling and validation

### Changed
- Refactored order processing logic
- Updated database schema for better field mapping support
- Enhanced UI for field mapping configuration

## [0.12.0] - 18/06/2025

### Added
- Shopify webhook integration for real-time order updates
- Enhanced order processing with better data extraction
- Improved error handling and logging
- Better UI/UX for order management

### Changed
- Updated order processing to handle webhook data
- Enhanced database operations for better performance
- Improved error reporting and user feedback

## [0.11.0] - 17/06/2025

### Added
- Order editing functionality
- Enhanced order processing with better field mapping
- Improved error handling and validation
- Better UI/UX for order management

### Changed
- Updated order processing logic
- Enhanced database operations
- Improved error reporting

## [0.10.0] - 16/06/2025

### Added
- Order deletion functionality
- Enhanced order processing
- Improved error handling
- Better UI/UX

### Changed
- Updated order management system
- Enhanced database operations
- Improved error reporting

## [0.9.0] - 15/06/2025

### Added
- Order reprocessing functionality
- Enhanced order processing with better field extraction
- Improved error handling and validation
- Better UI/UX for order management

### Changed
- Updated order processing logic
- Enhanced database operations
- Improved error reporting

## [0.8.0] - 14/06/2025

### Added
- Enhanced order processing with better field mapping
- Improved error handling and validation
- Better UI/UX for order management

### Changed
- Updated order processing logic
- Enhanced database operations
- Improved error reporting

## [0.7.0] - 13/06/2025

### Added
- Order processing with field mapping
- Enhanced error handling
- Better UI/UX

### Changed
- Updated order processing logic
- Enhanced database operations
- Improved error reporting

## [0.6.0] - 12/06/2025

### Added
- Basic order processing
- Enhanced error handling
- Better UI/UX

### Changed
- Updated order processing logic
- Enhanced database operations
- Improved error reporting

## [0.5.0] - 11/06/2025

### Added
- Order management system
- Enhanced error handling
- Better UI/UX

### Changed
- Updated order processing logic
- Enhanced database operations
- Improved error reporting

## [0.4.0] - 10/06/2025

### Added
- Store management system
- Enhanced error handling
- Better UI/UX

### Changed
- Updated store processing logic
- Enhanced database operations
- Improved error reporting

## [0.3.0] - 09/06/2025

### Added
- Authentication system
- Enhanced error handling
- Better UI/UX

### Changed
- Updated authentication logic
- Enhanced database operations
- Improved error reporting

## [0.2.0] - 08/06/2025

### Added
- Basic database operations
- Enhanced error handling
- Better UI/UX

### Changed
- Updated database logic
- Enhanced error handling
- Improved error reporting

## [0.1.0] - 07/06/2025

### Added
- Initial project setup
- Basic UI components
- Database schema
- Authentication system

### Changed
- Initial release

## [0.13.13] - 2025-06-21

### Added
- **Enhanced Time Window Mappings** - Added new time window ranges for job release time and delivery completion time window
- **Evening Range Support** - Added 18:00-22:00 range mapping for both job release time (→ 17:15) and delivery completion time window (→ Night)
- **Comprehensive Documentation** - Created `docs/TIME_WINDOW_MAPPINGS.md` with complete list of all time window mappings

### Changed
- **Time Window Logic** - Enhanced range-based time window conversion to support evening deliveries
- **Job Release Time** - Added 18:00-22:00 range that converts to "17:15"
- **Delivery Completion Time Window** - Added 18:00-22:00 range that converts to "Night"

### Technical Improvements
- **Range-Based Logic** - All time window conversions now use consistent range-based matching
- **Documentation** - Complete documentation of all time window mappings with examples and implementation details
- **Code Consistency** - Standardized time window conversion logic across both job release time and delivery completion time window

### Time Window Mappings Summary
**Job Release Time:**
- 10:00-14:00 → 08:45
- 14:00-18:00 → 13:45
- 18:00-22:00 → 17:15

**Delivery Completion Time Window:**
- 10:00-14:00 → Morning
- 14:00-18:00 → Afternoon
- 18:00-22:00 → Night

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