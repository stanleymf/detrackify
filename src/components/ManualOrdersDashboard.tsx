import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Calendar, Clock, RefreshCw, Menu, X, Plus, ArrowRight, Trash2 } from "lucide-react"
import { type Order, DASHBOARD_FIELD_LABELS, type DashboardColumnConfig } from "@/types"
import { useIsMobile } from "@/components/hooks/use-mobile"
import { AddOrder } from "@/components/AddOrder"

// Manual Orders Storage Keys
const MANUAL_ORDERS_KEY = "manual-orders"
const MANUAL_ORDERS_CONFIG_KEY = "manual-orders-config"

// Manual Orders Storage Functions
const getManualOrders = (): Order[] => {
  const stored = localStorage.getItem(MANUAL_ORDERS_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveManualOrders = (orders: Order[]): void => {
  localStorage.setItem(MANUAL_ORDERS_KEY, JSON.stringify(orders))
}

const getManualOrdersConfig = (): DashboardColumnConfig[] => {
  const stored = localStorage.getItem(MANUAL_ORDERS_CONFIG_KEY)
  if (!stored) {
    // Initialize with default configuration
    const allFields = Object.keys(DASHBOARD_FIELD_LABELS) as (keyof Order)[]
    const defaultConfigs: DashboardColumnConfig[] = allFields.map((field) => ({
      field,
      width: field === "address" || field === "instructions" ? 200 : 120,
      visible: true,
    }))
    localStorage.setItem(MANUAL_ORDERS_CONFIG_KEY, JSON.stringify(defaultConfigs))
    return defaultConfigs
  }
  return JSON.parse(stored)
}

const saveManualOrdersConfig = (columnConfigs: DashboardColumnConfig[]): void => {
  localStorage.setItem(MANUAL_ORDERS_CONFIG_KEY, JSON.stringify(columnConfigs))
}

export function ManualOrdersDashboard({ 
  viewMode = 'auto', 
  onViewModeChange 
}: { 
  viewMode?: 'auto' | 'mobile' | 'desktop'
  onViewModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void 
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ orderId: string; field: keyof Order } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [columnConfigs, setColumnConfigs] = useState<DashboardColumnConfig[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [addOrderModalOpen, setAddOrderModalOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const isMobile = useIsMobile()
  const actualViewMode = viewMode === 'auto' ? (isMobile ? 'mobile' : 'desktop') : viewMode

  const [resizing, setResizing] = useState<{
    field: keyof Order
    startX: number
    startWidth: number
  } | null>(null)

  // Load manual orders on mount
  useEffect(() => {
    loadManualOrders()
  }, [])

  // Load saved column configuration on mount
  useEffect(() => {
    const savedConfigs = getManualOrdersConfig()
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
      saveManualOrdersConfig(defaultConfigs)
    }
  }, [])

  // Auto-save column configuration when it changes
  useEffect(() => {
    if (columnConfigs.length > 0) {
      saveManualOrdersConfig(columnConfigs)
    }
  }, [columnConfigs])

  const loadManualOrders = () => {
    const manualOrders = getManualOrders()
    setOrders(manualOrders)
  }

  // Filter orders based on date, timeslot, and search
  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    // Search filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      const isMatch = Object.values(order).some((value) => 
        typeof value === 'string' && value.toLowerCase().includes(lowercasedQuery)
      )
      if (!isMatch) return false
    }

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
    setEditingCell({ orderId, field })
    setEditValue(currentValue || '')
  }

  const handleCellSave = async () => {
    if (!editingCell) return

    const updatedOrders = orders.map((order) => {
      if (order.id === editingCell.orderId) {
        return { ...order, [editingCell.field]: editValue }
      }
      return order
    })

    setOrders(updatedOrders)
    saveManualOrders(updatedOrders)
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleCellSave()
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

  const handleDeleteOrder = (orderId: string) => {
    const updatedOrders = orders.filter((order) => order.id !== orderId)
    setOrders(updatedOrders)
    saveManualOrders(updatedOrders)
    
    // Remove from selected if it was selected
    const newSelected = new Set(selectedOrders)
    newSelected.delete(orderId)
    setSelectedOrders(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return

    const updatedOrders = orders.filter((order) => !selectedOrders.has(order.id))
    setOrders(updatedOrders)
    saveManualOrders(updatedOrders)
    setSelectedOrders(new Set())
  }

  const handleTransferToMainDashboard = async () => {
    if (selectedOrders.size === 0) return

    try {
      // Get the selected orders
      const ordersToTransfer = orders.filter((order) => selectedOrders.has(order.id))
      
      // Group orders by base order ID (before the -index suffix)
      const orderGroups = new Map<string, Order[]>()
      
      ordersToTransfer.forEach(order => {
        const baseOrderId = order.id.includes('-') ? order.id.split('-')[0] : order.id
        if (!orderGroups.has(baseOrderId)) {
          orderGroups.set(baseOrderId, [])
        }
        orderGroups.get(baseOrderId)!.push(order)
      })
      
      let successCount = 0
      let errorCount = 0
      
      // Transfer each group as a single multi-item order
      for (const [baseOrderId, groupedOrders] of orderGroups) {
        try {
          const response = await fetch('/api/orders/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              orders: groupedOrders,
              baseOrderId: baseOrderId,
              transferred: true 
            }),
            credentials: 'include',
          })
          const result = await response.json()
          if (!response.ok || !result.success) {
            errorCount++
            console.error('Failed to transfer order group:', baseOrderId, result.error)
          } else {
            successCount++
          }
        } catch (err) {
          errorCount++
          console.error('Error transferring order group:', baseOrderId, err)
        }
      }
      // Remove successfully transferred orders from manual orders
      const updatedManualOrders = orders.filter((order) => !selectedOrders.has(order.id))
      setOrders(updatedManualOrders)
      saveManualOrders(updatedManualOrders)
      setSelectedOrders(new Set())
      setTransferDialogOpen(false)
      // Show success/error message
      alert(`Successfully transferred ${successCount} order(s) to main dashboard${errorCount ? `. ${errorCount} failed.` : ''}`)
    } catch (error) {
      console.error('Error transferring orders:', error)
      alert('Error transferring orders. Please try again.')
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

  const handleOrderCreated = () => {
    loadManualOrders()
    setAddOrderModalOpen(false)
  }

  const visibleColumns = columnConfigs.filter((config) => config.visible)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-olive-600">Manual Orders Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage manually created orders. These orders are separate from Shopify orders.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setAddOrderModalOpen(true)}
            className="bg-olive-600 hover:bg-olive-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Manual Order
          </Button>
          
          {selectedOrders.size > 0 && (
            <Button
              onClick={() => setTransferDialogOpen(true)}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Transfer to Main Dashboard ({selectedOrders.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Manual Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Transfer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.status === "Ready for Export").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedOrders.size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            <Menu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Manual Orders</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All dates" />
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
              <Select value={selectedTimeslot} onValueChange={setSelectedTimeslot}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All times" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  {uniqueTimeslots.map((timeslot) => (
                    <SelectItem key={timeslot} value={timeslot}>
                      {timeslot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                variant="outline"
                size="sm"
                onClick={loadManualOrders}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {selectedOrders.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
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
                  <Card key={order.id} className="border-2 hover:border-orange-300 transition-colors">
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
                            <div className="text-xs text-muted-foreground">ID: {order.id}</div>
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
                          <span className="text-right max-w-[200px] break-words" title={order.address}>
                            {order.address || 'N/A'}
                          </span>
                        </div>
                        {order.description && (
                          <div className="pt-2 border-t">
                            <div className="text-muted-foreground text-xs mb-1">Description:</div>
                            <div className="text-sm break-words" title={order.description}>
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
                    No manual orders found. Create your first manual order above.
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
            
            {filteredOrders.length === 0 && actualViewMode === 'desktop' && (
              <div className="text-center text-muted-foreground py-8">
                No manual orders found. Create your first manual order above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Order Modal */}
      <Dialog open={addOrderModalOpen} onOpenChange={setAddOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Manual Order</DialogTitle>
          </DialogHeader>
          <AddOrder
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onOrderCreated={handleOrderCreated}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Confirmation Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Orders to Main Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to transfer {selectedOrders.size} order(s) to the main dashboard? 
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground">
              The orders will be moved to the main dashboard where they can be exported to Detrack.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleTransferToMainDashboard}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Transfer Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => setTransferDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
