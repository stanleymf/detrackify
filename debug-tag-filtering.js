// Debug script to test tag filtering logic
console.log('🔍 Debugging Tag Filtering Issues\n');

// Test cases with different tag formats
const testCases = [
  {
    name: 'Exact match - single tag',
    productTags: 'Condolences Stand',
    inputTag: 'Condolences Stand',
    expected: true
  },
  {
    name: 'Exact match - multiple tags',
    productTags: 'Condolences Stand, Express Delivery, Priority',
    inputTag: 'Condolences Stand',
    expected: true
  },
  {
    name: 'Case sensitivity test',
    productTags: 'condolences stand',
    inputTag: 'Condolences Stand',
    expected: true
  },
  {
    name: 'Extra spaces test',
    productTags: '  Condolences Stand  , Express Delivery',
    inputTag: 'Condolences Stand',
    expected: true
  },
  {
    name: 'Partial match test',
    productTags: 'Condolences Stand',
    inputTag: 'Condolences',
    expected: true
  },
  {
    name: 'No match test',
    productTags: 'Express Delivery, Priority',
    inputTag: 'Condolences Stand',
    expected: false
  }
];

// Current logic from the worker
function testTagFiltering(productTags, inputTags) {
  console.log(`\n📋 Testing: Product Tags: "${productTags}"`);
  console.log(`📋 Input Tags: [${inputTags.map(t => `"${t}"`).join(', ')}]`);
  
  // Simulate the current logic from worker/index.ts
  const productTagsArray = productTags.split(',').map((t) => t.trim().toLowerCase());
  const inputTagsArray = inputTags.map((tag) => tag.trim().toLowerCase());
  
  console.log(`🔧 After splitting and trimming:`);
  console.log(`   Product tags: [${productTagsArray.map(t => `"${t}"`).join(', ')}]`);
  console.log(`   Input tags: [${inputTagsArray.map(t => `"${t}"`).join(', ')}]`);
  
  // Match if any input tag is a substring of any product tag
  const hasMatchingTag = inputTagsArray.some(inputTag =>
    productTagsArray.some(productTag => productTag.includes(inputTag))
  );
  
  console.log(`✅ Has matching tag: ${hasMatchingTag}`);
  return hasMatchingTag;
}

// Test the current logic
console.log('🧪 Testing Current Logic:\n');
testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
  const result = testTagFiltering(testCase.productTags, [testCase.inputTag]);
  console.log(`Expected: ${testCase.expected}, Actual: ${result}`);
  if (result !== testCase.expected) {
    console.log(`❌ FAILED: Expected ${testCase.expected} but got ${result}`);
  } else {
    console.log(`✅ PASSED`);
  }
});

// Test alternative splitting methods
console.log('\n\n🔧 Testing Alternative Splitting Methods:\n');

function testAlternativeSplitting(productTags, inputTags) {
  console.log(`\n📋 Testing with alternative splitting: "${productTags}"`);
  
  // Method 1: Split by ', ' (with space) - used in transformation
  const method1 = productTags.split(', ').map((t) => t.trim().toLowerCase());
  console.log(`Method 1 (split by ', '): [${method1.map(t => `"${t}"`).join(', ')}]`);
  
  // Method 2: Split by ',' (without space) - used in filtering
  const method2 = productTags.split(',').map((t) => t.trim().toLowerCase());
  console.log(`Method 2 (split by ','): [${method2.map(t => `"${t}"`).join(', ')}]`);
  
  // Method 3: Split by both and combine
  const method3 = productTags.split(/[,\s]+/).filter(t => t.trim()).map((t) => t.trim().toLowerCase());
  console.log(`Method 3 (split by regex): [${method3.map(t => `"${t}"`).join(', ')}]`);
  
  return { method1, method2, method3 };
}

// Test with a real-world example
const realExample = 'Condolences Stand, Express Delivery, Priority';
testAlternativeSplitting(realExample, ['Condolences Stand']);

console.log('\n\n💡 Recommendations:');
console.log('1. Check if Shopify returns tags with different separators');
console.log('2. Verify the exact format of tags in the API response');
console.log('3. Consider using a more robust splitting method');
console.log('4. Add more detailed logging to see the actual API response'); 