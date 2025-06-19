import type { ShopifyOrder } from '@/types/shopify'
import type { GlobalFieldMapping, ExtractProcessingMapping } from '@/types'

// Helper function to generate UUID using Web Crypto API
function generateUUID(): string {
  return crypto.randomUUID()
}

export interface D1Database {
  prepare: (query: string) => D1PreparedStatement
  batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>
  exec: (query: string) => Promise<D1Result>
}

export interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement
  first: <T = any>(colName?: string) => Promise<T | null>
  run: () => Promise<D1Result>
  all: <T = any>() => Promise<D1Result<T>>
}

export interface D1Result<T = any> {
  lastRowId: number | null
  changes: number
  duration: number
  results?: T[]
  success: boolean
  meta: any
}

export interface Store {
  id: string
  shopify_domain: string
  access_token: string
  api_version: string
  webhook_secret: string
  api_secret?: string
  store_name: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  store_id: string
  shopify_order_id: number
  shopify_order_name: string
  status: 'Ready for Export' | 'Exported' | 'Error'
  processed_data: string
  raw_shopify_data: string
  created_at: string
  updated_at: string
  exported_at: string | null
}

export interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export class DatabaseService {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  // Store Management
  async createStore(store: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO stores (id, shopify_domain, access_token, api_version, webhook_secret, api_secret, store_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, store.shopify_domain, store.access_token, store.api_version, store.webhook_secret, store.api_secret, store.store_name, now, now).run()

    return {
      id,
      ...store,
      created_at: now,
      updated_at: now
    }
  }

  async getStoreByDomain(domain: string): Promise<Store | null> {
    return this.db.prepare('SELECT * FROM stores WHERE shopify_domain = ?').bind(domain).first<Store>()
  }

  async getStoreById(id: string): Promise<Store | null> {
    return this.db.prepare('SELECT * FROM stores WHERE id = ?').bind(id).first<Store>()
  }

  async updateStore(id: string, updates: Partial<Store>): Promise<void> {
    // Check if api_secret column exists by trying to update it separately
    if (updates.api_secret !== undefined) {
      try {
        // Try to update api_secret column
        await this.db.prepare(`
          UPDATE stores 
          SET api_secret = ?, updated_at = ? 
          WHERE id = ?
        `).bind(updates.api_secret, new Date().toISOString(), id).run()
        
        // Remove api_secret from updates to avoid double update
        const { api_secret, ...otherUpdates } = updates
        
        // Update other fields if any
        if (Object.keys(otherUpdates).length > 0) {
          const setClause = Object.keys(otherUpdates).map(key => `${key} = ?`).join(', ')
          const values = Object.values(otherUpdates)
          
          await this.db.prepare(`
            UPDATE stores 
            SET ${setClause}, updated_at = ? 
            WHERE id = ?
          `).bind(...values, new Date().toISOString(), id).run()
        }
      } catch (error) {
        console.log('DatabaseService.updateStore: api_secret column not available, attempting to create it...')
        
        try {
          // Try to create the api_secret column
          await this.db.exec('ALTER TABLE stores ADD COLUMN api_secret TEXT')
          console.log('DatabaseService.updateStore: Successfully created api_secret column')
          
          // Now try the update again
          await this.db.prepare(`
            UPDATE stores 
            SET api_secret = ?, updated_at = ? 
            WHERE id = ?
          `).bind(updates.api_secret, new Date().toISOString(), id).run()
          
          // Remove api_secret from updates to avoid double update
          const { api_secret, ...otherUpdates } = updates
          
          // Update other fields if any
          if (Object.keys(otherUpdates).length > 0) {
            const setClause = Object.keys(otherUpdates).map(key => `${key} = ?`).join(', ')
            const values = Object.values(otherUpdates)
            
            await this.db.prepare(`
              UPDATE stores 
              SET ${setClause}, updated_at = ? 
              WHERE id = ?
            `).bind(...values, new Date().toISOString(), id).run()
          }
        } catch (createError) {
          console.log('DatabaseService.updateStore: Failed to create api_secret column, skipping api_secret update')
          
          // If we can't create the column, update other fields only
          const { api_secret, ...otherUpdates } = updates
          
          if (Object.keys(otherUpdates).length > 0) {
            const setClause = Object.keys(otherUpdates).map(key => `${key} = ?`).join(', ')
            const values = Object.values(otherUpdates)
            
            await this.db.prepare(`
              UPDATE stores 
              SET ${setClause}, updated_at = ? 
              WHERE id = ?
            `).bind(...values, new Date().toISOString(), id).run()
          }
        }
      }
    } else {
      // No api_secret update, proceed normally
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
      const values = Object.values(updates)
      
      await this.db.prepare(`
        UPDATE stores 
        SET ${setClause}, updated_at = ? 
        WHERE id = ?
      `).bind(...values, new Date().toISOString(), id).run()
    }
  }

  async deleteStore(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM stores WHERE id = ?').bind(id).run()
  }

  async getAllStores(): Promise<Store[]> {
    const result = await this.db.prepare('SELECT * FROM stores ORDER BY created_at DESC').all<Store>()
    return result.results || []
  }

  // Order Management
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO orders (id, store_id, shopify_order_id, shopify_order_name, status, processed_data, raw_shopify_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, order.store_id, order.shopify_order_id, order.shopify_order_name, order.status, order.processed_data, order.raw_shopify_data, now, now).run()

    return {
      id,
      ...order,
      created_at: now,
      updated_at: now
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<Order>()
  }

  async getOrderByShopifyId(storeId: string, shopifyOrderId: number): Promise<Order | null> {
    return this.db.prepare('SELECT * FROM orders WHERE store_id = ? AND shopify_order_id = ?').bind(storeId, shopifyOrderId).first<Order>()
  }

  async deleteOrder(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run()
  }

  async updateOrder(id: string, updates: {
    shopify_order_name?: string
    status?: string
    processed_data?: string
    raw_shopify_data?: string
    exported_at?: string | null
    updated_at?: string
  }): Promise<void> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined)
    if (fields.length === 0) return

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => updates[field as keyof typeof updates])
    
    await this.db.prepare(`UPDATE orders SET ${setClause} WHERE id = ?`).bind(...values, id).run()
  }

  async deleteAllOrders(): Promise<void> {
    console.log('DatabaseService.deleteAllOrders: Starting DELETE FROM orders query...')
    
    // First, let's check how many orders exist
    const countResult = await this.db.prepare('SELECT COUNT(*) as count FROM orders').first<{count: number}>()
    const orderCount = countResult?.count || 0
    console.log(`DatabaseService.deleteAllOrders: Found ${orderCount} orders to delete`)
    
    // Delete all orders
    const result = await this.db.prepare('DELETE FROM orders').run()
    console.log('DatabaseService.deleteAllOrders: Query completed, result:', result)
    console.log(`DatabaseService.deleteAllOrders: Deleted ${result.changes} orders`)
    
    // Also clear webhook events to prevent reprocessing
    const webhookResult = await this.db.prepare('DELETE FROM webhook_events').run()
    console.log('DatabaseService.deleteAllOrders: Cleared webhook events, result:', webhookResult)
    console.log(`DatabaseService.deleteAllOrders: Deleted ${webhookResult.changes} webhook events`)
    
    // Verify deletion
    const verifyResult = await this.db.prepare('SELECT COUNT(*) as count FROM orders').first<{count: number}>()
    const remainingOrders = verifyResult?.count || 0
    console.log(`DatabaseService.deleteAllOrders: Verification - ${remainingOrders} orders remaining`)
  }

  async getOrdersByStore(storeId: string, limit = 200, offset = 0): Promise<Order[]> {
    try {
      console.log(`Database: Getting orders for store ${storeId} with limit ${limit} and offset ${offset}`)
      
      const result = await this.db.prepare(`
        SELECT * FROM orders 
        WHERE store_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(storeId, limit, offset).all<Order>()
      
      console.log(`Database: Found ${result.results?.length || 0} orders for store ${storeId}`)
      return result.results || []
    } catch (error) {
      console.error('Database: Error getting orders by store:', error)
      throw error
    }
  }

  async getAllOrders(limit = 200, offset = 0): Promise<Order[]> {
    try {
      console.log(`Database: Getting all orders with limit ${limit} and offset ${offset}`)
      
      const result = await this.db.prepare(`
        SELECT * FROM orders 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all<Order>()
      
      console.log(`Database: Found ${result.results?.length || 0} total orders`)
      return result.results || []
    } catch (error) {
      console.error('Database: Error getting all orders:', error)
      throw error
    }
  }

  async getOrdersByStatus(status: string, limit = 200, offset = 0): Promise<Order[]> {
    try {
      console.log(`Database: Getting orders with status ${status} with limit ${limit} and offset ${offset}`)
      
      const result = await this.db.prepare(`
        SELECT * FROM orders 
        WHERE status = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(status, limit, offset).all<Order>()
      
      console.log(`Database: Found ${result.results?.length || 0} orders with status ${status}`)
      return result.results || []
    } catch (error) {
      console.error('Database: Error getting orders by status:', error)
      throw error
    }
  }

  // Field Mapping Management
  async saveGlobalFieldMappings(storeId: string | null, mappings: GlobalFieldMapping[]): Promise<void> {
    try {
      console.log('Database: Saving global field mappings for storeId:', storeId, 'mappings:', mappings)
      
      // Delete existing mappings for this store
      if (storeId === null) {
        await this.db.prepare('DELETE FROM global_field_mappings WHERE store_id IS NULL').run()
      } else {
        await this.db.prepare('DELETE FROM global_field_mappings WHERE store_id = ?').bind(storeId).run()
      }
      
      // Insert new mappings if any
      if (mappings.length > 0) {
        const statements = mappings.map(mapping => 
          this.db.prepare(`
            INSERT INTO global_field_mappings (id, store_id, dashboard_field, shopify_fields, separator, no_mapping, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            generateUUID(),
            storeId,
            mapping.dashboardField,
            JSON.stringify(mapping.shopifyFields),
            mapping.separator,
            mapping.noMapping,
            new Date().toISOString(),
            new Date().toISOString()
          )
        )
        await this.db.batch(statements)
      }
      console.log('Database: Successfully saved global field mappings')
    } catch (error) {
      console.error('Database: Error saving global field mappings:', error)
      throw error
    }
  }

  async getGlobalFieldMappings(storeId?: string): Promise<GlobalFieldMapping[]> {
    try {
      console.log('Database: Getting global field mappings for storeId:', storeId)
      
      let result
      if (storeId === undefined || storeId === null) {
        result = await this.db.prepare(`
          SELECT * FROM global_field_mappings 
          WHERE store_id IS NULL 
          ORDER BY dashboard_field
        `).all<{
          id: string
          store_id: string | null
          dashboard_field: string
          shopify_fields: string
          separator: string
          no_mapping: boolean
          created_at: string
          updated_at: string
        }>()
      } else {
        result = await this.db.prepare(`
          SELECT * FROM global_field_mappings 
          WHERE store_id = ? 
          ORDER BY dashboard_field
        `).bind(storeId).all<{
          id: string
          store_id: string | null
          dashboard_field: string
          shopify_fields: string
          separator: string
          no_mapping: boolean
          created_at: string
          updated_at: string
        }>()
      }
      
      const mappings = (result.results || []).map(row => ({
        dashboardField: row.dashboard_field,
        shopifyFields: JSON.parse(row.shopify_fields),
        separator: row.separator,
        noMapping: row.no_mapping
      }))
      
      console.log('Database: Retrieved global field mappings:', mappings)
      return mappings
    } catch (error) {
      console.error('Database: Error getting global field mappings:', error)
      throw error
    }
  }

  async saveExtractProcessingMappings(storeId: string | null, mappings: ExtractProcessingMapping[]): Promise<void> {
    try {
      console.log('Database: Saving extract processing mappings for storeId:', storeId, 'mappings:', mappings)
      
      // Delete existing mappings for this store
      if (storeId === null) {
        await this.db.prepare('DELETE FROM extract_processing_mappings WHERE store_id IS NULL').run()
      } else {
        await this.db.prepare('DELETE FROM extract_processing_mappings WHERE store_id = ?').bind(storeId).run()
      }
      
      // Insert new mappings if any
      if (mappings.length > 0) {
        const statements = mappings.map(mapping => 
          this.db.prepare(`
            INSERT INTO extract_processing_mappings (id, store_id, dashboard_field, processing_type, source_field, format, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            generateUUID(),
            storeId,
            mapping.dashboardField,
            mapping.processingType,
            mapping.sourceField,
            mapping.format || null,
            new Date().toISOString(),
            new Date().toISOString()
          )
        )
        await this.db.batch(statements)
      }
      console.log('Database: Successfully saved extract processing mappings')
    } catch (error) {
      console.error('Database: Error saving extract processing mappings:', error)
      throw error
    }
  }

  async getExtractProcessingMappings(storeId?: string): Promise<ExtractProcessingMapping[]> {
    try {
      console.log('Database: Getting extract processing mappings for storeId:', storeId)
      
      let result
      if (storeId === undefined || storeId === null) {
        result = await this.db.prepare(`
          SELECT * FROM extract_processing_mappings 
          WHERE store_id IS NULL 
          ORDER BY dashboard_field
        `).all<{
          id: string
          store_id: string | null
          dashboard_field: string
          processing_type: string
          source_field: string
          format: string | null
          created_at: string
          updated_at: string
        }>()
      } else {
        result = await this.db.prepare(`
          SELECT * FROM extract_processing_mappings 
          WHERE store_id = ? 
          ORDER BY dashboard_field
        `).bind(storeId).all<{
          id: string
          store_id: string | null
          dashboard_field: string
          processing_type: string
          source_field: string
          format: string | null
          created_at: string
          updated_at: string
        }>()
      }
      
      const mappings = (result.results || []).map(row => ({
        dashboardField: row.dashboard_field,
        processingType: row.processing_type as 'date' | 'time' | 'description' | 'itemCount' | 'phone',
        sourceField: row.source_field,
        format: row.format || undefined
      }))
      
      console.log('Database: Retrieved extract processing mappings:', mappings)
      return mappings
    } catch (error) {
      console.error('Database: Error getting extract processing mappings:', error)
      throw error
    }
  }

  // Authentication
  async createUser(email: string, passwordHash: string): Promise<User> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, email, passwordHash, now, now).run()

    return {
      id,
      email,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>()
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>()
  }

  async createSession(userId: string, sessionToken: string, expiresAt: string): Promise<UserSession> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, userId, sessionToken, expiresAt, now).run()

    return {
      id,
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      created_at: now
    }
  }

  async getSessionByToken(sessionToken: string): Promise<UserSession | null> {
    return this.db.prepare(`
      SELECT * FROM user_sessions 
      WHERE session_token = ? AND expires_at > ?
    `).bind(sessionToken, new Date().toISOString()).first<UserSession>()
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await this.db.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run()
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.db.prepare('DELETE FROM user_sessions WHERE expires_at < ?').bind(new Date().toISOString()).run()
  }

  // Detrack Configuration
  async getDetrackConfig(): Promise<any> {
    const result = await this.db.prepare('SELECT * FROM detrack_config ORDER BY created_at DESC LIMIT 1').first()
    return result
  }

  async saveDetrackConfig(config: {
    apiKey: string
    baseUrl?: string
    isEnabled: boolean
  }): Promise<void> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    // Delete existing config
    await this.db.prepare('DELETE FROM detrack_config').run()
    
    // Insert new config
    await this.db.prepare(`
      INSERT INTO detrack_config (id, api_key, base_url, is_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      config.apiKey, 
      config.baseUrl || 'https://app.detrack.com/api/v2',
      config.isEnabled ? 1 : 0,
      now, 
      now
    ).run()
  }

  // Webhook Event Tracking
  async createWebhookEvent(storeId: string, topic: string, shopifyOrderId?: number): Promise<string> {
    const id = generateUUID()
    const now = new Date().toISOString()
    
    await this.db.prepare(`
      INSERT INTO webhook_events (id, store_id, topic, shopify_order_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, storeId, topic, shopifyOrderId || null, now).run()

    return id
  }

  async markWebhookEventProcessed(id: string, errorMessage?: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.prepare(`
      UPDATE webhook_events 
      SET processed = ?, processed_at = ?, error_message = ?
      WHERE id = ?
    `).bind(true, now, errorMessage || null, id).run()
  }

  // Product Labels Management
  async getProductLabelsForUser(userId: string): Promise<any[]> {
    const result = await this.db.prepare(`
      SELECT id, product_name, label, created_at, updated_at
      FROM product_labels 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all<any>()
    return result.results || []
  }

  async saveProductLabelsForUser(userId: string, productLabels: any[]): Promise<void> {
    // First, delete all existing product labels for this user
    await this.db.prepare('DELETE FROM product_labels WHERE user_id = ?').bind(userId).run()
    
    // Then insert the new ones
    if (productLabels.length > 0) {
      const statements = productLabels.map(label => 
        this.db.prepare(`
          INSERT INTO product_labels (id, user_id, product_name, label, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          label.id || generateUUID(),
          userId,
          label.productName,
          label.label,
          new Date().toISOString(),
          new Date().toISOString()
        )
      )
      await this.db.batch(statements)
    }
  }

  async deleteProductLabelsForUser(userId: string, labelIds: string[]): Promise<void> {
    if (labelIds.length > 0) {
      const placeholders = labelIds.map(() => '?').join(',')
      await this.db.prepare(`
        DELETE FROM product_labels 
        WHERE user_id = ? AND id IN (${placeholders})
      `).bind(userId, ...labelIds).run()
    }
  }

  // Driver Info Management
  async getDriverInfoForUser(userId: string): Promise<any[]> {
    const result = await this.db.prepare(`
      SELECT id, driver_name, paynow_number, detrack_id, contact_no, price_per_drop, created_at, updated_at
      FROM driver_info 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all<any>()
    return result.results || []
  }

  async saveDriverInfoForUser(userId: string, driverInfos: any[]): Promise<void> {
    // First, delete all existing driver info for this user
    await this.db.prepare('DELETE FROM driver_info WHERE user_id = ?').bind(userId).run()
    
    // Then insert the new ones
    if (driverInfos.length > 0) {
      const statements = driverInfos.map(driver => 
        this.db.prepare(`
          INSERT INTO driver_info (id, user_id, driver_name, paynow_number, detrack_id, contact_no, price_per_drop, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          driver.id || generateUUID(),
          userId,
          driver.driverName,
          driver.paynowNumber,
          driver.detrackId,
          driver.contactNo,
          driver.pricePerDrop,
          new Date().toISOString(),
          new Date().toISOString()
        )
      )
      await this.db.batch(statements)
    }
  }

  async deleteDriverInfoForUser(userId: string, infoIds: string[]): Promise<void> {
    if (infoIds.length === 0) return
    
    const placeholders = infoIds.map(() => '?').join(',')
    await this.db.prepare(`
      DELETE FROM driver_info 
      WHERE user_id = ? AND id IN (${placeholders})
    `).bind(userId, ...infoIds).run()
  }

  // Tag Filter Management
  async getTagFiltersForUser(userId: string, storeId?: string): Promise<any[]> {
    let query = 'SELECT * FROM tag_filters WHERE user_id = ?'
    const params = [userId]
    
    if (storeId) {
      query += ' AND store_id = ?'
      params.push(storeId)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const result = await this.db.prepare(query).bind(...params).all<any>()
    return result.results || []
  }

  async saveTagFilter(tagFilter: {
    id: string
    tag: string
    storeId: string
    userId: string
    createdAt: string
  }): Promise<void> {
    await this.db.prepare(`
      INSERT INTO tag_filters (id, tag, store_id, user_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tagFilter.id, tagFilter.tag, tagFilter.storeId, tagFilter.userId, tagFilter.createdAt).run()
  }

  async deleteTagFilter(filterId: string, userId: string): Promise<void> {
    await this.db.prepare(`
      DELETE FROM tag_filters 
      WHERE id = ? AND user_id = ?
    `).bind(filterId, userId).run()
  }

  // Saved Products Management
  async getSavedProductsForUser(userId: string, storeId?: string): Promise<any[]> {
    let query = 'SELECT * FROM saved_products WHERE user_id = ?'
    const params = [userId]
    
    if (storeId) {
      query += ' AND store_id = ?'
      params.push(storeId)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const result = await this.db.prepare(query).bind(...params).all<any>()
    return result.results || []
  }

  async saveProduct(product: {
    id: string
    productId: string
    title: string
    variantTitle: string
    price: string
    handle: string
    tags: string
    orderTags: string
    storeId: string
    storeDomain: string
    userId: string
    createdAt: string
  }): Promise<void> {
    await this.db.prepare(`
      INSERT INTO saved_products (id, product_id, title, variant_title, price, handle, tags, order_tags, store_id, store_domain, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product.id, 
      product.productId, 
      product.title, 
      product.variantTitle, 
      product.price, 
      product.handle, 
      product.tags, 
      product.orderTags, 
      product.storeId, 
      product.storeDomain, 
      product.userId, 
      product.createdAt
    ).run()
  }

  async deleteSavedProduct(productId: string, userId: string): Promise<void> {
    await this.db.prepare(`
      DELETE FROM saved_products 
      WHERE id = ? AND user_id = ?
    `).bind(productId, userId).run()
  }

  async isProductSaved(productId: string, userId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM saved_products 
      WHERE product_id = ? AND user_id = ?
    `).bind(productId, userId).first<{count: number}>()
    
    return result ? result.count > 0 : false
  }
} 