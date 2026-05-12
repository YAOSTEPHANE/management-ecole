import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import MaterialRoomsPanel from './MaterialRoomsPanel';
import MaterialEquipmentPanel from './MaterialEquipmentPanel';
import MaterialMaintenancePanel from './MaterialMaintenancePanel';
import MaterialAllocationsPanel from './MaterialAllocationsPanel';
import MaterialRoomReservationsPanel from './MaterialRoomReservationsPanel';
import MaterialRoomOccupancyPanel from './MaterialRoomOccupancyPanel';
import MaterialStockManagementPanel from './MaterialStockManagementPanel';
import {
  FiGrid,
  FiPackage,
  FiTool,
  FiMapPin,
  FiShare2,
  FiCalendar,
  FiLayers,
  FiArchive,
} from 'react-icons/fi';
import { ADM } from '../adminModuleLayout';

type MatTab =
  | 'overview'
  | 'rooms'
  | 'equipment'
  | 'stock'
  | 'maintenance'
  | 'allocations'
  | 'reservations'
  | 'occupancy';

function weekBoundsIso() {
  const now = new Date();
  const start = new Date(now);
  const dow = start.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { from: start.toISOString(), to: end.toISOString() };
}

const MaterialManagementModule: React.FC = () => {
  const [tab, setTab] = useState<MatTab>('overview');

  const { data: rooms } = useQuery({
    queryKey: ['material-rooms-overview'],
    queryFn: () => adminApi.getMaterialRooms({ isActive: 'true' }),
  });
  const { data: equipment } = useQuery({
    queryKey: ['material-equipment-overview'],
    queryFn: () => adminApi.getMaterialEquipment({ isActive: 'true' }),
  });
  const { data: maint } = useQuery({
    queryKey: ['material-maint-overview'],
    queryFn: () => adminApi.getMaterialMaintenance({ status: 'OPEN' }),
  });
  const { data: maintProg } = useQuery({
    queryKey: ['material-maint-overview-ip'],
    queryFn: () => adminApi.getMaterialMaintenance({ status: 'IN_PROGRESS' }),
  });
  const { data: alloc } = useQuery({
    queryKey: ['material-alloc-overview'],
    queryFn: () => adminApi.getMaterialAllocations({ status: 'ACTIVE' }),
  });
  const wb = useMemo(() => weekBoundsIso(), []);
  const { data: stockAlerts } = useQuery({
    queryKey: ['material-stock-alerts-overview'],
    queryFn: () => adminApi.getMaterialStockItems({ lowStockOnly: 'true', isActive: 'true' }),
  });
  const { data: resvWeek } = useQuery({
    queryKey: ['material-resv-overview', wb.from, wb.to],
    queryFn: () =>
      adminApi.getMaterialRoomReservations({
        from: wb.from,
        to: wb.to,
      }),
  });

  const overview = useMemo(() => {
    const r = (rooms as any[])?.length ?? 0;
    const eq = (equipment as any[])?.length ?? 0;
    const mOpen = (maint as any[])?.length ?? 0;
    const mIp = (maintProg as any[])?.length ?? 0;
    const a = (alloc as any[])?.length ?? 0;
    const stockLow = (stockAlerts as any[])?.length ?? 0;
    const resv = (resvWeek as any[])?.filter((x) => x.status === 'PENDING' || x.status === 'CONFIRMED').length ?? 0;
    return { r, eq, mOpen, mIp, a, resv, stockLow };
  }, [rooms, equipment, maint, maintProg, alloc, resvWeek, stockAlerts]);

  const subTabs: { id: MatTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'rooms', label: 'Salles & lieux', icon: FiMapPin },
    { id: 'equipment', label: 'Inventaire matériel', icon: FiPackage },
    { id: 'stock', label: 'Gestion de stock', icon: FiArchive },
    { id: 'maintenance', label: 'Maintenance & réparations', icon: FiTool },
    { id: 'reservations', label: 'Réservations', icon: FiCalendar },
    { id: 'occupancy', label: 'Occupation', icon: FiLayers },
    { id: 'allocations', label: 'Prêts de matériel', icon: FiShare2 },
  ];

  return (
    <div className={ADM.root}>
      <div>
        <h2 className={ADM.h2}>Matériel, équipements & salles</h2>
        <p className={ADM.intro}>
          <strong className="font-medium text-gray-800">Matériel et équipements</strong> — inventaire par familles
          (pédagogique, informatique, sport, laboratoire), prêts et maintenance. <strong className="font-medium text-gray-800">Salles</strong> — inventaire, réservations et occupation.
        </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <Card className={`${ADM.statCard} border border-gray-200`}>
            <p className={ADM.statLabel}>Salles actives</p>
            <p className={ADM.statVal}>{overview.r}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-emerald-100 bg-emerald-50/40`}>
            <p className="text-[10px] font-medium text-emerald-900 uppercase tracking-wide leading-tight">
              Références inventaire
            </p>
            <p className={`${ADM.statValTone} text-emerald-900`}>{overview.eq}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-amber-100 bg-amber-50/40`}>
            <p className="text-[10px] font-medium text-amber-900 uppercase tracking-wide leading-tight">
              Maint. ouvertes
            </p>
            <p className={`${ADM.statValTone} text-amber-900`}>{overview.mOpen}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-violet-100 bg-violet-50/40`}>
            <p className="text-[10px] font-medium text-violet-900 uppercase tracking-wide leading-tight">
              Maint. en cours
            </p>
            <p className={`${ADM.statValTone} text-violet-900`}>{overview.mIp}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-sky-100 bg-sky-50/40`}>
            <p className="text-[10px] font-medium text-sky-900 uppercase tracking-wide leading-tight">
              Prêts actifs
            </p>
            <p className={`${ADM.statValTone} text-sky-900`}>{overview.a}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-rose-100 bg-rose-50/40`}>
            <p className="text-[10px] font-medium text-rose-900 uppercase tracking-wide leading-tight">
              Réservations (semaine)
            </p>
            <p className={`${ADM.statValTone} text-rose-900`}>{overview.resv}</p>
          </Card>
          <Card className={`${ADM.statCard} border border-orange-100 bg-orange-50/40`}>
            <p className="text-[10px] font-medium text-orange-900 uppercase tracking-wide leading-tight">
              Articles en stock bas
            </p>
            <p className={`${ADM.statValTone} text-orange-900`}>{overview.stockLow}</p>
          </Card>
        </div>
      )}

      {tab === 'rooms' && <MaterialRoomsPanel />}
      {tab === 'equipment' && <MaterialEquipmentPanel />}
      {tab === 'stock' && <MaterialStockManagementPanel />}
      {tab === 'maintenance' && <MaterialMaintenancePanel />}
      {tab === 'reservations' && <MaterialRoomReservationsPanel />}
      {tab === 'occupancy' && <MaterialRoomOccupancyPanel />}
      {tab === 'allocations' && <MaterialAllocationsPanel />}
    </div>
  );
};

export default MaterialManagementModule;
