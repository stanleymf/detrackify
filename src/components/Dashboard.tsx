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
import { Settings2, Eye, Calendar, Clock, RefreshCw } from "lucide-react"
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

  useEffect(() => {
    const loadedOrders = storage.getOrders()
    setOrders(loadedOrders)
  }, [])

  // Auto-save column configuration when it changes
  useEffect(() => {
    if (columnConfigs.length > 0) {
      storage.saveDashboardConfig(columnConfigs)
    }
  }, [columnConfigs])

  // Filter orders based on date and timeslot
  const filteredOrders = orders.filter((order) => {
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
  })

  // Get unique dates and timeslots for filter options
  const uniqueDates = Array.from(new Set(orders.map(order => order.deliveryDate).filter(Boolean)))
  const uniqueTimeslots = Array.from(new Set(orders.map(order => order.deliveryCompletionTimeWindow).filter(Boolean)))

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

    storage.updateOrder(editingCell.orderId, { [editingCell.field]: editValue })
    const updatedOrders = storage.getOrders()
    setOrders(updatedOrders)
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
    const selectedOrdersList = orders.filter((order) => selectedOrders.has(order.id))

    // Simulate API call to Detrack
    for (const order of selectedOrdersList) {
      try {
        // Mock API call - in real implementation, this would call Detrack API
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Simulate success/failure randomly for demo
        const success = Math.random() > 0.1 // 90% success rate

        if (success) {
          storage.updateOrder(order.id, {
            status: "Exported",
            remarks: "Successfully exported to Detrack",
          })
        } else {
          storage.updateOrder(order.id, {
            status: "Error",
            remarks: "Failed to export - API connection error",
          })
        }
      } catch (error) {
        storage.updateOrder(order.id, {
          status: "Error",
          remarks: "Export failed - network error",
        })
      }
    }

    // Refresh orders and clear selection
    const updatedOrders = storage.getOrders()
    setOrders(updatedOrders)
    setSelectedOrders(new Set())
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
  const totalOrders = filteredOrders.length
  const readyForExport = filteredOrders.filter((order) => order.status === "Ready for Export").length
  const exported = filteredOrders.filter((order) => order.status === "Exported").length
  const errors = filteredOrders.filter((order) => order.status === "Error").length

  // Load orders from database
  const loadOrdersFromDatabase = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const orders = await response.json()
        setOrders(orders)
      } else {
        console.error('Failed to load orders from database')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
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
      const response = await fetch('/api/fetch-orders', { method: 'POST' })
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
  const handleBulkDelete = () => {
    if (selectedOrders.size === 0) {
      setFetchResult('No orders selected for deletion')
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedOrders.size} selected order(s)?`)) {
      // Delete selected orders from storage
      selectedOrders.forEach(orderId => {
        storage.deleteOrder(orderId)
      })
      
      // Refresh orders list
      const updatedOrders = storage.getOrders()
      setOrders(updatedOrders)
      
      // Clear selection
      setSelectedOrders(new Set())
      
      // Show success message
      setFetchResult(`Successfully deleted ${selectedOrders.size} order(s)`)
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
          <Button onClick={handleFetchOrders} disabled={fetchingOrders} className="flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white">
            <RefreshCw className={fetchingOrders ? "animate-spin" : ""} />
            {fetchingOrders ? "Fetching..." : "Fetch Orders from Shopify"}
          </Button>
        </div>
      </div>
      {fetchResult && (
        <div className="mb-4 p-3 bg-muted/50 border rounded text-sm whitespace-pre-wrap">
          {fetchResult}
        </div>
      )}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-olive-600">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{readyForExport}</div>
            <p className="text-xs text-muted-foreground">Ready for Export</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{exported}</div>
            <p className="text-xs text-muted-foreground">Exported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-error">{errors}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
      </div>

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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
