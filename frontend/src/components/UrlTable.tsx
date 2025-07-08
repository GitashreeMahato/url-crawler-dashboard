import  { useEffect, useMemo, useState } from 'react';

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
  Status: string;
  InternalLinks: number;
  ExternalLinks: number;
  BrokenLinks: number;
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
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

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
