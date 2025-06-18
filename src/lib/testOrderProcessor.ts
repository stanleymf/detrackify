import { OrderProcessor, processShopifyOrder } from './orderProcessor'
import type { ShopifyOrder } from '@/types/shopify'
import type { GlobalFieldMapping } from '@/types'

// Sample Shopify order with tags for testing
const sampleShopifyOrder: ShopifyOrder = {
  id: 123456789,
  name: "#1001",
  email: "customer@example.com",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  processed_at: "2024-01-15T10:30:00Z",
  fulfillment_status: "unfulfilled",
  financial_status: "paid",
  total_price: "150.00",
  subtotal_price: "150.00",
  total_tax: "0.00",
  currency: "SGD",
  customer: {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "customer@example.com",
    phone: "+6598765432",
    default_address: {
      first_name: "John",
      last_name: "Doe",
      company: "ABC Company",
      address1: "123 Main Street",
      address2: "Unit 456",
      city: "Singapore",
      province: "Singapore",
      country: "Singapore",
      zip: "123456",
      phone: "+6598765432"
    }
  },
  shipping_address: {
    first_name: "John",
    last_name: "Doe",
    company: "ABC Company",
    address1: "123 Main Street",
    address2: "Unit 456",
    city: "Singapore",
    province: "Singapore",
    country: "Singapore",
    zip: "123456",
    phone: "+6598765432"
  },
  billing_address: {
    first_name: "John",
    last_name: "Doe",
    company: "ABC Company",
    address1: "123 Main Street",
    address2: "Unit 456",
    city: "Singapore",
    province: "Singapore",
    country: "Singapore",
    zip: "123456",
    phone: "+6598765432"
  },
  line_items: [
    {
      id: 1,
      sku: "PROD-001",
      title: "Premium T-Shirt",
      variant_title: "Large / Blue",
      quantity: 2,
      price: "50.00",
      variant_id: 1,
      product_id: 1
    },
    {
      id: 2,
      sku: "PROD-002",
      title: "Designer Jeans",
      variant_title: "32 / Dark Blue",
      quantity: 1,
      price: "50.00",
      variant_id: 2,
      product_id: 2
    }
  ],
  fulfillments: [],
  tags: "delivery_date:20/01/2024, processing_date:18/01/2024, time_window:14:00-18:00, priority:high",
  note: "Please deliver to reception",
  tracking_number: "",
  tracking_company: "",
  tracking_url: ""
}

// Sample global field mappings
const sampleGlobalMappings: GlobalFieldMapping[] = [
  {
    dashboardField: "deliveryOrderNo",
    shopifyFields: ["order.name"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "firstName",
    shopifyFields: ["shipping_address.first_name"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "lastName",
    shopifyFields: ["shipping_address.last_name"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "address",
    shopifyFields: ["shipping_address.address1", "shipping_address.address2", "shipping_address.city"],
    separator: ", ",
    noMapping: false
  },
  {
    dashboardField: "companyName",
    shopifyFields: ["shipping_address.company"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "postalCode",
    shopifyFields: ["shipping_address.zip"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "recipientPhoneNo",
    shopifyFields: ["shipping_address.phone"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "instructions",
    shopifyFields: ["order.note"],
    separator: "",
    noMapping: false
  },
  {
    dashboardField: "sku",
    shopifyFields: ["line_items.sku"],
    separator: ", ",
    noMapping: false
  },
  {
    dashboardField: "qty",
    shopifyFields: ["line_items.quantity"],
    separator: ", ",
    noMapping: false
  }
]

export function testOrderProcessing() {
  console.log("=== Testing Order Processing ===")
  
  // Test individual field processing
  const processor = new OrderProcessor(sampleShopifyOrder)
  
  console.log("\n--- Extract Processing Fields ---")
  console.log("Delivery Date:", processor.processField('deliveryDate'))
  console.log("Processing Date:", processor.processField('processingDate'))
  console.log("Job Release Time:", processor.processField('jobReleaseTime'))
  console.log("Delivery Completion Time Window:", processor.processField('deliveryCompletionTimeWindow'))
  console.log("Description:", processor.processField('description'))
  console.log("Item Count:", processor.processField('itemCount'))
  
  console.log("\n--- All Processed Fields ---")
  const processedFields = processor.getAllProcessedFields()
  Object.entries(processedFields).forEach(([field, value]) => {
    console.log(`${field}: ${value}`)
  })
  
  console.log("\n--- Complete Order Processing ---")
  const result = processShopifyOrder(sampleShopifyOrder, sampleGlobalMappings, [])
  
  console.log("Processed Order Data:")
  Object.entries(result).forEach(([field, value]) => {
    console.log(`${field}: ${value}`)
  })
  
  return result
}

// Example usage in webhook handler
export function handleShopifyWebhook(shopifyOrder: ShopifyOrder, storeMappings: GlobalFieldMapping[]) {
  console.log("Processing webhook for order:", shopifyOrder.name)
  
  // Process the order with the store's field mappings
  const processedOrder = processShopifyOrder(shopifyOrder, storeMappings, [])
  
  // Add status and other metadata
  const finalOrder = {
    ...processedOrder,
    status: "Ready for Export" as const,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  }
  
  console.log("Processed order ready for dashboard:", finalOrder)
  return finalOrder
} 