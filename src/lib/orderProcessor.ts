import type { ShopifyOrder, ShopifyLineItem } from '@/types/shopify'
import type { ExtractProcessingField, GlobalFieldMapping } from '@/types'

export class OrderProcessor {
  private order: ShopifyOrder

  constructor(order: ShopifyOrder) {
    this.order = order
  }

  /**
   * Extract date from order tags in dd/mm/yyyy format
   * Expected format in tags: "14:00-18:00, 18/06/2025, Delivery, Singapore"
   * Look for date patterns like "dd/mm/yyyy" or "dd-mm-yyyy"
   */
  extractDateFromTags(dateType: 'delivery' | 'processing'): string {
    const tags = this.order.tags || ''
    
    console.log(`Extracting ${dateType} date from tags: "${tags}"`)
    
    // Split tags and look for date patterns
    const tagParts = tags.split(',').map(tag => tag.trim())
    console.log(`Tag parts:`, tagParts)
    
    // Look for date patterns in the tags
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/, // dd/mm/yyyy
      /(\d{2}-\d{2}-\d{4})/,   // dd-mm-yyyy
      /(\d{1,2}\/\d{1,2}\/\d{4})/, // d/m/yyyy or dd/m/yyyy or d/mm/yyyy
      /(\d{1,2}-\d{1,2}-\d{4})/    // d-m-yyyy or dd-m-yyyy or d-mm-yyyy
    ]
    
    for (const tag of tagParts) {
      for (const pattern of datePatterns) {
        const match = tag.match(pattern)
        if (match) {
          const dateValue = match[1]
          console.log(`Found date in tag "${tag}": "${dateValue}"`)
          
          // Validate and format the date
          if (this.isValidDateFormat(dateValue)) {
            console.log(`Date is already in correct format: ${dateValue}`)
            return dateValue // Already in dd/mm/yyyy format
          }

          // Try to parse and reformat if it's in a different format
          const parsedDate = this.parseAndFormatDate(dateValue)
          console.log(`Parsed date: "${parsedDate}"`)
          return parsedDate
        }
      }
    }
    
    console.log(`No ${dateType} date found in tags`)
    return ''
  }

  /**
   * Extract time window from order tags and convert to job release time
   * Expected format in tags: "14:00-18:00, 18/06/2025, Delivery, Singapore"
   * Look for time patterns like "hh:mm-hh:mm"
   */
  extractJobReleaseTime(): string {
    const tags = this.order.tags || ''
    
    console.log(`Extracting job release time from tags: "${tags}"`)
    
    // Split tags and look for time window patterns
    const tagParts = tags.split(',').map(tag => tag.trim())
    
    // Look for time window patterns like "14:00-18:00"
    const timePattern = /(\d{1,2}:\d{2}-\d{1,2}:\d{2})/
    
    for (const tag of tagParts) {
      const match = tag.match(timePattern)
      if (match) {
        const timeValue = match[1]
        console.log(`Found time window in tag "${tag}": "${timeValue}"`)
        
        // Convert time window to job release time
        switch (timeValue) {
          case '10:00-14:00':
            return '8:45am'
          case '11:00-15:00':
            return '8:45am'
          case '14:00-18:00':
            return '1:45pm'
          case '18:00-22:00':
            return '5:15pm'
          default:
            console.log(`Unknown time window: ${timeValue}`)
            return ''
        }
      }
    }
    
    console.log(`No time window found in tags`)
    return ''
  }

  /**
   * Extract time window from order tags and convert to delivery completion window
   * Expected format in tags: "14:00-18:00, 18/06/2025, Delivery, Singapore"
   * Look for time patterns like "hh:mm-hh:mm"
   */
  extractDeliveryCompletionTimeWindow(): string {
    const tags = this.order.tags || ''
    
    console.log(`Extracting delivery completion time window from tags: "${tags}"`)
    
    // Split tags and look for time window patterns
    const tagParts = tags.split(',').map(tag => tag.trim())
    
    // Look for time window patterns like "14:00-18:00"
    const timePattern = /(\d{1,2}:\d{2}-\d{1,2}:\d{2})/
    
    for (const tag of tagParts) {
      const match = tag.match(timePattern)
      if (match) {
        const timeValue = match[1]
        console.log(`Found time window in tag "${tag}": "${timeValue}"`)
        
        // Convert time window to delivery completion window
        switch (timeValue) {
          case '10:00-14:00':
            return 'Morning'
          case '11:00-15:00':
            return 'Morning'
          case '14:00-18:00':
            return 'Afternoon'
          case '18:00-22:00':
            return 'Night'
          default:
            console.log(`Unknown time window: ${timeValue}`)
            return ''
        }
      }
    }
    
    console.log(`No time window found in tags`)
    return ''
  }

  /**
   * Extract first two letters from order name for Group field
   * Example: #WF70000 -> WF
   */
  extractGroup(): string {
    const orderName = this.order.name || ''
    
    console.log(`Extracting group from order name: "${orderName}"`)
    
    // Remove any non-alphabetic characters and get first two letters
    const letters = orderName.replace(/[^A-Za-z]/g, '')
    const result = letters.substring(0, 2).toUpperCase()
    
    console.log(`Letters found: "${letters}", Group result: "${result}"`)
    
    return result
  }

  /**
   * Calculate total number of line items (for both noOfShippingLabels and itemCount)
   */
  calculateItemCount(): string {
    const totalQuantity = this.order.line_items.reduce((sum, item) => {
      return sum + item.quantity
    }, 0)
    
    return totalQuantity.toString()
  }

  /**
   * Extract description by combining line item titles and variant titles
   */
  extractDescription(): string {
    if (!this.order.line_items || this.order.line_items.length === 0) {
      return ''
    }

    const descriptions = this.order.line_items.map(item => {
      const title = item.title || ''
      const variantTitle = item.variant_title || ''
      
      if (variantTitle) {
        return `${title} - ${variantTitle}`
      }
      return title
    })

    return descriptions.join(', ')
  }

  /**
   * Process a specific field based on its type
   */
  processField(field: ExtractProcessingField): string {
    switch (field) {
      case 'deliveryDate':
        return this.extractDateFromTags('delivery')
      case 'processingDate':
        return this.extractDateFromTags('processing')
      case 'jobReleaseTime':
        return this.extractJobReleaseTime()
      case 'deliveryCompletionTimeWindow':
        return this.extractDeliveryCompletionTimeWindow()
      case 'noOfShippingLabels':
      case 'itemCount':
        return this.calculateItemCount()
      case 'group':
        return this.extractGroup()
      case 'description':
        return this.extractDescription()
      default:
        return ''
    }
  }

  /**
   * Validate if a date string is in dd/mm/yyyy format
   */
  private isValidDateFormat(dateStr: string): boolean {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/
    return dateRegex.test(dateStr)
  }

  /**
   * Parse and format date from various formats to dd/mm/yyyy
   */
  private parseAndFormatDate(dateStr: string): string {
    try {
      // Try to parse the date
      const date = new Date(dateStr)
      
      if (isNaN(date.getTime())) {
        return ''
      }
      
      // Format to dd/mm/yyyy
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      
      return `${day}/${month}/${year}`
    } catch (error) {
      console.error('Error parsing date:', dateStr, error)
      return ''
    }
  }

  /**
   * Get all processed fields for the order
   */
  getAllProcessedFields(): Record<ExtractProcessingField, string> {
    return {
      deliveryDate: this.processField('deliveryDate'),
      processingDate: this.processField('processingDate'),
      jobReleaseTime: this.processField('jobReleaseTime'),
      deliveryCompletionTimeWindow: this.processField('deliveryCompletionTimeWindow'),
      group: this.processField('group'),
      noOfShippingLabels: this.processField('noOfShippingLabels'),
      itemCount: this.processField('itemCount'),
      description: this.processField('description'),
    }
  }
}

