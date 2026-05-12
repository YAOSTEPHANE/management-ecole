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
import { ADM } from './adminModuleLayout';

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
    { id: 'rollcall', label: 'Pointage (NFC / bio / manuel)', icon: FiUserCheck },
    { id: 'absences', label: 'Suivi des absences', icon: FiCalendar },
    { id: 'reports', label: 'Rapports d’assiduité', icon: FiBarChart2 },
    { id: 'parents', label: 'Notifications parents', icon: FiBell },
  ];

  return (
    <div className={ADM.root}>
      <div>
        <h2 className={ADM.h2}>Absences, retards & assiduité</h2>
        <p className={ADM.intro}>
          Pointage quotidien (manuel, carte NFC ou biométrie), justification des absences et certificats médicaux,
          suivi des retards avec notification automatique aux parents (e-mail / SMS si configuré), statistiques
          d’assiduité et sanctions pour absences non justifiées.
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
              className={`${ADM.tabBtn(active, 'bg-teal-50 text-teal-900 ring-1 ring-teal-200')}`}
            >
              <Icon className={ADM.tabIcon} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className={ADM.section}>
          <div className={ADM.grid3}>
            <Card className={`${ADM.statCard} border border-gray-200`}>
              <p className={ADM.statLabel}>Enregistrements présence</p>
              <p className={ADM.statVal}>{absenceCount}</p>
              <p className={ADM.statHint}>Lignes en base (toutes dates, filtres globaux)</p>
            </Card>
            <Card className={`${ADM.statCard} border border-gray-200`}>
              <p className={ADM.statLabel}>Cours</p>
              <p className={ADM.statVal}>{courseCount}</p>
              <p className={ADM.statHint}>Pour l’appel par matière et classe</p>
            </Card>
            <Card className={`${ADM.statCard} border border-teal-100 bg-teal-50/50`}>
              <p className="text-[10px] font-medium text-teal-800 uppercase tracking-wide leading-tight">
                Parcours type
              </p>
              <ol className={ADM.olSm}>
                <li>Faire l’appel du jour (carte, empreinte ou saisie manuelle)</li>
                <li>Vérifier et justifier les absences</li>
                <li>Consulter les rapports et prévenir les parents si besoin</li>
              </ol>
            </Card>
          </div>
        </div>
      )}

      {tab === 'rollcall' && <PointageEleves embedded />}

      {tab === 'absences' && <CompleteManagement attendanceModule compact />}

      {tab === 'reports' && <AttendanceReportsPanel />}

      {tab === 'parents' && <ParentAttendanceNotifyPanel />}
    </div>
  );
};

export default AttendanceManagementModule;
