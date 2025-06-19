// Test script to try different Detrack API endpoints
const API_BASE_URL = 'https://detrackify.stanleytan92.workers.dev'

async function testAlternativeEndpoints() {
  console.log('Testing alternative Detrack API endpoints...\n')
  
  // Test 1: Try the v1 endpoint to see if it works
  console.log('Test 1: Try v1 endpoint')
  try {
    const response = await fetch(`${API_BASE_URL}/api/detrack/test-v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    console.log('Status:', response.status)
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 2: Try a different v2 endpoint
  console.log('Test 2: Try different v2 endpoint')
  try {
    const response = await fetch(`${API_BASE_URL}/api/detrack/test-v2-alt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    console.log('Status:', response.status)
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 3: Try with different authentication method
  console.log('Test 3: Try with different auth method')
  try {
    const response = await fetch(`${API_BASE_URL}/api/detrack/test-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    console.log('Status:', response.status)
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error:', error.message)
  }
}

testAlternativeEndpoints() 