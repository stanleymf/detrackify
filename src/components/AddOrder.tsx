import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Trash2 } from "lucide-react"
import { useIsMobile } from "@/components/hooks/use-mobile"
import { type Order } from "@/types"

interface OrderItem {
  sku: string
  description: string
  qty: number
}

interface ManualOrderData {
  deliveryOrderNo: string
  deliveryDate: string
  processingDate: string
  jobReleaseTime: string
  deliveryCompletionTimeWindow: string
  senderNumberOnApp: string
  address: string
  companyName: string
  firstName: string
  lastName: string
  recipientPhoneNo: string
  senderPhoneNo: string
  instructions: string
  emailsForNotifications: string
  senderNameOnApp: string
  group: string
  noOfShippingLabels: string
  items: OrderItem[]
}

const initialOrderData: ManualOrderData = {
  deliveryOrderNo: "",
  deliveryDate: "",
  processingDate: "",
  jobReleaseTime: "",
  deliveryCompletionTimeWindow: "",
  senderNumberOnApp: "",
  address: "",
  companyName: "",
  firstName: "",
  lastName: "",
  recipientPhoneNo: "",
  senderPhoneNo: "",
  instructions: "",
  emailsForNotifications: "",
  senderNameOnApp: "",
  group: "",
  noOfShippingLabels: "",
  items: [{ sku: "", description: "", qty: 1 }] // Start with one item
}

