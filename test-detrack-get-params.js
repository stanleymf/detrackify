// Test different GET request parameters for Detrack API
const API_KEY = '7d5c8ef661165fb1e7cd33edb47b6ef8caa97b54a990cdf4'

async function testDetrackGetParams() {
  console.log('Testing different GET request parameters...\n')
  
  const testCases = [
    {
      name: 'Test 1: Basic GET without params',
      url: 'https://app.detrack.com/api/v2/dn/jobs'
    },
    {
      name: 'Test 2: GET with date filter (today)',
      url: 'https://app.detrack.com/api/v2/dn/jobs?date=2025-06-19'
    },
    {
      name: 'Test 3: GET with status filter',
      url: 'https://app.detrack.com/api/v2/dn/jobs?status=dispatched'
    },
    {
      name: 'Test 4: GET with limit',
      url: 'https://app.detrack.com/api/v2/dn/jobs?limit=10'
    },
    {
      name: 'Test 5: GET with group filter',
      url: 'https://app.detrack.com/api/v2/dn/jobs?group_name=WF'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`${testCase.name}`)
    console.log('URL:', testCase.url)
    
    try {
      const response = await fetch(testCase.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      })
      
      console.log('Status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response length:', Array.isArray(data) ? data.length : 'Not an array')
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('✅ Found jobs! First job DO number:', data[0].do_number)
          console.log('First job structure keys:', Object.keys(data[0]).slice(0, 10))
        } else {
          console.log('Response:', JSON.stringify(data).substring(0, 200))
        }
      } else {
        const errorText = await response.text()
        console.log('Error response:', errorText)
      }
      
    } catch (error) {
      console.log('Network Error:', error.message)
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
  }
}

testDetrackGetParams() 