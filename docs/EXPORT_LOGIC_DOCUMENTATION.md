# Export to Detrack Logic Documentation

## Overview

This document explains how the Detrackify system processes Shopify orders and exports them to Detrack, specifically focusing on the relationship between order-level and line-item-level processing.

## Architecture Flow

### 1. Data Processing Level (Order Level)

When a Shopify order comes in via webhook, the system processes it at the **order level**:

```typescript
// Each Shopify order creates multiple processed rows (one per line item)
const processedDataArray = processShopifyOrder(completeOrderData, globalMappings, extractMappings)
```

**Key Points:**
- **One Shopify order** → **Multiple processed rows** (one per line item)
- **Order-level fields** are duplicated across all line items (e.g., customer info, address, phone)
- **Line-item specific fields** are unique per row (e.g., description, SKU, quantity)

### 2. Database Storage Level (Line-Item Level)

The processed data is stored in the database as **individual line item rows**:

```typescript
// Each line item becomes a separate row in the database
activeLineItems.forEach((lineItem, index) => {
  const row: Record<string, string> = {
    // Order-level fields (same for all line items)
    ...processedFields,
    ...globalMappedFields,
    
    // Line-item specific fields
    description: lineItem.title + (lineItem.variant_title ? ` - ${lineItem.variant_title}` : ''),
    sku: lineItem.sku || '',
    qty: lineItem.quantity.toString(),
  }
  result.push(row)
})
```

**Key Points:**
- **Each line item** gets its own database row with a unique ID (e.g., `order-uuid-0`, `order-uuid-1`)
- **Order-level data** is duplicated across all line item rows
- **Line-item data** is specific to each row

### 3. Export to Detrack Level (Order Level - Grouped)

When exporting to Detrack, the system **regroups line items back to order level**:

```typescript
// Group line items by their base order ID
const orderGroups = new Map<string, { order: any, lineItems: any[], lineItemIds: string[] }>()

for (const lineItemId of orderIds) {
  const baseOrderId = lineItemId.split('-').slice(0, -1).join('-')
  // Group all line items from the same order together
}
```

**Key Points:**
- **Multiple line item rows** → **One Detrack job per order**
- **All line items from the same order** are combined into a single Detrack delivery job
- **Order-level fields** are used once per Detrack job
- **Line-item fields** are combined into an `items` array

## Detailed Process Flow

### Step 1: Shopify Webhook Processing

1. **Shopify Order Received**: A fulfillment webhook is received from Shopify
2. **Order Data Fetching**: Complete order data is fetched from Shopify API
3. **Data Processing**: Order is processed using `processShopifyOrder()` function
4. **Database Storage**: Multiple rows are created (one per line item)

### Step 2: Dashboard Display

1. **Line Item Rows**: Each line item appears as a separate row in the dashboard
2. **Individual Selection**: Users can select individual line item rows for export
3. **Order-Level Fields**: Common fields (address, phone, etc.) are duplicated across rows
4. **Line-Item Fields**: Specific fields (description, SKU, quantity) are unique per row

### Step 3: Export to Detrack

1. **Selection Processing**: Selected line item IDs are processed
2. **Order Grouping**: Line items are grouped by their base order ID
3. **Detrack Job Creation**: One Detrack job is created per order group
4. **Bulk Export**: All jobs are sent to Detrack in a single bulk request

## Detrack Job Structure

Each Detrack job contains:

```typescript
{
  "type": "Delivery",
  "do_number": "WF76382", // Order number (without #)
  "date": "23/06/2025",   // Delivery date
  "address": "...",       // Order-level (same for all items)
  "phone_number": "...",  // Order-level (same for all items)
  "items": [              // All line items combined
    {
      "sku": "FLOWER-001",
      "description": "Eternal Pink - Large",
      "quantity": 1
    },
    {
      "sku": "FLOWER-002", 
      "description": "Sunshine Yellow - Medium",
      "quantity": 2
    }
  ]
}
```

## Example Scenario

### Input: Shopify Order #WF76382
- **Line Item 1**: Eternal Pink (qty: 1)
- **Line Item 2**: Sunshine Yellow (qty: 2)

### Database Storage
- **Row 1**: `order-uuid-0` (Eternal Pink)
  - Order-level fields: address, phone, customer info
  - Line-item fields: description="Eternal Pink", sku="FLOWER-001", qty="1"
- **Row 2**: `order-uuid-1` (Sunshine Yellow)
  - Order-level fields: address, phone, customer info (duplicated)
  - Line-item fields: description="Sunshine Yellow", sku="FLOWER-002", qty="2"

### Export to Detrack
- **1 Detrack job** with 2 items in the `items` array
- **Total quantity**: 3 (sum of all line items)
- **Order-level data**: Used once per job
- **Line-item data**: Combined into items array

## Key Benefits

1. **Flexible Selection**: Users can select individual line items for export
2. **Order Integrity**: All line items from the same order are grouped together
3. **Efficient Processing**: Single Detrack job per order reduces API calls
4. **Data Consistency**: Order-level information is maintained across all line items

## Technical Implementation

### File Structure
- `src/lib/orderProcessor.ts`: Core processing logic
- `worker/index.ts`: Export to Detrack functionality
- `src/components/Dashboard.tsx`: User interface for selection and export

### Key Functions
- `processShopifyOrder()`: Converts Shopify order to multiple line item rows
- `convertMultipleLineItemsToDetrackFormat()`: Groups line items into Detrack jobs
- `handleExportToDetrack()`: Manages the export process

### Database Schema
- Each order is stored with `processed_data` containing an array of line item objects
- Each line item object contains both order-level and line-item specific fields
- Line item IDs follow the pattern: `{order-uuid}-{line-item-index}`

## Error Handling

1. **Missing Orders**: Orders deleted from Shopify are skipped
2. **Invalid Line Items**: Line items with zero quantity are filtered out
3. **Export Failures**: Failed exports are logged and reported to the user
4. **Partial Success**: Orders with some successful line items are marked accordingly

## Configuration

The export behavior is controlled by:
- **Global Field Mappings**: Define how Shopify fields map to dashboard fields
- **Extract Processing Mappings**: Define special processing rules for specific fields
- **Detrack Configuration**: API settings for Detrack integration

This architecture provides a robust and flexible system for processing Shopify orders and exporting them to Detrack while maintaining data integrity and user control over the export process. 