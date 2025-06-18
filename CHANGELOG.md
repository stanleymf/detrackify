# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
- **Direct Dashboard Field Export** - Export to Detrack now uses exact dashboard fields instead of complex transformation logic
- **Simplified Export Logic** - Removed complex field mapping transformation in favor of direct field usage
- **Enhanced Export Logging** - Detailed logging shows exact data being sent to Detrack API
- **Export Data Validation** - Logs show complete order data structure before API submission

### Changed
- **Export Data Source** - Export now uses dashboard display fields directly instead of transformed data
- **Export Field Mapping** - Simplified to use dashboard fields that match CSV format previously used for manual import
- **Export Process** - Removed complex transformation layer, now directly maps dashboard fields to Detrack format
- **API Request Structure** - Export requests now contain the exact field structure shown in dashboard

### Fixed
- **Export Field Mismatch** - Fixed issue where export used transformed data instead of dashboard fields
- **Export Data Accuracy** - Export now sends the same data structure shown in dashboard display
- **Export Complexity** - Simplified export logic to match user expectations from dashboard view
- **Export Reliability** - Direct field mapping reduces potential for data transformation errors

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