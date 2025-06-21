# Extract Processing Requirements

## ⚠️ **CRITICAL: DO NOT MODIFY EXTRACT PROCESSING MAPPINGS**

**These mappings contain business-critical logic and should NEVER be modified without explicit permission from the project owner.**

## Critical Warning

**These extract processing mapping rules are business-critical. Do not modify any logic or mappings in this document or in the codebase without explicit approval from the business owner. Breaking these rules will cause data loss or incorrect order processing.**

## Extract Processing Fields and Mapping Rules

The following fields are processed using custom logic in the backend. They do not use simple field mappings, but instead extract or compute their values from Shopify order data according to the rules below.

| Field                          | Rule/Logic                                                                                      | Source Field(s)         |
|------------------------------- |----------------------------------------------------------------------------------------------- |------------------------ |
| `deliveryDate`                 | Extract from order tags, supports both `delivery_date:` prefix and plain date in tag           | order.tags              |
| `processingDate`               | Extract from order tags, supports both `processing_date:` prefix and plain date in tag         | order.tags              |
| `jobReleaseTime`               | Extract from order tags, supports both `time_window:` prefix and plain time window in tag.     | order.tags              |
| `deliveryCompletionTimeWindow` | Extract from order tags, supports both `time_window:` prefix and plain time window in tag.     | order.tags              |
| `group`                        | Extracts first two letters before the first number in order name, uppercased                  | order.name              |
| `noOfShippingLabels`           | Total quantity of all non-removed line items                                                   | order.line_items        |
| `itemCount`                    | Total quantity of all non-removed line items                                                   | order.line_items        |
| `description`                  | Concatenates all line item titles and variant titles, comma-separated                          | order.line_items        |
| `senderNumberOnApp`            | Normalized phone from billing address (removes +65, spaces, etc)                              | billing_address.phone   |
| `senderPhoneNo`                | Normalized phone from billing address (removes +65, spaces, etc)                              | billing_address.phone   |
| `recipientPhoneNo`             | Normalized phone from shipping address (removes +65, spaces, etc)                             | shipping_address.phone  |

## Notes
- These rules are implemented in `src/lib/orderProcessor.ts` and referenced in `src/types/index.ts`.
- If you need to add new extract processing fields, follow the same pattern and document the rule here.
- Any changes to these rules must be reviewed and approved by the business owner.

## Field Requirements

### 1. Delivery Date
- **Source**: Shopify order tags
- **Input Format**: `delivery_date:dd/mm/yyyy` (ALWAYS dd/mm/yyyy format)
- **Output Format**: `dd/mm/yyyy` (ALWAYS)
- **Example**: `delivery_date:20/01/2024` → `20/01/2024`

### 2. Processing Date
- **Source**: Shopify order tags
- **Input Format**: `processing_date:dd/mm/yyyy` (ALWAYS dd/mm/yyyy format)
- **Output Format**: `dd/mm/yyyy` (ALWAYS)
- **Example**: `processing_date:18/01/2024` → `18/01/2024`

### 3. Job Release Time
- **Source**: Shopify order tags
- **Input Format**: `time_window:hh:mm-hh:mm` (ALWAYS hh:mm-hh:mm format)
- **Output Format**: Specific time in `hh:mm` format
- **Conversions**:
  - `time_window:10:00-14:00` → `08:45`
  - `time_window:11:00-15:00` → `08:45`
  - `time_window:14:00-18:00` → `13:45`
  - `time_window:18:00-22:00` → `17:15`

### 4. Delivery Completion Time Window
- **Source**: Shopify order tags
- **Input Format**: `time_window:hh:mm-hh:mm` (ALWAYS hh:mm-hh:mm format)
- **Output Format**: Text label
- **Conversions**:
  - `time_window:10:00-14:00` → `Morning`
  - `time_window:11:00-15:00` → `Morning`
  - `time_window:14:00-18:00` → `Afternoon`
  - `time_window:18:00-22:00` → `Night`

## Tag Format Examples

### Valid Tag Format
```
delivery_date:20/01/2024, processing_date:18/01/2024, time_window:14:00-18:00, priority:high
```

### Expected Outputs
- **Delivery Date**: `20/01/2024`
- **Processing Date**: `18/01/2024`
- **Job Release Time**: `13:45`
- **Delivery Completion Time Window**: `Afternoon`

## Implementation Location

The extract processing logic is implemented in:
- **File**: `src/lib/orderProcessor.ts`
- **Class**: `OrderProcessor`
- **Methods**:
  - `extractDateFromTags(dateType: 'delivery' | 'processing')`
  - `extractJobReleaseTime()`
  - `extractDeliveryCompletionTimeWindow()`

## Testing

Use the test file `tests/test-extract-processing.js` to verify the logic works correctly.

## ⚠️ **REMINDER**

**DO NOT MODIFY THESE MAPPINGS WITHOUT EXPLICIT PERMISSION!**

If you need to make changes:
1. Contact the project owner
2. Get written permission
3. Document all changes
4. Test thoroughly
5. Update this documentation

## Version History

- **v0.13.13** (2025-06-20): Fixed extract processing field display and implemented correct time window conversions 