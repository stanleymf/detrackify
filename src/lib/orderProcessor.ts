import type { ShopifyOrder, ShopifyLineItem } from '@/types/shopify'
import type { GlobalFieldMapping } from '@/types'

export class OrderProcessor {
  private order: ShopifyOrder
  private extractMappings: any[]

  constructor(order: ShopifyOrder, extractMappings: any[]) {
    this.order = order
    this.extractMappings = extractMappings
  }

  /**
   * Generic function to extract a value from various sources based on mapping.
   */
  private extractValue(mapping: any): string {
    const sourceField = mapping.sourceField || ''
    const processingType = mapping.processingType || ''
    const format = mapping.format || ''
    
    if (sourceField === 'order.tags') {
      const value = this.extractFromTags(processingType, format)
      
      // Apply specific conversions for time-based fields
      if (mapping.dashboardField === 'jobReleaseTime') {
        return this.convertTimeWindowToJobReleaseTime(value)
      } else if (mapping.dashboardField === 'deliveryCompletionTimeWindow') {
        return this.convertTimeWindowToDeliveryTimeWindow(value)
      }
      
      return value
    } else if (sourceField === 'line_items') {
      const value = this.processLineItems(format)
      return value
    } else if (sourceField === 'order.name') {
      const value = this.extractGroup(format)
      return value
    } else {
      // Handle nested object paths like billing_address.phone
      const value = this.extractNestedValue(sourceField)
      
      // Apply phone normalization if needed
      if (processingType === 'phone' && format === 'normalize') {
        const normalized = this.normalizePhoneNumber(value, format)
        return normalized
      }
      
      return value
    }
  }

  private extractFromTags(processingType: string, format: string): string {
    const tags = (this.order.tags || '').split(',').map(t => t.trim())
    
    if (processingType === 'date') {
      // Look for date patterns in tags
      for (const tag of tags) {
        if (format === 'dd/mm/yyyy') {
          // Look for DD/MM/YYYY pattern
          const dateMatch = tag.match(/(\d{2})\/(\d{2})\/(\d{4})/)
          if (dateMatch) {
            return dateMatch[0]
          }
        }
      }
    } else if (processingType === 'time') {
      // Look for time patterns in tags
      for (const tag of tags) {
        if (format === 'time_window') {
          // Look for HH:MM-HH:MM pattern
          const timeMatch = tag.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
          if (timeMatch) {
            return timeMatch[0]
          }
          // Look for single time HH:MM pattern
          const singleTimeMatch = tag.match(/(\d{1,2}):(\d{2})/)
          if (singleTimeMatch) {
            return singleTimeMatch[0]
          }
        }
      }
    }
    
    return ''
  }

  private extractFromNoteAttributes(processingType: string, format: string): string {
    if (!format || !(this.order as any).note_attributes) return ''
    const regex = new RegExp(format)
    for (const attr of (this.order as any).note_attributes) {
      if (attr.name.match(regex)) return attr.value
      if (String(attr.value).match(regex)) return String(attr.value)
    }
    return ''
  }

