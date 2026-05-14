'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Badge from '../ui/Badge';
import { FiSearch, FiUser, FiX } from 'react-icons/fi';

export type LibraryBorrowerRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  studentProfile?: {
    studentId?: string;
    class?: { name?: string; level?: string } | null;
  } | null;
  teacherProfile?: { employeeId?: string } | null;
  staffProfile?: { jobTitle?: string } | null;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Enseignant',
  STUDENT: 'Élève',
  PARENT: 'Parent',
  EDUCATOR: 'Éducateur',
  STAFF: 'Personnel',
};

function borrowerSubtitle(row: LibraryBorrowerRow): string {
  if (row.studentProfile?.class?.name) {
    const cls = row.studentProfile.class;
    const parts = [cls.name, cls.level].filter(Boolean).join(' · ');
    const sid = row.studentProfile.studentId;
    return sid ? `${parts} — N° ${sid}` : parts;
  }
  if (row.studentProfile?.studentId) {
    return `N° élève ${row.studentProfile.studentId}`;
  }
  if (row.staffProfile?.jobTitle) {
    return row.staffProfile.jobTitle;
  }
  if (row.teacherProfile?.employeeId) {
    return `Matricule ${row.teacherProfile.employeeId}`;
  }
  return row.email;
}

type LibraryBorrowerSearchProps = {
  value: string;
  selected?: LibraryBorrowerRow | null;
  onChange: (borrowerId: string, borrower?: LibraryBorrowerRow | null) => void;
  searchFn: (q: string) => Promise<LibraryBorrowerRow[]>;
  disabled?: boolean;
};

export default function LibraryBorrowerSearch({
  value,
  selected,
  onChange,
  searchFn,
  disabled = false,
}: LibraryBorrowerSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['library-borrower-search', debouncedQ],
    queryFn: () => searchFn(debouncedQ),
    enabled: debouncedQ.length >= 2 && open && !disabled,
  });

  const display = useMemo(() => {
    if (selected && selected.id === value) return selected;
    return null;
  }, [selected, value]);

  const pick = (row: LibraryBorrowerRow) => {
    onChange(row.id, row);
    setQuery('');
    setDebouncedQ('');
    setOpen(false);
  };

  const clear = () => {
    onChange('', null);
    setQuery('');
    setOpen(true);
  };

  if (display) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2.5">
        <div className="min-w-0 flex items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <FiUser className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">
              {display.firstName} {display.lastName}
            </p>
            <p className="text-xs text-stone-600 truncate">{borrowerSubtitle(display)}</p>
            <Badge className="mt-1 bg-white text-stone-700 text-[10px] border border-stone-200">
              {ROLE_LABELS[display.role] ?? display.role}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="shrink-0 rounded-lg p-1.5 text-stone-500 hover:bg-white hover:text-stone-800 disabled:opacity-50"
          aria-label="Changer d'emprunteur"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Nom, prénom, e-mail ou n° élève (min. 2 caractères)…"
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-stone-50"
          aria-label="Rechercher un emprunteur"
          autoComplete="off"
        />
      </div>

      {open && debouncedQ.length >= 2 && (
        <div className="absolute z-[10060] mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {isFetching ? (
            <p className="px-3 py-2 text-xs text-stone-500">Recherche…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-stone-500">Aucun emprunteur trouvé.</p>
          ) : (
            results.map((row) => (
              <button
                key={row.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(row)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-sky-50"
              >
                <FiUser className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium text-stone-900">
                    {row.firstName} {row.lastName}
                    <span className="ml-1 text-xs font-normal text-stone-500">
                      ({ROLE_LABELS[row.role] ?? row.role})
                    </span>
                  </span>
                  <span className="block truncate text-xs text-stone-500">{borrowerSubtitle(row)}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {open && debouncedQ.length > 0 && debouncedQ.length < 2 && (
        <p className="mt-1 text-[11px] text-stone-500">Saisissez au moins 2 caractères.</p>
      )}
    </div>
  );
}
