# Testing Files Management

This document outlines the organization, purpose, and management of testing files in the Detrackify project.

## 📁 Directory Structure

```
tests/
├── analyze-detrack-response.js      # Analyze Detrack API response structure
├── debug-tag-filtering.js           # Debug tag filtering functionality
├── simple-detrack-test.js           # Basic Detrack API connectivity test
├── test-detrack-alternatives.js     # Test alternative Detrack endpoints
├── test-detrack-analytics-endpoint.js # Test Detrack analytics endpoints
├── test-detrack-debug.js            # Debug Detrack API issues
├── test-detrack-endpoint-discovery.js # Discover available Detrack endpoints
├── test-detrack-endpoints-direct.js # Direct endpoint testing
├── test-detrack-endpoints.js        # General endpoint testing
├── test-detrack-get-params.js       # Test GET parameters
├── test-detrack-minimal.js          # Minimal Detrack test
├── test-detrack-real-data.js        # Test with real data
├── test-detrack-single-vs-bulk.js   # Compare single vs bulk operations
├── test-detrack-variations.js       # Test different variations
├── test-fetch-product.js            # Test product fetching
├── test-shopify-product.js          # Test Shopify product integration
└── test-tag-filtering.js            # Test tag filtering functionality
```

## 🎯 Purpose of Each Test File

### **Detrack API Testing**
- **`simple-detrack-test.js`** - Basic connectivity and authentication
- **`test-detrack-endpoints.js`** - General endpoint functionality
- **`test-detrack-endpoints-direct.js`** - Direct API calls without middleware
- **`test-detrack-minimal.js`** - Minimal setup for quick testing
- **`test-detrack-real-data.js`** - Testing with actual production data

### **Analytics & Response Analysis**
- **`analyze-detrack-response.js`** - Analyze API response structure and data
- **`test-detrack-analytics-endpoint.js`** - Test analytics-specific endpoints
- **`test-detrack-debug.js`** - Debug specific API issues

### **Endpoint Discovery & Parameters**
- **`test-detrack-endpoint-discovery.js`** - Discover available endpoints
- **`test-detrack-get-params.js`** - Test GET parameter handling
- **`test-detrack-alternatives.js`** - Test alternative endpoint approaches

### **Performance & Optimization**
- **`test-detrack-single-vs-bulk.js`** - Compare single vs bulk operation performance
- **`test-detrack-variations.js`** - Test different parameter variations

### **Integration Testing**
- **`test-fetch-product.js`** - Test product fetching from various sources
- **`test-shopify-product.js`** - Test Shopify product integration
- **`test-tag-filtering.js`** - Test tag filtering functionality
- **`debug-tag-filtering.js`** - Debug tag filtering issues

## 🚀 How to Use Test Files

### **Running Tests**
```bash
# Run a specific test
node tests/simple-detrack-test.js

# Run multiple tests
node tests/test-detrack-endpoints.js && node tests/test-detrack-minimal.js

# Run all tests (if you have a test runner)
npm test
```

### **Test File Structure**
Each test file should follow this structure:
```javascript
// Test file header with description
/**
 * Test: [Test Name]
 * Purpose: [What this test does]
 * Dependencies: [Any required setup]
 * Usage: [How to run this test]
 */

// Configuration
const config = {
  // Test-specific configuration
};

// Test functions
async function testFunction() {
  // Test implementation
}

// Main execution
if (require.main === module) {
  testFunction().catch(console.error);
}
```

## 📋 Test File Naming Convention

### **Format**: `[action]-[target]-[specificity].js`

- **`test-`** - Standard test files
- **`debug-`** - Debugging specific issues
- **`analyze-`** - Analysis and data inspection
- **`simple-`** - Basic/minimal tests

### **Examples**:
- `test-detrack-endpoints.js` - Test Detrack endpoints
- `debug-tag-filtering.js` - Debug tag filtering
- `analyze-detrack-response.js` - Analyze Detrack responses
- `simple-detrack-test.js` - Simple Detrack test

## 🔧 Maintenance Guidelines

### **Adding New Test Files**
1. **Follow naming convention** - Use descriptive names
2. **Add documentation** - Include purpose and usage in file header
3. **Update this document** - Add new file to the directory structure
4. **Test the test** - Ensure it runs without errors

### **Updating Existing Tests**
1. **Preserve functionality** - Don't break existing tests
2. **Update documentation** - Keep file headers current
3. **Version control** - Commit test changes with clear messages

### **Removing Test Files**
1. **Verify obsolescence** - Ensure test is no longer needed
2. **Update documentation** - Remove from this file
3. **Clean commit** - Remove with clear reasoning

## 🎯 Best Practices

### **Test File Organization**
- **Group related tests** - Keep similar tests together
- **Use descriptive names** - Make purpose clear from filename
- **Maintain consistency** - Follow established patterns

### **Test Execution**
- **Run independently** - Each test should be self-contained
- **Handle errors gracefully** - Provide clear error messages
- **Clean up after tests** - Don't leave test data in production

### **Documentation**
- **Keep headers updated** - Maintain current purpose and usage
- **Document dependencies** - List required setup or configuration
- **Provide examples** - Show how to run and interpret results

## 🔍 Troubleshooting

### **Common Issues**
1. **Authentication errors** - Check API keys and credentials
2. **Network timeouts** - Verify connectivity and endpoints
3. **Data format issues** - Validate request/response formats

### **Debug Process**
1. **Check test file** - Verify test logic and configuration
2. **Review logs** - Look for error messages and stack traces
3. **Test manually** - Try API calls directly
4. **Update documentation** - Document any new issues or solutions

## 📚 Related Documentation

- **ARCHITECTURE.md** - System architecture and design
- **DEPLOYMENT_GUIDE.md** - Deployment procedures
- **FIELD_MAPPING_GUIDE.md** - Field mapping configuration
- **README.md** - Project overview and setup

---

*Last updated: 2025-06-20*
*Version: 1.0* 