// Test script to debug tag filtering issue
const testTagFiltering = async () => {
  try {
    console.log('🔍 Testing Tag Filtering with Detrackify API\n');
    
    // Test data - replace with your actual store ID
    const testData = {
      storeId: 'your-store-id-here', // Replace with actual store ID
      tags: ['Condolences Stand'], // The exact tag you're trying to filter by
      titles: []
    };
    
    console.log('📋 Test Data:', JSON.stringify(testData, null, 2));
    console.log('\n🌐 Making API call to: https://detrackify.stanleytan92.workers.dev/api/stores/products');
    
    const response = await fetch('https://detrackify.stanleytan92.workers.dev/api/stores/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ Success Response:');
    console.log('Number of products found:', result.products?.length || 0);
    
    if (result.products && result.products.length > 0) {
      console.log('\n📦 Sample Products:');
      result.products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Tags: [${product.tags.join(', ')}]`);
        console.log(`  Price: $${product.price}`);
      });
    } else {
      console.log('\n❌ No products found with the specified tag filter');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Instructions for use
console.log('📝 Instructions:');
console.log('1. Replace "your-store-id-here" with your actual store ID');
console.log('2. Make sure you\'re logged into the Detrackify app');
console.log('3. Run this script to test the tag filtering');
console.log('4. Check the browser console for detailed debug logs\n');

// Uncomment the line below to run the test
// testTagFiltering(); 