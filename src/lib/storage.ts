import type { Order, AppSettings, ShopifyStore, GlobalFieldMapping, DashboardColumnConfig, AutoClearSettings } from "@/types"

const ORDERS_KEY = "shopify-orders"
const SETTINGS_KEY = "app-settings"
const AUTO_CLEAR_SETTINGS_KEY = "auto-clear-settings"

// Migration function to handle old data format
const migrateSettings = (stored: any): AppSettings => {
  // If it's already in the new format, return as is
  if (stored.globalFieldMappings !== undefined) {
    return stored
  }

  // Migrate from old format to new format
  const migrated: AppSettings = {
    shopifyStores: stored.shopifyStores || [],
    globalFieldMappings: stored.fieldMappings || [],
    extractProcessingMappings: stored.extractProcessingMappings || [],
    dashboardConfig: stored.dashboardConfig || undefined
  }

  // Save the migrated data
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(migrated))
  
  return migrated
}

export const storage = {
  // Orders
  getOrders: (): Order[] => {
    const stored = localStorage.getItem(ORDERS_KEY)
    return stored ? JSON.parse(stored) : []
  },

  saveOrders: (orders: Order[]): void => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  },

  addOrder: (order: Order): void => {
    const orders = storage.getOrders()
    orders.push(order)
    storage.saveOrders(orders)
  },

  updateOrder: (orderId: string, updates: Partial<Order>): void => {
    const orders = storage.getOrders()
    const index = orders.findIndex((order) => order.id === orderId)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates }
      storage.saveOrders(orders)
    }
  },

  deleteOrder: (orderId: string): void => {
    const orders = storage.getOrders()
    const filtered = orders.filter((order) => order.id !== orderId)
    storage.saveOrders(filtered)
  },

  // Settings
  getSettings: (): AppSettings => {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) {
      const defaultSettings: AppSettings = {
        shopifyStores: [],
        globalFieldMappings: [],
        extractProcessingMappings: [],
        dashboardConfig: undefined
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings))
      return defaultSettings
    }
    
    const parsed = JSON.parse(stored)
    return migrateSettings(parsed)
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  },

  addShopifyStore: (store: ShopifyStore): void => {
    const settings = storage.getSettings()
    settings.shopifyStores.push(store)
    storage.saveSettings(settings)
  },

  updateShopifyStore: (storeId: string, updates: Partial<ShopifyStore>): void => {
    const settings = storage.getSettings()
    const index = settings.shopifyStores.findIndex((store) => store.id === storeId)
    if (index !== -1) {
      settings.shopifyStores[index] = { ...settings.shopifyStores[index], ...updates }
      storage.saveSettings(settings)
    }
  },

  removeShopifyStore: (storeId: string): void => {
    const settings = storage.getSettings()
    settings.shopifyStores = settings.shopifyStores.filter((store) => store.id !== storeId)
    storage.saveSettings(settings)
  },

  updateFieldMappings: (mappings: GlobalFieldMapping[]): void => {
    const settings = storage.getSettings()
    settings.globalFieldMappings = mappings
    storage.saveSettings(settings)
  },

  // Dashboard Configuration
  getDashboardConfig: (): DashboardColumnConfig[] => {
    const settings = storage.getSettings()
    return settings.dashboardConfig?.columnConfigs || []
  },

  saveDashboardConfig: (columnConfigs: DashboardColumnConfig[]): void => {
    const settings = storage.getSettings()
    if (!settings.dashboardConfig) {
      settings.dashboardConfig = { columnConfigs: [] }
    }
    settings.dashboardConfig.columnConfigs = columnConfigs
    storage.saveSettings(settings)
  },

  updateDashboardConfig: (columnConfigs: DashboardColumnConfig[]): void => {
    storage.saveDashboardConfig(columnConfigs)
  },

  // Auto-clear settings
  getAutoClearSettings: (): AutoClearSettings => {
    const stored = localStorage.getItem(AUTO_CLEAR_SETTINGS_KEY)
    if (!stored) {
      const defaultSettings: AutoClearSettings = {
        enabled: false,
        delayMinutes: 30,
        showConfirmation: true
      }
      localStorage.setItem(AUTO_CLEAR_SETTINGS_KEY, JSON.stringify(defaultSettings))
      return defaultSettings
    }
    return JSON.parse(stored)
  },

  saveAutoClearSettings: (settings: AutoClearSettings): void => {
    localStorage.setItem(AUTO_CLEAR_SETTINGS_KEY, JSON.stringify(settings))
  },
}
