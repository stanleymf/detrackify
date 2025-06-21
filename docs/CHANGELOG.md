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