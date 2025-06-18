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
import { Eye, Calendar, Clock, RefreshCw } from "lucide-react"
import { type Order, DASHBOARD_FIELD_LABELS, type DashboardColumnConfig } from "@/types"
import { storage } from "@/lib/storage"

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ orderId: string; field: keyof Order } | null>(
    null
  )
  const [editValue, setEditValue] = useState("")
  const [columnConfigs, setColumnConfigs] = useState<DashboardColumnConfig[]>([])
  const [resizing, setResizing] = useState<{
    field: keyof Order
    startX: number
    startWidth: number
  } | null>(null)
  
  // Fetch orders loading state
  const [fetchingOrders, setFetchingOrders] = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50) // 50 orders per page
  const [totalOrderCount, setTotalOrderCount] = useState(0)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>("all")

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

  // Orders are now loaded from database via loadOrdersFromDatabase()

  // Auto-save column configuration when it changes
  useEffect(() => {
    if (columnConfigs.length > 0) {
      storage.saveDashboardConfig(columnConfigs)
    }
  }, [columnConfigs])

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
  const uniqueExpressOrders = new Map<string, { deliveryOrderNo: string; fullLineItem: string }>()
  expressOrders.forEach(order => {
    const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
    if (!uniqueExpressOrders.has(baseOrderId)) {
      uniqueExpressOrders.set(baseOrderId, {
        deliveryOrderNo: order.deliveryOrderNo || '',
        fullLineItem: order.description || '' // This contains the full line item title + variant title
      })
    }
  })
  
  const expressOrdersArray = Array.from(uniqueExpressOrders.values())

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
        // Refresh orders from database
        await loadOrdersFromDatabase()
        
        // Show results summary
        if (data.results && data.results.length > 0) {
          const summary = data.results.map((r: any) => 
            `${r.storeName}: fetched ${r.fetched}, saved ${r.saved}${r.errors.length ? ", errors: " + r.errors.join('; ') : ''}`
          ).join('\n')
          setFetchResult(summary)
        } else {
          setFetchResult('No stores configured. Please add Shopify stores in Settings first.')
        }
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
        // Delete selected orders from database
        const deletePromises = Array.from(selectedOrders).map(orderId =>
          fetch(`/api/orders/${orderId}`, { 
            method: 'DELETE', 
            credentials: 'include' 
          })
        )
        
        await Promise.all(deletePromises)
        
        // Refresh orders from database
        await loadOrdersFromDatabase()
        
        // Clear selection
        setSelectedOrders(new Set())
        
        // Show success message
        setFetchResult(`Successfully deleted ${selectedOrders.size} order(s)`)
      } catch (error: any) {
        console.error('Error deleting orders:', error)
        setFetchResult('Error deleting orders: ' + error.message)
      }
    }
  }

  // Clear all orders
  const handleClearAllOrders = async () => {
    if (confirm('Are you sure you want to delete all orders from the database and start fresh?')) {
      try {
        console.log('Starting clear all orders operation...')
        
        // Delete all orders from database using bulk endpoint
        const response = await fetch('/api/orders/clear-all', { 
          method: 'DELETE', 
          credentials: 'include' 
        })
        
        console.log('Clear all response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Clear all error response:', errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const responseData = await response.json()
        console.log('Clear all response data:', responseData)
        
        console.log('Refreshing orders from database...')
        // Refresh orders from database
        await loadOrdersFromDatabase()
        
        // Clear selection
        setSelectedOrders(new Set())
        
        // Show success message
        setFetchResult('Successfully cleared all orders from the database')
        console.log('Clear all orders operation completed successfully')
      } catch (error: any) {
        console.error('Error clearing orders:', error)
        setFetchResult('Error clearing orders: ' + error.message)
      }
    }
  }

  const handleReprocessOrders = async () => {
    try {
      setFetchingOrders(true)
      console.log('Reprocessing orders...')
      
      const response = await fetch('/api/reprocess-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reprocess orders')
      }
      
      const result = await response.json()
      console.log('Reprocess orders result:', result)
      
      if (result.success) {
        // Show success message
        setFetchResult(`✅ Successfully reprocessed ${result.results[0]?.reprocessed || 0} orders.`)
        
        // Refresh the orders list
        await loadOrdersFromDatabase()
      } else {
        throw new Error(result.error || 'Failed to reprocess orders')
      }
    } catch (error) {
      console.error('Error reprocessing orders:', error)
      setFetchResult(`❌ Error: ${error instanceof Error ? error.message : 'Failed to reprocess orders'}`)
    } finally {
      setFetchingOrders(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Orders Dashboard</h2>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
      {fetchResult && (
        <div className="mb-4 p-3 bg-muted/50 border rounded text-sm whitespace-pre-wrap">
          {fetchResult}
        </div>
      )}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div key={prefix} className="flex justify-between text-xs">
                    <span className="text-blue-700 font-medium">{prefix}:</span>
                    <span className="text-muted-foreground">{count}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expressOrdersArray.map((order, index) => (
                <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-700 text-sm">{order.deliveryOrderNo}</div>
                  <div className="text-muted-foreground text-xs truncate" title={order.fullLineItem}>
                    {order.fullLineItem}
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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-olive-600">Order Dashboard</CardTitle>
            <div className="flex gap-2">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
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

                {filteredOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    {orders.length === 0 
                      ? "No orders found. Orders will appear here when pulled from Shopify."
                      : "No orders match the selected filters."
                    }
                  </div>
                )}
              </div>
            </div>
            
            {/* Pagination Controls */}
            {totalOrderCount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalOrderCount)} of {totalOrderCount} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadOrdersFromDatabase(currentPage - 1)}
                    disabled={currentPage === 1 || loadingOrders}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.ceil(totalOrderCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadOrdersFromDatabase(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalOrderCount / pageSize) || loadingOrders}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
