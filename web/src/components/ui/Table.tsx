import React, { isValidElement } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  /** Texte et espacements plus compacts (ex. liste élèves) */
  dense?: boolean;
}

function formatCellValue(value: unknown): React.ReactNode {
  if (value == null) return '—';
  if (isValidElement(value)) return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function Table<T extends { id?: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  dense = false,
}: TableProps<T>) {
  const thClass = dense
    ? 'px-4 py-2 text-left text-[10px] font-semibold text-stone-600 uppercase tracking-[0.12em]'
    : 'px-6 py-3 text-left text-xs font-semibold text-stone-700 uppercase tracking-[0.1em]';
  const tdClass = dense
    ? 'px-4 py-2 whitespace-nowrap text-xs text-stone-800'
    : 'px-6 py-4 whitespace-nowrap text-sm text-stone-800';
  const emptyTdClass = dense ? 'px-4 py-6 text-center text-stone-500 text-xs' : 'px-6 py-8 text-center text-stone-500';

  return (
    <div className="overflow-x-auto rounded-xl shadow-lux-soft ring-1 ring-stone-200/60">
      <table className="min-w-full divide-y divide-stone-200/80">
        <thead className="bg-gradient-to-r from-stone-100 via-amber-50/40 to-stone-100 border-b border-amber-200/20">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={thClass}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white/95 divide-y divide-stone-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={emptyTdClass}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-amber-50/35 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={tdClass}>
                    {column.render ? column.render(item) : formatCellValue((item as Record<string, unknown>)[column.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;






