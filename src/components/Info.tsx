import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Package, 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save,
  X
} from 'lucide-react';

interface ProductLabel {
  id: string;
  productName: string;
  label: string;
}

interface DriverInfo {
  id: string;
  driverName: string;
  paynowNumber: string;
  detrackId: string;
  contactNo: string;
  pricePerDrop: string;
}

export default function Info() {
  const [productLabels, setProductLabels] = useState<ProductLabel[]>([]);
  const [driverInfos, setDriverInfos] = useState<DriverInfo[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newPaynowNumber, setNewPaynowNumber] = useState('');
  const [newDetrackId, setNewDetrackId] = useState('');
  const [newContactNo, setNewContactNo] = useState('');
  const [newPricePerDrop, setNewPricePerDrop] = useState('');
  
  // Search states
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  
  // Bulk selection states
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  
  // Editing states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState('');
  const [editingProductLabel, setEditingProductLabel] = useState('');
  const [editingDriverName, setEditingDriverName] = useState('');
  const [editingPaynowNumber, setEditingPaynowNumber] = useState('');
  const [editingDetrackId, setEditingDetrackId] = useState('');
  const [editingContactNo, setEditingContactNo] = useState('');
  const [editingPricePerDrop, setEditingPricePerDrop] = useState('');
  
  // Migration notification state
  const [showMigrationNotice, setShowMigrationNotice] = useState(false);
  
  // File input refs
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const driverFileInputRef = useRef<HTMLInputElement>(null);

  // Load data from server on component mount
  useEffect(() => {
    // Clear any existing localStorage data since we've migrated to server-side storage
    clearLocalStorageData();
    loadProductLabels();
    loadDriverInfos();
  }, []);

  // Clear localStorage data that was previously used
  const clearLocalStorageData = () => {
    try {
      const hadProductLabels = localStorage.getItem('productLabels');
      const hadDriverInfos = localStorage.getItem('driverInfos');
      
      localStorage.removeItem('productLabels');
      localStorage.removeItem('driverInfos');
      
      // Show migration notice if there was data in localStorage
      if (hadProductLabels || hadDriverInfos) {
        setShowMigrationNotice(true);
        console.log('Migrated from localStorage to server-side storage');
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Load product labels from server
  const loadProductLabels = async () => {
    try {
      const response = await fetch('/api/config/product-labels', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProductLabels(data.productLabels || []);
      }
    } catch (error) {
      console.error('Error loading product labels:', error);
    }
  };

  // Load driver info from server
  const loadDriverInfos = async () => {
    try {
      const response = await fetch('/api/config/driver-info', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDriverInfos(data.driverInfo || []);
      }
    } catch (error) {
      console.error('Error loading driver info:', error);
    }
  };

  // Save product labels to server
  const saveProductLabelsToServer = async (labels: ProductLabel[]) => {
    try {
      const response = await fetch('/api/config/product-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(labels)
      });
      if (!response.ok) {
        throw new Error('Failed to save product labels');
      }
    } catch (error) {
      console.error('Error saving product labels:', error);
      throw error;
    }
  };

  // Save driver info to server
  const saveDriverInfosToServer = async (drivers: DriverInfo[]) => {
    try {
      const response = await fetch('/api/config/driver-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(drivers)
      });
      if (!response.ok) {
        throw new Error('Failed to save driver info');
      }
    } catch (error) {
      console.error('Error saving driver info:', error);
      throw error;
    }
  };

  // Filtered data
  const filteredProductLabels = useMemo(() => {
    if (!productSearchTerm.trim()) return productLabels;
    return productLabels.filter(product => 
      product.productName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.label.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [productLabels, productSearchTerm]);

  const filteredDriverInfos = useMemo(() => {
    if (!driverSearchTerm.trim()) return driverInfos;
    return driverInfos.filter(driver => 
      driver.driverName.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.paynowNumber.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.detrackId.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.contactNo.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );
  }, [driverInfos, driverSearchTerm]);

  // Bulk delete functions
  const deleteSelectedProducts = async () => {
    const updatedLabels = productLabels.filter(product => !selectedProducts.has(product.id));
    setProductLabels(updatedLabels);
    setSelectedProducts(new Set());
    
    try {
      await saveProductLabelsToServer(updatedLabels);
    } catch (error) {
      // Revert on error
      setProductLabels(productLabels);
      console.error('Failed to delete products:', error);
    }
  };

  const deleteSelectedDrivers = async () => {
    const updatedDrivers = driverInfos.filter(driver => !selectedDrivers.has(driver.id));
    setDriverInfos(updatedDrivers);
    setSelectedDrivers(new Set());
    
    try {
      await saveDriverInfosToServer(updatedDrivers);
    } catch (error) {
      // Revert on error
      setDriverInfos(driverInfos);
      console.error('Failed to delete drivers:', error);
    }
  };

  const toggleProductSelection = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleDriverSelection = (id: string) => {
    const newSelected = new Set(selectedDrivers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDrivers(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === filteredProductLabels.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProductLabels.map(p => p.id)));
    }
  };

  const selectAllDrivers = () => {
    if (selectedDrivers.size === filteredDriverInfos.length) {
      setSelectedDrivers(new Set());
    } else {
      setSelectedDrivers(new Set(filteredDriverInfos.map(d => d.id)));
    }
  };

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      // Handle quoted fields with commas
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleProductCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = parseCSV(csvText);
        
        // Skip header row and process data
        const newProducts = rows.slice(1).map((row, index) => ({
          id: `product-${Date.now()}-${index}`,
          productName: row[0] || '',
          label: row[1] || ''
        })).filter(p => p.productName && p.label);

        if (newProducts.length === 0) {
          alert('No valid product data found in CSV');
          return;
        }

        const updatedProducts = [...productLabels, ...newProducts];
        setProductLabels(updatedProducts);
        await saveProductLabelsToServer(updatedProducts);
        
        // Clear file input
        if (productFileInputRef.current) {
          productFileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleDriverCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        // Warn if file appears to be tab-delimited
        if (csvText.includes('\t') && !csvText.includes(',')) {
          alert('Your file appears to be tab-delimited. Please export/save as comma-separated CSV for best results.');
        }
        const rows = parseCSV(csvText);
        if (rows.length < 2) {
          alert('No data found in CSV');
          return;
        }
        // Detect header and map columns
        const header = rows[0].map(h => h.trim().toLowerCase());
        const contactIdx = header.findIndex(h => h === 'contact no.' || h === 'contact number');
        if (header.length < 5 || contactIdx === -1) {
          alert('CSV header must include: Driver Name, Paynow Number, Detrack ID, Contact No./Contact Number, Price Per Drop');
          return;
        }
        // Map columns by header
        const idx = {
          driverName: header.findIndex(h => h === 'driver name'),
          paynowNumber: header.findIndex(h => h === 'paynow number'),
          detrackId: header.findIndex(h => h === 'detrack id'),
          contactNo: contactIdx,
          pricePerDrop: header.findIndex(h => h === 'price per drop'),
        };
        // Strict validation: all fields must be present
        const newDrivers = rows.slice(1).map((row, index) => ({
          id: `driver-${Date.now()}-${index}`,
          driverName: row[idx.driverName]?.trim() || '',
          paynowNumber: row[idx.paynowNumber]?.trim() || '',
          detrackId: row[idx.detrackId]?.trim() || '',
          contactNo: row[idx.contactNo]?.trim() || '',
          pricePerDrop: row[idx.pricePerDrop]?.trim() || ''
        })).filter(d => d.driverName && d.paynowNumber && d.detrackId && d.contactNo && d.pricePerDrop);

        if (newDrivers.length === 0) {
          alert('No valid driver data found in CSV. Please ensure all fields are filled.');
          return;
        }

        const updatedDrivers = [...driverInfos, ...newDrivers];
        setDriverInfos(updatedDrivers);
        await saveDriverInfosToServer(updatedDrivers);
        
        // Clear new driver input fields
        setNewDriverName('');
        setNewPaynowNumber('');
        setNewDetrackId('');
        setNewContactNo('');
        setNewPricePerDrop('');
        
        // Clear file input
        if (driverFileInputRef.current) {
          driverFileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const addProductLabel = async () => {
    if (!newProductName.trim() || !newLabel.trim()) return;

    const newProduct: ProductLabel = {
      id: `product-${Date.now()}`,
      productName: newProductName.trim(),
      label: newLabel.trim()
    };

    const updatedProducts = [...productLabels, newProduct];
    setProductLabels(updatedProducts);
    setNewProductName('');
    setNewLabel('');

    try {
      await saveProductLabelsToServer(updatedProducts);
    } catch (error) {
      // Revert on error
      setProductLabels(productLabels);
      console.error('Failed to add product:', error);
    }
  };

  const removeProductLabel = async (id: string) => {
    const updatedProducts = productLabels.filter(product => product.id !== id);
    setProductLabels(updatedProducts);
    
    try {
      await saveProductLabelsToServer(updatedProducts);
    } catch (error) {
      // Revert on error
      setProductLabels(productLabels);
      console.error('Failed to remove product:', error);
    }
  };

  const addDriverInfo = async () => {
    if (!newDriverName.trim() || !newPaynowNumber.trim() || !newDetrackId.trim() || !newContactNo.trim() || !newPricePerDrop.trim()) return;

    const newDriver: DriverInfo = {
      id: `driver-${Date.now()}`,
      driverName: newDriverName.trim(),
      paynowNumber: newPaynowNumber.trim(),
      detrackId: newDetrackId.trim(),
      contactNo: newContactNo.trim(),
      pricePerDrop: newPricePerDrop.trim()
    };

    const updatedDrivers = [...driverInfos, newDriver];
    setDriverInfos(updatedDrivers);
    setNewDriverName('');
    setNewPaynowNumber('');
    setNewDetrackId('');
    setNewContactNo('');
    setNewPricePerDrop('');

    try {
      await saveDriverInfosToServer(updatedDrivers);
    } catch (error) {
      // Revert on error
      setDriverInfos(driverInfos);
      console.error('Failed to add driver:', error);
    }
  };

  const removeDriverInfo = async (id: string) => {
    const updatedDrivers = driverInfos.filter(driver => driver.id !== id);
    setDriverInfos(updatedDrivers);
    
    try {
      await saveDriverInfosToServer(updatedDrivers);
    } catch (error) {
      // Revert on error
      setDriverInfos(driverInfos);
      console.error('Failed to remove driver:', error);
    }
  };

  const handleProductKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addProductLabel();
    }
  };

  const handleDriverKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addDriverInfo();
    }
  };

  const startEditingProduct = (product: ProductLabel) => {
    setEditingProductId(product.id);
    setEditingProductName(product.productName);
    setEditingProductLabel(product.label);
  };

  const startEditingDriver = (driver: DriverInfo) => {
    setEditingDriverId(driver.id);
    setEditingDriverName(driver.driverName);
    setEditingPaynowNumber(driver.paynowNumber);
    setEditingDetrackId(driver.detrackId);
    setEditingContactNo(driver.contactNo);
    setEditingPricePerDrop(driver.pricePerDrop);
  };

  const saveProductEdit = async () => {
    if (!editingProductId || !editingProductName.trim() || !editingProductLabel.trim()) return;

    const updatedProducts = productLabels.map(product =>
      product.id === editingProductId
        ? { ...product, productName: editingProductName.trim(), label: editingProductLabel.trim() }
        : product
    );

    setProductLabels(updatedProducts);
    cancelEdit();

    try {
      await saveProductLabelsToServer(updatedProducts);
    } catch (error) {
      // Revert on error
      setProductLabels(productLabels);
      console.error('Failed to save product edit:', error);
    }
  };

  const saveDriverEdit = async () => {
    if (!editingDriverId || !editingDriverName.trim() || !editingPaynowNumber.trim() || !editingDetrackId.trim() || !editingContactNo.trim() || !editingPricePerDrop.trim()) return;

    const updatedDrivers = driverInfos.map(driver =>
      driver.id === editingDriverId
        ? {
            ...driver,
            driverName: editingDriverName.trim(),
            paynowNumber: editingPaynowNumber.trim(),
            detrackId: editingDetrackId.trim(),
            contactNo: editingContactNo.trim(),
            pricePerDrop: editingPricePerDrop.trim()
          }
        : driver
    );

    setDriverInfos(updatedDrivers);
    cancelEdit();

    try {
      await saveDriverInfosToServer(updatedDrivers);
    } catch (error) {
      // Revert on error
      setDriverInfos(driverInfos);
      console.error('Failed to save driver edit:', error);
    }
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setEditingDriverId(null);
    setEditingProductName('');
    setEditingProductLabel('');
    setEditingDriverName('');
    setEditingPaynowNumber('');
    setEditingDetrackId('');
    setEditingContactNo('');
    setEditingPricePerDrop('');
  };

  const exportProductLabelsCSV = () => {
    const headers = ['Product Name', 'Label'];
    const csvContent = [
      headers.join(','),
      ...productLabels.map(product => [
        `"${product.productName}"`,
        `"${product.label}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-labels.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportDriverInfoCSV = () => {
    const headers = ['Driver Name', 'Paynow Number', 'Detrack ID', 'Contact No.', 'Price Per Drop'];
    const csvContent = [
      headers.join(','),
      ...driverInfos.map(driver => [
        `"${driver.driverName}"`,
        `"${driver.paynowNumber}"`,
        `"${driver.detrackId}"`,
        `"${driver.contactNo}"`,
        `"${driver.pricePerDrop}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driver-info.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Information Management</h1>
          <p className="text-gray-600 mt-1">Manage product labels and driver information</p>
        </div>
        <div className="flex gap-2">
          {productLabels.length > 0 && (
            <Button onClick={exportProductLabelsCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Products
            </Button>
          )}
          {driverInfos.length > 0 && (
            <Button onClick={exportDriverInfoCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Drivers
            </Button>
          )}
        </div>
      </div>

      {/* Migration Notice */}
      {showMigrationNotice && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">Data Migration Complete</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Your data has been successfully migrated from local storage to server-side storage. 
                  This ensures your information is synced across all devices and securely backed up.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowMigrationNotice(false)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Labels Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Labels
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage product names and their corresponding labels for order processing
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Product */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name</label>
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                onKeyPress={handleProductKeyPress}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Label</label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={handleProductKeyPress}
                placeholder="Enter label"
              />
            </div>
            <Button onClick={addProductLabel} disabled={!newProductName.trim() || !newLabel.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* CSV Import Section */}
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Import CSV</label>
                  <p className="text-xs text-gray-600 mb-2">
                    Upload a CSV file with "Product Name" and "Label" columns
                  </p>
                  <input
                    ref={productFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleProductCSVImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => productFileInputRef.current?.click()}
                    className="text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </Button>
                </div>
                <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                  <p className="font-medium mb-1">CSV Format:</p>
                  <p>Product Name,Label</p>
                  <p>Example Product,Example Label</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProducts.size === filteredProductLabels.length && filteredProductLabels.length > 0}
                  onCheckedChange={selectAllProducts}
                />
                <span className="text-sm text-gray-600">
                  Select All ({selectedProducts.size} selected)
                </span>
              </div>
              {selectedProducts.size > 0 && (
                <Button
                  variant="outline"
                  onClick={deleteSelectedProducts}
                  className="text-red-600 hover:text-red-700"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedProducts.size})
                </Button>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.size === filteredProductLabels.length && filteredProductLabels.length > 0}
                      onCheckedChange={selectAllProducts}
                    />
                  </TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductLabels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      {productLabels.length === 0 ? (
                        <div className="text-center">
                          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Labels</h3>
                          <p className="text-gray-600 mb-4">Add your first product label to get started.</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                          <p className="text-gray-600">Try adjusting your search terms.</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProductLabels.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <Input
                            value={editingProductName}
                            onChange={(e) => setEditingProductName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveProductEdit()}
                            onBlur={saveProductEdit}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                            onClick={() => startEditingProduct(product)}
                          >
                            {product.productName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <Input
                            value={editingProductLabel}
                            onChange={(e) => setEditingProductLabel(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveProductEdit()}
                            onBlur={saveProductEdit}
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                            onClick={() => startEditingProduct(product)}
                          >
                            <Badge variant="outline">{product.label}</Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={saveProductEdit}>
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingProduct(product)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeProductLabel(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Driver Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage driver details including contact information and payment rates
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Driver Name</label>
              <Input
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                onKeyPress={handleDriverKeyPress}
                placeholder="Enter driver name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Paynow Number</label>
              <Input
                value={newPaynowNumber}
                onChange={(e) => setNewPaynowNumber(e.target.value)}
                onKeyPress={handleDriverKeyPress}
                placeholder="Enter Paynow number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Detrack ID</label>
              <Input
                value={newDetrackId}
                onChange={(e) => setNewDetrackId(e.target.value)}
                onKeyPress={handleDriverKeyPress}
                placeholder="Enter Detrack ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact No.</label>
              <Input
                value={newContactNo}
                onChange={(e) => setNewContactNo(e.target.value)}
                onKeyPress={handleDriverKeyPress}
                placeholder="Enter Contact No."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price Per Drop</label>
              <Input
                value={newPricePerDrop}
                onChange={(e) => setNewPricePerDrop(e.target.value)}
                onKeyPress={handleDriverKeyPress}
                placeholder="Enter Price Per Drop"
              />
            </div>
            <Button 
              onClick={addDriverInfo} 
              disabled={!newDriverName.trim() || !newPaynowNumber.trim() || !newDetrackId.trim() || !newContactNo.trim() || !newPricePerDrop.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </div>

          {/* CSV Import Section */}
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Import CSV</label>
                  <p className="text-xs text-gray-600 mb-2">
                    Upload a CSV file with "Driver Name", "Paynow Number", "Detrack ID", "Contact No.", and "Price Per Drop" columns
                  </p>
                  <input
                    ref={driverFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleDriverCSVImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => driverFileInputRef.current?.click()}
                    className="text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </Button>
                </div>
                <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                  <p className="font-medium mb-1">CSV Format:</p>
                  <p>Driver Name,Paynow Number,Detrack ID,Contact No.,Price Per Drop</p>
                  <p>John Doe,91234567,D12345,1234567890,10</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search drivers..."
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDrivers.size === filteredDriverInfos.length && filteredDriverInfos.length > 0}
                  onCheckedChange={selectAllDrivers}
                />
                <span className="text-sm text-gray-600">
                  Select All ({selectedDrivers.size} selected)
                </span>
              </div>
              {selectedDrivers.size > 0 && (
                <Button
                  variant="outline"
                  onClick={deleteSelectedDrivers}
                  className="text-red-600 hover:text-red-700"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedDrivers.size})
                </Button>
              )}
            </div>
          </div>

          {/* Drivers Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDrivers.size === filteredDriverInfos.length && filteredDriverInfos.length > 0}
                      onCheckedChange={selectAllDrivers}
                    />
                  </TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Paynow Number</TableHead>
                  <TableHead>Detrack ID</TableHead>
                  <TableHead>Contact No.</TableHead>
                  <TableHead>Price Per Drop</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDriverInfos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {driverInfos.length === 0 ? (
                        <div className="text-center">
                          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Driver Information</h3>
                          <p className="text-gray-600 mb-4">Add your first driver to get started.</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers Found</h3>
                          <p className="text-gray-600">Try adjusting your search terms.</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDriverInfos.map((driver) => (
                    <TableRow key={driver.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedDrivers.has(driver.id)}
                          onCheckedChange={() => toggleDriverSelection(driver.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {editingDriverId === driver.id ? (
                          <Input
                            value={editingDriverName}
                            onChange={(e) => setEditingDriverName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveDriverEdit()}
                            onBlur={saveDriverEdit}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                            onClick={() => startEditingDriver(driver)}
                          >
                            {driver.driverName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingDriverId === driver.id ? (
                          <Input
                            value={editingPaynowNumber}
                            onChange={(e) => setEditingPaynowNumber(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveDriverEdit()}
                            onBlur={saveDriverEdit}
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors font-mono"
                            onClick={() => startEditingDriver(driver)}
                          >
                            {driver.paynowNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingDriverId === driver.id ? (
                          <Input
                            value={editingDetrackId}
                            onChange={(e) => setEditingDetrackId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveDriverEdit()}
                            onBlur={saveDriverEdit}
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors font-mono"
                            onClick={() => startEditingDriver(driver)}
                          >
                            {driver.detrackId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingDriverId === driver.id ? (
                          <Input
                            value={editingContactNo}
                            onChange={(e) => setEditingContactNo(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveDriverEdit()}
                            onBlur={saveDriverEdit}
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors font-mono"
                            onClick={() => startEditingDriver(driver)}
                          >
                            {driver.contactNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingDriverId === driver.id ? (
                          <Input
                            value={editingPricePerDrop}
                            onChange={(e) => setEditingPricePerDrop(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveDriverEdit()}
                            onBlur={saveDriverEdit}
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                            onClick={() => startEditingDriver(driver)}
                          >
                            ${driver.pricePerDrop}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingDriverId === driver.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={saveDriverEdit}>
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingDriver(driver)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeDriverInfo(driver.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 