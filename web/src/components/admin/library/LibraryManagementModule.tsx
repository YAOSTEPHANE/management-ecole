import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import LibraryBooksPanel from './LibraryBooksPanel';
import LibraryLoansPanel from './LibraryLoansPanel';
import LibraryReservationsPanel from './LibraryReservationsPanel';
import LibraryPenaltiesPanel from './LibraryPenaltiesPanel';
import LibraryInventoryPanel from './LibraryInventoryPanel';
import {
  FiGrid,
  FiBook,
  FiRefreshCw,
  FiBookmark,
  FiAlertCircle,
  FiLayers,
} from 'react-icons/fi';

type LibTab =
  | 'overview'
  | 'catalog'
  | 'loans'
  | 'reservations'
  | 'penalties'
  | 'inventory';

const LibraryManagementModule: React.FC = () => {
  const [tab, setTab] = useState<LibTab>('overview');

  const { data: books } = useQuery({
    queryKey: ['library-books-overview'],
    queryFn: () => adminApi.getLibraryBooks(),
  });
  const { data: loans } = useQuery({
    queryKey: ['library-loans-overview'],
    queryFn: () => adminApi.getLibraryLoans({ status: 'ACTIVE' }),
  });
  const { data: resv } = useQuery({
    queryKey: ['library-reservations-overview'],
    queryFn: () => adminApi.getLibraryReservations(),
  });
  const { data: penalties } = useQuery({
    queryKey: ['library-penalties-overview'],
    queryFn: () => adminApi.getLibraryPenalties({ paid: 'false' }),
  });

  const overview = useMemo(() => {
    const b = (books as any[]) ?? [];
    const activeTitles = b.filter((x) => x.isActive).length;
    const loanActive = (loans as any[])?.length ?? 0;
    const resvPending =
      (resv as any[])?.filter((r) => r.status === 'PENDING' || r.status === 'READY').length ?? 0;
    const penUnpaid = (penalties as any[])?.length ?? 0;
    return { activeTitles, loanActive, resvPending, penUnpaid };
  }, [books, loans, resv, penalties]);

  const subTabs: { id: LibTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'catalog', label: 'Catalogue', icon: FiBook },
    { id: 'loans', label: 'Emprunts & retours', icon: FiRefreshCw },
    { id: 'reservations', label: 'Réservations', icon: FiBookmark },
    { id: 'penalties', label: 'Pénalités', icon: FiAlertCircle },
    { id: 'inventory', label: 'Inventaire', icon: FiLayers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Bibliothèque</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Catalogue, circulation des ouvrages, réservations et suivi des sanctions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-80" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase">Titres au catalogue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{overview.activeTitles}</p>
          </Card>
          <Card className="p-5 border border-amber-100 bg-amber-50/40">
            <p className="text-xs font-medium text-amber-900 uppercase">Emprunts en cours</p>
            <p className="text-3xl font-bold text-amber-900 mt-1">{overview.loanActive}</p>
          </Card>
          <Card className="p-5 border border-violet-100 bg-violet-50/40">
            <p className="text-xs font-medium text-violet-900 uppercase">Réservations actives</p>
            <p className="text-3xl font-bold text-violet-900 mt-1">{overview.resvPending}</p>
          </Card>
          <Card className="p-5 border border-rose-100 bg-rose-50/40">
            <p className="text-xs font-medium text-rose-900 uppercase">Pénalités à régler</p>
            <p className="text-3xl font-bold text-rose-900 mt-1">{overview.penUnpaid}</p>
          </Card>
        </div>
      )}

      {tab === 'catalog' && <LibraryBooksPanel />}
      {tab === 'loans' && <LibraryLoansPanel />}
      {tab === 'reservations' && <LibraryReservationsPanel />}
      {tab === 'penalties' && <LibraryPenaltiesPanel />}
      {tab === 'inventory' && <LibraryInventoryPanel />}
    </div>
  );
};

export default LibraryManagementModule;