  private extractFromLineItemProperties(processingType: string, format: string): string {
    if (!format || !this.order.line_items) return ''
    const regex = new RegExp(format)
    for (const item of this.order.line_items) {
      const properties = (item as any).properties || (item as any)._properties
      if (!properties) continue
      for (const prop of properties) {
        if (prop.name.match(regex)) return prop.value
        if (String(prop.value).match(regex)) return String(prop.value)
      }
    }
    return ''
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Process Shopify order and extract all required fields based on mappings.
   */
  processShopifyOrder(): Record<string, string> {
    const processedFields: Record<string, string> = {}
    
    this.extractMappings.forEach(mapping => {
      // Check if this field should be skipped (noMapping equivalent)
      if (mapping.processingType === 'skip' || mapping.noMapping) {
        processedFields[mapping.dashboardField] = ''
        return
      }
      
      const value = this.extractValue(mapping)
      processedFields[mapping.dashboardField] = value
    })

    // Apply defaults for fields not processed by extract mappings
    if (!processedFields.description) {
      processedFields.description = this.generateDescription()
    }
    if (!processedFields.qty) {
      processedFields.qty = this.calculateItemCount()
    }
    if (!processedFields.address) {
      processedFields.address = this.formatAddress()
    }
    if (!processedFields.deliveryOrderNo) {
      processedFields.deliveryOrderNo = this.order.name || ''
    }
    if (!processedFields.emailsForNotifications) {
      processedFields.emailsForNotifications = this.order.email || ''
    }
    if (!processedFields.instructions) {
      processedFields.instructions = this.order.note || ''
    }

    return processedFields
  }

  /**
   * Extract date from order tags in dd/mm/yyyy format
   * Expected format in tags: "14:00-18:00, 18/06/2025, Delivery, Singapore"
   * Look for date patterns like "dd/mm/yyyy" or "dd-mm-yyyy" or "yyyy-mm-dd"
   */
  private extractDateFromTags(dateType: 'delivery' | 'processing'): string {
    const tags = this.order.tags || ''
    const tagParts = tags.split(',').map(tag => tag.trim())
    for (const tag of tagParts) {
      if (tag.toLowerCase().includes(dateType)) {
        let dateMatch = tag.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (dateMatch) return `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`
        dateMatch = tag.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        if (dateMatch) return `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`
        dateMatch = tag.match(/(\d{2})-(\d{2})-(\d{4})/)
        if (dateMatch) return `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`
        const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
        dateMatch = tag.match(dateRegex)
        if (dateMatch) return `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`
      }
    }
    return ''
  }

  /**
   * Extract time window from order tags and convert to job release time
   * Expected format in tags: "14:00-18:00, 18/06/2025, Delivery, Singapore"
   * Look for time patterns like "hh:mm-hh:mm" or time window keywords
   */
  extractJobReleaseTime(): string {
    const tags = this.order.tags || ''
    
    const tagParts = tags.split(',').map(tag => tag.trim())
    
    // Look for time window tags
    for (const tag of tagParts) {
      // Check for time window keywords
      if (tag.toLowerCase().includes('morning') || 
          tag.toLowerCase().includes('afternoon') || 
          tag.toLowerCase().includes('night')) {
        const timeValue = tag.toLowerCase()
        
        // Map time windows to specific times
        if (timeValue.includes('morning')) {
          return '09:00'
        } else if (timeValue.includes('afternoon')) {
          return '14:00'
        } else if (timeValue.includes('night')) {
          return '18:00'
        }
      }
      
      // Check for HH:MM-HH:MM format and apply conversion
      const timeMatch = tag.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        const timeWindow = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}-${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`
        return this.convertTimeWindowToJobReleaseTime(timeWindow)
      }
      
      // Check for single time HH:MM format
      const singleTimeMatch = tag.match(/(\d{1,2}):(\d{2})/)
      if (singleTimeMatch) {
        return `${singleTimeMatch[1].padStart(2, '0')}:${singleTimeMatch[2]}`
      }
    }
    
    return ''
  }

  /**
   * Extract delivery completion time window from order tags
   * Expected format in tags: "14:00-18:00, 18/06/2025, Delivery, Singapore"
   */
  extractDeliveryCompletionTimeWindow(): string {
    const tags = this.order.tags || ''
    
    const tagParts = tags.split(',').map(tag => tag.trim())
    
    // Look for time window tags
    for (const tag of tagParts) {
      // Check for time window keywords
      if (tag.toLowerCase().includes('morning') || 
          tag.toLowerCase().includes('afternoon') || 
          tag.toLowerCase().includes('night')) {
        const timeValue = tag.toLowerCase()
        
        // Map time windows to specific ranges
        if (timeValue.includes('morning')) {
          return '09:00-12:00'
        } else if (timeValue.includes('afternoon')) {
          return '14:00-18:00'
        } else if (timeValue.includes('night')) {
          return '18:00-21:00'
        }
      }
      
      // Check for HH:MM-HH:MM format and apply conversion
      const timeMatch = tag.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        const timeWindow = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}-${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`
        return this.convertTimeWindowToDeliveryTimeWindow(timeWindow)
      }
    }
    
    return ''
  }

  /**
   * Normalize phone number based on format
   */
  private normalizePhoneNumber(phone: string, format: string): string {
    if (!phone) return ''
    
    // Remove all spaces and special characters first
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
    
    // Handle Singapore numbers (+65)
    if (cleaned.startsWith('+65')) {
      // Remove +65 and return clean number
      const number = cleaned.substring(3)
      return number
    }
    
    // Handle other international numbers (just remove +)
    if (cleaned.startsWith('+')) {
      const result = cleaned.substring(1)
      return result
    }
    
    // Handle local numbers (return as is, no spacing)
    return cleaned
  }

  /**
   * Convert time window to job release time according to requirements
   */
  private convertTimeWindowToJobReleaseTime(timeWindow: string): string {
    // Parse the time window (e.g., "14:00-18:00")
    const match = timeWindow.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
    if (!match) {
      return timeWindow
    }
    
    const startHour = parseInt(match[1], 10)
    const startMinute = parseInt(match[2], 10)
    
    // Convert start time to minutes for easier comparison
    const startTimeInMinutes = startHour * 60 + startMinute
    
    // Apply range-based conversions
    // Morning Range: 10:00-14:00 (600-840 minutes) → 08:45
    if (startTimeInMinutes >= 600 && startTimeInMinutes < 840) {
      return '08:45'
    }
    // Afternoon Range: 14:00-18:00 (840-1080 minutes) → 13:45
    else if (startTimeInMinutes >= 840 && startTimeInMinutes < 1080) {
      return '13:45'
    }
    // Evening Range: 18:00-22:00 (1080-1320 minutes) → 17:15
    else if (startTimeInMinutes >= 1080 && startTimeInMinutes < 1320) {
      return '17:15'
    }
    
    // If no range matches, return original time window
    return timeWindow
  }

