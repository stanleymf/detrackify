# Organization and Cleanup Guide

This guide helps you keep your Detrackify project organized and ready for efficient development. Follow these steps at the start of each session or after major changes:

## 1. Documentation
- Keep all documentation files in the `docs/` folder.
- Key docs include:
  - `EXPORT_LOGIC_DOCUMENTATION.md`: Explains order/line-item export logic.
  - `CHANGELOG.md`: Track all changes, features, and bug fixes.
  - `DEPLOYMENT_GUIDE.md`: Step-by-step deployment instructions.
  - `ORGANIZATION_AND_CLEANUP_GUIDE.md`: This guide.

## 2. Test and Debug Files
- Remove or archive obsolete test/debug files from the `tests/` directory.
- Only keep up-to-date, relevant test scripts.

## 3. Debug Logging
- Remove or comment out all `console.log` and debug statements from production code.
- Use logging only for critical errors or essential audit trails.

## 4. File Structure
- Place all source code in the `src/` directory.
- Place all documentation in the `docs/` directory.
- Place all scripts in the `scripts/` directory.
- Place all tests in the `tests/` directory (keep clean).

## 5. Code Review
- Run a linter and formatter before committing code.
- Check for unused files, variables, and dependencies.
- Ensure all business logic is documented in the appropriate doc files.

## 6. Deployment
- Follow the `DEPLOYMENT_GUIDE.md` for production deployment.
- Update the `CHANGELOG.md` after every release or major change.

## 7. Onboarding New Sessions/Agents
- Review this guide and the `EXPORT_LOGIC_DOCUMENTATION.md` to get up to speed.
- Check the latest entries in `CHANGELOG.md` for recent changes.
- Confirm the codebase is clean (no debug/test clutter) before starting new work.

---

By following this checklist, you ensure a maintainable, organized, and efficient project environment for every session. 