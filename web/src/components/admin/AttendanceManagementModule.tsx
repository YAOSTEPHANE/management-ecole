import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import CompleteManagement from './CompleteManagement';
import PointageEleves from './PointageEleves';
import AttendanceReportsPanel from './AttendanceReportsPanel';
import ParentAttendanceNotifyPanel from './ParentAttendanceNotifyPanel';
import {
  FiGrid,
  FiUserCheck,
  FiCalendar,
  FiBarChart2,
  FiBell,
} from 'react-icons/fi';

type AttendanceTab = 'overview' | 'rollcall' | 'absences' | 'reports' | 'parents';

const AttendanceManagementModule: React.FC = () => {
  const [tab, setTab] = useState<AttendanceTab>('overview');

  const { data: absences } = useQuery({
    queryKey: ['admin-absences-overview'],
    queryFn: () => adminApi.getAllAbsences(),
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses-overview'],
    queryFn: () => adminApi.getAllCourses(),
  });

  const absenceCount = absences?.length ?? 0;
  const courseCount = courses?.length ?? 0;

  const subTabs: { id: AttendanceTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'rollcall', label: 'Appel / pointage', icon: FiUserCheck },
    { id: 'absences', label: 'Suivi des absences', icon: FiCalendar },
    { id: 'reports', label: 'Rapports d’assiduité', icon: FiBarChart2 },
    { id: 'parents', label: 'Notifications parents', icon: FiBell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Gestion des présences</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Appel quotidien (NFC ou manuel), suivi des absences, rapports et messages aux familles.
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
                  ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-200'
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Enregistrements présence</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{absenceCount}</p>
              <p className="text-xs text-gray-500 mt-1">Lignes en base (toutes dates, filtres globaux)</p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Cours</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{courseCount}</p>
              <p className="text-xs text-gray-500 mt-1">Pour l’appel par matière et classe</p>
            </Card>
            <Card className="p-4 border border-teal-100 bg-teal-50/50">
              <p className="text-xs font-medium text-teal-800 uppercase">Parcours type</p>
              <ol className="text-sm text-gray-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Faire l’appel du jour (pointage NFC ou manuel)</li>
                <li>Vérifier et justifier les absences</li>
                <li>Consulter les rapports et prévenir les parents si besoin</li>
              </ol>
            </Card>
          </div>
        </div>
      )}

      {tab === 'rollcall' && <PointageEleves embedded />}

      {tab === 'absences' && <CompleteManagement attendanceModule />}

      {tab === 'reports' && <AttendanceReportsPanel />}

      {tab === 'parents' && <ParentAttendanceNotifyPanel />}
    </div>
  );
};

export default AttendanceManagementModule;
