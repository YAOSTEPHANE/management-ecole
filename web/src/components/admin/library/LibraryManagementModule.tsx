import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../ui/Card';
import LibraryBooksPanel from './LibraryBooksPanel';
import LibraryLoansPanel from './LibraryLoansPanel';
import LibraryReservationsPanel from './LibraryReservationsPanel';
import LibraryPenaltiesPanel from './LibraryPenaltiesPanel';
import LibraryInventoryPanel from './LibraryInventoryPanel';
import LibraryReportsPanel from './LibraryReportsPanel';
import DigitalLibraryPanel from './DigitalLibraryPanel';
import {
  FiGrid,
  FiBook,
  FiRefreshCw,
  FiBookmark,
  FiAlertCircle,
  FiLayers,
  FiCloud,
  FiPrinter,
} from 'react-icons/fi';
import { ADM } from '../adminModuleLayout';
import { useLibraryManagement } from '@/contexts/LibraryManagementContext';

type LibTab =
  | 'overview'
  | 'catalog'
  | 'digital'
  | 'loans'
  | 'reservations'
  | 'penalties'
  | 'inventory'
  | 'reports';

const LibraryManagementModule: React.FC<{ initialTab?: LibTab }> = ({ initialTab = 'overview' }) => {
  const [tab, setTab] = useState<LibTab>(initialTab);
  const { libraryApi, scope } = useLibraryManagement();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const { data: books } = useQuery({
    queryKey: ['library-books-overview', scope],
    queryFn: () => libraryApi.getLibraryBooks(),
  });
  const { data: loans } = useQuery({
    queryKey: ['library-loans-overview', scope],
    queryFn: () => libraryApi.getLibraryLoans({ status: 'ACTIVE' }),
  });
  const { data: resv } = useQuery({
    queryKey: ['library-reservations-overview', scope],
    queryFn: () => libraryApi.getLibraryReservations(),
  });
  const { data: penalties } = useQuery({
    queryKey: ['library-penalties-overview', scope],
    queryFn: () => libraryApi.getLibraryPenalties({ paid: 'false' }),
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
    { id: 'digital', label: 'Bibliothèque numérique', icon: FiCloud },
    { id: 'loans', label: 'Emprunts & retours', icon: FiRefreshCw },
    { id: 'reservations', label: 'Réservations', icon: FiBookmark },
    { id: 'penalties', label: 'Pénalités', icon: FiAlertCircle },
    { id: 'inventory', label: 'Inventaire', icon: FiLayers },
    { id: 'reports', label: 'Rapports', icon: FiPrinter },
  ];

  return (
    <div className={ADM.root}>
      <div>
        <h2 className={ADM.h2}>Bibliothèque</h2>
        <p className={ADM.intro}>Catalogue, circulation des ouvrages, réservations et suivi des sanctions.</p>
      </div>

      <div className={ADM.tabRow}>
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={ADM.tabBtn(active, 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200')}
            >
              <Icon className={ADM.tabIcon} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className={ADM.grid4}>
          <Card className={`${ADM.statCard} border border-gray-200`}>
            <p className={ADM.statLabel}>Titres au catalogue</p>
            <p className={ADM.statVal}>{overview.activeTitles}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-amber-100 bg-amber-50/40`}>
            <p className="text-[10px] font-medium text-amber-900 uppercase tracking-wide leading-tight">
              Emprunts en cours
            </p>
            <p className={`${ADM.statValTone} text-amber-900`}>{overview.loanActive}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-violet-100 bg-violet-50/40`}>
            <p className="text-[10px] font-medium text-violet-900 uppercase tracking-wide leading-tight">
              Réservations actives
            </p>
            <p className={`${ADM.statValTone} text-violet-900`}>{overview.resvPending}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-rose-100 bg-rose-50/40`}>
            <p className="text-[10px] font-medium text-rose-900 uppercase tracking-wide leading-tight">
              Pénalités à régler
            </p>
            <p className={`${ADM.statValTone} text-rose-900`}>{overview.penUnpaid}</p>
          </Card>
        </div>
      )}

      {tab === 'catalog' && <LibraryBooksPanel />}
      {tab === 'digital' && <DigitalLibraryPanel />}
      {tab === 'loans' && <LibraryLoansPanel />}
      {tab === 'reservations' && <LibraryReservationsPanel />}
      {tab === 'penalties' && <LibraryPenaltiesPanel />}
      {tab === 'inventory' && <LibraryInventoryPanel />}
      {tab === 'reports' && <LibraryReportsPanel />}
    </div>
  );
};

export default LibraryManagementModule;
