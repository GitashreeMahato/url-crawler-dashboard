import  { useEffect, useMemo, useState } from 'react';
import ReactModal from 'react-modal';
import axios from 'axios';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  Column

} from '@tanstack/react-table';

// Define the structure of one URL row in the table
interface UrlItem {
  ID: number;
  Url: string;
  Title: string;
    HTMLVersion: string;
  Status: string;
  InternalLinks: number;
  ExternalLinks: number;
  BrokenLinks: number;
    LoginFormDetected: boolean;
}
// Utility to truncate long URLs for better readability
const truncateUrl = (url: string, maxLength = 60) => {
  return url.length > maxLength ? url.slice(0, maxLength) + '...' : url;
};

// Search input component (global filter)
const GlobalFilter = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Search..."
    style={{ marginBottom: 12, padding: 6 }}
  />
);

// 👇 filters for all column
const Filter = ({ column }: { column: Column<any, unknown> }) => {
  const columnFilterValue = column.getFilterValue();
  return (
    <input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Filter ${column.id}`}
      style={{ width: '100%', fontSize: '0.8rem' }}
    />
  );
};

//status filter
const StatusFilter = ({ column }: { column: Column<any, unknown> }) => {
  const value = column.getFilterValue() as string;

  const statuses = ['queued', 'running', 'done', 'error'];

  return (
    <select
      value={value || ''}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      style={{ width: '100%' }}
    >
      <option value="">All Statuses</option>
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
};
// filter for links
const NumberFilter = ({ column }: { column: Column<any, unknown> }) => {
  const rawValue = column.getFilterValue();
  const value = typeof rawValue === 'number' ? rawValue : '';

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        column.setFilterValue(val ? Number(val) : undefined);
      }}
      placeholder={`Filter ${column.id}`}
      style={{ width: '100%' }}
    />
  );
};



  // Table data state

const UrlTable = () => {
  const [data, setData] = useState<UrlItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);


  // Fetch data from backend API
  useEffect(() => {
    const fetchData =()=>{
    axios
      .get('http://localhost:8080/urls')
      .then((res) => setData(res.data))
      .catch(() => alert('Failed to load URLs'))
      .finally(() => setLoading(false));
  }; 
  fetchData();
  const interval = setInterval(fetchData, 5000);
  return ()=> clearInterval(interval);
}, []);

    // Define table columns with headers and optional custom rendering
  const columns = useMemo<ColumnDef<UrlItem>[]>(
    () => [
      {
        header: 'Title',
        accessorKey: 'Title',
        cell: info => info.getValue(),
    filterFn: 'includesString', // built-in fuzzy matching
      },
          {
    header: 'HTML Version',
    accessorKey: 'HTMLVersion',
    cell: info => info.getValue(),
    filterFn: 'equalsString',
  },

      {
        header: 'URL',
        accessorKey: 'Url',
        cell: (info) => truncateUrl(info.getValue() as string),
      },
      {
        header: 'Status',
        accessorKey: 'Status',
        cell: info => info.getValue(),
        filterFn: 'equalsString',
        enableColumnFilter: true,
      },
      
      {
        header: 'Internal',
        accessorKey: 'InternalLinks',
        filterFn: 'equals',
      },
      {
        header: 'External',
        accessorKey: 'ExternalLinks',
        filterFn: 'equals',
      },
      {
        header: 'Broken',
        accessorKey: 'BrokenLinks',
        filterFn: 'equals',
      },
    ],
    []
  );
  // Configure the table instance using @tanstack/react-table v8
   const table = useReactTable({
    data,
    columns,
    state: {
    globalFilter,
    columnFilters,
    
    },
    onGlobalFilterChange: setGlobalFilter,
      onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <p>Loading...</p>;
  
    return (
    <>
      <GlobalFilter value={globalFilter} onChange={setGlobalFilter} />

      <table border={1} cellPadding={6} width="100%">
        <thead>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanFilter() && (
                    <>
                    {header.column.id === 'Status' ? (
      <StatusFilter column={header.column} />
    ) : ['InternalLinks', 'ExternalLinks', 'BrokenLinks'].includes(header.column.id) ? (
      <NumberFilter column={header.column} />
    ) : (
      <Filter column={header.column} />
    )}

                    </>
                  )}
                                   
                </th>
              ))}
              
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: any) => (
        <tr key={row.id} onClick={() => setSelectedUrl(row.original)} style={{ cursor: 'pointer' }}>
              {row.getVisibleCells().map((cell: any) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for URL Details */}
<ReactModal
  isOpen={!!selectedUrl}
  onRequestClose={() => setSelectedUrl(null)}
  contentLabel="URL Details"
  ariaHideApp={false}
  style={{
    content: {
      maxWidth: '500px',
      margin: 'auto',
      padding: '20px',
    },
  }}
>
  {selectedUrl && (
    <div>
      <h2>URL Details</h2>
      <p><strong>Title:</strong> {selectedUrl.Title}</p>
      <p><strong>URL:</strong> {selectedUrl.Url}</p>
      <p><strong>HTML Version:</strong> {selectedUrl.HTMLVersion}</p>
      <p><strong>Status:</strong> {selectedUrl.Status}</p>
      <p><strong>Internal Links:</strong> {selectedUrl.InternalLinks}</p>
      <p><strong>External Links:</strong> {selectedUrl.ExternalLinks}</p>
      <p><strong>Broken Links:</strong> {selectedUrl.BrokenLinks}</p>
      <p><strong>Login Form Detected:</strong> {selectedUrl.LoginFormDetected ? 'Yes' : 'No'}</p>
      <button onClick={() => setSelectedUrl(null)} style={{ marginTop: 10 }}>
        Close
      </button>
    </div>
  )}
</ReactModal>
{/* Pagination */}
      <div style={{ marginTop: 10 }}>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          ⬅ Prev
        </button>{' '}
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next ➡
        </button>
      </div>
    </>
  );
};

export default UrlTable;
