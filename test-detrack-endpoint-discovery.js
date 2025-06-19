// Test both Detrack endpoints (cloud and connect) for GET and POST
const API_KEY = '7d5c8ef661165fb1e7cd33edb47b6ef8caa97b54a990cdf4'

const endpoints = [
  {
    name: 'Detrack Cloud v2',
    base: 'https://app.detrack.com/api/v2/dn/jobs',
    version: 'v2'
  },
  {
    name: 'Detrack Connect v2',
    base: 'https://connect.detrack.com/api/v2/dn/jobs',
    version: 'v2'
  },
  {
    name: 'Detrack Connect v1',
    base: 'https://connect.detrack.com/api/v1/dn/jobs',
    version: 'v1'
  }
]

const testPayload = {
  data: [
    {
      type: 'Delivery',
      do_number: '76382-TEST',
      date: '19/06/2025',
      address: '123 Orchard Road, #12-34, Singapore 238858',
      deliver_to_collect_from: 'John Doe',
      phone_number: '98765432',
      order_number: '76382-TEST',
      items: [
        {
          description: 'Test Item',
          quantity: 1
        }
      ]
    }
  ]
}

async function testEndpoints() {
  for (const endpoint of endpoints) {
    console.log(`\n=== Testing ${endpoint.name} (${endpoint.base}) ===`)
    // Test GET
    try {
      const getResp = await fetch(endpoint.base, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      })
      console.log(`GET status: ${getResp.status}`)
      const getText = await getResp.text()
      console.log('GET response:', getText.substring(0, 300))
    } catch (e) {
      console.log('GET error:', e.message)
    }
    // Test POST
    try {
      const postResp = await fetch(endpoint.base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(testPayload)
      })
      console.log(`POST status: ${postResp.status}`)
      const postText = await postResp.text()
      console.log('POST response:', postText.substring(0, 300))
    } catch (e) {
      console.log('POST error:', e.message)
    }
    console.log('---------------------------------------------')
  }
}

testEndpoints() 