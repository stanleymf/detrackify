// Test different Detrack API endpoints directly
const API_KEY = '7d5c8ef661165fb1e7cd33edb47b6ef8caa97b54a990cdf4'

async function testDetrackEndpoints() {
  console.log('Testing different Detrack API endpoints...\n')
  
  const endpoints = [
    {
      name: 'Test 1: Jobs endpoint (current)',
      url: 'https://app.detrack.com/api/v2/dn/jobs',
      method: 'POST',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-ENDPOINT"
          }
        ]
      }
    },
    {
      name: 'Test 2: Try GET request to jobs',
      url: 'https://app.detrack.com/api/v2/dn/jobs',
      method: 'GET'
    },
    {
      name: 'Test 3: Try different v2 endpoint',
      url: 'https://app.detrack.com/api/v2/deliveries',
      method: 'POST',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-DELIVERIES"
          }
        ]
      }
    },
    {
      name: 'Test 4: Try API status endpoint',
      url: 'https://app.detrack.com/api/v2/status',
      method: 'GET'
    }
  ]
  
  for (const endpoint of endpoints) {
    console.log(`${endpoint.name}`)
    console.log('URL:', endpoint.url)
    console.log('Method:', endpoint.method)
    
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      }
      
      if (endpoint.payload) {
        options.body = JSON.stringify(endpoint.payload)
        console.log('Payload:', JSON.stringify(endpoint.payload, null, 2))
      }
      
      const response = await fetch(endpoint.url, options)
      
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

testDetrackEndpoints() 