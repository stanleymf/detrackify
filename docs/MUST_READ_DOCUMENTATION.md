# Must-Read Documentation

This document lists the essential documentation that should be reviewed at the start of each development session to ensure you're up-to-date with the project's current state and architecture.

## 🚨 **CRITICAL - Read First**

### **1. CHANGELOG.md**
- **Purpose**: Track all recent changes, fixes, and new features
- **When to read**: **ALWAYS** at the start of each session
- **What to look for**: 
  - Latest version number and changes
  - Recent bug fixes that might affect your work
  - New features that might be relevant
  - Breaking changes or deprecations

### **2. ARCHITECTURE.md**
- **Purpose**: Understand the overall system architecture and design decisions
- **When to read**: When starting new features or debugging complex issues
- **What to look for**:
  - System components and their relationships
  - Data flow between components
  - Technology stack and dependencies
  - Phase 1 vs Phase 2 features

## 📋 **ESSENTIAL - Read Regularly**

### **3. README.md**
- **Purpose**: Project overview, setup instructions, and quick reference
- **When to read**: When setting up environment or onboarding
- **What to look for**:
  - Project description and goals
  - Setup and installation steps
  - Available scripts and commands
  - Quick troubleshooting guide

### **4. DEPLOYMENT_GUIDE.md**
- **Purpose**: Understand deployment process and environment management
- **When to read**: Before deploying changes or when troubleshooting deployment issues
- **What to look for**:
  - Deployment steps and procedures
  - Environment configuration
  - Common deployment issues and solutions
  - Rollback procedures

### **5. FIELD_MAPPING_GUIDE.md**
- **Purpose**: Understand how data is mapped between different systems
- **When to read**: When working with data integration, orders, or field mapping
- **What to look for**:
  - Field mapping configurations
  - Data transformation rules
  - Integration points between Shopify and Detrack
  - Custom field handling

## 🔧 **SPECIALIZED - Read When Relevant**

### **6. docs/TESTING_FILES_MANAGEMENT.md**
- **Purpose**: Understand test file organization and management
- **When to read**: When working with tests, debugging, or adding new test files
- **What to look for**:
  - Test file naming conventions
  - Available test files and their purposes
  - How to run and maintain tests
  - Best practices for testing

### **7. docs/progress.md**
- **Purpose**: Track ongoing development progress and current tasks
- **When to read**: When resuming work or checking project status
- **What to look for**:
  - Current development priorities
  - In-progress features
  - Known issues and blockers
  - Next steps and milestones

### **8. docs/prd.md**
- **Purpose**: Product requirements and feature specifications
- **When to read**: When working on new features or understanding requirements
- **What to look for**:
  - Feature requirements and specifications
  - User stories and acceptance criteria
  - Business logic and rules
  - Integration requirements

## 📊 **QUICK REFERENCE - Check as Needed**

### **9. package.json**
- **Purpose**: Dependencies, scripts, and project configuration
- **When to read**: When adding dependencies or running scripts
- **What to look for**:
  - Available npm scripts
  - Dependencies and their versions
  - Build and deployment configurations

### **10. wrangler.jsonc**
- **Purpose**: Cloudflare Workers configuration
- **When to read**: When modifying backend configuration or deployment
- **What to look for**:
  - Environment variables and bindings
  - Worker configuration settings
  - Database and KV namespace bindings

## 🎯 **Session Startup Checklist**

### **Before Starting Development:**
1. ✅ **Read CHANGELOG.md** - Check latest changes and version
2. ✅ **Check ARCHITECTURE.md** - Understand current system state
3. ✅ **Review README.md** - Confirm setup and available commands
4. ✅ **Check progress.md** - Understand current priorities and tasks

### **Before Deploying:**
1. ✅ **Read DEPLOYMENT_GUIDE.md** - Follow deployment procedures
2. ✅ **Check wrangler.jsonc** - Verify configuration
3. ✅ **Update CHANGELOG.md** - Document your changes

### **When Working on Features:**
1. ✅ **Read prd.md** - Understand requirements
2. ✅ **Check FIELD_MAPPING_GUIDE.md** - Understand data flow
3. ✅ **Review ARCHITECTURE.md** - Ensure alignment with design

### **When Debugging:**
1. ✅ **Check CHANGELOG.md** - Look for recent related changes
2. ✅ **Review TESTING_FILES_MANAGEMENT.md** - Use appropriate tests
3. ✅ **Check progress.md** - Look for known issues

## 📝 **Documentation Maintenance**

### **Keep Documentation Updated:**
- **Update CHANGELOG.md** after every change
- **Update progress.md** when starting/completing tasks
- **Update relevant docs** when changing architecture or processes
- **Add new docs** when creating new systems or processes

### **Documentation Standards:**
- Use clear, concise language
- Include examples where helpful
- Keep information current and accurate
- Use consistent formatting and structure

---

## 🚀 **Quick Start Commands**

```bash
# Check current version and recent changes
git log --oneline -5
cat CHANGELOG.md | head -20

# Check current project status
cat docs/progress.md

# Verify setup
npm run build
npm run deploy

# Run tests (if applicable)
node tests/simple-detrack-test.js
```

---

*Last updated: 2025-06-20*
*Version: 1.0*

**Remember**: This documentation is your roadmap to understanding and working effectively with the Detrackify project. Regular review ensures you stay aligned with the project's current state and architecture. 