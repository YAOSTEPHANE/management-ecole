import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import MaterialRoomsPanel from './MaterialRoomsPanel';
import MaterialEquipmentPanel from './MaterialEquipmentPanel';
import MaterialMaintenancePanel from './MaterialMaintenancePanel';
import MaterialAllocationsPanel from './MaterialAllocationsPanel';
import {
  FiGrid,
  FiPackage,
  FiTool,
  FiMapPin,
  FiShare2,
} from 'react-icons/fi';

type MatTab = 'overview' | 'rooms' | 'equipment' | 'maintenance' | 'allocations';

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

  const overview = useMemo(() => {
    const r = (rooms as any[])?.length ?? 0;
    const eq = (equipment as any[])?.length ?? 0;
    const mOpen = (maint as any[])?.length ?? 0;
    const mIp = (maintProg as any[])?.length ?? 0;
    const a = (alloc as any[])?.length ?? 0;
    return { r, eq, mOpen, mIp, a };
  }, [rooms, equipment, maint, maintProg, alloc]);

  const subTabs: { id: MatTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'rooms', label: 'Salles & lieux', icon: FiMapPin },
    { id: 'equipment', label: 'Inventaire', icon: FiPackage },
    { id: 'maintenance', label: 'Maintenance', icon: FiTool },
    { id: 'allocations', label: 'Allocations', icon: FiShare2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Gestion matérielle</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Salles, inventaire, interventions et prêts (utilisateur, classe ou salle).
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-5 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase">Salles actives</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{overview.r}</p>
          </Card>
          <Card className="p-5 border border-emerald-100 bg-emerald-50/40">
            <p className="text-xs font-medium text-emerald-900 uppercase">Références inventaire</p>
            <p className="text-3xl font-bold text-emerald-900 mt-1">{overview.eq}</p>
          </Card>
          <Card className="p-5 border border-amber-100 bg-amber-50/40">
            <p className="text-xs font-medium text-amber-900 uppercase">Maint. ouvertes</p>
            <p className="text-3xl font-bold text-amber-900 mt-1">{overview.mOpen}</p>
          </Card>
          <Card className="p-5 border border-violet-100 bg-violet-50/40">
            <p className="text-xs font-medium text-violet-900 uppercase">Maint. en cours</p>
            <p className="text-3xl font-bold text-violet-900 mt-1">{overview.mIp}</p>
          </Card>
          <Card className="p-5 border border-sky-100 bg-sky-50/40">
            <p className="text-xs font-medium text-sky-900 uppercase">Allocations actives</p>
            <p className="text-3xl font-bold text-sky-900 mt-1">{overview.a}</p>
          </Card>
        </div>
      )}

      {tab === 'rooms' && <MaterialRoomsPanel />}
      {tab === 'equipment' && <MaterialEquipmentPanel />}
      {tab === 'maintenance' && <MaterialMaintenancePanel />}
      {tab === 'allocations' && <MaterialAllocationsPanel />}
    </div>
  );
};

export default MaterialManagementModule;
