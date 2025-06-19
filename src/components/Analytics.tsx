import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Download, BarChart3, Users, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

// Fetch available job types from backend
async function fetchJobTypes() {
  const res = await fetch('/api/detrack/job-types');
  if (!res.ok) throw new Error('Failed to fetch job types');
  const data = await res.json();
  return data.jobTypes || [];
}

// Fetch jobs from backend API, which proxies to Detrack
async function fetchDetrackJobs(type: string, date: string) {
  const params = new URLSearchParams({ type, date });
  const res = await fetch(`/api/detrack/jobs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  const data = await res.json();
  // Map/normalize the response to the table fields
  return (data.jobs || []).map((job: any) => ({
    date: job.date || '',
    do_number: job.do_number || '',
    assign_to: job.assign_to || '',
    status: job.status || '',
    time_window: job.time_window || '',
    description: job.description || '',
  }));
}

// PartTimePay component with enhanced UI
function PartTimePay({ jobs }: { jobs: any[] }) {
  // Read driver info from server API
  const [driverInfos, setDriverInfos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDriverInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/config/driver-info', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setDriverInfos(data.driverInfo || []);
        } else {
          console.error('Failed to load driver info from server');
          setDriverInfos([]);
        }
      } catch (error) {
        console.error('Error loading driver info:', error);
        setDriverInfos([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadDriverInfo();
  }, []);

  // Map driver name to jobs and calculate totals
  const driverPayData = React.useMemo(() => {
    if (!driverInfos.length) return [];
    return driverInfos.map(driver => {
      // Match jobs where assigned_to matches driverName (case-insensitive)
      const matchedJobs = jobs.filter(job => 
        job.assign_to && 
        job.assign_to.trim().toLowerCase() === driver.driverName.trim().toLowerCase()
      );
      // Unique order IDs
      const uniqueOrderIds = Array.from(new Set(matchedJobs.map(job => job.do_number)));
      const totalCount = uniqueOrderIds.length;
      const pricePerDrop = parseFloat(driver.pricePerDrop) || 0;
      const totalAmount = totalCount * pricePerDrop;
      return {
        driverName: driver.driverName,
        paynowNumber: driver.paynowNumber,
        totalCount,
        totalAmount,
        pricePerDrop,
      };
    }).filter(d => d.totalCount > 0);
  }, [jobs, driverInfos]);

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="mx-auto h-12 w-12 mb-4 opacity-50 animate-pulse" />
        <p className="text-sm">Loading driver information...</p>
      </div>
    );
  }

  if (!driverPayData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">No part-time pay data for this day.</p>
        <p className="text-xs mt-1">Add driver information in the Info tab to see pay calculations.</p>
      </div>
    );
  }

  const totalAmount = driverPayData.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalOrders = driverPayData.reduce((sum, d) => sum + d.totalCount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{totalOrders}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Amount</p>
                <p className="text-2xl font-bold text-green-900">${totalAmount.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Active Drivers</p>
                <p className="text-2xl font-bold text-purple-900">{driverPayData.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left font-medium text-gray-700">Driver Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Paynow Number</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Orders</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Price Per Drop</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {driverPayData.map((d, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{d.driverName}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{d.paynowNumber}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary" className="font-medium">{d.totalCount}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">${d.pricePerDrop.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">${d.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [type, setType] = useState('Delivery');
  const [date, setDate] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobTypesLoading, setJobTypesLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [timeWindowFilter, setTimeWindowFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setJobTypesLoading(true);
    fetchJobTypes()
      .then(types => {
        setJobTypes(types);
        if (types.length > 0) setType(types[0]);
      })
      .catch(() => setJobTypes([]))
      .finally(() => setJobTypesLoading(false));
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const jobs = await fetchDetrackJobs(type, date);
      setJobs(jobs);
    } catch (err: any) {
      setError(err.message || 'Error fetching jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobs([]);
    setError(null);
    setSearchTerm('');
    setAssignedToFilter('all');
    setTimeWindowFilter('all');
    setStatusFilter('all');
  };

  const handleExportCSV = () => {
    if (filteredJobs.length === 0) return;
    
    const headers = ['Date', 'Delivery Order No.', 'Time Window', 'Assigned To', 'Description', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredJobs.map(job => [
        job.date,
        job.do_number,
        job.time_window,
        job.assign_to,
        `"${job.description}"`,
        job.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detrack-jobs-${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get unique values for filter dropdowns
  const uniqueAssignedTo = useMemo(() => {
    const values = [...new Set(jobs.map(job => job.assign_to).filter(Boolean))];
    return values.sort();
  }, [jobs]);

  const uniqueTimeWindows = useMemo(() => {
    const values = [...new Set(jobs.map(job => job.time_window).filter(Boolean))];
    return values.sort();
  }, [jobs]);

  const uniqueStatuses = useMemo(() => {
    const values = [...new Set(jobs.map(job => job.status).filter(Boolean))];
    return values.sort();
  }, [jobs]);

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search across all fields
      const searchMatch = !searchTerm || 
        Object.values(job).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filter by assigned to
      const assignedToMatch = assignedToFilter === 'all' || job.assign_to === assignedToFilter;

      // Filter by time window
      const timeWindowMatch = timeWindowFilter === 'all' || job.time_window === timeWindowFilter;

      // Filter by status
      const statusMatch = statusFilter === 'all' || job.status === statusFilter;

      return searchMatch && assignedToMatch && timeWindowMatch && statusMatch;
    });
  }, [jobs, searchTerm, assignedToFilter, timeWindowFilter, statusFilter]);

  // Calculate stat cards data
  const statCardsData = useMemo(() => {
    const timeWindows = ['Morning', 'Afternoon', 'Night'];
    const stats: any = {};

    timeWindows.forEach(timeWindow => {
      const jobsInTimeWindow = jobs.filter(job => job.time_window === timeWindow);
      
      // Group by assigned_to and count orders with status
      const driverBreakdown: any = {};
      jobsInTimeWindow.forEach(job => {
        const driver = job.assign_to || 'Unassigned';
        if (!driverBreakdown[driver]) {
          driverBreakdown[driver] = {
            orders: new Set(),
            completed: 0,
            failed: 0
          };
        }
        driverBreakdown[driver].orders.add(job.do_number);
        
        // Count status
        if (job.status === 'completed') {
          driverBreakdown[driver].completed++;
        } else if (job.status === 'failed') {
          driverBreakdown[driver].failed++;
        }
      });

      // Convert to array format with counts
      const breakdown = Object.entries(driverBreakdown).map(([driver, data]: [string, any]) => ({
        driver,
        count: data.orders.size,
        orders: Array.from(data.orders),
        completed: data.completed,
        failed: data.failed
      })).sort((a: any, b: any) => b.count - a.count); // Sort by count descending

      stats[timeWindow] = {
        totalJobs: jobsInTimeWindow.length,
        orders: new Set(jobsInTimeWindow.map(job => job.do_number)).size,
        driverBreakdown: breakdown
      };
    });

    // Calculate total across all time windows
    const allJobs = jobs;
    const totalDriverBreakdown: any = {};
    allJobs.forEach(job => {
      const driver = job.assign_to || 'Unassigned';
      if (!totalDriverBreakdown[driver]) {
        totalDriverBreakdown[driver] = {
          orders: new Set(),
          completed: 0,
          failed: 0
        };
      }
      totalDriverBreakdown[driver].orders.add(job.do_number);
      
      // Count status
      if (job.status === 'completed') {
        totalDriverBreakdown[driver].completed++;
      } else if (job.status === 'failed') {
        totalDriverBreakdown[driver].failed++;
      }
    });

    const totalBreakdown = Object.entries(totalDriverBreakdown).map(([driver, data]: [string, any]) => ({
      driver,
      count: data.orders.size,
      orders: Array.from(data.orders),
      completed: data.completed,
      failed: data.failed
    })).sort((a: any, b: any) => b.count - a.count);

    stats['Total'] = {
      totalJobs: allJobs.length,
      orders: new Set(allJobs.map(job => job.do_number)).size,
      driverBreakdown: totalBreakdown
    };

    return stats;
  }, [jobs]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track delivery performance and driver analytics</p>
        </div>
        {jobs.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline" className="w-fit">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Fetch Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Job Type</label>
              <Select value={type} onValueChange={setType} disabled={jobTypesLoading || jobTypes.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((t, idx) => (
                    <SelectItem key={idx} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleFetch} disabled={!date || loading || jobTypesLoading} className="w-full sm:w-auto">
              {loading ? 'Fetching...' : 'Fetch Jobs'}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={jobs.length === 0 && !error} className="w-full sm:w-auto">
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Morning', 'Afternoon', 'Night', 'Total'].map((timeWindow) => {
            const data = statCardsData[timeWindow];
            const totalOrders = data?.orders || 0;
            const driverCount = data?.driverBreakdown?.length || 0;
            const completedOrders = data?.driverBreakdown?.reduce((sum: number, driver: any) => sum + driver.completed, 0) || 0;
            const failedOrders = data?.driverBreakdown?.reduce((sum: number, driver: any) => sum + driver.failed, 0) || 0;
            
            return (
              <Card key={timeWindow} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {timeWindow === 'Morning' && <Clock className="w-4 h-4 text-orange-500" />}
                      {timeWindow === 'Afternoon' && <Clock className="w-4 h-4 text-blue-500" />}
                      {timeWindow === 'Night' && <Clock className="w-4 h-4 text-purple-500" />}
                      {timeWindow === 'Total' && <BarChart3 className="w-4 h-4 text-green-500" />}
                      {timeWindow}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">{totalOrders}</span>
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{totalOrders} orders • {driverCount} drivers</span>
                    <div className="flex items-center gap-2">
                      {completedOrders > 0 && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {completedOrders}
                        </span>
                      )}
                      {failedOrders > 0 && (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {failedOrders}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {data?.driverBreakdown && data.driverBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {data.driverBreakdown.slice(0, 5).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-medium truncate">{item.driver}</span>
                          <div className="flex items-center gap-2">
                            {item.completed > 0 && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span className="font-bold">{item.completed}</span>
                              </div>
                            )}
                            {item.failed > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-3 h-3" />
                                <span className="font-bold">{item.failed}</span>
                              </div>
                            )}
                            <span className="text-blue-600 font-bold">{item.count}</span>
                          </div>
                        </div>
                      ))}
                      {data.driverBreakdown.length > 5 && (
                        <div className="text-xs text-muted-foreground pt-1">
                          +{data.driverBreakdown.length - 5} more drivers
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No deliveries in this time window
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Part-Time Pay Section */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Part-Time Pay
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Paynow, Total Count, and Total Amount for each part-time driver
            </p>
          </CardHeader>
          <CardContent>
            <PartTimePay jobs={jobs} />
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Assigned To</label>
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All drivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueAssignedTo.map((value, idx) => (
                      <SelectItem key={idx} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time Window</label>
                <Select value={timeWindowFilter} onValueChange={setTimeWindowFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time windows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueTimeWindows.map((value, idx) => (
                      <SelectItem key={idx} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueStatuses.map((value, idx) => (
                      <SelectItem key={idx} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredJobs.length !== jobs.length && (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Delivery Order No.</TableHead>
                    <TableHead>Time Window</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {jobs.length === 0 ? 'No data' : 'No jobs match the current filters'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{job.date}</TableCell>
                        <TableCell className="font-mono">{job.do_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.time_window}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{job.assign_to || 'Unassigned'}</TableCell>
                        <TableCell className="max-w-xs truncate">{job.description}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {jobs.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-600 mb-4">Select a date and fetch jobs to see analytics and performance metrics.</p>
            <Button onClick={() => setDate(new Date().toISOString().split('T')[0])}>
              Set Today's Date
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 