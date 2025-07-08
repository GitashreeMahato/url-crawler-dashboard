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
  // Table data state

const UrlTable = () => {
  const [data, setData] = useState<UrlItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);


  // Fetch data from backend API
  useEffect(() => {
    axios
      .get('http://localhost:8080/urls')
      .then((res) => setData(res.data))
      .catch(() => alert('Failed to load URLs'))
      .finally(() => setLoading(false));
  }, []);

    // Define table columns with headers and optional custom rendering
  const columns = useMemo<ColumnDef<UrlItem>[]>(
    () => [
      {
        header: 'Title',
        accessorKey: 'Title',
      },
          { header: 'HTML Version', accessorKey: 'HTMLVersion' },

      {
        header: 'URL',
        accessorKey: 'Url',
        cell: (info) => truncateUrl(info.getValue() as string),
      },
      {
        header: 'Status',
        accessorKey: 'Status',
      },
      {
        header: 'Internal',
        accessorKey: 'InternalLinks',
      },
      {
        header: 'External',
        accessorKey: 'ExternalLinks',
      },
      {
        header: 'Broken',
        accessorKey: 'BrokenLinks',
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
    },
    onGlobalFilterChange: setGlobalFilter,
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
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
        <tr key={row.id} onClick={() => setSelectedUrl(row.original)} style={{ cursor: 'pointer' }}>
              {row.getVisibleCells().map((cell) => (
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
