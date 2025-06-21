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
  note_attributes?: ShopifyNoteAttribute[]
}

export interface ShopifyCustomer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  default_address: ShopifyAddress
  price: string
  variant_id: number
  product_id: number
  current_quantity?: number
  fulfillable_quantity?: number
  fulfillment_status?: string | null
  properties?: ShopifyProperty[]
  _properties?: ShopifyProperty[]
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
  properties?: ShopifyProperty[]
  _properties?: ShopifyProperty[]
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

export interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string
  vendor: string
  product_type: string
  created_at: string
  updated_at: string
  published_at: string
  template_suffix: string
  status: string
  published_scope: string
  tags: string
  admin_graphql_api_id: string
  variants: ShopifyProductVariant[]
  options: ShopifyProductOption[]
  images: ShopifyProductImage[]
  image: ShopifyProductImage | null
}

export interface ShopifyProductVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  position: number
  inventory_policy: string
  compare_at_price: string
  fulfillment_service: string
  inventory_management: string
  option1: string
  option2: string | null
  option3: string | null
  created_at: string
  updated_at: string
  taxable: boolean
  barcode: string
  grams: number
  image_id: number | null
  weight: number
  weight_unit: string
  inventory_item_id: number
  inventory_quantity: number
  old_inventory_quantity: number
  requires_shipping: boolean
  admin_graphql_api_id: string
}

export interface ShopifyProductOption {
  id: number
  product_id: number
  name: string
  position: number
  values: string[]
}

export interface ShopifyProductImage {
  id: number
  product_id: number
  position: number
  created_at: string
  updated_at: string
  alt: string | null
  width: number
  height: number
  src: string
  variant_ids: number[]
  admin_graphql_api_id: string
}

export interface ShopifyNoteAttribute {
  name: string
  value: string
}

export interface ShopifyProperty {
  name: string
  value: any
} 