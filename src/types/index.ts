export interface Order {
  id: string
  deliveryOrderNo: string
  deliveryDate: string
  processingDate: string
  jobReleaseTime: string
  deliveryCompletionTimeWindow: string
  trackingNo: string
  senderNumberOnApp: string
  deliverySequence: string
  address: string
  companyName: string
  postalCode: string
  firstName: string
  lastName: string
  recipientPhoneNo: string
  senderPhoneNo: string
  instructions: string
  assignTo: string
  emailsForNotifications: string
  zone: string
  accountNo: string
  deliveryJobOwner: string
  senderNameOnApp: string
  group: string
  noOfShippingLabels: string
  attachmentUrl: string
  status: "Ready for Export" | "Exported" | "Error"
  podAt: string
  remarks: string
  itemCount: string
  serviceTime: string
  sku: string
  description: string
  qty: string
}

// Database Order interface - matches the actual database schema
export interface DatabaseOrder {
  id: string
  store_id: string
  shopify_order_id: number
  shopify_order_name: string
  status: string
  processed_data: string // JSON string of processed order data
  raw_shopify_data: string // JSON string of original Shopify data
  created_at: string
  updated_at: string
  exported_at: string | null
}

// Store interface - matches the database schema
export interface Store {
  id: string
  shopify_domain: string
  access_token: string
  api_version: string
  webhook_secret: string | null
  api_secret: string | null
  store_name: string | null
  created_at: string
  updated_at: string
}

// User interface - matches the database schema
export interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface ShopifyStore {
  id: string
  name: string
  url: string
  apiKey: string
  connected: boolean
}

// Global Field Mapping - maps multiple Shopify fields to one Dashboard field
export interface GlobalFieldMapping {
  dashboardField: string
  shopifyFields: string[]
  separator: string
  noMapping: boolean
}

// Extract Processing Mapping - special fields that require logic processing
export interface ExtractProcessingMapping {
  dashboardField: string
  processingType: 'date' | 'time' | 'group' | 'itemCount' | 'description' | 'phone'
  sourceField: string // e.g., 'order.tags', 'line_items', 'order.name'
  format?: string // for date/time formatting
}

// Dashboard Column Configuration - for auto-saving column preferences
export interface DashboardColumnConfig {
  field: keyof Order
  width: number
  visible: boolean
}

export interface AppSettings {
  shopifyStores: ShopifyStore[]
  globalFieldMappings: GlobalFieldMapping[]
  extractProcessingMappings: ExtractProcessingMapping[]
  dashboardConfig?: {
    columnConfigs: DashboardColumnConfig[]
  }
}

// Special processing fields that require logic
export const EXTRACT_PROCESSING_FIELDS = [
  'deliveryDate',
  'processingDate', 
  'jobReleaseTime',
  'deliveryCompletionTimeWindow',
  'group',
  'noOfShippingLabels',
  'itemCount',
  'description',
  'senderNumberOnApp',
  'senderPhoneNo',
  'recipientPhoneNo'
] as const

export type ExtractProcessingField = typeof EXTRACT_PROCESSING_FIELDS[number]

export const DASHBOARD_FIELDS = [
  "deliveryOrderNo",
  "deliveryDate",
  "processingDate",
  "jobReleaseTime",
  "deliveryCompletionTimeWindow",
  "trackingNo",
  "senderNumberOnApp",
  "deliverySequence",
  "address",
  "companyName",
  "postalCode",
  "firstName",
  "lastName",
  "recipientPhoneNo",
  "senderPhoneNo",
  "instructions",
  "assignTo",
  "emailsForNotifications",
  "zone",
  "accountNo",
  "deliveryJobOwner",
  "senderNameOnApp",
  "group",
  "noOfShippingLabels",
  "attachmentUrl",
  "status",
  "podAt",
  "remarks",
  "itemCount",
  "serviceTime",
  "sku",
  "description",
  "qty",
] as const

