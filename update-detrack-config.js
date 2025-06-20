// Script to update Detrack configuration to use the correct v2 endpoint
const API_BASE_URL = 'https://detrackify.stanleytan92.workers.dev'

async function updateDetrackConfig() {
  try {
    console.log('Updating Detrack configuration to use v2 endpoint...')
    
    // Update the configuration with the correct v2 endpoint
    const response = await fetch(`${API_BASE_URL}/api/detrack/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: 'process.env.DETRACK_API_KEY', // Your correct API key
        baseUrl: 'https://app.detrack.com/api/v2', // Correct v2 endpoint
        isEnabled: true
      })
    })
    
    if (response.ok) {
      console.log('✅ Detrack configuration updated successfully!')
      
      // Test the connection
      console.log('Testing Detrack connection...')
      const testResponse = await fetch(`${API_BASE_URL}/api/detrack/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (testResponse.ok) {
        console.log('✅ Detrack connection test successful!')
      } else {
        const errorData = await testResponse.json()
        console.log('❌ Detrack connection test failed:', errorData.error)
      }
    } else {
      console.log('❌ Failed to update Detrack configuration:', response.status)
    }
  } catch (error) {
    console.error('❌ Error updating Detrack configuration:', error)
  }
}

// Run the update
updateDetrackConfig() 