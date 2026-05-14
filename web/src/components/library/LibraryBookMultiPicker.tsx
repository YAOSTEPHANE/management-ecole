'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiBook, FiPlus, FiX } from 'react-icons/fi';

export type LibraryBookOption = {
  id: string;
  title: string;
  author?: string | null;
  copiesAvailable: number;
};

type LibraryBookMultiPickerProps = {
  books: LibraryBookOption[];
  selectedBookIds: string[];
  onChange: (bookIds: string[]) => void;
  disabled?: boolean;
};

export default function LibraryBookMultiPicker({
  books,
  selectedBookIds,
  onChange,
  disabled = false,
}: LibraryBookMultiPickerProps) {
  const [pickId, setPickId] = useState('');

  const availableBooks = useMemo(
    () => books.filter((b) => b.copiesAvailable > 0),
    [books],
  );

  const selectedCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const id of selectedBookIds) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [selectedBookIds]);

  const selectedRows = useMemo(() => {
    const rows: { key: string; bookId: string; title: string; author?: string | null }[] = [];
    selectedBookIds.forEach((bookId, index) => {
      const book = books.find((b) => b.id === bookId);
      rows.push({
        key: `${bookId}-${index}`,
        bookId,
        title: book?.title ?? 'Ouvrage',
        author: book?.author,
      });
    });
    return rows;
  }, [books, selectedBookIds]);

  const addBook = () => {
    if (!pickId) return;
    const book = books.find((b) => b.id === pickId);
    if (!book) return;
    const used = selectedCounts.get(pickId) ?? 0;
    if (used >= book.copiesAvailable) {
      toast.error(`Plus d'exemplaires disponibles pour « ${book.title} »`);
      return;
    }
    onChange([...selectedBookIds, pickId]);
    setPickId('');
  };

  const removeAt = (index: number) => {
    onChange(selectedBookIds.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Ouvrages</label>
      <div className="flex gap-2">
        <select
          value={pickId}
          disabled={disabled}
          onChange={(e) => setPickId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-stone-50"
          aria-label="Ajouter un ouvrage"
        >
          <option value="">— Ajouter un livre —</option>
          {availableBooks.map((b) => {
            const used = selectedCounts.get(b.id) ?? 0;
            const remaining = b.copiesAvailable - used;
            return (
              <option key={b.id} value={b.id} disabled={remaining < 1}>
                {b.title}
                {b.author ? ` — ${b.author}` : ''} ({remaining} dispo.)
              </option>
            );
          })}
        </select>
        <button
          type="button"
          disabled={disabled || !pickId}
          onClick={addBook}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-50"
        >
          <FiPlus className="h-4 w-4" aria-hidden />
          Ajouter
        </button>
      </div>

      {selectedRows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
          Aucun ouvrage sélectionné. L&apos;emprunteur peut emprunter plusieurs livres en une fois.
        </p>
      ) : (
        <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/80 p-2">
          {selectedRows.map((row, index) => (
            <li
              key={row.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-white bg-white px-2.5 py-2 text-sm shadow-sm"
            >
              <span className="flex min-w-0 items-start gap-2">
                <FiBook className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-stone-900">{row.title}</span>
                  {row.author ? (
                    <span className="block truncate text-xs text-stone-500">{row.author}</span>
                  ) : null}
                </span>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAt(index)}
                className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
                aria-label="Retirer cet ouvrage"
              >
                <FiX className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedRows.length > 0 && (
        <p className="text-xs text-stone-500">
          {selectedRows.length} ouvrage{selectedRows.length > 1 ? 's' : ''} sélectionné{selectedRows.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
