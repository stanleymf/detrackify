# Changelog

All notable changes to this project will be documented in this file.

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