/**
 * Utility function to process a Shopify order with both global mappings and extract processing
 */
export function processShopifyOrder(
  order: ShopifyOrder,
  globalMappings: GlobalFieldMapping[],
  extractMappings: any[]
): Record<string, string>[] {
  const processor = new OrderProcessor(order)
  const result: Record<string, string>[] = []

  console.log('Processing order:', order.name)
  console.log('Global mappings:', globalMappings.length)
  console.log('Extract mappings:', extractMappings.length)

  // Process extract processing fields first (order-level)
  const processedFields = processor.getAllProcessedFields()
  console.log('Extract processed fields:', processedFields)

  // Process global field mappings (but don't overwrite extract processing fields)
  const globalMappedFields: Record<string, string> = {}
  globalMappings.forEach(mapping => {
    // Skip if this field was already processed by extract processing
    if (processedFields[mapping.dashboardField as keyof typeof processedFields] !== undefined) {
      console.log(`Skipping global mapping for ${mapping.dashboardField} (already processed by extract processing)`)
      return
    }

    if (mapping.noMapping) {
      globalMappedFields[mapping.dashboardField] = ''
      console.log(`Set ${mapping.dashboardField} = "" (no mapping)`)
      return
    }

    const values: string[] = []
    mapping.shopifyFields.forEach((shopifyField: string) => {
      if (shopifyField.startsWith('line_items.')) {
        // Get from current line item
        const field = shopifyField.replace('line_items.', '')
        const value = order.line_items[0][field as keyof typeof order.line_items]
        if (value !== undefined && value !== null && value !== '') {
          values.push(String(value))
        }
      } else {
        // Get from order root
        const value = getNestedValue(order, shopifyField)
        if (value !== undefined && value !== null && value !== '') {
          values.push(String(value))
        }
      }
    })

    const finalValue = values.join(mapping.separator || ' ')
    globalMappedFields[mapping.dashboardField] = finalValue
    console.log(`Set ${mapping.dashboardField} = "${finalValue}" (from ${mapping.shopifyFields.join(', ')})`)
  })

  // Create one row per line item
  if (order.line_items && order.line_items.length > 0) {
    order.line_items.forEach((lineItem, index) => {
      const row: Record<string, string> = {
        // Order-level fields (same for all line items)
        ...processedFields,
        ...globalMappedFields,
        
        // Line-item specific fields
        description: lineItem.title + (lineItem.variant_title ? ` - ${lineItem.variant_title}` : ''),
        sku: lineItem.sku || '',
        qty: lineItem.quantity.toString(),
      }

      console.log(`Created row ${index + 1} for line item: ${lineItem.title}`)
      result.push(row)
    })
  } else {
    // Fallback: create one row if no line items
    const row: Record<string, string> = {
      ...processedFields,
      ...globalMappedFields,
      description: '',
      sku: '',
      qty: '',
    }
    result.push(row)
  }

  console.log(`Created ${result.length} rows for order ${order.name}`)
  return result
}

/**
 * Get nested object value using dot notation (e.g., "customer.first_name")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
} 