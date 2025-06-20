// Debug script to test different Detrack API payload variations
const API_BASE_URL = 'https://detrackify.stanleytan92.workers.dev'

async function testDetrackDebug() {
  console.log('Testing different Detrack API payload variations...\n')
  
  const testCases = [
    {
      name: 'Test 1: Current payload with DD/MM/YYYY date',
      endpoint: '/api/detrack/test',
      description: 'Current implementation with DD/MM/YYYY date format'
    },
    {
      name: 'Test 2: Try with YYYY-MM-DD date format',
      endpoint: '/api/detrack/test-date',
      description: 'Using YYYY-MM-DD date format'
    },
    {
      name: 'Test 3: Try minimal payload without items',
      endpoint: '/api/detrack/test-simple',
      description: 'Minimal payload without items array'
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

testDetrackDebug() 