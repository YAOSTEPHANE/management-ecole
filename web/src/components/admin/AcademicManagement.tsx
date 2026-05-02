import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import ClassesList from './ClassesList';
import StudentsList from './StudentsList';
import ScheduleManagement from './ScheduleManagement';
import CoursesProgramManagement from './CoursesProgramManagement';
import SchoolCalendarManagement from './SchoolCalendarManagement';
import {
  FiLayers,
  FiUsers,
  FiCalendar,
  FiBook,
  FiClock,
  FiGrid,
} from 'react-icons/fi';

type AcademicTab =
  | 'overview'
  | 'classes'
  | 'enrollment'
  | 'courses'
  | 'schedule'
  | 'school-calendar';

const AcademicManagement: React.FC = () => {
  const [tab, setTab] = useState<AcademicTab>('overview');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminApi.getAllCourses(),
  });

  const { data: schedules } = useQuery({
    queryKey: ['admin-schedules-overview'],
    queryFn: () => adminApi.getSchedules(),
  });

  const { data: calendarEvents } = useQuery({
    queryKey: ['school-calendar-events', 'overview'],
    queryFn: () => adminApi.getSchoolCalendarEvents(),
  });

  const totalStudents = students?.length ?? 0;
  const assigned = students?.filter((s: any) => s.classId).length ?? 0;
  const unassigned = totalStudents - assigned;

  const subTabs: { id: AcademicTab; label: string; icon: typeof FiLayers }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'classes', label: 'Classes & niveaux', icon: FiLayers },
    { id: 'enrollment', label: 'Élèves & classes', icon: FiUsers },
    { id: 'courses', label: 'Matières & programme', icon: FiBook },
    { id: 'schedule', label: 'Emploi du temps', icon: FiClock },
    { id: 'school-calendar', label: 'Calendrier scolaire', icon: FiCalendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Gestion académique</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Structure pédagogique : classes, affectation des élèves, matières, emplois du temps et
          calendrier de l’établissement.
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
                  ? 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Classes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{classes?.length ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Groupes et niveaux</p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Élèves affectés</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{assigned}</p>
              <p className="text-xs text-amber-600 mt-1">
                {unassigned > 0 ? `${unassigned} sans classe` : 'Tous affectés'}
              </p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Matières</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{courses?.length ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Cours par classe</p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Créneaux EDT</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{schedules?.length ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Calendrier : {calendarEvents?.length ?? 0} évén.</p>
            </Card>
          </div>

          <Card className="p-5 border border-indigo-100 bg-indigo-50/40">
            <h3 className="font-semibold text-gray-900 mb-2">Par où commencer ?</h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1.5">
              <li>
                Créez les <strong>classes</strong> (nom, niveau, année scolaire, capacité).
              </li>
              <li>
                <strong>Affectez les élèves</strong> à une classe depuis la fiche élève ou l’onglet
                « Élèves & classes ».
              </li>
              <li>
                Ajoutez les <strong>matières</strong> (code unique, enseignant, volume horaire).
              </li>
              <li>
                Construisez l’<strong>emploi du temps</strong> à partir des matières créées.
              </li>
              <li>
                Renseignez le <strong>calendrier scolaire</strong> (vacances, examens, jours fériés).
              </li>
            </ol>
          </Card>
        </div>
      )}

      {tab === 'classes' && <ClassesList />}
      {tab === 'enrollment' && <StudentsList showClassFilter />}
      {tab === 'courses' && <CoursesProgramManagement />}
      {tab === 'schedule' && <ScheduleManagement />}
      {tab === 'school-calendar' && <SchoolCalendarManagement />}
    </div>
  );
};

export default AcademicManagement;
