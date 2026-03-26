"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, CircleCheck, CircleXIcon, Columns2, Pencil, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDevices } from "@/server/iqapi";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"

export type Devices = {
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
  const [columnVisibility, setColumnVisibility] = useState({});
  const [totalDevices, setTotalDevices] = useState(0);

  const [pageIndex, setPageIndex] = useState(0); // Current page index
  const [pageSize, setPageSize] = useState(100); // Page size

  const handleEditLabel = () => {
  };

  const columns: ColumnDef<Devices>[] = [
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
      accessorKey: "serial_no",
      header: "Serial Number",
      cell: ({ row }) => <div>{row.getValue("serial_no")}</div>,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => (
          <div className="flex items-center justify-between">
            <span>{row.getValue("label")}</span>
            <button
              onClick={() => handleEditLabel(row.original)}
              className="ml-2 text-gray-500 hover:text-primary"
            >
              <Pencil size={16} />
            </button>
          </div>
        ),
    },
    {
      accessorKey: "port_group",
      header: "Port Group",
      cell: ({ row }) => <div>{row.getValue("port_group")}</div>,
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
    async function loadDevices() {
      setLoading(true);
      try {
        const { data, total } = await fetchDevices(pageIndex + 1, pageSize, globalFilter); // Fetch all matching devices
        console.log("Fetched Data:", data);
        setDevices(data); // Store all results locally
        setTotalDevices(total);
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    loadDevices();
  }, [pageIndex, pageSize, globalFilter]);

  const table = useReactTable({
    data: devices ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    state: {
      columnFilters,
      sorting,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex, pageSize },
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
    }, 500); // ⏳ Debounce to avoid excessive API calls

  return () => clearTimeout(delayDebounce);
}, [searchTerm]);   

  if (error) return <div className="text-destructive">{error}</div>;

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalDevices / pageSize);

  // Calculate page numbers to show
  const pagesToShow = [];
  const startPage = Math.max(pageIndex - 2, 0);
  const endPage = Math.min(pageIndex + 2, totalPages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.push(i);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)} // Update Search Term
          className="max-w-sm w-1/2"
        />
    <div className="flex flex-row gap-4">
        <div className="border rounded-md px-2 py-1 text-sm">
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
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
                <Columns2 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
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
                    <PaginationLink
                    onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                    >
                    <ChevronLeft />
                    </PaginationLink>
                </PaginationItem>
                )}

            {/* Show pages */}
            {pageIndex > 2 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPageIndex(0)}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            {pageIndex > 2 && <PaginationEllipsis />}

            {pagesToShow.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                    onClick={(e) => {
                        e.preventDefault(); // Prevents full-page reload
                        console.log("Page Clicked:", page + 1);
                        setPageIndex(page);
                    }}
                    className={page === pageIndex ? "text-primary font-bold" : ""}
                    >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            {pageIndex < totalPages - 3 && <PaginationEllipsis />}

            {pageIndex < totalPages - 3 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPageIndex(totalPages - 1)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}

            {pageIndex < totalPages - 1 && (
                <PaginationItem>
                    <PaginationLink
                    onClick={() =>
                        setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))
                    }
                    >
                    <ChevronRight />
                    </PaginationLink>
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
