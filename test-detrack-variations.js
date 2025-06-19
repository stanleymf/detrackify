// Test script to try different variations of the Detrack API
const API_BASE_URL = 'https://detrackify.stanleytan92.workers.dev'

async function testDetrackVariations() {
  console.log('Testing different Detrack API variations...\n')
  
  // Test 1: Current implementation
  console.log('Test 1: Current implementation')
  try {
    const response = await fetch(`${API_BASE_URL}/api/detrack/test`, {
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
  
  // Test 2: Try with different API key format
  console.log('Test 2: Testing with different API key')
  try {
    const response = await fetch(`${API_BASE_URL}/api/detrack/update-key`, {
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
  
  // Test 3: Check current config
  console.log('Test 3: Current Detrack configuration')
  try {
    const response = await fetch(`${API_BASE_URL}/api/detrack/config`, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    console.log('Status:', response.status)
    console.log('Config:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('Error:', error.message)
  }
}

testDetrackVariations() 