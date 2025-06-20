// Analyze the successful Detrack GET response to understand the correct structure
const API_KEY = process.env.DETRACK_API_KEY

async function analyzeDetrackResponse() {
  console.log('Analyzing successful Detrack GET response...\n')
  
  try {
    const response = await fetch('https://app.detrack.com/api/v2/dn/jobs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.DETRACK_API_KEY,
        'Accept': 'application/json'
      }
    })
    
    console.log('Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      
      // Analyze the structure of the first job
      if (data && data.length > 0) {
        const firstJob = data[0]
        console.log('✅ SUCCESS: Found', data.length, 'jobs')
        console.log('\n📋 First Job Structure Analysis:')
        console.log('================================')
        
        // Key fields that might be required for POST
        const keyFields = [
          'type', 'do_number', 'date', 'address', 'deliver_to_collect_from', 
          'phone_number', 'order_number', 'items', 'status', 'group_name'
        ]
        
        keyFields.forEach(field => {
          if (firstJob[field] !== undefined) {
            console.log(`${field}:`, JSON.stringify(firstJob[field]))
          } else {
            console.log(`${field}:`, 'undefined')
          }
        })
        
        console.log('\n📦 Items Structure:')
        if (firstJob.items && firstJob.items.length > 0) {
          console.log('First item:', JSON.stringify(firstJob.items[0], null, 2))
        }
        
        console.log('\n🔍 Full Job Structure (first 10 fields):')
        const fields = Object.keys(firstJob).slice(0, 10)
        fields.forEach(field => {
          console.log(`${field}:`, typeof firstJob[field], '=', JSON.stringify(firstJob[field]).substring(0, 100))
        })
        
        // Create a minimal POST payload based on the GET response
        console.log('\n📝 Suggested POST Payload:')
        const suggestedPayload = {
          "data": [
            {
              "type": firstJob.type || "Delivery",
              "do_number": "TEST-ANALYSIS",
              "date": firstJob.date || "2025-06-19",
              "address": firstJob.address || "Test Address",
              "deliver_to_collect_from": firstJob.deliver_to_collect_from || "Test Recipient",
              "phone_number": firstJob.phone_number || "12345678",
              "order_number": "TEST-ANALYSIS",
              "group_name": firstJob.group_name || "TEST",
              "items": [
                {
                  "description": "Test Item",
                  "quantity": 1
                }
              ]
            }
          ]
        }
        
        console.log(JSON.stringify(suggestedPayload, null, 2))
        
      } else {
        console.log('❌ No jobs found in response')
      }
    } else {
      console.log('❌ GET request failed:', response.status)
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

analyzeDetrackResponse() 