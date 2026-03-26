"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleXIcon, Columns2, Pencil, Wifi, WifiOff, Filter, Download, MoreHorizontal, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { exportDevicesToCSV, exportDevicesToExcel } from "@/lib/export";
import { restartDevice } from "@/server/iqapi";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDevices } from "@/server/iqapi";
import { updateLabel } from "@/server/iqapi";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { PopoverClose } from "@radix-ui/react-popover";

export type Devices = {
  uuid: string;
  serial_no: string;
  port_group: string;
  is_activated: boolean;
  used_data_formatted: number;
  device_type: string;
  device_plan: string;
  label: string;
  status_formatted: string;
};

export function DataTableDemo() {
  const [devices, setDevices] = useState<Devices[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({uuid: false});
  const [totalDevices, setTotalDevices] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const [pageIndex, setPageIndex] = useState(0); // Current page index
  const [pageSize, setPageSize] = useState(100); // Page size

  // Row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filter states
  const [activationFilter, setActivationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [devicePlanFilter, setDevicePlanFilter] = useState<string>("all");
  
  // Get unique values for filters
  const uniqueDeviceTypes = React.useMemo(() => {
    const types = new Set(devices.map(device => device.device_type));
    return Array.from(types).filter(Boolean) as string[];
  }, [devices]);
  
  const uniqueDevicePlans = React.useMemo(() => {
    const plans = new Set(devices.map(device => device.device_plan));
    return Array.from(plans).filter(Boolean) as string[];
  }, [devices]);
  
  // Apply filters to the data
  const filteredDevices = React.useMemo(() => {
    return devices.filter(device => {
      // Filter by activation status
      if (activationFilter !== 'all') {
        const shouldBeActive = activationFilter === 'active';
        if (device.is_activated !== shouldBeActive) return false;
      }
      
      // Filter by device status
      if (statusFilter !== 'all' && device.status_formatted !== statusFilter) {
        return false;
      }
      
      // Filter by device type
      if (deviceTypeFilter !== 'all' && device.device_type !== deviceTypeFilter) {
        return false;
      }
      
      // Filter by device plan
      if (devicePlanFilter !== 'all' && device.device_plan !== devicePlanFilter) {
        return false;
      }
      
      return true;
    });
  }, [devices, activationFilter, statusFilter, deviceTypeFilter, devicePlanFilter]);

  const [selectedDevice, setSelectedDevice] = useState<Devices | null>(null);
  const [newLabel, setNewLabel] = useState<string>("");

  // Get selected devices
  const selectedDevices = React.useMemo(() => {
    return filteredDevices.filter((_, index) => rowSelection[index]);
  }, [filteredDevices, rowSelection]);

  // Export handlers
  const handleExportCSV = () => {
    const devicesToExport = selectedDevices.length > 0 ? selectedDevices : filteredDevices;
    exportDevicesToCSV(devicesToExport);
    toast.success(`Exported ${devicesToExport.length} devices to CSV`);
  };

  const handleExportExcel = () => {
    const devicesToExport = selectedDevices.length > 0 ? selectedDevices : filteredDevices;
    exportDevicesToExcel(devicesToExport);
    toast.success(`Exported ${devicesToExport.length} devices to Excel`);
  };

  // Bulk action handlers
  const handleBulkRestart = async () => {
    if (selectedDevices.length === 0) {
      toast.error("No devices selected");
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const device of selectedDevices) {
      try {
        await restartDevice(device.uuid);
        successCount++;
      } catch (error) {
        console.error(`Failed to restart device ${device.serial_no}:`, error);
        failCount++;
      }
    }

    setBulkActionLoading(false);
    setRowSelection({});

    if (failCount === 0) {
      toast.success(`Successfully restarted ${successCount} devices`);
    } else {
      toast.warning(`Restarted ${successCount} devices, ${failCount} failed`);
    }
  };

  const columns: ColumnDef<Devices>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "is_activated",
      header: "Status",
      cell: ({ row }) => {
        const isActivated = row.getValue("is_activated");
        const statusFormatted = row.original.status_formatted; // Get additional status
        
        return (
          <div className="flex items-center gap-2">
            {/* Activation Indicator */}
            {isActivated ? (
              <CircleCheck size={14} className="text-green-500" />
            ) : (
              <CircleXIcon size={14} className="text-gray-400" />
            )}
  
            {/* Connectivity Indicator */}
            {statusFormatted === "Reachable" ? (
              <Wifi size={16} className="text-foreground" />
            ) : (
              <WifiOff size={16} className="text-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "uuid",
      header: "UUID",
      cell: ({ row }) => <div>{row.getValue("uuid")}</div>,
    },
    {
      accessorKey: "serial_no",
      header: "Serial Number",
      cell: ({ row }) => (
        <Link 
          href={`/devices/${row.original.uuid}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {row.getValue("serial_no")}
        </Link>
      ),
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => {
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [label, setLabel] = useState<string>(row.getValue("label"));
        const [uuid, setID] = useState<string>(row.getValue("uuid"));
        const [open, setOpen] = useState(false);
    
        const handleUpdate = async () => {
          setLoading(true);
          setError(null);
    
          try {
            const response = await updateLabel(uuid, label);
        
            const result = await response;
            console.log("Update successful:", result.label);

            setLabel(result.label);
            setOpen(false);
            
          } catch (err) {
            setError("Error updating label");
            console.error(err);
          } finally {
            setLoading(false);
          }
        };
    
        return (
          <div className="flex gap-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger className="ml-2 text-gray-500 hover:text-primary">
                <Pencil size={16} />
              </PopoverTrigger>
              <PopoverContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Label</h4>
                    <p className="text-sm text-muted-foreground">
                      Set a label for this device.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="label">Label</Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="col-span-2 h-8"
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? "Updating..." : "Update"}
                      </Button>
                    </div>
                    {error && <p className="text-destructive">{error}</p>}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <span>{label}</span>
          </div>
        );
      },
    },
    
    {
      accessorKey: "port_group",
      header: "Port Group",
      cell: ({ row }) => {
        const portGroup = row.getValue("port_group") as string | null | undefined;
        const displayValue = (portGroup ?? "").replace(/^SpQ\s*:\s*/, '');
        return <div>{displayValue}</div>;
      },
    },
    {
      accessorKey: "used_data_formatted",
      header: "Used Data (GB)",
      cell: ({ row }) => {
        const mbValue = row.getValue("used_data_formatted") as number;
        const gbValue = (mbValue / 1024).toFixed(2); // Convert to GB with 2 decimal places
        return <div>{gbValue} GB</div>;
      },
    },
    {
      accessorKey: "device_type",
      header: "Device Type",
      cell: ({ row }) => <div>{row.getValue("device_type")}</div>,
    },
    {
      accessorKey: "device_plan",
      header: "Device Plan",
      cell: ({ row }) => <div>{row.getValue("device_plan")}</div>,
    },
  ];
 
  useEffect(() => {
    let isMounted = true;
    
    async function loadDevices() {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, total } = await fetchDevices(pageIndex + 1, pageSize, globalFilter);
        
        if (!isMounted) return;
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from API');
        }
        
        setDevices(data);
        setTotalDevices(total || 0);
      } catch (err) {
        console.error("Error fetching devices:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch devices. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadDevices();
    
    return () => {
      isMounted = false;
    };
  }, [pageIndex, pageSize, globalFilter, retryCount]);

  const table = useReactTable({
    data: filteredDevices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    state: {
      columnFilters,
      sorting,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex, pageSize },
      rowSelection,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (typeof value === "string") {
        return value.toLowerCase().includes(filterValue.toLowerCase());
      }
      return false;
    },
    onPaginationChange: (updater) => {
        const newPagination = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
        console.log("Pagination Updated: ", newPagination);
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      },
  });


  const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setGlobalFilter(searchTerm);
      setPageIndex(0);
    }, 500); // ⏳ Debounce to avoid excessive API calls

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading devices</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setRetryCount(prev => prev + 1)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate the total number of pages based on filtered data
  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  
  // Ensure pageIndex is within bounds
  useEffect(() => {
    if (totalPages > 0 && pageIndex >= totalPages) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [totalPages, pageIndex]);

  // Calculate page numbers to show
  const pagesToShow = [];
  const startPage = Math.max(pageIndex - 2, 0);
  const endPage = Math.min(pageIndex + 2, totalPages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.push(i);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full md:max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Activation Status Filter */}
          <div className="relative">
            <Select 
              value={activationFilter}
              onValueChange={setActivationFilter}
            >
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="mr-2 h-4 w-4" />
                <span>Activation</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Device Status Filter */}
          <div className="relative">
            <Select 
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="mr-2 h-4 w-4" />
                <span>Device Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Reachable">Reachable</SelectItem>
                <SelectItem value="Unreachable">Unreachable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Device Type Filter */}
          {uniqueDeviceTypes.length > 0 && (
            <div className="relative">
              <Select 
                value={deviceTypeFilter}
                onValueChange={setDeviceTypeFilter}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Device Type</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueDeviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Device Plan Filter */}
          {uniqueDevicePlans.length > 0 && (
            <div className="relative">
              <Select 
                value={devicePlanFilter}
                onValueChange={setDevicePlanFilter}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Device Plan</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {uniqueDevicePlans.map(plan => (
                    <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-row gap-4 items-center">
        <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Page Size" className="text-foreground"/>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
            </SelectContent>
        </Select>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {selectedDevices.length > 0
                ? `Export ${selectedDevices.length} selected`
                : `Export all ${filteredDevices.length} devices`}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportCSV}>
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              Export to Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bulk Actions Dropdown */}
        {selectedDevices.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={bulkActionLoading}>
                {bulkActionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                )}
                Actions ({selectedDevices.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulkRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart Devices
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
                <Columns2 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide() && column.id !== "uuid" && column.id !== "select")
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
          {loading ? (
    // Show skeleton while loading
        [...Array(5)].map((_, index) => (
            <TableRow key={index}>
            <TableCell colSpan={columns.length}>
                <Skeleton className="h-8 w-full bg-secondary" />
            </TableCell>
            </TableRow>
        ))
          ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    <div className="flex flex-row justify-between items-center w-full mt-4">
      {/* Shadcn Pagination */}
      <div className="flex justify-center flex-grow">
        <Pagination>
          <PaginationContent>
            {pageIndex > 0 && (
                <PaginationItem>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                    >
                    <ChevronLeft />
                    </Button>
                </PaginationItem>
                )}

            {/* Show pages */}
            {pageIndex > 2 && (
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageIndex(0)}
                >
                  1
                </Button>
              </PaginationItem>
            )}
            {pageIndex > 2 && <PaginationEllipsis />}

            {pagesToShow.map((page) => (
              <PaginationItem key={page}>
                <Button
                    variant={page === pageIndex ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault(); // Prevents full-page reload
                        console.log("Page Clicked:", page + 1);
                        setPageIndex(page);
                    }}
                    >
                  {page + 1}
                </Button>
              </PaginationItem>
            ))}

            {pageIndex < totalPages - 3 && <PaginationEllipsis />}

            {pageIndex < totalPages - 3 && (
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageIndex(totalPages - 1)}
                >
                  {totalPages}
                </Button>
              </PaginationItem>
            )}

            {pageIndex < totalPages - 1 && (
                <PaginationItem>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))
                    }
                    >
                    <ChevronRight />
                    </Button>
                </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
      <Label htmlFor="totalDeviceCount">
        Total Devices: {totalDevices}
      </Label>
    </div>
    </div>
  );
}