  /**
   * Convert time window to delivery completion time window according to requirements
   */
  private convertTimeWindowToDeliveryTimeWindow(timeWindow: string): string {
    // Parse the time window (e.g., "14:00-18:00")
    const match = timeWindow.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
    if (!match) {
      return timeWindow
    }
    
    const startHour = parseInt(match[1], 10)
    const startMinute = parseInt(match[2], 10)
    
    // Convert start time to minutes for easier comparison
    const startTimeInMinutes = startHour * 60 + startMinute
    
    // Apply range-based conversions
    // Morning Range: 10:00-14:00 (600-840 minutes) → Morning
    if (startTimeInMinutes >= 600 && startTimeInMinutes < 840) {
      return 'Morning'
    }
    // Afternoon Range: 14:00-18:00 (840-1080 minutes) → Afternoon
    else if (startTimeInMinutes >= 840 && startTimeInMinutes < 1080) {
      return 'Afternoon'
    }
    // Evening Range: 18:00-22:00 (1080-1320 minutes) → Night
    else if (startTimeInMinutes >= 1080 && startTimeInMinutes < 1320) {
      return 'Night'
    }
    
    // If no range matches, return original time window
    return timeWindow
  }

  /**
   * Extract value from nested object using dot notation path
   */
  private extractNestedValue(path: string): string {
    const parts = path.split('.')
    let current: any = this.order
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return ''
      }
    }
    
    if (current === null || current === undefined) {
      return ''
    }
    
    return String(current)
  }

  /**
   * Process line items for item count and shipping labels
   */
  private processLineItems(format: string): string {
    if (!this.order.line_items || !Array.isArray(this.order.line_items)) {
      return '0'
    }
    
    if (format === 'sum_quantities') {
      const totalQuantity = this.order.line_items.reduce((sum, item) => {
        const quantity = item.quantity || 0
        return sum + quantity
      }, 0)
      
      return String(totalQuantity)
    }
    
    // Default: return number of line items
    return String(this.order.line_items.length)
  }

  /**
   * Extract group from order name
   */
  private extractGroup(format: string): string {
    const orderName = this.order.name || ''
    
    if (format === 'first_two_letters') {
      // Remove # if present and get first two letters
      const cleanName = orderName.replace('#', '')
      const result = cleanName.substring(0, 2).toUpperCase()
      return result
    }
    
    return orderName
  }

  /**
   * Generate description from line items
   */
  private generateDescription(): string {
    const lineItems = this.order.line_items || []
    return lineItems.map(item => `${item.title} - ${item.variant_title || 'Default'}`).join(', ')
  }

  /**
   * Calculate total item count
   */
  private calculateItemCount(): string {
    const lineItems = this.order.line_items || []
    return lineItems.reduce((total, item) => total + (item.quantity || 0), 0).toString()
  }

  /**
   * Format shipping address
   */
  private formatAddress(): string {
    const shippingAddress = this.order.shipping_address
    if (!shippingAddress) return ''
    const parts = [
      shippingAddress.address1,
      shippingAddress.address2,
      shippingAddress.city,
      shippingAddress.province,
      shippingAddress.zip,
      shippingAddress.country,
    ].filter(Boolean)
    return parts.join(', ')
  }
}

/**
 * Processes a Shopify order to extract and transform data based on mappings.
 * @param order The raw Shopify order.
 * @param globalMappings The global field mappings.
 * @param extractMappings The extract processing mappings.
 * @returns An array of processed line items.
 */
export function processShopifyOrder(
  order: ShopifyOrder,
  globalMappings: GlobalFieldMapping[],
  extractMappings: any[],
  manuallyEditedFields?: Record<string, boolean>
): Record<string, string>[] {
  const processor = new OrderProcessor(order, extractMappings)
  const result: Record<string, string>[] = []

  // Process extract processing fields first (order-level)
  const processedFields = processor.processShopifyOrder()

  // Process global field mappings (but don't overwrite extract processing fields)
  const globalMappedFields: Record<string, string> = {}
  globalMappings.forEach(mapping => {
    // Skip if this field was already processed by extract processing
    if (processedFields[mapping.dashboardField] !== undefined && processedFields[mapping.dashboardField] !== '') {
      return
    }

    if (mapping.noMapping) {
      globalMappedFields[mapping.dashboardField] = ''
      return
    }

    const values: string[] = []
    mapping.shopifyFields.forEach((shopifyField: string) => {
      if (shopifyField.startsWith('line_items.')) {
        // Get from current line item
        const field = shopifyField.replace('line_items.', '')
        if (order.line_items && order.line_items.length > 0) {
          const value = order.line_items[0][field as keyof typeof order.line_items[0]]
          if (value !== undefined && value !== null && value !== '') {
            values.push(String(value))
          }
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
  })

  // Create one row per line item
  if (order.line_items && order.line_items.length > 0) {
    // Filter out removed/cancelled line items
    const activeLineItems = order.line_items.filter(item => {
      // Check if current_quantity is 0 (item was reduced to 0)
      if (item.current_quantity === 0) {
        return false
      }
      
      return true
    })

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