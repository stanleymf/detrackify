import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  X,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { ProductLabel, StoreProduct, TagFilter, TitleFilter, SavedProduct, SyncStatus } from '@/types';
import { parseCSV } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ShopifyStore } from '@/types/shopify';
import { storage } from '@/lib/storage';

interface DriverInfo {
  id: string;
  driverName: string;
  paynowNumber: string;
  detrackId: string;
  contactNo: string;
  pricePerDrop: string;
}

export default function Info({ 
  viewMode = 'auto'
}: { 
  viewMode?: 'auto' | 'mobile' | 'desktop'
}) {
  const { toast } = useToast();
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

  // Store Products state
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [tagFilters, setTagFilters] = useState<TagFilter[]>([]);
  const [newTagFilter, setNewTagFilter] = useState("");
  const [titleFilters, setTitleFilters] = useState<TitleFilter[]>([]);
  const [newTitleFilter, setNewTitleFilter] = useState("");
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());

  // Saved Products enhanced features
  const [savedProductsSearchTerm, setSavedProductsSearchTerm] = useState('');
  const [savedProductsCollapsed, setSavedProductsCollapsed] = useState(false);
  const [savedProductsCurrentPage, setSavedProductsCurrentPage] = useState(1);
  const savedProductsPerPage = 10;

  // Sync functionality state
  const [syncStatus, setSyncStatus] = useState<{ last_sync: string | null, total_products: number, last_sync_status: string | null } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);
  const productsPerPage = 10;

  const syncStatusInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Filtered and paginated saved products
  const filteredSavedProducts = useMemo(() => {
    if (!savedProductsSearchTerm.trim()) return savedProducts;
    return savedProducts.filter(product => 
      product.title.toLowerCase().includes(savedProductsSearchTerm.toLowerCase()) ||
      product.variantTitle?.toLowerCase().includes(savedProductsSearchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(savedProductsSearchTerm.toLowerCase())) ||
      product.storeDomain.toLowerCase().includes(savedProductsSearchTerm.toLowerCase())
    );
  }, [savedProducts, savedProductsSearchTerm]);

  const paginatedSavedProducts = useMemo(() => {
    const startIndex = (savedProductsCurrentPage - 1) * savedProductsPerPage;
    const endIndex = startIndex + savedProductsPerPage;
    return filteredSavedProducts.slice(startIndex, endIndex);
  }, [filteredSavedProducts, savedProductsCurrentPage]);

  const totalSavedProductsPages = Math.ceil(filteredSavedProducts.length / savedProductsPerPage);

  // Add state for tag filter, fetched products, and selected fetched products
  const [tagFilter, setTagFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [selectedFetched, setSelectedFetched] = useState<Set<string>>(new Set());

  // Add state for loading
  const [fetching, setFetching] = useState(false);

  // Add state for fetched products search
  const [fetchedProductsSearchTerm, setFetchedProductsSearchTerm] = useState('');

  // Load stores from local storage (Settings)
  useEffect(() => {
    // Clear any existing localStorage data since we've migrated to server-side storage
    clearLocalStorageData();
    loadProductLabels();
    loadDriverInfos();
    loadStoresFromDB();
    loadSavedProducts();
  }, []);

  // Load saved products when selected store changes
  useEffect(() => {
    if (selectedStore) {
      loadSavedProducts();
    }
  }, [selectedStore]);

  // Reset pagination when search term changes
  useEffect(() => {
    setSavedProductsCurrentPage(1);
  }, [savedProductsSearchTerm]);

  // Pagination navigation functions
  const goToSavedProductsPage = (page: number) => {
    setSavedProductsCurrentPage(page);
  };

  const goToNextSavedProductsPage = () => {
    if (savedProductsCurrentPage < totalSavedProductsPages) {
      setSavedProductsCurrentPage(savedProductsCurrentPage + 1);
    }
  };

  const goToPreviousSavedProductsPage = () => {
    if (savedProductsCurrentPage > 1) {
      setSavedProductsCurrentPage(savedProductsCurrentPage - 1);
    }
  };

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

  // Load tag filters when store changes
  useEffect(() => {
    if (selectedStore) {
      loadTagFilters()
    }
  }, [selectedStore])

  const loadTagFilters = async () => {
    try {
      const response = await fetch(`/api/config/tag-filters?storeId=${selectedStore}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTagFilters(data.tagFilters || [])
      }
    } catch (error) {
      console.error('Error loading tag filters:', error)
    }
  }

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) {
      return storeProducts
    }
    return storeProducts.filter(product =>
      product.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.variantTitle.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(productSearchTerm.toLowerCase()))
    )
  }, [storeProducts, productSearchTerm])

  // Fetch products based on tags and titles
  const fetchProducts = async () => {
    if (!selectedStore) return

    setIsLoadingProducts(true)
    try {
      const storeTagFilters = tagFilters.filter(filter => filter.storeId === selectedStore)
      
      const response = await fetch('/api/stores/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          storeId: selectedStore,
          tags: storeTagFilters.map(filter => filter.tag)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStoreProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Load saved products when store changes
  const loadSavedProducts = async () => {
    try {
      const response = await fetch(`/api/saved-products?storeId=${selectedStore}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSavedProducts(data.savedProducts || [])
        // Create a set of saved product IDs for quick lookup
        const savedIds = new Set<string>(data.savedProducts?.map((p: SavedProduct) => p.productId) || [])
        setSavedProductIds(savedIds)
      }
    } catch (error) {
      console.error('Error loading saved products:', error)
    }
  }

  // Save product to configuration
  const saveProduct = async (product: StoreProduct) => {
    try {
      const response = await fetch('/api/saved-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(product)
      })

      if (response.ok) {
        // Add to saved products list
        const savedProduct: SavedProduct = {
          id: '', // Will be set by the server
          productId: product.id,
          title: product.title,
          variantTitle: product.variantTitle,
          price: product.price,
          handle: product.handle,
          tags: product.tags,
          storeId: product.storeId,
          storeDomain: product.storeDomain,
          userId: '', // Will be set by the server
          createdAt: new Date().toISOString(),
          orderTags: product.orderTags || []
        }
        setSavedProducts([savedProduct, ...savedProducts])
        setSavedProductIds(new Set([...savedProductIds, product.id]))
      }
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  // Remove product from saved configuration
  const removeSavedProduct = async (savedProduct: SavedProduct) => {
    try {
      const response = await fetch(`/api/saved-products/${savedProduct.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setSavedProducts(savedProducts.filter(p => p.id !== savedProduct.id))
        const newSavedIds = new Set(savedProductIds)
        newSavedIds.delete(savedProduct.productId)
        setSavedProductIds(newSavedIds)
      }
    } catch (error) {
      console.error('Error removing saved product:', error)
    }
  }

  const fetchSyncStatus = async () => {
    if (!selectedStore) return
    
    try {
      const response = await fetch(`/api/sync/status?storeId=${selectedStore}`)
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data.syncStatus)
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
    }
  }

  const handleSyncProducts = async () => {
    if (!selectedStore) {
      toast({
        title: "No store selected",
        description: "Please select a store first.",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    setSyncMessage('Starting sync...')
    
    try {
      const response = await fetch('/api/sync/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId: selectedStore }),
      })

      if (response.ok) {
        const data = await response.json()
        setSyncMessage(`Sync completed! ${data.totalProducts} products synced.`)
        toast({
          title: "Sync successful",
          description: `${data.totalProducts} products have been synced.`,
        })
        
        // Refresh saved products and sync status
        loadSavedProducts()
        fetchSyncStatus()
      } else {
        const errorData = await response.json()
        setSyncMessage(`Sync failed: ${errorData.error}`)
        toast({
          title: "Sync failed",
          description: errorData.error || "Failed to sync products",
          variant: "destructive",
        })
      }
    } catch (error) {
      setSyncMessage(`Sync failed: ${error}`)
      toast({
        title: "Sync failed",
        description: "An error occurred while syncing products",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (selectedStore) {
      loadSavedProducts()
      fetchSyncStatus()
    }
  }, [selectedStore])

  // Use existing filteredSavedProducts instead of creating new filteredProducts
  const totalPages = Math.ceil(filteredSavedProducts.length / productsPerPage)
  const paginatedProducts = filteredSavedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  )

  // Select/deselect all products on the current page
  const toggleSelectAllProductsOnPage = () => {
    const pageIds = paginatedSavedProducts.map((p) => p.id)
    const allSelected = pageIds.every((id) => selectedProducts.has(id))
    const newSelected = new Set(selectedProducts)
    if (allSelected) {
      pageIds.forEach((id) => newSelected.delete(id))
    } else {
      pageIds.forEach((id) => newSelected.add(id))
    }
    setSelectedProducts(newSelected)
  }

  // Bulk apply label to selected products
  const handleBulkApplyLabel = async () => {
    if (!newLabel.trim() || selectedProducts.size === 0) return
    // Update label for selected products in state
    const updated = savedProducts.map((product) =>
      selectedProducts.has(product.id)
        ? { ...product, label: newLabel }
        : product
    )
    setSavedProducts(updated)
    setNewLabel("")
    setSelectedProducts(new Set())
    // Persist to server
    try {
      await fetch('/api/saved-products/bulk-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
          label: newLabel,
          storeId: selectedStore
        })
      })
      // Reload products from server
      loadSavedProducts()
    } catch (error) {
      console.error('Failed to update labels on server', error)
    }
  }

  // Restore loadStoresFromDB and use it in useEffect
  const loadStoresFromDB = async () => {
    try {
      const response = await fetch('/api/stores', { credentials: 'include' })
      if (response.ok) {
        const storesData = await response.json()
        console.log('Fetched stores from backend:', storesData)
        setStores(storesData)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      await fetch(`/api/stores/${storeId}`, { method: 'DELETE', credentials: 'include' });
      loadStoresFromDB();
      if (selectedStore === storeId) setSelectedStore('');
    } catch (error) {
      console.error('Failed to delete store:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/saved-products/${productId}`, { method: 'DELETE', credentials: 'include' });
      loadSavedProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  // Poll sync status while syncing
  useEffect(() => {
    if (isSyncing && selectedStore) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/sync/status?storeId=${selectedStore}`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setSyncStatus(data.syncStatus);
            if (data.syncStatus?.last_sync_status === 'success' || data.syncStatus?.last_sync_status === 'error') {
              setIsSyncing(false);
              if (syncStatusInterval.current) clearInterval(syncStatusInterval.current);
            }
          }
        } catch {}
      };
      poll();
      syncStatusInterval.current = setInterval(poll, 2000);
      return () => {
        if (syncStatusInterval.current) clearInterval(syncStatusInterval.current);
      };
    }
  }, [isSyncing, selectedStore]);

  // Fetch products by tag
  const fetchProductsByTag = async () => {
    console.log('[Frontend] fetchProductsByTag called');
    console.log('[Frontend] Current state:', { selectedStore, tagFilter, titleFilter, fetching });
    
    if (!selectedStore) {
      console.log('[Frontend] No store selected, returning');
      return;
    }
    
    if (fetching) {
      console.log('[Frontend] Already fetching, returning');
      return;
    }
    
    console.log('[Frontend] Starting fetch process');
    setFetchedProducts([]);
    setSelectedFetched(new Set());
    setFetching(true);
    
    try {
      const requestBody = { 
        storeId: selectedStore, 
        tags: tagFilter.split(',').map(t => t.trim()).filter(Boolean),
        titles: titleFilter.split(',').map(t => t.trim()).filter(Boolean)
      };
      
      console.log('[Frontend] Fetching products with:', requestBody);
      console.log('[Frontend] Making request to /api/stores/products');
      
      const res = await fetch('/api/stores/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      console.log('[Frontend] Response received:', res.status, res.statusText);
      console.log('[Frontend] Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Frontend] Response data:', data);
        setFetchedProducts(data.products || []);
        console.log('[Frontend] Set fetched products:', data.products?.length || 0);
      } else {
        const errorText = await res.text();
        console.error('[Frontend] Error response:', errorText);
        alert(`Failed to fetch products: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      console.error('[Frontend] Fetch error:', error);
      console.error('[Frontend] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('[Frontend] Setting fetching to false');
      setFetching(false);
    }
  };

  // Save selected fetched products
  const handleSaveSelected = async () => {
    if (selectedFetched.size === 0) return;
    const toSave = fetchedProducts.filter(p => selectedFetched.has(p.id)).map(p => ({
      id: p.id,
      title: p.title,
      variantTitle: p.variantTitle || '',
      price: p.price || '0',
      handle: p.handle,
      tags: p.tags,
      storeId: selectedStore,
      storeDomain: stores.find(s => s.id === selectedStore)?.shopify_domain || '',
    }));
    await fetch('/api/saved-products/bulk-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ products: toSave })
    });
    loadSavedProducts();
    setFetchedProducts([]);
    setSelectedFetched(new Set());
  };

  // Bulk delete selected saved products
  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm('Are you sure you want to delete all selected products?')) return;
    try {
      await fetch('/api/saved-products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productIds: Array.from(selectedProducts) })
      });
      setSelectedProducts(new Set());
      loadSavedProducts();
    } catch (err) {
      // Optionally show a toast or error
    }
  };

  // Pagination for fetched products
  const fetchedProductsPerPage = 20;
  const [fetchedProductsPage, setFetchedProductsPage] = useState(1);
  const sortedFetchedProducts = useMemo(() => {
    // Remove duplicates by id (or by title+variant if id is not unique)
    const seen = new Set();
    return fetchedProducts
      .filter(p => {
        const key = p.id || (p.title + (p.variantTitle || ''));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const tA = a.title.toLowerCase();
        const tB = b.title.toLowerCase();
        if (tA !== tB) return tA.localeCompare(tB);
        const vA = (a.variantTitle || '').toLowerCase();
        const vB = (b.variantTitle || '').toLowerCase();
        return vA.localeCompare(vB);
      });
  }, [fetchedProducts]);

  // Filter fetched products based on search term
  const filteredFetchedProducts = useMemo(() => {
    if (!fetchedProductsSearchTerm.trim()) return sortedFetchedProducts;
    return sortedFetchedProducts.filter(product => 
      product.title.toLowerCase().includes(fetchedProductsSearchTerm.toLowerCase()) ||
      product.variantTitle?.toLowerCase().includes(fetchedProductsSearchTerm.toLowerCase()) ||
      product.tags.some((tag: string) => tag.toLowerCase().includes(fetchedProductsSearchTerm.toLowerCase()))
    );
  }, [sortedFetchedProducts, fetchedProductsSearchTerm]);

  const totalFetchedPages = Math.ceil(filteredFetchedProducts.length / fetchedProductsPerPage);
  const paginatedFetchedProducts = useMemo(() => {
    const start = (fetchedProductsPage - 1) * fetchedProductsPerPage;
    return filteredFetchedProducts.slice(start, start + fetchedProductsPerPage);
  }, [filteredFetchedProducts, fetchedProductsPage]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setFetchedProductsPage(1);
  }, [fetchedProductsSearchTerm]);

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

      {/* Store Products */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Store Products Management
          </CardTitle>
          <CardDescription>
            Fetch, organize, and manage your store's products with advanced filtering and bulk operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Configuration Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="store-select" className="text-sm font-medium">Select Store</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger id="store-select" className="w-full">
                    <SelectValue placeholder="Choose a store to work with" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {store.shopify_domain}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="tag-filter" className="text-sm font-medium">Product Filter</Label>
                <div className="flex gap-2">
                  <Input 
                    id="tag-filter" 
                    value={tagFilter} 
                    onChange={e => setTagFilter(e.target.value)} 
                    placeholder="e.g., roses, birthday, anniversary" 
                    className="flex-1" 
                  />
                  <Button 
                    onClick={fetchProductsByTag} 
                    disabled={!selectedStore || fetching}
                    className="min-w-[100px]"
                    title={`Debug: selectedStore=${selectedStore}, tagFilter="${tagFilter}", titleFilter="${titleFilter}", fetching=${fetching}`}
                  >
                    {fetching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Fetch
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="title-filter" 
                    value={titleFilter} 
                    onChange={e => setTitleFilter(e.target.value)} 
                    placeholder="Search by product title (e.g., Heartfelt)" 
                    className="flex-1" 
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter tags separated by commas OR product title to filter products. Leave both empty to fetch all products.
                </p>
                {/* Debug display */}
                <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                  <div>Debug: selectedStore="{selectedStore}"</div>
                  <div>tagFilter="{tagFilter}"</div>
                  <div>titleFilter="{titleFilter}"</div>
                  <div>fetching={fetching.toString()}</div>
                  <div>Button disabled: {(!selectedStore || fetching).toString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fetched Products Section */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Fetched Products
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredFetchedProducts.length > 0 
                    ? `${filteredFetchedProducts.length} products found matching your filter`
                    : 'No products fetched yet'
                  }
                </p>
              </div>
              {filteredFetchedProducts.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selectedFetched.size}</span> selected
                  </div>
                  <Button 
                    onClick={handleSaveSelected} 
                    disabled={selectedFetched.size === 0}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Selected ({selectedFetched.size})
                  </Button>
                </div>
              )}
            </div>

            {/* Search Bar */}
            {sortedFetchedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search fetched products..."
                    value={fetchedProductsSearchTerm}
                    onChange={(e) => setFetchedProductsSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {filteredFetchedProducts.length} of {sortedFetchedProducts.length} products
                </p>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <Table className="min-w-full text-sm border rounded-lg overflow-hidden">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="w-[50px] px-4 py-3">
                      <Checkbox 
                        className="mt-1"
                        checked={paginatedFetchedProducts.length > 0 && 
                          paginatedFetchedProducts.every(p => selectedFetched.has(p.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFetched(new Set([...selectedFetched, ...paginatedFetchedProducts.map(p => p.id)]));
                          } else {
                            const newSelected = new Set(selectedFetched);
                            paginatedFetchedProducts.forEach(p => newSelected.delete(p.id));
                            setSelectedFetched(newSelected);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[300px] px-4 py-3 font-medium text-gray-700">Title</TableHead>
                    <TableHead className="w-[200px] px-4 py-3 font-medium text-gray-700">Variant</TableHead>
                    <TableHead className="min-w-[300px] px-4 py-3 font-medium text-gray-700">Tags</TableHead>
                    <TableHead className="w-[100px] px-4 py-3 font-medium text-gray-700 text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFetchedProducts.map((product) => (
                    <TableRow key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                      <TableCell className="align-top px-4 py-3">
                        <Checkbox
                          className="mt-1"
                          checked={selectedFetched.has(product.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedFetched);
                            if (checked) {
                              newSelected.add(product.id);
                            } else {
                              newSelected.delete(product.id);
                            }
                            setSelectedFetched(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell className="align-top px-4 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900" title={product.title}>
                            {product.title}
                          </div>
                          {product.handle && (
                            <div className="text-xs text-gray-500 font-mono">
                              /{product.handle}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {product.variants?.[0]?.title || 'Default'}
                        </div>
                      </TableCell>
                      <TableCell className="align-top px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {product.tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs whitespace-nowrap font-medium">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top px-4 py-3 text-right">
                        <div className="font-medium text-gray-900">
                          ${Number(product.price || 0).toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedFetchedProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        {fetching ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            <span className="text-gray-600">Fetching products...</span>
                          </div>
                        ) : fetchedProductsSearchTerm.trim() ? (
                          <div className="text-gray-500">
                            No products found matching "{fetchedProductsSearchTerm}". Try adjusting your search terms.
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            No products found. Try adjusting your tag filter.
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalFetchedPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <div className="text-sm text-gray-600">
                  Page {fetchedProductsPage} of {totalFetchedPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFetchedProductsPage(p => Math.max(1, p - 1))}
                    disabled={fetchedProductsPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFetchedProductsPage(p => Math.min(totalFetchedPages, p + 1))}
                    disabled={fetchedProductsPage === totalFetchedPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Progress Indicator */}
      {isSyncing && syncStatus && (
        <div className="my-4 flex items-center gap-2">
          <span className="text-sm text-blue-600 font-medium">
            Syncing products... {syncStatus.total_products || 0} fetched so far
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-2 bg-blue-500" style={{ width: `${Math.min(syncStatus.total_products / 10, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Saved Products Section */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5" />
              <div>
                <CardTitle>Saved Products</CardTitle>
                <CardDescription>
                  Manage your saved products with advanced filtering and bulk operations
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <Collapsible open={!savedProductsCollapsed} onOpenChange={(open) => setSavedProductsCollapsed(!open)}>
          <div className="flex justify-end px-6 py-2 border-b">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {savedProductsCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-6">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search saved products..."
                    value={savedProductsSearchTerm}
                    onChange={(e) => setSavedProductsSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Label for selected products"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-[200px]"
                  />
                  <Button 
                    onClick={handleBulkApplyLabel}
                    disabled={selectedProducts.size === 0 || !newLabel.trim()}
                    size="sm"
                  >
                    Apply Label
                  </Button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {savedProducts.length} products saved for this store
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selectedProducts.size}</span> selected
                  </div>
                  <Button 
                    onClick={handleBulkDeleteProducts} 
                    disabled={selectedProducts.size === 0}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedProducts.size})
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table className="min-w-full text-sm border rounded-lg overflow-hidden">
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="w-[50px] px-4 py-3">
                        <Checkbox 
                          className="mt-1"
                          checked={paginatedSavedProducts.length > 0 && 
                            paginatedSavedProducts.every(p => selectedProducts.has(p.id))}
                          onCheckedChange={toggleSelectAllProductsOnPage}
                        />
                      </TableHead>
                      <TableHead className="w-[300px] px-4 py-3 font-medium text-gray-700">Title</TableHead>
                      <TableHead className="w-[200px] px-4 py-3 font-medium text-gray-700">Variant</TableHead>
                      <TableHead className="min-w-[200px] px-4 py-3 font-medium text-gray-700">Tags</TableHead>
                      <TableHead className="w-[150px] px-4 py-3 font-medium text-gray-700">Label</TableHead>
                      <TableHead className="w-[100px] px-4 py-3 font-medium text-gray-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSavedProducts.map((product) => (
                      <TableRow key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                        <TableCell className="align-top px-4 py-3">
                          <Checkbox
                            className="mt-1"
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedProducts);
                              if (checked) {
                                newSelected.add(product.id);
                              } else {
                                newSelected.delete(product.id);
                              }
                              setSelectedProducts(newSelected);
                            }}
                          />
                        </TableCell>
                        <TableCell className="align-top px-4 py-3">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900" title={product.title}>
                              {product.title}
                            </div>
                            {product.handle && (
                              <div className="text-xs text-gray-500 font-mono">
                                /{product.handle}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {product.variantTitle || 'Default'}
                          </div>
                        </TableCell>
                        <TableCell className="align-top px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {product.tags.map((tag: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs whitespace-nowrap font-medium">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="align-top px-4 py-3">
                          {product.label ? (
                            <Badge variant="outline" className="font-medium">
                              {product.label}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">No label</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedSavedProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="text-gray-500">
                            No saved products found.
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {savedProducts.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((savedProductsCurrentPage - 1) * savedProductsPerPage) + 1} to {Math.min(savedProductsCurrentPage * savedProductsPerPage, filteredSavedProducts.length)} of {filteredSavedProducts.length} products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousSavedProductsPage}
                      disabled={savedProductsCurrentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextSavedProductsPage}
                      disabled={savedProductsCurrentPage >= totalSavedProductsPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Driver's Information */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Driver's Information
          </CardTitle>
          <CardDescription>
            Manage driver details including PayNow numbers and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search drivers..."
                  value={driverSearchTerm}
                  onChange={(e) => setDriverSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={driverFileInputRef}
                onChange={handleDriverCSVImport}
                accept=".csv"
                className="hidden"
              />
              <Button onClick={() => driverFileInputRef.current?.click()} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              {driverInfos.length > 0 && (
                <Button onClick={exportDriverInfoCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* Add New Driver */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Add New Driver</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <Input
                placeholder="Driver Name"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                onKeyPress={handleDriverKeyPress}
              />
              <Input
                placeholder="PayNow Number"
                value={newPaynowNumber}
                onChange={(e) => setNewPaynowNumber(e.target.value)}
                onKeyPress={handleDriverKeyPress}
              />
              <Input
                placeholder="Detrack ID"
                value={newDetrackId}
                onChange={(e) => setNewDetrackId(e.target.value)}
                onKeyPress={handleDriverKeyPress}
              />
              <Input
                placeholder="Contact No"
                value={newContactNo}
                onChange={(e) => setNewContactNo(e.target.value)}
                onKeyPress={handleDriverKeyPress}
              />
              <Input
                placeholder="Price Per Drop"
                value={newPricePerDrop}
                onChange={(e) => setNewPricePerDrop(e.target.value)}
                onKeyPress={handleDriverKeyPress}
              />
              <Button onClick={addDriverInfo} disabled={!newDriverName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </div>
          </div>

          {/* Drivers Table */}
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm border rounded-lg overflow-hidden">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="w-[50px] px-4 py-3">
                    <Checkbox 
                      className="mt-1"
                      checked={filteredDriverInfos.length > 0 && 
                        filteredDriverInfos.every(d => selectedDrivers.has(d.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDrivers(new Set(filteredDriverInfos.map(d => d.id)));
                        } else {
                          setSelectedDrivers(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 font-medium text-gray-700">Driver Name</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-gray-700">PayNow Number</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-gray-700">Detrack ID</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-gray-700">Contact No</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-gray-700">Price Per Drop</TableHead>
                  <TableHead className="w-[100px] px-4 py-3 font-medium text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDriverInfos.map((driver) => (
                  <TableRow key={driver.id} className="border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <Checkbox
                        className="mt-1"
                        checked={selectedDrivers.has(driver.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedDrivers);
                          if (checked) {
                            newSelected.add(driver.id);
                          } else {
                            newSelected.delete(driver.id);
                          }
                          setSelectedDrivers(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {editingDriverId === driver.id ? (
                        <Input
                          value={editingDriverName}
                          onChange={(e) => setEditingDriverName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="font-medium text-gray-900">{driver.driverName}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {editingDriverId === driver.id ? (
                        <Input
                          value={editingPaynowNumber}
                          onChange={(e) => setEditingPaynowNumber(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-gray-600 font-mono">{driver.paynowNumber}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {editingDriverId === driver.id ? (
                        <Input
                          value={editingDetrackId}
                          onChange={(e) => setEditingDetrackId(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-gray-600">{driver.detrackId}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {editingDriverId === driver.id ? (
                        <Input
                          value={editingContactNo}
                          onChange={(e) => setEditingContactNo(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-gray-600">{driver.contactNo}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {editingDriverId === driver.id ? (
                        <Input
                          value={editingPricePerDrop}
                          onChange={(e) => setEditingPricePerDrop(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-gray-600">${driver.pricePerDrop}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingDriverId === driver.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveDriverEdit}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingDriver(driver)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDriverInfo(driver.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDriverInfos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="text-gray-500">
                        No drivers found. Add some drivers to get started.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bulk Actions */}
          {selectedDrivers.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-700">
                <span className="font-medium">{selectedDrivers.size}</span> driver(s) selected
              </div>
              <Button 
                onClick={deleteSelectedDrivers} 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 