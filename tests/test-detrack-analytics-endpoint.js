// Test the updated Detrack Analytics API endpoint
const API_BASE_URL = 'https://detrackify.stanleytan92.workers.dev'

async function testAnalyticsEndpoint() {
  console.log('Testing updated Detrack Analytics API endpoint...\n')
  
  try {
    // Test the new endpoint format without date parameter
    const response = await fetch(`${API_BASE_URL}/api/detrack/jobs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ SUCCESS: Analytics endpoint working!')
      console.log('Response:', JSON.stringify(data, null, 2))
      
      if (data.jobs && Array.isArray(data.jobs)) {
        console.log(`Found ${data.jobs.length} jobs`)
        if (data.jobs.length > 0) {
          console.log('Sample job:', JSON.stringify(data.jobs[0], null, 2))
        }
      }
    } else {
      const errorText = await response.text()
      console.log('❌ FAILED:', response.status, errorText)
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message)
  }
}

testAnalyticsEndpoint() 