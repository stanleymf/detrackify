// Test both single and bulk job creation endpoints for Detrack
const API_KEY = process.env.DETRACK_API_KEY

const singleJobPayload = {
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

const bulkJobPayload = {
  data: [singleJobPayload]
}

async function testSingleAndBulk() {
  // Single job creation
  console.log('\n=== Testing Single Job Creation ===')
  try {
    const resp = await fetch('https://app.detrack.com/api/v2/dn/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.DETRACK_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(singleJobPayload)
    })
    console.log('Single POST status:', resp.status)
    const text = await resp.text()
    console.log('Single POST response:', text)
  } catch (e) {
    console.log('Single POST error:', e.message)
  }

  // Bulk job creation
  console.log('\n=== Testing Bulk Job Creation ===')
  console.log('Bulk payload sent:', JSON.stringify(bulkJobPayload, null, 2))
  try {
    const resp = await fetch('https://app.detrack.com/api/v2/dn/jobs/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.DETRACK_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(bulkJobPayload)
    })
    console.log('Bulk POST status:', resp.status)
    const text = await resp.text()
    console.log('Bulk POST response:', text)
  } catch (e) {
    console.log('Bulk POST error:', e.message)
  }
}

testSingleAndBulk() 