export const DASHBOARD_FIELD_LABELS: Record<string, string> = {
  deliveryOrderNo: "Delivery Order (D.O.) No.",
  deliveryDate: "Delivery Date",
  processingDate: "Processing Date",
  jobReleaseTime: "Job Release Time",
  deliveryCompletionTimeWindow: "Delivery Completion Time Window",
  trackingNo: "Tracking No.",
  senderNumberOnApp: "Sender's number to appear on app",
  deliverySequence: "Delivery Sequence",
  address: "Address",
  companyName: "Company Name",
  postalCode: "Postal Code",
  firstName: "First Name",
  lastName: "Last Name",
  recipientPhoneNo: "Recipient's Phone No.",
  senderPhoneNo: "Sender's Phone No.",
  instructions: "Instructions",
  assignTo: "Assign to",
  emailsForNotifications: "Emails For Notifications",
  zone: "Zone",
  accountNo: "Account No.",
  deliveryJobOwner: "Delivery Job Owner",
  senderNameOnApp: "Sender's name to appear on app",
  group: "Group",
  noOfShippingLabels: "No. of Shipping Labels",
  attachmentUrl: "Attachment (URL)",
  status: "Status",
  podAt: "POD at",
  remarks: "Remarks",
  itemCount: "Item count",
  serviceTime: "Service Time",
  sku: "SKU",
  description: "Description",
  qty: "Qty",
}

export const SHOPIFY_FIELDS = [
  // Order root fields
  "id",
  "name",
  "order_number",
  "email",
  "phone",
  "created_at",
  "updated_at",
  "processed_at",
  "canceled_at",
  "cancel_reason",
  "currency",
  "subtotal_price",
  "total_price",
  "total_tax",
  "financial_status",
  "fulfillment_status",
  "tags",
  "note",
  "customer_locale",
  "status_url",
  "tracking_number",
  "tracking_company",
  "tracking_url",

  // Customer fields
  "customer.id",
  "customer.first_name",
  "customer.last_name",
  "customer.email",
  "customer.phone",

  // Shipping address fields
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.company",
  "shipping_address.address1",
  "shipping_address.address2",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.country",
  "shipping_address.zip",
  "shipping_address.phone",

  // Billing address fields
  "billing_address.first_name",
  "billing_address.last_name",
  "billing_address.company",
  "billing_address.address1",
  "billing_address.address2",
  "billing_address.city",
  "billing_address.province",
  "billing_address.country",
  "billing_address.zip",
  "billing_address.phone",

  // Line items (array, but allow mapping to first/concat)
  "line_items.id",
  "line_items.sku",
  "line_items.title",
  "line_items.variant_title",
  "line_items.quantity",
  "line_items.price",
  "line_items.product_id",
  "line_items.variant_id",

  // Fulfillments (array, allow mapping to first/concat)
  "fulfillments.id",
  "fulfillments.status",
  "fulfillments.tracking_number",
  "fulfillments.tracking_company",
  "fulfillments.tracking_url",
  "fulfillments.created_at",
  "fulfillments.updated_at",

  // Misc/advanced
  "metafields",
  "discount_applications",
  "shipping_lines",
  "billing_address",
  "shipping_address",
  "customer",
  "line_items",
  "fulfillments"
] as const

export interface StoreProduct {
  id: string;
  title: string;
  variantTitle: string;
  price: string;
  handle: string;
  tags: string[];
  orderTags: string[];
  storeId: string;
  storeDomain: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProduct {
  id: string;
  productId: string;
  title: string;
  variantTitle: string;
  price: string;
  handle: string;
  tags: string[];
  orderTags: string[];
  storeId: string;
  storeDomain: string;
  userId: string;
  createdAt: string;
  image_url?: string;
  label?: string;
}

export interface TagFilter {
  id: string;
  tag: string;
  storeId: string;
  createdAt: string;
}

export interface TitleFilter {
  id: string;
  title: string;
  store_id: string;
  user_id: string;
  created_at: string;
}

export interface ProductLabel {
  id: string;
  productName: string;
  label: string;
}

export interface SyncStatus {
  last_sync: string | null;
  total_products: number;
  last_sync_status: 'success' | 'error' | null;
}
