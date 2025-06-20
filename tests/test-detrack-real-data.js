// Test Detrack API with real order data from dashboard
const API_KEY = process.env.DETRACK_API_KEY

async function testDetrackWithRealData() {
  console.log('Testing Detrack API with real order data...\n')
  
  // Real order data based on dashboard structure
  const realOrderData = {
    deliveryOrderNo: "#76382",
    deliveryDate: "19/06/2025",
    processingDate: "18/06/2025", 
    jobReleaseTime: "8:45am",
    deliveryCompletionTimeWindow: "Morning",
    trackingNo: "TRK76382",
    senderNumberOnApp: "91234567",
    deliverySequence: "1",
    address: "123 Orchard Road, #12-34, Singapore 238858",
    companyName: "Test Company Pte Ltd",
    postalCode: "238858",
    firstName: "John",
    lastName: "Doe",
    recipientPhoneNo: "98765432",
    senderPhoneNo: "91234567",
    instructions: "Please call before delivery",
    assignTo: "Driver A",
    emailsForNotifications: "john.doe@email.com",
    zone: "Central",
    accountNo: "ACC76382",
    deliveryJobOwner: "Logistics Team",
    senderNameOnApp: "Test Company",
    group: "WF",
    noOfShippingLabels: "2",
    attachmentUrl: "",
    status: "Ready for Export",
    podAt: "",
    remarks: "",
    itemCount: "3",
    serviceTime: "30 mins",
    sku: "FLOWER-001",
    description: "Premium Flower Bouquet - Red Roses",
    qty: "1"
  }
  
  console.log('📋 Real Order Data:')
  console.log('===================')
  console.log('Delivery Order No:', realOrderData.deliveryOrderNo)
  console.log('Customer:', `${realOrderData.firstName} ${realOrderData.lastName}`)
  console.log('Address:', realOrderData.address)
  console.log('Phone:', realOrderData.recipientPhoneNo)
  console.log('Date:', realOrderData.deliveryDate)
  console.log('Description:', realOrderData.description)
  console.log('Group:', realOrderData.group)
  
  // Convert to Detrack format using the same logic as the app
  const convertToDetrackFormat = (orderData) => {
    const getField = (field, defaultValue = '') => {
      const value = orderData[field]
      return value && value.toString().trim() !== '' ? value.toString().trim() : defaultValue
    }
    
    const cleanPhoneNumber = (phone) => {
      if (!phone) return ''
      return phone.replace(/^\+65/, '').replace(/^65/, '')
    }
    
    const getDeliveryDate = () => {
      const deliveryDate = getField('deliveryDate')
      if (deliveryDate) {
        if (deliveryDate.includes('/')) {
          const parts = deliveryDate.split('/')
          if (parts.length === 3) {
            return deliveryDate
          }
        }
        if (deliveryDate.includes('-') && deliveryDate.length === 10) {
          const parts = deliveryDate.split('-')
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`
          }
        }
        return deliveryDate
      }
      const today = new Date()
      return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
    }
    
    const payload = {
      "data": [
        {
          "type": "Delivery",
          "do_number": getField('deliveryOrderNo', '').replace('#', ''),
          "date": getDeliveryDate(),
          "tracking_number": getField('trackingNo', 'T0'),
          "order_number": getField('deliveryOrderNo', '').replace('#', ''),
          "address": getField('address', ''),
          "deliver_to_collect_from": `${getField('firstName', '')} ${getField('lastName', '')}`.trim(),
          "phone_number": cleanPhoneNumber(getField('recipientPhoneNo', '')),
          "notify_email": getField('emailsForNotifications', ''),
          "group_name": getField('group', ''),
          "items": [
            {
              "sku": getField('sku', ''),
              "description": getField('description', ''),
              "quantity": parseInt(getField('qty', '1'))
            }
          ]
        }
      ]
    }
    
    return payload
  }
  
  const detrackPayload = convertToDetrackFormat(realOrderData)
  
  console.log('\n📦 Detrack Payload:')
  console.log('==================')
  console.log(JSON.stringify(detrackPayload, null, 2))
  
  // Test with Detrack API
  console.log('\n🚀 Testing with Detrack API...')
  console.log('API Key:', API_KEY)
  
  try {
    const response = await fetch('https://app.detrack.com/api/v2/dn/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.DETRACK_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(detrackPayload)
    })
    
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response:', responseText)
    
    if (response.ok) {
      console.log('✅ SUCCESS: Order created in Detrack!')
    } else {
      console.log('❌ FAILED: Could not create order in Detrack')
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(responseText)
        console.log('Error details:', JSON.stringify(errorJson, null, 2))
      } catch (e) {
        console.log('Error response is not JSON')
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message)
  }
}

testDetrackWithRealData() 