import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, X, Info, Save, Truck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  type ShopifyStore,
  type GlobalFieldMapping,
  type AppSettings,
  DASHBOARD_FIELD_LABELS,
  SHOPIFY_FIELDS,
  EXTRACT_PROCESSING_FIELDS,
} from "@/types"
import { storage } from "@/lib/storage"

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({ 
    shopifyStores: [], 
    globalFieldMappings: [],
    extractProcessingMappings: []
  })
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false)
  const [newStore, setNewStore] = useState({ name: "", url: "", apiKey: "", apiSecret: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [editingStore, setEditingStore] = useState<{ id: string, name: string, url: string, apiKey: string, apiSecret: string } | null>(null)
  
  // Detrack integration state
  const [detrackConfig, setDetrackConfig] = useState({
    apiKey: "",
    baseUrl: "https://app.detrack.com/api/v1",
    isEnabled: false
  })

  useEffect(() => {
    const loadedSettings = storage.getSettings()
    // Ensure we have the correct structure
    const safeSettings: AppSettings = {
      shopifyStores: loadedSettings.shopifyStores || [],
      globalFieldMappings: loadedSettings.globalFieldMappings || [],
      extractProcessingMappings: loadedSettings.extractProcessingMappings || []
    }
    setSettings(safeSettings)

    // Load stores from database
    loadStoresFromDatabase()
    
    // Load field mappings from database
    loadFieldMappingsFromDatabase()
    
    // Load Detrack configuration
    loadDetrackConfig()
  }, [])

  const loadStoresFromDatabase = async () => {
    try {
      const response = await fetch('/api/stores', { credentials: 'include' })
      if (response.ok) {
        const stores = await response.json()
        // Convert database store format to frontend format
        const frontendStores = stores.map((store: any) => ({
          id: store.id,
          name: store.store_name,
          url: store.shopify_domain,
          apiKey: store.access_token,
          connected: true
        }))
        setSettings(prev => ({
          ...prev,
          shopifyStores: frontendStores
        }))
      }
    } catch (error) {
      console.error('Error loading stores from database:', error)
    }
  }

  const loadFieldMappingsFromDatabase = async () => {
    try {
      const response = await fetch('/api/field-mappings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          globalFieldMappings: data.globalFieldMappings || [],
          extractProcessingMappings: data.extractProcessingMappings || []
        }))
      }
    } catch (error) {
      console.error('Error loading field mappings from database:', error)
    }
  }

  const loadDetrackConfig = async () => {
    try {
      const response = await fetch('/api/detrack/config', { credentials: 'include' })
      if (response.ok) {
        const config = await response.json()
        setDetrackConfig({
          apiKey: config.apiKey || '',
          baseUrl: config.baseUrl || 'https://app.detrack.com/api/v1',
          isEnabled: config.isEnabled || false
        })
      }
    } catch (error) {
      console.error('Error loading Detrack config:', error)
    }
  }

  const saveDetrackConfig = async () => {
    try {
      const response = await fetch('/api/detrack/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detrackConfig),
        credentials: 'include'
      })
      
      if (response.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    } catch (error) {
      console.error('Error saving Detrack config:', error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const testDetrackConnection = async () => {
    try {
      console.log('Testing Detrack connection...')
      
      // Test the Detrack API connection through our backend
      const response = await fetch('/api/detrack/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      console.log('Test connection response status:', response.status)
      
      if (response.ok) {
        alert('Detrack connection successful!')
      } else {
        const errorData = await response.json()
        console.error('Detrack connection error:', errorData)
        alert(`Detrack connection failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error testing Detrack connection:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error testing Detrack connection: ${errorMessage}`)
    }
  }

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.url || !newStore.apiKey) return

    try {
      // Save to backend database
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_name: newStore.name,
          shopify_domain: newStore.url,
          access_token: newStore.apiKey,
          api_secret: newStore.apiSecret,
          api_version: '2024-01', // Default API version
          webhook_secret: crypto.randomUUID() // Generate a proper webhook secret
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const createdStore = await response.json()
        
        // Add to frontend state
        const frontendStore = {
          id: createdStore.id,
          name: createdStore.store_name,
          url: createdStore.shopify_domain,
          apiKey: createdStore.access_token,
          connected: true,
        }

        setSettings(prev => ({
          ...prev,
          shopifyStores: [...prev.shopifyStores, frontendStore]
        }))
        
        setNewStore({ name: "", url: "", apiKey: "", apiSecret: "" })
        setIsAddStoreOpen(false)
      } else {
        console.error('Failed to create store:', await response.text())
      }
    } catch (error) {
      console.error('Error creating store:', error)
    }
  }

  const handleRemoveStore = async (storeId: string) => {
    try {
      // Delete from backend database
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Remove from frontend state
        setSettings(prev => ({
          ...prev,
          shopifyStores: prev.shopifyStores.filter(store => store.id !== storeId)
        }))
      } else {
        console.error('Failed to delete store:', await response.text())
      }
    } catch (error) {
      console.error('Error deleting store:', error)
    }
  }

  const handleRegisterWebhook = async (storeId: string) => {
    try {
      const response = await fetch(`/api/stores/${storeId}/register-webhook`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok) {
        alert('Webhook registered successfully!')
      } else {
        alert('Failed to register webhook: ' + (data.error || JSON.stringify(data)))
      }
    } catch (error) {
      console.error('Error registering webhook:', error)
      alert('Error registering webhook: ' + error)
    }
  }

  const handleEditStore = async () => {
    if (!editingStore) return

    try {
      const response = await fetch(`/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_name: editingStore.name,
          shopify_domain: editingStore.url,
          access_token: editingStore.apiKey,
          api_secret: editingStore.apiSecret
        }),
        credentials: 'include'
      })

      if (response.ok) {
        // Update frontend state
        setSettings(prev => ({
          ...prev,
          shopifyStores: prev.shopifyStores.map(store => 
            store.id === editingStore.id 
              ? { ...store, name: editingStore.name, url: editingStore.url, apiKey: editingStore.apiKey }
              : store
          )
        }))
        setEditingStore(null)
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        console.error('Failed to update store:', await response.text())
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    } catch (error) {
      console.error('Error updating store:', error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const handleFieldMappingChange = (
    dashboardField: string,
    shopifyField: string,
    action: "add" | "remove"
  ) => {
    const updatedMappings = [...(settings.globalFieldMappings || [])]
    const mappingIndex = updatedMappings.findIndex((m: GlobalFieldMapping) => m.dashboardField === dashboardField)

    if (mappingIndex === -1) {
      // Create new mapping
      if (action === "add" && shopifyField !== "no-mapping") {
        updatedMappings.push({
          dashboardField,
          shopifyFields: [shopifyField],
          separator: ", ",
          noMapping: false,
        })
      } else if (shopifyField === "no-mapping") {
        updatedMappings.push({
          dashboardField,
          shopifyFields: [],
          separator: "",
          noMapping: true,
        })
      }
    } else {
      // Update existing mapping
      const mapping = updatedMappings[mappingIndex]

      if (shopifyField === "no-mapping") {
        mapping.shopifyFields = []
        mapping.noMapping = true
      } else if (action === "add" && !mapping.shopifyFields.includes(shopifyField)) {
        mapping.shopifyFields.push(shopifyField)
        mapping.noMapping = false
      } else if (action === "remove") {
        mapping.shopifyFields = mapping.shopifyFields.filter((f: string) => f !== shopifyField)
        if (mapping.shopifyFields.length === 0) {
          mapping.noMapping = true
        }
      }
    }

    storage.updateFieldMappings(updatedMappings)
    const updatedSettings = storage.getSettings()
    setSettings(updatedSettings)
  }

  const handleSeparatorChange = (dashboardField: string, separator: string) => {
    const updatedMappings = [...(settings.globalFieldMappings || [])]
    const mappingIndex = updatedMappings.findIndex((m: GlobalFieldMapping) => m.dashboardField === dashboardField)

    if (mappingIndex !== -1) {
      updatedMappings[mappingIndex].separator = separator
      storage.updateFieldMappings(updatedMappings)
      const updatedSettings = storage.getSettings()
      setSettings(updatedSettings)
    }
  }

  const handleSaveFieldMappings = async () => {
    setIsSaving(true)
    setSaveStatus("idle")
    
    try {
      // Save to database via API
      const response = await fetch('/api/field-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          globalFieldMappings: settings.globalFieldMappings,
          extractProcessingMappings: settings.extractProcessingMappings
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save field mappings')
      }

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000) // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error saving field mappings:', error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000) // Clear error message after 3 seconds
    } finally {
      setIsSaving(false)
    }
  }

  const getFieldMapping = (dashboardField: string): GlobalFieldMapping | undefined => {
    return (settings.globalFieldMappings || []).find((m: GlobalFieldMapping) => m.dashboardField === dashboardField)
  }

  const isExtractProcessingField = (field: string): boolean => {
    return EXTRACT_PROCESSING_FIELDS.includes(field as any)
  }

  return (
    <div className="space-y-6">
      {/* Shopify Stores Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-olive-600">Shopify Stores</CardTitle>
            <Dialog open={isAddStoreOpen} onOpenChange={setIsAddStoreOpen}>
              <DialogTrigger asChild>
                <Button className="bg-olive-600 hover:bg-olive-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Shopify Store</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      value={newStore.name}
                      onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                      placeholder="My Shopify Store"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-url">Store URL</Label>
                    <Input
                      id="store-url"
                      value={newStore.url}
                      onChange={(e) => setNewStore({ ...newStore, url: e.target.value })}
                      placeholder="mystore.myshopify.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={newStore.apiKey}
                      onChange={(e) => setNewStore({ ...newStore, apiKey: e.target.value })}
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-secret">API Secret (Private App)</Label>
                    <Input
                      id="api-secret"
                      type="password"
                      value={newStore.apiSecret}
                      onChange={(e) => setNewStore({ ...newStore, apiSecret: e.target.value })}
                      placeholder="shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get this from your Shopify store's Private App settings
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddStoreOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddStore}
                      className="bg-olive-600 hover:bg-olive-700 text-white"
                    >
                      Add Store
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {settings.shopifyStores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No Shopify stores connected. Add a store to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {settings.shopifyStores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  {editingStore?.id === store.id ? (
                    // Edit mode
                    <div className="w-full space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`edit-name-${store.id}`}>Store Name</Label>
                          <Input
                            id={`edit-name-${store.id}`}
                            value={editingStore.name}
                            onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                            placeholder="My Shopify Store"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-url-${store.id}`}>Store URL</Label>
                          <Input
                            id={`edit-url-${store.id}`}
                            value={editingStore.url}
                            onChange={(e) => setEditingStore({ ...editingStore, url: e.target.value })}
                            placeholder="mystore.myshopify.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-api-key-${store.id}`}>API Key</Label>
                          <Input
                            id={`edit-api-key-${store.id}`}
                            type="password"
                            value={editingStore.apiKey}
                            onChange={(e) => setEditingStore({ ...editingStore, apiKey: e.target.value })}
                            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-api-secret-${store.id}`}>API Secret (Private App)</Label>
                          <Input
                            id={`edit-api-secret-${store.id}`}
                            type="password"
                            value={editingStore.apiSecret}
                            onChange={(e) => setEditingStore({ ...editingStore, apiSecret: e.target.value })}
                            placeholder="shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Get this from your Shopify store's Private App settings
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingStore(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleEditStore}
                          className="bg-olive-600 hover:bg-olive-700 text-white"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Normal view
                    <>
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium">{store.name}</h3>
                          <p className="text-sm text-muted-foreground">{store.url}</p>
                        </div>
                        <Badge className="bg-success text-success-foreground">Connected</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingStore({
                            id: store.id,
                            name: store.name,
                            url: store.url,
                            apiKey: store.apiKey,
                            apiSecret: "" // We don't show the current secret for security
                          })}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStore(store.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegisterWebhook(store.id)}
                          className="text-olive-600 hover:text-olive-700"
                        >
                          Register Webhook
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detrack Integration Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-olive-600 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Detrack Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your Detrack API key to enable order export functionality.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={detrackConfig.isEnabled ? "default" : "secondary"}>
                {detrackConfig.isEnabled ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="detrack-api-key">API Key</Label>
              <Input
                id="detrack-api-key"
                type="password"
                value={detrackConfig.apiKey}
                onChange={(e) => setDetrackConfig({ ...detrackConfig, apiKey: e.target.value })}
                placeholder="Your Detrack API Key"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the only credential required for Detrack integration. Get this from your Detrack account settings.
              </p>
            </div>
            
            <div>
              <Label htmlFor="detrack-base-url">API Base URL</Label>
              <Input
                id="detrack-base-url"
                value={detrackConfig.baseUrl}
                onChange={(e) => setDetrackConfig({ ...detrackConfig, baseUrl: e.target.value })}
                placeholder="https://connect.detrack.com/api/v1/"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: https://connect.detrack.com/api/v1/ (Detrack V1 API)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="detrack-enabled"
                checked={detrackConfig.isEnabled}
                onChange={(e) => setDetrackConfig({ ...detrackConfig, isEnabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="detrack-enabled">Enable Detrack Integration</Label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={saveDetrackConfig}
                className="bg-olive-600 hover:bg-olive-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
              <Button
                onClick={testDetrackConnection}
                variant="outline"
                disabled={!detrackConfig.apiKey}
              >
                Test Connection
              </Button>
            </div>

            {saveStatus === "success" && (
              <Badge className="bg-success text-success-foreground">
                Configuration saved successfully!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Mappings Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-olive-600">Field Mappings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how Shopify order data maps to dashboard fields. You can map multiple Shopify
                fields to a single dashboard field.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === "success" && (
                <Badge className="bg-success text-success-foreground">Saved!</Badge>
              )}
              {saveStatus === "error" && (
                <Badge className="bg-error text-error-foreground">Save Failed</Badge>
              )}
              <Button
                onClick={handleSaveFieldMappings}
                disabled={isSaving}
                className="bg-olive-600 hover:bg-olive-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Mappings"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(DASHBOARD_FIELD_LABELS).map(([field, label]) => {
              const mapping = getFieldMapping(field)
              const isExtractField = isExtractProcessingField(field)
              
              return (
                <div key={field} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{label}</Label>
                      {isExtractField && (
                        <Badge variant="outline" className="text-xs">
                          <Info className="w-3 h-3 mr-1" />
                          Auto-processed
                        </Badge>
                      )}
                    </div>
                    {!isExtractField && (
                      <Select
                        onValueChange={(value) => handleFieldMappingChange(field, value, "add")}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Add Shopify field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-mapping">No Mapping</SelectItem>
                          <Separator />
                          {/* Grouped Shopify fields for clarity */}
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Order Fields</div>
                          {SHOPIFY_FIELDS.filter(f => [
                            'id','name','order_number','email','phone','created_at','updated_at','processed_at','canceled_at','cancel_reason','currency','subtotal_price','total_price','total_tax','financial_status','fulfillment_status','tags','note','customer_locale','status_url','tracking_number','tracking_company','tracking_url'
                          ].includes(f)).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Customer Fields</div>
                          {SHOPIFY_FIELDS.filter(f => f.startsWith('customer.')).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Shipping Address Fields</div>
                          {SHOPIFY_FIELDS.filter(f => f.startsWith('shipping_address.')).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Billing Address Fields</div>
                          {SHOPIFY_FIELDS.filter(f => f.startsWith('billing_address.')).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Line Item Fields</div>
                          {SHOPIFY_FIELDS.filter(f => f.startsWith('line_items.')).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Fulfillment Fields</div>
                          {SHOPIFY_FIELDS.filter(f => f.startsWith('fulfillments.')).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Advanced/Misc Fields</div>
                          {SHOPIFY_FIELDS.filter(f => [
                            'metafields','discount_applications','shipping_lines','billing_address','shipping_address','customer','line_items','fulfillments'
                          ].includes(f)).map(shopifyField => (
                            <SelectItem key={shopifyField} value={shopifyField}>{shopifyField}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {isExtractField ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <p className="text-sm text-muted-foreground">
                          This field is automatically processed by the system using special logic:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          {field === 'deliveryDate' && (
                            <li>• Extracted from order tags with format "delivery:YYYY-MM-DD"</li>
                          )}
                          {field === 'processingDate' && (
                            <li>• Extracted from order tags with format "processing:YYYY-MM-DD"</li>
                          )}
                          {field === 'jobReleaseTime' && (
                            <li>• Extracted from order tags with format "release:HH:MM"</li>
                          )}
                          {field === 'deliveryCompletionTimeWindow' && (
                            <li>• Extracted from order tags with format "window:HH:MM-HH:MM"</li>
                          )}
                          {field === 'description' && (
                            <li>• Combined from line item titles and variant titles</li>
                          )}
                          {field === 'itemCount' && (
                            <li>• Sum of all line item quantities</li>
                          )}
                          {field === 'noOfShippingLabels' && (
                            <li>• Count of line items</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <>
                      {mapping && !mapping.noMapping && mapping.shopifyFields.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {mapping.shopifyFields.map((shopifyField) => (
                              <Badge
                                key={shopifyField}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {shopifyField}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFieldMappingChange(field, shopifyField, "remove")
                                  }
                                  className="ml-1 hover:text-error"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>

                          {mapping.shopifyFields.length > 1 && (
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`separator-${field}`} className="text-sm">
                                Separator:
                              </Label>
                              <Input
                                id={`separator-${field}`}
                                value={mapping.separator}
                                onChange={(e) => handleSeparatorChange(field, e.target.value)}
                                className="w-20"
                                placeholder=", "
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {mapping?.noMapping && (
                        <Badge variant="outline" className="text-muted-foreground">
                          No Mapping - Field will be empty
                        </Badge>
                      )}
                    </>
                  )}

                  <Separator />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
