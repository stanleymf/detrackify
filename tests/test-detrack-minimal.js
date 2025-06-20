// Minimal test of Detrack API with the most basic payload possible
const API_KEY = process.env.DETRACK_API_KEY

async function testDetrackMinimal() {
  console.log('Testing Detrack API with minimal payload...\n')
  
  const testCases = [
    {
      name: 'Test 1: Absolute minimal payload',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-MINIMAL"
          }
        ]
      }
    },
    {
      name: 'Test 2: Minimal with required fields',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-MINIMAL-2",
            "date": "18/06/2025",
            "address": "Test Address"
          }
        ]
      }
    },
    {
      name: 'Test 3: Try different endpoint',
      endpoint: 'https://connect.detrack.com/api/v1/dn/jobs',
      payload: {
        "do": "TEST-V1",
        "date": "18/06/2025",
        "address": "Test Address"
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`${testCase.name}`)
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2))
    
    try {
      const endpoint = testCase.endpoint || 'https://app.detrack.com/api/v2/dn/jobs'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.DETRACK_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      })
      
      console.log('Endpoint:', endpoint)
      console.log('Status:', response.status)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('Response:', responseText)
      
      // Try to parse as JSON
      try {
        const responseJson = JSON.parse(responseText)
        console.log('Parsed JSON:', JSON.stringify(responseJson, null, 2))
      } catch (e) {
        console.log('Response is not JSON')
      }
      
    } catch (error) {
      console.log('Network Error:', error.message)
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
  }
}

testDetrackMinimal() 