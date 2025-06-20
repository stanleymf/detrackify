// Test script to fetch "Heartfelt Condolences" product directly from Shopify API
const fetchProductFromShopify = async () => {
  try {
    // We need the store's access token to make direct Shopify API calls
    // For now, let's create a test that shows the expected API call structure
    
    console.log('🔍 Testing product fetch for "Heartfelt Condolences"');
    console.log('\n📋 Expected API Call Structure:');
    console.log('URL: https://windflowerflorist.myshopify.com/admin/api/2024-01/products.json');
    console.log('Method: GET');
    console.log('Headers: {');
    console.log('  "X-Shopify-Access-Token": "[STORE_ACCESS_TOKEN]",');
    console.log('  "Content-Type": "application/json"');
    console.log('}');
    console.log('Query Params: ?fields=id,title,handle,tags,variants,created_at,updated_at');
    
    console.log('\n🔍 To get the actual product data, you would need:');
    console.log('1. The store access token for windflowerflorist.myshopify.com');
    console.log('2. Make a GET request to the Shopify Admin API');
    console.log('3. Filter the results for products with title containing "Heartfelt Condolences"');
    
    console.log('\n📦 Expected Product Structure:');
    console.log('{');
    console.log('  "id": 123456789,');
    console.log('  "title": "Heartfelt Condolences",');
    console.log('  "handle": "heartfelt-condolences",');
    console.log('  "tags": "condolences, sympathy, flowers, stand",');
    console.log('  "variants": [');
    console.log('    {');
    console.log('      "id": 987654321,');
    console.log('      "title": "Default Title",');
    console.log('      "price": "88.00"');
    console.log('    }');
    console.log('  ]');
    console.log('}');
    
    console.log('\n💡 To test this through the Detrackify app:');
    console.log('1. Go to https://detrackify.stanleytan92.workers.dev');
    console.log('2. Navigate to the Info page');
    console.log('3. Select the windflowerflorist.myshopify.com store');
    console.log('4. In the Product Filter field, enter: "Heartfelt Condolences"');
    console.log('5. Click "Fetch"');
    console.log('6. The product should appear with its tags displayed');
    
    console.log('\n🎯 Alternative: Test with tag filter');
    console.log('If the product has tags like "condolences" or "sympathy",');
    console.log('you can also try filtering by those tags in the Product Filter field.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
fetchProductFromShopify(); 