export function AddOrder({ 
  viewMode = 'auto', 
  onViewModeChange,
  onOrderCreated
}: { 
  viewMode?: 'auto' | 'mobile' | 'desktop'
  onViewModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void 
  onOrderCreated?: () => void
}) {
  const [orderData, setOrderData] = useState<ManualOrderData>(initialOrderData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const actualViewMode = viewMode === 'auto' ? (isMobile ? 'mobile' : 'desktop') : viewMode

  const handleInputChange = (field: keyof Omit<ManualOrderData, 'items'>, value: string) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addItem = () => {
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, { sku: "", description: "", qty: 1 }]
    }))
  }

  const removeItem = (index: number) => {
    if (orderData.items.length > 1) {
      setOrderData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const getTotalQuantity = () => {
    return orderData.items.reduce((total, item) => total + item.qty, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      // Create multiple orders (one per line item) to match the Shopify order structure
      const baseOrderId = crypto.randomUUID()
      const createdOrders: Order[] = []

      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i]
        const lineItemId = `${baseOrderId}-${i}`
        
        const newOrder: Order = {
          id: lineItemId,
          deliveryOrderNo: orderData.deliveryOrderNo,
          deliveryDate: orderData.deliveryDate,
          processingDate: orderData.processingDate,
          jobReleaseTime: orderData.jobReleaseTime,
          deliveryCompletionTimeWindow: orderData.deliveryCompletionTimeWindow,
          senderNumberOnApp: orderData.senderNumberOnApp,
          address: orderData.address,
          companyName: orderData.companyName,
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          recipientPhoneNo: orderData.recipientPhoneNo,
          senderPhoneNo: orderData.senderPhoneNo,
          instructions: orderData.instructions,
          emailsForNotifications: orderData.emailsForNotifications,
          senderNameOnApp: orderData.senderNameOnApp,
          group: orderData.group,
          noOfShippingLabels: orderData.noOfShippingLabels,
          // Line item specific fields
          sku: item.sku,
          description: item.description,
          qty: item.qty.toString(),
          itemCount: getTotalQuantity().toString(),
          // Default fields
          trackingNo: "",
          deliverySequence: "",
          postalCode: "",
          assignTo: "",
          zone: "",
          accountNo: "",
          deliveryJobOwner: "",
          attachmentUrl: "",
          status: "Ready for Export",
          podAt: "",
          remarks: "",
          serviceTime: ""
        }

        createdOrders.push(newOrder)
      }

      // POST to backend for true persistence
      const response = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orders: createdOrders,
          baseOrderId: baseOrderId 
        }),
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save manual order to backend')
      }

      // Save to manual orders storage for UI speed
      const manualOrders = JSON.parse(localStorage.getItem("manual-orders") || "[]")
      createdOrders.forEach(order => manualOrders.push(order))
      localStorage.setItem("manual-orders", JSON.stringify(manualOrders))

      setSubmitResult(`Manual order created successfully with ${createdOrders.length} items!`)
      setOrderData(initialOrderData) // Reset form
      if (onOrderCreated) {
        onOrderCreated()
      }
    } catch (error) {
      console.error('Error creating manual order:', error)
      setSubmitResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setOrderData(initialOrderData)
    setSubmitResult(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-olive-600" />
        <h1 className="text-2xl font-bold text-olive-600">Add New Order</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-olive-600">Manual Order Entry</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a new order manually with multiple items. This order will bypass Shopify mapping and be created directly.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryOrderNo">Delivery Order (D.O.) No.</Label>
                <Input
                  id="deliveryOrderNo"
                  value={orderData.deliveryOrderNo}
                  onChange={(e) => handleInputChange('deliveryOrderNo', e.target.value)}
                  placeholder="e.g., DO-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={orderData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processingDate">Processing Date</Label>
                <Input
                  id="processingDate"
                  type="date"
                  value={orderData.processingDate}
                  onChange={(e) => handleInputChange('processingDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobReleaseTime">Job Release Time</Label>
                <Select value={orderData.jobReleaseTime} onValueChange={(value) => handleInputChange('jobReleaseTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select release time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:45">08:45 (Morning)</SelectItem>
                    <SelectItem value="13:45">13:45 (Afternoon)</SelectItem>
                    <SelectItem value="17:15">17:15 (Evening)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryCompletionTimeWindow">Delivery Completion Time Window</Label>
                <Select value={orderData.deliveryCompletionTimeWindow} onValueChange={(value) => handleInputChange('deliveryCompletionTimeWindow', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning (10:00-14:00)</SelectItem>
                    <SelectItem value="Afternoon">Afternoon (14:00-18:00)</SelectItem>
                    <SelectItem value="Night">Night (18:00-22:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderNumberOnApp">Sender Number on App</Label>
                <Input
                  id="senderNumberOnApp"
                  value={orderData.senderNumberOnApp}
                  onChange={(e) => handleInputChange('senderNumberOnApp', e.target.value)}
                  placeholder="Sender number"
                />
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-olive-600">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={orderData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Full delivery address"
                    required
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={orderData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-olive-600">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={orderData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={orderData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPhoneNo">Recipient's Phone Number</Label>
                  <Input
                    id="recipientPhoneNo"
                    value={orderData.recipientPhoneNo}
                    onChange={(e) => handleInputChange('recipientPhoneNo', e.target.value)}
                    placeholder="e.g., 6591234567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderPhoneNo">Sender's Phone No.</Label>
                  <Input
                    id="senderPhoneNo"
                    value={orderData.senderPhoneNo}
                    onChange={(e) => handleInputChange('senderPhoneNo', e.target.value)}
                    placeholder="e.g., 6591234567"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-olive-600">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={orderData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="Delivery instructions"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailsForNotifications">Emails for Notifications</Label>
                  <Input
                    id="emailsForNotifications"
                    value={orderData.emailsForNotifications}
                    onChange={(e) => handleInputChange('emailsForNotifications', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderNameOnApp">Sender's name to appear on app</Label>
                  <Input
                    id="senderNameOnApp"
                    value={orderData.senderNameOnApp}
                    onChange={(e) => handleInputChange('senderNameOnApp', e.target.value)}
                    placeholder="Sender name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Group</Label>
                  <Input
                    id="group"
                    value={orderData.group}
                    onChange={(e) => handleInputChange('group', e.target.value)}
                    placeholder="e.g., WF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noOfShippingLabels">No. of Shipping Labels</Label>
                  <Input
                    id="noOfShippingLabels"
                    type="number"
                    value={orderData.noOfShippingLabels}
                    onChange={(e) => handleInputChange('noOfShippingLabels', e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-olive-600">Order Items</h3>
                <div className="text-sm text-muted-foreground">
                  Total Quantity: <span className="font-medium">{getTotalQuantity()}</span>
                </div>
              </div>
              
              {orderData.items.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-olive-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                      {orderData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`sku-${index}`}>SKU</Label>
                        <Input
                          id={`sku-${index}`}
                          value={item.sku}
                          onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                          placeholder="e.g., ITEM-001"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Input
                          id={`description-${index}`}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`qty-${index}`}>Quantity</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 1)}
                          placeholder="1"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full border-dashed border-2 border-olive-300 text-olive-600 hover:bg-olive-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Item
              </Button>
            </div>

            {/* Submit Result */}
            {submitResult && (
              <div className={`p-4 rounded-lg ${
                submitResult.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-700' 
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {submitResult}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-olive-600 hover:bg-olive-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Order ({orderData.items.length} item{orderData.items.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 