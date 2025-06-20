// Test script to try different Detrack API endpoints and payloads
const API_BASE_URL = 'https://detrackify.stanleytan92.workers.dev'

async function testDifferentEndpoints() {
  console.log('Testing different Detrack API variations...\n')
  
  const testCases = [
    {
      name: 'Test 1: Current payload with v2 endpoint',
      endpoint: '/api/detrack/test',
      description: 'Current implementation'
    },
    {
      name: 'Test 2: Try without items array',
      endpoint: '/api/detrack/test-simple',
      description: 'Minimal payload without items'
    },
    {
      name: 'Test 3: Try with different date format',
      endpoint: '/api/detrack/test-date',
      description: 'YYYY-MM-DD format instead of DD/MM/YYYY'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`${testCase.name}`)
    console.log(`Description: ${testCase.description}`)
    
    try {
      const response = await fetch(`${API_BASE_URL}${testCase.endpoint}`, {
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
  }
}

testDifferentEndpoints() 