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
import { ADM } from '../adminModuleLayout';

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
    <div className={ADM.root}>
      <div>
        <h2 className={ADM.h2}>Gestion matérielle</h2>
        <p className={ADM.intro}>Salles, inventaire, interventions et prêts (utilisateur, classe ou salle).</p>
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
        <div className={ADM.grid5}>
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
              Allocations actives
            </p>
            <p className={`${ADM.statValTone} text-sky-900`}>{overview.a}</p>
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
