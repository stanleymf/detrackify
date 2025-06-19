// Simple direct test of Detrack API
const API_KEY = '7d5c8ef661165fb1e7cd33edb47b6ef8caa97b54a990cdf4'

async function testDetrackDirectly() {
  console.log('Testing Detrack API directly...\n')
  
  const testCases = [
    {
      name: 'Test 1: Minimal payload',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-001",
            "date": "18/06/2025",
            "address": "Test Address",
            "deliver_to_collect_from": "Test Recipient",
            "phone_number": "12345678"
          }
        ]
      }
    },
    {
      name: 'Test 2: With items array',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-002",
            "date": "18/06/2025",
            "address": "Test Address",
            "deliver_to_collect_from": "Test Recipient",
            "phone_number": "12345678",
            "items": [
              {
                "description": "Test Item",
                "quantity": 1
              }
            ]
          }
        ]
      }
    },
    {
      name: 'Test 3: Different date format',
      payload: {
        "data": [
          {
            "type": "Delivery",
            "do_number": "TEST-003",
            "date": "2025-06-18",
            "address": "Test Address",
            "deliver_to_collect_from": "Test Recipient",
            "phone_number": "12345678"
          }
        ]
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`${testCase.name}`)
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2))
    
    try {
      const response = await fetch('https://app.detrack.com/api/v2/dn/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      })
      
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

testDetrackDirectly() 