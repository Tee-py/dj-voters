import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVoterUploads, useVoters } from '@/lib/api';
import { createFileRoute } from '@tanstack/react-router';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowUpDown,
  Briefcase,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/dashboard/voters')({
  component: VotersDashboard,
});

function VotersDashboard() {
  const { data: votersData, isLoading: isLoadingVoters } = useVoters();
  const { data: uploadsData, isLoading: isLoadingUploads, refetch: refetchUploads } = useVoterUploads();

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchUploads();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [refetchUploads]);

  const sortedUploads = uploadsData?.data.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateA - dateB;
  });

  return (
    <div className="space-y-8 p-8 w-full">
      <Card className="bg-black text-white w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Voter Management Dashboard</CardTitle>
          <CardDescription className="text-gray-400">
            Manage and monitor voter information and file processing
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-8 w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="mr-2" /> File Processing Queue
            </CardTitle>
            <CardDescription>Monitor ongoing voter file processing tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUploads ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {sortedUploads?.map((upload) => (
                  <div key={upload.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-medium">Task ID: {upload.id}</span>
                        <p className="text-sm text-gray-500">File: {upload.file}</p>
                      </div>
                      <StatusBadge status={upload.status} />
                    </div>
                    <Progress value={(upload.processed_records / upload.total_records) * 100} className="h-2 mb-2" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Processed: {upload.processed_records.toLocaleString()}</span>
                      <span>Total: {upload.total_records ? upload.total_records.toLocaleString() : 0}</span>
                    </div>
                    {upload.status === 'failed' && upload.reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800 flex items-center">
                          <XCircle className="w-4 h-4 mr-2" />
                          Error: {upload.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Users className="mr-2" /> Quick Stats
            </CardTitle>
            <CardDescription>Overview of voter registration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="mr-2" /> Total Voters
                </h3>
                <p className="text-3xl font-bold text-black">{votersData?.data.length.toLocaleString() || 0}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Briefcase className="mr-2" /> Departments
                </h3>
                <p className="text-3xl font-bold text-black">
                  {new Set(votersData?.data.map((v) => v.department)).size.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Users className="mr-2" /> Voters List
          </CardTitle>
          <CardDescription>Comprehensive list of all registered voters</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVoters ? <VotersTableSkeleton /> : <DataTable data={votersData?.data || []} />}
        </CardContent>
      </Card>
    </div>
  );
}

const columns: ColumnDef<Voter>[] = [
  {
    accessorKey: 'full_name',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('full_name')}</div>,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'matriculation_number',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Matriculation Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];

function DataTable({ data }: { data: Voter[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center py-4 gap-2">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('full_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('full_name')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Filter by email..."
          value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('email')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Filter by department..."
          value={(table.getColumn('department')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('department')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    completed: { icon: CheckCircle, className: 'bg-green-100 text-green-800' },
    processing: { icon: Loader2, className: 'bg-blue-100 text-blue-800' },
    pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
    failed: { icon: AlertCircle, className: 'bg-red-100 text-red-800' },
  };

  const { icon: Icon, className } = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="w-4 h-4 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function VotersTableSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

interface Voter {
  id: string;
  full_name: string;
  email: string;
  gender: string;
  department: string;
  matriculation_number: string;
}
