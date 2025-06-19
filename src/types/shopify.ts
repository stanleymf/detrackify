export interface ShopifyWebhook {
  id: string
  topic: string
  address: string
  format: 'json' | 'xml'
  created_at: string
  updated_at: string
  api_version: string
}

export interface ShopifyOrder {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
  processed_at: string
  fulfillment_status: 'fulfilled' | 'partial' | 'unfulfilled' | null
  financial_status: 'authorized' | 'paid' | 'partially_paid' | 'partially_refunded' | 'pending' | 'refunded' | 'voided'
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  customer: ShopifyCustomer
  shipping_address: ShopifyAddress
  billing_address: ShopifyAddress
  line_items: ShopifyLineItem[]
  fulfillments: ShopifyFulfillment[]
  tags: string
  note: string
  tracking_number: string
  tracking_company: string
  tracking_url: string
}

export interface ShopifyCustomer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  default_address: ShopifyAddress
}

export interface ShopifyAddress {
  first_name: string
  last_name: string
  company: string
  address1: string
  address2: string
  city: string
  province: string
  country: string
  zip: string
  phone: string
}

export interface ShopifyLineItem {
  id: number
  sku: string
  title: string
  variant_title: string
  quantity: number
  price: string
  variant_id: number
  product_id: number
  current_quantity?: number
  fulfillable_quantity?: number
  fulfillment_status?: string | null
}

export interface ShopifyFulfillment {
  id: number
  order_id: number
  status: 'open' | 'in_progress' | 'success' | 'cancelled' | 'error' | 'failure'
  created_at: string
  updated_at: string
  tracking_number: string
  tracking_company: string
  tracking_url: string
  line_items: ShopifyLineItem[]
}

export interface ShopifyStore {
  id: string
  shopify_domain: string
  access_token: string
  api_version: string
  webhook_secret: string
  created_at: string
  updated_at: string
}

export interface WebhookEvent {
  id: string
  topic: string
  shop_domain: string
  data: ShopifyOrder
  created_at: string
}

export type WebhookTopic = 
  | 'orders/create'
  | 'orders/updated'
  | 'orders/fulfilled'
  | 'orders/cancelled'
  | 'fulfillments/create'
  | 'fulfillments/update' 