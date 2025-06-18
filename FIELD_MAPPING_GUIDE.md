# Field Mapping Guide

## Overview

The Detrackify app uses a sophisticated field mapping system to transform Shopify order data into the format required by Detrack. There are two types of mappings:

1. **Global Field Mappings** - Simple field-to-field relationships
2. **Extract Processing Mappings** - Complex logic processing for special fields

## Global Field Mappings

Global field mappings allow you to map multiple Shopify fields to a single Dashboard field. This is useful for combining data or providing fallback values.

### Configuration
```typescript
{
  dashboardField: "address",
  shopifyFields: ["shipping_address.address1", "shipping_address.address2", "shipping_address.city"],
  separator: ", ",
  noMapping: false
}
```

### Features
- **Multiple Fields**: Map multiple Shopify fields to one Dashboard field
- **Separators**: Define how multiple values are combined (e.g., ", ", " - ", "")
- **No Mapping**: Set `noMapping: true` to return empty values for unused fields

### Examples
```typescript
// Simple mapping
{
  dashboardField: "firstName",
  shopifyFields: ["shipping_address.first_name"],
  separator: "",
  noMapping: false
}

// Combined mapping
{
  dashboardField: "fullName",
  shopifyFields: ["shipping_address.first_name", "shipping_address.last_name"],
  separator: " ",
  noMapping: false
}
```

## Extract Processing Mappings

These are special fields that require logic processing beyond simple field mapping.

### Supported Fields

#### 1. Delivery Date & Processing Date
**Source**: `order.tags`  
**Format**: `delivery_date:dd/mm/yyyy` or `processing_date:dd/mm/yyyy`

**Example Tags**:
```
delivery_date:20/01/2024, processing_date:18/01/2024, priority:high
```

**Output**: `20/01/2024` (dd/mm/yyyy format)

#### 2. Job Release Time
**Source**: `order.tags`  
**Format**: `time_window:hh:mm-hh:mm`

**Conversions**:
- `10:00-14:00` → `8:45am`
- `14:00-18:00` → `1:45pm`
- `18:00-22:00` → `5:15pm`

**Example Tags**:
```
time_window:14:00-18:00, delivery_date:20/01/2024
```

**Output**: `1:45pm`

#### 3. Delivery Completion Time Window
**Source**: `order.tags`  
**Format**: `time_window:hh:mm-hh:mm`

**Conversions**:
- `10:00-14:00` → `Morning`
- `14:00-18:00` → `Afternoon`
- `18:00-22:00` → `Night`

**Example Tags**:
```
time_window:18:00-22:00, priority:urgent
```

**Output**: `Night`

#### 4. Description
**Source**: `line_items`  
**Logic**: Combines `title` and `variant_title` for each line item

**Example Line Items**:
```json
[
  {
    "title": "Premium T-Shirt",
    "variant_title": "Large / Blue",
    "quantity": 2
  },
  {
    "title": "Designer Jeans",
    "variant_title": "32 / Dark Blue",
    "quantity": 1
  }
]
```

**Output**: `Premium T-Shirt - Large / Blue, Designer Jeans - 32 / Dark Blue`

#### 5. Item Count & No. of Shipping Labels
**Source**: `line_items`  
**Logic**: Sums all line item quantities

**Example Line Items**:
```json
[
  { "quantity": 2 },
  { "quantity": 1 },
  { "quantity": 3 }
]
```

**Output**: `6`

## Shopify Order Tags Format

To use the extract processing features, format your Shopify order tags as follows:

```
delivery_date:20/01/2024, processing_date:18/01/2024, time_window:14:00-18:00, priority:high
```

### Tag Format Rules
- Use comma-separated key-value pairs
- Key format: `field_name:value`
- No spaces around the colon
- Values can contain spaces
- Case-sensitive

### Supported Tags
- `delivery_date:dd/mm/yyyy`
- `processing_date:dd/mm/yyyy`
- `time_window:hh:mm-hh:mm`
- Any other custom tags (ignored by processing)

## Implementation

### Order Processing Flow

1. **Webhook Receipt**: Shopify sends order data via webhook
2. **Field Mapping**: Apply global field mappings
3. **Extract Processing**: Process special fields with logic
4. **Data Transformation**: Combine all processed data
5. **Dashboard Display**: Show processed order in dashboard
6. **Export Preparation**: Format for Detrack export

### Code Example

```typescript
import { processShopifyOrder } from '@/lib/orderProcessor'

// Process a Shopify order
const processedOrder = processShopifyOrder(
  shopifyOrder,
  globalMappings,
  extractMappings
)

// Result contains all mapped and processed fields
console.log(processedOrder.deliveryDate) // "20/01/2024"
console.log(processedOrder.jobReleaseTime) // "1:45pm"
console.log(processedOrder.description) // "Premium T-Shirt - Large / Blue"
```

## Configuration

### Store-Specific Mappings
Each Shopify store can have its own field mappings:

```typescript
interface StoreConfig {
  id: string
  shopify_domain: string
  globalFieldMappings: GlobalFieldMapping[]
  extractProcessingMappings: ExtractProcessingMapping[]
}
```

### Default Mappings
The system provides sensible defaults for common fields, but stores can customize them based on their specific needs.

## Testing

Use the test processor to verify your mappings:

```typescript
import { testOrderProcessing } from '@/lib/testOrderProcessor'

// Run the test with sample data
const result = testOrderProcessing()
console.log(result)
```

## Best Practices

1. **Tag Consistency**: Use consistent tag formats across all orders
2. **Fallback Values**: Configure global mappings with fallback fields
3. **Testing**: Test mappings with sample orders before going live
4. **Documentation**: Document custom tag formats for store staff
5. **Validation**: Validate processed data before export to Detrack

## Troubleshooting

### Common Issues

1. **Empty Dates**: Check tag format matches exactly `delivery_date:dd/mm/yyyy`
2. **Wrong Times**: Verify time window format is `time_window:hh:mm-hh:mm`
3. **Missing Descriptions**: Ensure line items have both `title` and `variant_title`
4. **Incorrect Counts**: Check line item `quantity` fields are numeric

### Debug Mode
Enable debug logging to see processing steps:

```typescript
const processor = new OrderProcessor(order)
console.log('Tags:', order.tags)
console.log('Delivery Date:', processor.processField('deliveryDate'))
``` 