import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Calendar, Clock, RefreshCw, Menu, X, Smartphone, Monitor } from "lucide-react"
import { type Order, DASHBOARD_FIELD_LABELS, type DashboardColumnConfig } from "@/types"
import { storage } from "@/lib/storage"
import { useIsMobile } from "@/components/hooks/use-mobile"

export function Dashboard({ 
  viewMode = 'auto', 
  onViewModeChange 
}: { 
  viewMode?: 'auto' | 'mobile' | 'desktop'
  onViewModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void 
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [fetchingOrders, setFetchingOrders] = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ orderId: string; field: keyof Order } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>('all')
  const [columnConfigs, setColumnConfigs] = useState<DashboardColumnConfig[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(200)
  const [totalOrderCount, setTotalOrderCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [productLabels, setProductLabels] = useState<any[]>([])

  const isMobile = useIsMobile()
  const actualViewMode = viewMode === 'auto' ? (isMobile ? 'mobile' : 'desktop') : viewMode

  const [resizing, setResizing] = useState<{
    field: keyof Order
    startX: number
    startWidth: number
  } | null>(null)
  
  // Helper function to extract base order ID from line item ID
  const getBaseOrderId = (lineItemId: string): string => {
    // Line item IDs have format: "orderId-index" (e.g., "cf3d7af2-2675-4cd4-99bc-dade2374cf6f-0")
    // We need to extract just the orderId part
    return lineItemId.includes('-') ? lineItemId.split('-').slice(0, -1).join('-') : lineItemId
  }
  
  // Load global field mappings from storage
  const [globalFieldMappings, setGlobalFieldMappings] = useState<any[]>([])
  useEffect(() => {
    const settings = storage.getSettings()
    setGlobalFieldMappings(settings.globalFieldMappings || [])
  }, [])

  // Helper to check if a field is noMapping
  const isNoMapping = (field: string) => {
    const mapping = globalFieldMappings.find((m) => m.dashboardField === field)
    return mapping && mapping.noMapping
  }

  // Load saved column configuration on mount
  useEffect(() => {
    const savedConfigs = storage.getDashboardConfig()
    if (savedConfigs.length > 0) {
      setColumnConfigs(savedConfigs)
    } else {
      // Initialize with default configuration
      const allFields = Object.keys(DASHBOARD_FIELD_LABELS) as (keyof Order)[]
      const defaultConfigs: DashboardColumnConfig[] = allFields.map((field) => ({
        field,
        width: field === "address" || field === "instructions" ? 200 : 120,
        visible: true,
      }))
      setColumnConfigs(defaultConfigs)
      storage.saveDashboardConfig(defaultConfigs)
    }
  }, [])

  // Auto-save column configuration when it changes
  useEffect(() => {
    if (columnConfigs.length > 0) {
      storage.saveDashboardConfig(columnConfigs)
    }
  }, [columnConfigs])

  // Load product labels from server
  useEffect(() => {
    const loadProductLabels = async () => {
      try {
        const response = await fetch('/api/config/product-labels', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setProductLabels(data.productLabels || [])
        }
      } catch (error) {
        console.error('Error loading product labels:', error)
      }
    }
    
    loadProductLabels()
  }, [])

  // Filter orders based on date and timeslot
  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    const deliveryDate = order.deliveryDate
    const timeWindow = order.deliveryCompletionTimeWindow

    // Date filter
    if (selectedDate && selectedDate !== "all" && deliveryDate !== selectedDate) {
      return false
    }

    // Timeslot filter
    if (selectedTimeslot && selectedTimeslot !== "all" && timeWindow !== selectedTimeslot) {
      return false
    }

    return true
  }) : []

  // Get unique dates and timeslots for filter options
  const uniqueDates = Array.isArray(orders) ? Array.from(new Set(orders.map(order => order.deliveryDate).filter(Boolean))) : []
  const uniqueTimeslots = Array.isArray(orders) ? Array.from(new Set(orders.map(order => order.deliveryCompletionTimeWindow).filter(Boolean))) : []

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders)
    if (checked) {
      newSelected.add(orderId)
    } else {
      newSelected.delete(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(filteredOrders.map((order) => order.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleCellClick = (orderId: string, field: keyof Order, currentValue: string) => {
    if (field === "status") return // Status is not directly editable
    setEditingCell({ orderId, field })
    setEditValue(currentValue)
  }

  const handleCellSave = () => {
    if (!editingCell) return

    // TODO: Update order in database instead of localStorage
    // For now, just refresh from database
    loadOrdersFromDatabase()
    setEditingCell(null)
    setEditValue("")
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave()
    } else if (e.key === "Escape") {
      handleCellCancel()
    }
  }

  const handleExportToDetrack = async () => {
    // Safety check to ensure orders is an array
    if (!Array.isArray(orders)) {
      console.error('Orders is not an array:', orders)
      alert('Error: Orders data is not properly loaded. Please refresh the page.')
      return
    }

    const selectedOrdersList = orders.filter((order) => selectedOrders.has(order.id))
    
    if (selectedOrdersList.length === 0) {
      alert('No orders selected for export')
      return
    }

    try {
      console.log(`Exporting ${selectedOrdersList.length} orders to Detrack...`)
      
      // Call the real API endpoint
      const response = await fetch('/api/export/detrack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: selectedOrdersList.map(order => order.id)
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Export result:', result)

      if (result.success) {
        // Show success message with summary
        const summary = result.summary
        alert(`Export completed!\n\nTotal: ${summary.total}\nSuccess: ${summary.success}\nErrors: ${summary.errors}`)
        
        // Refresh orders to show updated statuses
        await loadOrdersFromDatabase()
        setSelectedOrders(new Set())
      } else {
        throw new Error('Export failed')
      }

    } catch (error) {
      console.error('Error exporting to Detrack:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleColumnVisibilityChange = (field: keyof Order, visible: boolean) => {
    setColumnConfigs((prev) =>
      prev.map((config) => (config.field === field ? { ...config, visible } : config))
    )
  }

  const handleResizeStart = (e: React.MouseEvent, field: keyof Order) => {
    e.preventDefault()
    const config = columnConfigs.find((c) => c.field === field)
    if (config) {
      setResizing({
        field,
        startX: e.clientX,
        startWidth: config.width,
      })
    }
  }

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return

      const deltaX = e.clientX - resizing.startX
      const newWidth = Math.max(80, resizing.startWidth + deltaX) // Minimum width of 80px

      setColumnConfigs((prev) =>
        prev.map((config) =>
          config.field === resizing.field ? { ...config, width: newWidth } : config
        )
      )
    },
    [resizing]
  )

  const handleResizeEnd = useCallback(() => {
    setResizing(null)
  }, [])

  useEffect(() => {
    if (resizing) {
      document.addEventListener("mousemove", handleResizeMove)
      document.addEventListener("mouseup", handleResizeEnd)
      return () => {
        document.removeEventListener("mousemove", handleResizeMove)
        document.removeEventListener("mouseup", handleResizeEnd)
      }
    }
  }, [resizing, handleResizeMove, handleResizeEnd])

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Ready for Export":
        return <Badge className="bg-warning text-warning-foreground">Ready for Export</Badge>
      case "Exported":
        return <Badge className="bg-success text-success-foreground">Exported</Badge>
      case "Error":
        return <Badge className="bg-error text-error-foreground">Error</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderCell = (order: Order, field: keyof Order) => {
    const value = order[field] as string
    const isEditing = editingCell?.orderId === order.id && editingCell?.field === field

    if (field === "status") {
      if (isNoMapping("status")) {
        return <span>-</span>
      }
      return getStatusBadge(order.status)
    }

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
          autoFocus
        />
      )
    }

    return (
      <button
        type="button"
        className="min-h-[32px] px-2 py-1 hover:bg-dust-100 rounded text-xs w-full text-left"
        onClick={() => handleCellClick(order.id, field, value)}
      >
        {value || "-"}
      </button>
    )
  }

  const visibleColumns = columnConfigs.filter((config) => config.visible)
  
  // Calculate stats based on unique orders (not line items)
  const uniqueOrderIds = new Set(filteredOrders.map(order => {
    // Extract base order ID from line item ID (format: "orderId-index")
    const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
    return baseOrderId
  }))
  
  const totalOrders = uniqueOrderIds.size
  
  // Count statuses based on unique orders
  const orderStatusMap = new Map<string, string>()
  filteredOrders.forEach(order => {
    const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
    // Only update if we haven't seen this order before, or if current status is more important
    if (!orderStatusMap.has(baseOrderId) || order.status === 'Error') {
      orderStatusMap.set(baseOrderId, order.status)
    }
  })
  
  const errors = Array.from(orderStatusMap.values()).filter(status => status === "Error").length

  // Calculate orders by store prefix
  const storeBreakdown = new Map<string, number>()
  
  // Group orders by base order ID to count unique orders
  const uniqueOrders = new Map<string, Order>()
  filteredOrders.forEach(order => {
    const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
    if (!uniqueOrders.has(baseOrderId)) {
      uniqueOrders.set(baseOrderId, order)
    }
  })
  
  // Count unique orders by store prefix
  uniqueOrders.forEach(order => {
    const orderNumber = order.deliveryOrderNo || ''
    
    // Extract prefix from order number (e.g., "#WF" from "#WF10000")
    const prefixMatch = orderNumber.match(/^#([A-Z]+)/)
    const prefix = prefixMatch ? prefixMatch[1] : 'Unknown'
    
    if (!storeBreakdown.has(prefix)) {
      storeBreakdown.set(prefix, 0)
    }
    storeBreakdown.set(prefix, storeBreakdown.get(prefix)! + 1)
  })
  
  // Convert to sorted array for display
  const storeBreakdownArray = Array.from(storeBreakdown.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, 3) // Show top 3 stores

  // Calculate Express orders
  const expressOrders = filteredOrders.filter(order => {
    const description = (order.description || '').toLowerCase()
    return description.includes('express')
  })

  // Group express orders by unique order (to avoid duplicates from line items)
  const uniqueExpressOrders = new Map<string, { deliveryOrderNo: string; fullLineItem: string; address: string }>()
  expressOrders.forEach(order => {
    const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
    if (!uniqueExpressOrders.has(baseOrderId)) {
      uniqueExpressOrders.set(baseOrderId, {
        deliveryOrderNo: order.deliveryOrderNo || '',
        fullLineItem: order.description || '', // This contains the full line item title + variant title
        address: order.address || ''
      })
    }
  })
  
  const expressOrdersArray = Array.from(uniqueExpressOrders.values())

  // Get product names that have label "Stand"
  const standProductNames = productLabels
    .filter(product => product.label.toLowerCase() === 'stand')
    .map(product => product.productName.toLowerCase())

  // Filter orders for Flower Stands
  const flowerStandOrders = filteredOrders.filter(order => {
    const description = (order.description || '').toLowerCase()
    return standProductNames.some(productName => description.includes(productName))
  })

  // Group flower stand orders by unique order (to avoid duplicates from line items)
  const uniqueFlowerStandOrders = new Map<string, { deliveryOrderNo: string; fullLineItem: string; address: string }>()
  flowerStandOrders.forEach(order => {
    const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
    if (!uniqueFlowerStandOrders.has(baseOrderId)) {
      uniqueFlowerStandOrders.set(baseOrderId, {
        deliveryOrderNo: order.deliveryOrderNo || '',
        fullLineItem: order.description || '',
        address: order.address || ''
      })
    }
  })
  
  const flowerStandOrdersArray = Array.from(uniqueFlowerStandOrders.values())

  // Load orders from database
  const loadOrdersFromDatabase = async (page = currentPage, size = pageSize) => {
    try {
      setLoadingOrders(true)
      console.log(`Loading orders from database... page ${page}, size ${size}`)
      
      const offset = (page - 1) * size
      const response = await fetch(`/api/orders?limit=${size}&offset=${offset}`, { credentials: 'include' })
      console.log('Load orders response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Orders loaded from database:', data)
        
        // Handle both array response (current) and object response (legacy)
        let ordersArray: Order[]
        let totalCount: number
        
        if (Array.isArray(data)) {
          // Current format: direct array of orders
          ordersArray = data
          totalCount = data.length // For now, assume this is the total. We'll need to get actual total count
        } else if (data && typeof data === 'object' && 'orders' in data) {
          // Legacy format: object with orders and totalCount
          ordersArray = data.orders || []
          totalCount = data.totalCount || 0
        } else {
          console.error('Unexpected response format:', data)
          ordersArray = []
          totalCount = 0
        }
        
        console.log('Number of orders loaded:', ordersArray.length)
        console.log('Sample order:', ordersArray[0] || 'No orders')
        setOrders(ordersArray)
        setTotalOrderCount(totalCount)
        setCurrentPage(page)
        console.log('Orders state updated with', ordersArray.length, 'orders')
      } else {
        const errorText = await response.text()
        console.error('Failed to load orders from database:', errorText)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  // Load orders on mount
  useEffect(() => {
    loadOrdersFromDatabase()
  }, [])

  // Fetch orders from Shopify API
  const handleFetchOrders = async () => {
    setFetchingOrders(true)
    setFetchResult(null)
    try {
      console.log('Fetching orders from Shopify...')
      const response = await fetch('/api/fetch-orders', { method: 'POST', credentials: 'include' })
      const data = await response.json()
      console.log('Fetch response:', data)
      
      if (data.success) {
        // Show results summary first
        if (data.results && data.results.length > 0) {
          const summary = data.results.map((r: any) => 
            `${r.storeName}: fetched ${r.fetched}, saved ${r.saved}${r.errors.length ? ", errors: " + r.errors.join('; ') : ''}`
          ).join('\n')
          setFetchResult(summary)
        } else {
          setFetchResult('No stores configured. Please add Shopify stores in Settings first.')
        }
        
        // Add a small delay to ensure database updates are complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Refresh orders from database, reset to page 1 to see newest orders
        console.log('Refreshing orders from database after fetch...')
        await loadOrdersFromDatabase(1, pageSize)
        
      } else {
        setFetchResult('Failed to fetch orders: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Fetch orders error:', error)
      setFetchResult('Error: ' + error.message)
    } finally {
      setFetchingOrders(false)
    }
  }

  // Bulk delete selected orders
  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) {
      setFetchResult('No orders selected for deletion')
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedOrders.size} selected order(s)?`)) {
      try {
        console.log(`Attempting to delete ${selectedOrders.size} orders...`)
        
        // Convert line item IDs to base order IDs and remove duplicates
        const baseOrderIds = Array.from(selectedOrders).map(getBaseOrderId)
        const uniqueOrderIds = [...new Set(baseOrderIds)]
        
        console.log(`Selected line items: ${Array.from(selectedOrders).join(', ')}`)
        console.log(`Unique base order IDs: ${uniqueOrderIds.join(', ')}`)
        
        // Delete selected orders from database with proper error handling
        const deleteResults = await Promise.allSettled(
          uniqueOrderIds.map(async (orderId) => {
            console.log(`Deleting order: ${orderId}`)
            const response = await fetch(`/api/orders/${orderId}`, { 
              method: 'DELETE', 
              credentials: 'include' 
            })
            
            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`HTTP ${response.status}: ${errorText}`)
            }
            
            const result = await response.json()
            console.log(`Successfully deleted order: ${orderId}`, result)
            return { orderId, success: true }
          })
        )
        
        // Count successes and failures
        const successful = deleteResults.filter(result => result.status === 'fulfilled').length
        const failed = deleteResults.filter(result => result.status === 'rejected').length
        
        console.log(`Delete operation completed: ${successful} successful, ${failed} failed`)
        
        if (failed > 0) {
          const errors = deleteResults
            .filter(result => result.status === 'rejected')
            .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown error')
          console.error('Delete errors:', errors)
          setFetchResult(`Deleted ${successful} orders, but ${failed} failed: ${errors.join(', ')}`)
        } else {
          setFetchResult(`Successfully deleted ${successful} order(s)`)
        }
        
        // Refresh orders from database, reset to page 1
        await loadOrdersFromDatabase(1, pageSize)
        
        // Clear selection
        setSelectedOrders(new Set())
        
      } catch (error: any) {
        console.error('Error in bulk delete operation:', error)
        setFetchResult('Error deleting orders: ' + error.message)
      }
    }
  }

  // Clear all orders
  const handleClearAllOrders = async () => {
    if (confirm('Are you sure you want to delete all orders from the database and start fresh?')) {
      try {
        console.log('=== FRONTEND: Starting clear all orders operation ===')
        console.log('Current orders count:', orders.length)
        console.log('Current page:', currentPage)
        console.log('Page size:', pageSize)
        
        // Delete all orders from database using bulk endpoint
        console.log('FRONTEND: Making DELETE request to /api/orders/clear-all')
        const response = await fetch('/api/orders/clear-all', { 
          method: 'DELETE', 
          credentials: 'include' 
        })
        
        console.log('FRONTEND: Clear all response status:', response.status)
        console.log('FRONTEND: Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('FRONTEND: Clear all error response:', errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const responseData = await response.json()
        console.log('FRONTEND: Clear all response data:', responseData)
        
        console.log('FRONTEND: Refreshing orders from database...')
        // Refresh orders from database, reset to page 1
        await loadOrdersFromDatabase(1, pageSize)
        
        // Clear selection
        setSelectedOrders(new Set())
        
        // Show success message
        setFetchResult('Successfully cleared all orders from the database')
        console.log('FRONTEND: Clear all orders operation completed successfully')
      } catch (error: any) {
        console.error('=== FRONTEND: Error clearing orders ===')
        console.error('Error details:', error)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        setFetchResult('Error clearing orders: ' + error.message)
      }
    }
  }

  const handleReprocessOrders = async () => {
    if (confirm('Are you sure you want to reprocess all orders? This will re-fetch and process all orders from Shopify.')) {
      try {
        setFetchingOrders(true)
        setFetchResult(null)
        
        console.log('Starting order reprocessing...')
        const response = await fetch('/api/reprocess-orders', { 
          method: 'POST', 
          credentials: 'include' 
        })
        
        console.log('Reprocess response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Reprocess error response:', errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const responseData = await response.json()
        console.log('Reprocess response data:', responseData)
        
        // Refresh orders from database, reset to page 1
        await loadOrdersFromDatabase(1, pageSize)
        
        // Show success message
        setFetchResult('Successfully reprocessed all orders from Shopify')
        console.log('Order reprocessing completed successfully')
        
      } catch (error: any) {
        console.error('Error reprocessing orders:', error)
        setFetchResult('Error reprocessing orders: ' + error.message)
      } finally {
        setFetchingOrders(false)
      }
    }
  }

  const handleExportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export')
      return
    }

    try {
      // Get visible columns
      const visibleColumns = columnConfigs.filter(config => config.visible)
      
      // Create CSV header
      const headers = visibleColumns.map(config => DASHBOARD_FIELD_LABELS[config.field])
      const csvHeader = headers.join(',')
      
      // Create CSV rows
      const csvRows = filteredOrders.map(order => {
        return visibleColumns.map(config => {
          const value = order[config.field] || ''
          // Escape commas and quotes in CSV values
          const escapedValue = String(value).replace(/"/g, '""')
          return `"${escapedValue}"`
        }).join(',')
      })
      
      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n')
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `detrackify-orders-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Show success message
      setFetchResult(`Successfully exported ${filteredOrders.length} orders to CSV`)
      
    } catch (error: any) {
      console.error('Error exporting to CSV:', error)
      setFetchResult('Error exporting to CSV: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders Dashboard</h2>
      {fetchResult && (
        <div className="mb-4 p-3 bg-muted/50 border rounded text-sm whitespace-pre-wrap">
          {fetchResult}
        </div>
      )}
      {/* Stats Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-olive-600">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-error">{errors}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Store Breakdown</p>
            {storeBreakdownArray.length > 0 ? (
              <div className="space-y-1">
                {storeBreakdownArray.map(([prefix, count]) => (
                  <div key={prefix} className="flex justify-between text-sm">
                    <span className="text-blue-700 font-medium">{prefix}:</span>
                    <span className="text-muted-foreground font-bold text-base">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-2">
                No orders found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Express Orders Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-purple-600">{expressOrdersArray.length}</div>
              <p className="text-xs text-muted-foreground">Express Orders</p>
            </div>
          </div>
          {expressOrdersArray.length > 0 ? (
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {expressOrdersArray.map((order, index) => (
                <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-700 text-sm">{order.deliveryOrderNo}</div>
                  <div className="text-muted-foreground text-xs truncate" title={order.fullLineItem}>
                    {order.fullLineItem}
                  </div>
                  <div className="text-muted-foreground text-xs truncate mt-1" title={order.address}>
                    📍 {order.address}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              No Express orders found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flower Stands Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-green-600">{flowerStandOrdersArray.length}</div>
              <p className="text-xs text-muted-foreground">Flower Stands</p>
            </div>
          </div>
          {flowerStandOrdersArray.length > 0 ? (
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {flowerStandOrdersArray.map((order, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium text-green-700 text-sm">{order.deliveryOrderNo}</div>
                  <div className="text-muted-foreground text-xs truncate" title={order.fullLineItem}>
                    {order.fullLineItem}
                  </div>
                  <div className="text-muted-foreground text-xs truncate mt-1" title={order.address}>
                    📍 {order.address}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              No Flower Stands found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons - moved here */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button 
          onClick={handleBulkDelete} 
          disabled={selectedOrders.size === 0}
          variant="destructive"
          className="flex items-center gap-2"
        >
          Delete Selected ({selectedOrders.size})
        </Button>
        <Button 
          onClick={handleClearAllOrders} 
          variant="destructive"
          className="flex items-center gap-2"
        >
          Clear All Orders
        </Button>
        <Button 
          onClick={handleFetchOrders} 
          disabled={fetchingOrders} 
          className="flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white"
        >
          <RefreshCw className={fetchingOrders ? "animate-spin" : ""} />
          {fetchingOrders ? "Fetching..." : "Fetch Orders from Shopify"}
        </Button>
        <Button 
          onClick={handleReprocessOrders} 
          disabled={fetchingOrders} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={fetchingOrders ? "animate-spin" : ""} />
          {fetchingOrders ? "Reprocessing..." : "Reprocess Orders"}
        </Button>
        <Button 
          onClick={handleExportToCSV} 
          disabled={fetchingOrders} 
          className="flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white"
        >
          <RefreshCw className={fetchingOrders ? "animate-spin" : ""} />
          {fetchingOrders ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>

      {/* Orders Dashboard Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-olive-600">Order Dashboard</CardTitle>
          </div>
          
          {/* Controls Section */}
          <div className="flex justify-between items-center mt-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Desktop Controls */}
            <div className={`gap-2 ${isMobile ? 'hidden' : 'flex'}`}>
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by date..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timeslot Filter */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedTimeslot} onValueChange={setSelectedTimeslot}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by timeslot..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Timeslots</SelectItem>
                    {uniqueTimeslots.map((timeslot) => (
                      <SelectItem key={timeslot} value={timeslot}>
                        {timeslot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {columnConfigs.map((config) => (
                    <DropdownMenuCheckboxItem
                      key={config.field}
                      checked={config.visible}
                      onCheckedChange={(checked) =>
                        handleColumnVisibilityChange(config.field, checked as boolean)
                      }
                    >
                      {DASHBOARD_FIELD_LABELS[config.field]}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={handleExportToDetrack}
                disabled={selectedOrders.size === 0}
                className="bg-olive-600 hover:bg-olive-700 text-white"
              >
                Export to Detrack ({selectedOrders.size})
              </Button>
              <Button
                onClick={handleExportToCSV}
                disabled={filteredOrders.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Export to CSV ({filteredOrders.length})
              </Button>
            </div>
          </div>
          
          {/* Mobile Controls Menu */}
          {isMobile && mobileMenuOpen && (
            <div className="mt-4 space-y-3 border-t pt-4">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by date..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timeslot Filter */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedTimeslot} onValueChange={setSelectedTimeslot}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by timeslot..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Timeslots</SelectItem>
                    {uniqueTimeslots.map((timeslot) => (
                      <SelectItem key={timeslot} value={timeslot}>
                        {timeslot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {columnConfigs.map((config) => (
                      <DropdownMenuCheckboxItem
                        key={config.field}
                        checked={config.visible}
                        onCheckedChange={(checked) =>
                          handleColumnVisibilityChange(config.field, checked as boolean)
                        }
                      >
                        {DASHBOARD_FIELD_LABELS[config.field]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleExportToDetrack}
                  disabled={selectedOrders.size === 0}
                  className="bg-olive-600 hover:bg-olive-700 text-white flex-1"
                >
                  Export ({selectedOrders.size})
                </Button>
              </div>
              
              {/* CSV Export for Mobile */}
              <div className="flex gap-2">
                <Button
                  onClick={handleExportToCSV}
                  disabled={filteredOrders.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  Export to CSV ({filteredOrders.length})
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Mobile Card View */}
            {actualViewMode === 'mobile' && (
              <div className="space-y-3 p-4">
                {/* Select All for Mobile */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select All ({filteredOrders.length})
                  </span>
                </div>
                
                {/* Order Cards */}
                {filteredOrders.map((order, index) => (
                  <Card key={order.id} className="border-2 hover:border-olive-300 transition-colors">
                    <CardContent className="p-4">
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOrder(order.id, checked as boolean)
                            }
                          />
                          <div>
                            <div className="font-medium text-sm">{order.deliveryOrderNo}</div>
                            <div className="text-xs text-muted-foreground">ID: {order.id.split('-')[0]}</div>
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      {/* Key Order Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span>{`${order.firstName || ''} ${order.lastName || ''}`.trim() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{order.deliveryDate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span>{order.deliveryCompletionTimeWindow || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{order.recipientPhoneNo || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="text-right max-w-[200px] truncate" title={order.address}>
                            {order.address || 'N/A'}
                          </span>
                        </div>
                        {order.description && (
                          <div className="pt-2 border-t">
                            <div className="text-muted-foreground text-xs mb-1">Description:</div>
                            <div className="text-sm truncate" title={order.description}>
                              {order.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No orders found
                  </div>
                )}
              </div>
            )}
            {/* Desktop Table View */}
            {actualViewMode === 'desktop' && (
              <div className="overflow-x-auto">
                <div
                  className="min-w-full"
                  style={{
                    minWidth: `${visibleColumns.reduce((sum, config) => sum + config.width, 48)}px`,
                  }}
                >
                  {/* Header Row */}
                  <div className="flex bg-dust-200 border-b sticky top-0 z-10">
                    <div className="w-12 p-2 border-r bg-dust-200 flex-shrink-0">
                      <Checkbox
                        checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                    {visibleColumns.map((config) => (
                      <div
                        key={config.field}
                        className="p-2 border-r font-medium text-xs text-olive-700 bg-dust-200 relative group flex-shrink-0"
                        style={{ width: `${config.width}px` }}
                      >
                        <div className="truncate pr-2">{DASHBOARD_FIELD_LABELS[config.field]}</div>
                        {/* Resize Handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-olive-400 group-hover:bg-olive-300"
                          onMouseDown={(e) => handleResizeStart(e, config.field)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Data Rows */}
                  {filteredOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className={`flex border-b hover:bg-dust-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-dust-25"
                      }`}
                    >
                      <div className="w-12 p-2 border-r flex-shrink-0">
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOrder(order.id, checked as boolean)
                          }
                        />
                      </div>
                      {visibleColumns.map((config) => (
                        <div
                          key={config.field}
                          className="border-r flex-shrink-0"
                          style={{ width: `${config.width}px` }}
                        >
                          {renderCell(order, config.field)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
