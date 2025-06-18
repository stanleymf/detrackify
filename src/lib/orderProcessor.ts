import type { ShopifyOrder, ShopifyLineItem } from '@/types/shopify'
import type { ExtractProcessingField, GlobalFieldMapping } from '@/types'

export class OrderProcessor {
  private order: ShopifyOrder

  constructor(order: ShopifyOrder) {
    this.order = order
  }

  /**
   * Extract date from order tags in dd/mm/yyyy format
   * Expected format in tags: "delivery_date:dd/mm/yyyy" or "processing_date:dd/mm/yyyy"
   */
  extractDateFromTags(dateType: 'delivery' | 'processing'): string {
    const tags = this.order.tags || ''
    const tagPrefix = `${dateType}_date:`
    
    // Split tags and find the relevant date tag
    const tagParts = tags.split(',').map(tag => tag.trim())
    const dateTag = tagParts.find(tag => tag.startsWith(tagPrefix))
    
    if (!dateTag) {
      return ''
    }

    // Extract the date part after the prefix
    const dateValue = dateTag.replace(tagPrefix, '').trim()
    
    // Validate and format the date
    if (this.isValidDateFormat(dateValue)) {
      return dateValue // Already in dd/mm/yyyy format
    }

    // Try to parse and reformat if it's in a different format
    const parsedDate = this.parseAndFormatDate(dateValue)
    return parsedDate
  }

  /**
   * Extract time window from order tags and convert to job release time
   * Expected format in tags: "time_window:hh:mm-hh:mm"
   */
  extractJobReleaseTime(): string {
    const tags = this.order.tags || ''
    const tagPrefix = 'time_window:'
    
    const tagParts = tags.split(',').map(tag => tag.trim())
    const timeTag = tagParts.find(tag => tag.startsWith(tagPrefix))
    
    if (!timeTag) {
      return ''
    }

    const timeValue = timeTag.replace(tagPrefix, '').trim()
    
    // Convert time window to job release time
    switch (timeValue) {
      case '10:00-14:00':
        return '8:45am'
      case '14:00-18:00':
        return '1:45pm'
      case '18:00-22:00':
        return '5:15pm'
      default:
        return ''
    }
  }

  /**
   * Extract time window from order tags and convert to delivery completion window
   */
  extractDeliveryCompletionTimeWindow(): string {
    const tags = this.order.tags || ''
    const tagPrefix = 'time_window:'
    
    const tagParts = tags.split(',').map(tag => tag.trim())
    const timeTag = tagParts.find(tag => tag.startsWith(tagPrefix))
    
    if (!timeTag) {
      return ''
    }

    const timeValue = timeTag.replace(tagPrefix, '').trim()
    
    // Convert time window to delivery completion window
    switch (timeValue) {
      case '10:00-14:00':
        return 'Morning'
      case '14:00-18:00':
        return 'Afternoon'
      case '18:00-22:00':
        return 'Night'
      default:
        return ''
    }
  }

  /**
   * Combine line item title and variant title for description
   */
  extractDescription(): string {
    const descriptions: string[] = []
    
    this.order.line_items.forEach(item => {
      let itemDescription = item.title
      
      // Add variant title if it exists and is different from main title
      if (item.variant_title && item.variant_title !== item.title) {
        itemDescription += ` - ${item.variant_title}`
      }
      
      descriptions.push(itemDescription)
    })
    
    return descriptions.join(', ')
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
      case 'description':
        return this.extractDescription()
      case 'noOfShippingLabels':
      case 'itemCount':
        return this.calculateItemCount()
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
      description: this.processField('description'),
      noOfShippingLabels: this.processField('noOfShippingLabels'),
      itemCount: this.processField('itemCount'),
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
): Record<string, string> {
  const processor = new OrderProcessor(order)
  const result: Record<string, string> = {}

  // Process extract processing fields first
  const processedFields = processor.getAllProcessedFields()
  Object.entries(processedFields).forEach(([field, value]) => {
    result[field] = value
  })

  // Process global field mappings
  globalMappings.forEach(mapping => {
    if (mapping.noMapping) {
      result[mapping.dashboardField] = ''
      return
    }

    const values: string[] = []
    mapping.shopifyFields.forEach((shopifyField: string) => {
      const value = getNestedValue(order, shopifyField)
      if (value !== undefined && value !== null && value !== '') {
        values.push(String(value))
      }
    })

    result[mapping.dashboardField] = values.join(mapping.separator || ' ')
  })

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