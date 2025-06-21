## [0.15.0] - 2025-06-21

### Added
- **New Time Window Mapping**: Added support for "11:00-15:00" time window in extract processing mappings
- **Job Release Time**: "11:00-15:00" now maps to "08:45" (same as 10:00-14:00)
- **Delivery Completion Time Window**: "11:00-15:00" now maps to "Morning" (same as 10:00-14:00)

### Updated
- **Documentation**: Updated `EXTRACT_PROCESSING_REQUIREMENTS.md` and `FIELD_MAPPING_GUIDE.md` with new time window conversions
- **Order Processor**: Enhanced time window conversion logic in `src/lib/orderProcessor.ts`
- **Deployment**: Fixed Cloudflare deployment caching issues with clean build process

### Fixed
- **Deployment Issues**: Resolved Cloudflare worker deployment caching problems by implementing clean build process
- **Extract Processing**: Fixed time window conversion functions not being called by extract methods
- **Debug Logging**: Added comprehensive debug logging to verify time window processing

### Tested
- **Time Window Mapping**: Successfully tested with 15 orders containing "11:00-15:00" time windows
- **Conversion Logic**: Verified both Job Release Time (→ "08:45") and Delivery Completion Time Window (→ "Morning") conversions
- **Production Deployment**: Confirmed new code is live and processing orders correctly

## [0.14.0] - 2025-06-21

### Added
- **Manual Order Creation**: Added new "Add Order" button on the Dashboard that opens a modal to create orders manually without going through Shopify.
- **AddOrder Component**: New form component within a modal with all required fields for manual order entry.
- **Manual Order API**: New `POST /api/orders/manual` endpoint that bypasses complex mapping logic.
- **Direct Order Processing**: Manual orders use minimal processing (only phone normalization) and skip Shopify-specific mappings.
- **Dashboard Refresh**: The dashboard now automatically refreshes after a manual order is successfully created.

### Fixed
- **Manual Store Foreign Key**: Resolved a `D1_ERROR: FOREIGN KEY constraint failed` by ensuring the `manual` store exists in the `stores` table before creating a manual order. This was fixed by running a direct SQL insert on the production database.

### Technical Details
- **Bypass Mapping Logic**: Manual orders completely bypass the `OrderProcessor` class and complex Shopify-to-Detrack mappings
- **Minimal Processing**: Only applies phone number normalization, all other fields are used as-is from user input
- **Database Integration**: Manual orders stored with `store_id: 'manual'` and can be exported to Detrack like regular orders
- **Form Fields**: Includes all specified fields: Delivery Order No, dates, times, addresses, customer info, item details, etc.
- **Dropdown Selections**: Job Release Time (08:45, 13:45, 17:15) and Delivery Completion Time Window (Morning, Afternoon, Night)

### Benefits
- **Independent Operation**: Manual orders work independently of Shopify integration
- **Export Compatibility**: Manual orders can be exported to Detrack using existing export logic
- **Preserved Mappings**: Existing Shopify mapping configurations remain completely untouched
- **Simple Workflow**: Direct input → minimal processing → database storage → export ready

## [0.13.0] - 2025-06-21

### Added
- **Export Logic Documentation**: Added `EXPORT_LOGIC_DOCUMENTATION.md` in `docs/` to explain order/line-item export logic and Detrack integration.
- **Organization & Cleanup Guide**: Added `ORGANIZATION_AND_CLEANUP_GUIDE.md` in `docs/` for onboarding and project hygiene.

### Changed
- **Documentation Structure**: Moved `CHANGELOG.md` and `DEPLOYMENT_GUIDE.md` into the `docs/` folder for better organization.
- **Debug/Test Cleanup**: Removed all obsolete test and debug files from `tests/`.
- **Debug Logging**: Removed all `console.log` and debug statements from production code (especially in `orderProcessor.ts` and `worker/index.ts`).
- **Phone Normalization**: Updated phone normalization logic to remove all spacing between digits for recipient and sender phone numbers.
- **Project Structure**: Ensured all documentation is in `docs/`, code in `src/`, scripts in `scripts/`, and tests in `tests/` (clean).

### Fixed
- **Export Grouping**: Confirmed and documented that all line items from a Shopify order are grouped into a single Detrack job.
- **Business Logic Consistency**: Ensured all business logic is documented and code matches requirements.

--- 