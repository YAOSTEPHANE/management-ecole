import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import HRContractsPanel from './HRContractsPanel';
import HRPayrollPanel from './HRPayrollPanel';
import HRBenefitsPanel from './HRBenefitsPanel';
import HRPerformancePanel from './HRPerformancePanel';
import HRLeavesPanel from './HRLeavesPanel';
import {
  FiGrid,
  FiBriefcase,
  FiDollarSign,
  FiHeart,
  FiAward,
  FiCalendar,
} from 'react-icons/fi';

type HRTab =
  | 'overview'
  | 'contracts'
  | 'payroll'
  | 'benefits'
  | 'performance'
  | 'leaves';

const HRManagementModule: React.FC = () => {
  const [tab, setTab] = useState<HRTab>('overview');

  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers-hr-overview'],
    queryFn: adminApi.getTeachers,
  });
  const { data: educators } = useQuery({
    queryKey: ['admin-educators-hr-overview'],
    queryFn: adminApi.getEducators,
  });
  const { data: leaves } = useQuery({
    queryKey: ['admin-hr-teacher-leaves', 'overview-pending'],
    queryFn: () => adminApi.getHrTeacherLeaves({ status: 'PENDING' }),
  });
  const { data: reviews } = useQuery({
    queryKey: ['admin-hr-performance-reviews-overview'],
    queryFn: adminApi.getHrTeacherPerformanceReviews,
  });

  const stats = useMemo(() => {
    const t = (teachers as any[] | undefined)?.length ?? 0;
    const ed = (educators as any[] | undefined)?.length ?? 0;
    const pending = (leaves as any[] | undefined)?.length ?? 0;
    const rev = (reviews as any[] | undefined)?.length ?? 0;
    return { staff: t + ed, pending, reviews: rev };
  }, [teachers, educators, leaves, reviews]);

  const subTabs: { id: HRTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'contracts', label: 'Contrats', icon: FiBriefcase },
    { id: 'payroll', label: 'Paies', icon: FiDollarSign },
    { id: 'benefits', label: 'Avantages sociaux', icon: FiHeart },
    { id: 'performance', label: 'Évaluation', icon: FiAward },
    { id: 'leaves', label: 'Congés & permissions', icon: FiCalendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Ressources humaines</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Contrats, masse salariale indicative, politique sociale, évaluations et validation des congés.
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
                  ? 'bg-rose-50 text-rose-900 ring-1 ring-rose-200'
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase">Personnel suivi</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.staff}</p>
            <p className="text-xs text-gray-500 mt-1">Enseignants + éducateurs</p>
          </Card>
          <Card className="p-5 border border-amber-100 bg-amber-50/40">
            <p className="text-xs font-medium text-amber-800 uppercase">Congés en attente</p>
            <p className="text-3xl font-bold text-amber-900 mt-1">{stats.pending}</p>
            <p className="text-xs text-gray-600 mt-1">À traiter dans Congés & permissions</p>
          </Card>
          <Card className="p-5 border border-violet-100 bg-violet-50/40">
            <p className="text-xs font-medium text-violet-800 uppercase">Fiches d’évaluation</p>
            <p className="text-3xl font-bold text-violet-900 mt-1">{stats.reviews}</p>
            <p className="text-xs text-gray-600 mt-1">Enregistrées (historique)</p>
          </Card>
        </div>
      )}

      {tab === 'contracts' && <HRContractsPanel />}
      {tab === 'payroll' && <HRPayrollPanel />}
      {tab === 'benefits' && <HRBenefitsPanel />}
      {tab === 'performance' && <HRPerformancePanel />}
      {tab === 'leaves' && <HRLeavesPanel />}
    </div>
  );
};

export default HRManagementModule;
