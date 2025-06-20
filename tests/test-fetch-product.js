// Test script to fetch "Heartfelt Condolences" product and display its tags
const fetchProduct = async () => {
  try {
    // First, let's get the store ID for windflowerflorist.myshopify.com
    console.log('🔍 Fetching store information...');
    
    const storesResponse = await fetch('https://detrackify.stanleytan92.workers.dev/api/stores', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!storesResponse.ok) {
      throw new Error(`Failed to fetch stores: ${storesResponse.status}`);
    }
    
    const storesData = await storesResponse.json();
    const store = storesData.stores.find(s => s.shopify_domain === 'windflowerflorist.myshopify.com');
    
    if (!store) {
      throw new Error('Store windflowerflorist.myshopify.com not found');
    }
    
    console.log(`✅ Found store: ${store.shopify_domain} (ID: ${store.id})`);
    
    // Now fetch products with a title filter for "Heartfelt Condolences"
    console.log('\n🔍 Fetching products with title filter "Heartfelt Condolences"...');
    
    const productsResponse = await fetch('https://detrackify.stanleytan92.workers.dev/api/stores/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        storeId: store.id,
        titles: ['Heartfelt Condolences']
      })
    });
    
    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status}`);
    }
    
    const productsData = await productsResponse.json();
    
    if (!productsData.products || productsData.products.length === 0) {
      console.log('❌ No products found with title "Heartfelt Condolences"');
      return;
    }
    
    console.log(`✅ Found ${productsData.products.length} product(s):`);
    
    productsData.products.forEach((product, index) => {
      console.log(`\n📦 Product ${index + 1}:`);
      console.log(`   Title: ${product.title}`);
      console.log(`   Variant: ${product.variantTitle || 'Default'}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   Tags: ${product.tags.join(', ')}`);
      console.log(`   Order Tags: ${product.orderTags.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
fetchProduct(); 