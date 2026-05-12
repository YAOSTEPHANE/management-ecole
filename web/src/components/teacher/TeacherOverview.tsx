import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { teacherApi } from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { FiBook, FiUsers, FiClipboard, FiCalendar, FiTrendingUp, FiClock, FiFileText, FiAlertCircle } from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_GRID, CHART_MARGIN_COMPACT, CHART_ANIMATION_MS } from '../charts';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

const TeacherOverview = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: teacherApi.getCourses,
  });

  // Fetch assignments for upcoming tasks
  const { data: allAssignments } = useQuery({
    queryKey: ['teacher-all-assignments'],
    queryFn: async () => {
      if (!courses) return [];
      const assignments = await Promise.all(
        courses.map((course: any) => 
          teacherApi.getCourseAssignments(course.id).catch(() => [])
        )
      );
      return assignments.flat();
    },
    enabled: !!courses && courses.length > 0,
  });

  const { data: teachKpi } = useQuery({
    queryKey: ['teacher-dashboard-kpis'],
    queryFn: () => teacherApi.getDashboardKpis(),
    staleTime: 60_000,
  });

  // Calculate unique students across all courses
  const uniqueStudents = useMemo(() => {
    if (!courses) return new Set();
    const students = new Set();
    courses.forEach((course: any) => {
      course.class?.students?.forEach((student: any) => {
        students.add(student.id);
      });
    });
    return students;
  }, [courses]);

  const totalStudents = uniqueStudents.size;
  const totalGrades = courses?.reduce((sum: number, course: any) => {
    return sum + (course._count?.grades || 0);
  }, 0) || 0;

  const totalAbsences = courses?.reduce((sum: number, course: any) => {
    return sum + (course._count?.absences || 0);
  }, 0) || 0;

  const totalAssignments = allAssignments?.length || 0;
  const upcomingAssignments = useMemo(() => {
    if (!allAssignments) return [];
    const now = new Date();
    return allAssignments
      .filter((a: any) => new Date(a.dueDate) >= now)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [allAssignments]);

  if (coursesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Mes Cours',
      value: courses?.length || 0,
      icon: FiBook,
      color: 'from-blue-500 to-blue-600',
      subtitle: 'Cours actifs',
    },
    {
      title: 'Élèves',
      value: totalStudents,
      icon: FiUsers,
      color: 'from-green-500 to-green-600',
      subtitle: 'Total élèves',
    },
    {
      title: 'Notes',
      value: totalGrades,
      icon: FiClipboard,
      color: 'from-purple-500 to-purple-600',
      subtitle: 'Notes saisies',
    },
    {
      title: 'Devoirs',
      value: totalAssignments,
      icon: FiFileText,
      color: 'from-indigo-500 to-indigo-600',
      subtitle: 'Devoirs créés',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-[1px] shadow-lg shadow-emerald-500/15">
        <div className="rounded-[15px] bg-white/97 backdrop-blur-xl px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
            Pilotage pédagogique
          </p>
          <p className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Agrégation de vos cours, effectifs suivis et charge documentaire (notes, devoirs). Idéal pour prioriser vos
            séances et le suivi des élèves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} variant="premium" hover className="overflow-hidden ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white transform rotate-3 hover:rotate-6 transition-transform`}>
                  <Icon className="w-8 h-8" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {teachKpi?.charts?.gradesByMonth && teachKpi.charts.gradesByMonth.length > 0 && (
        <Card variant="premium" className="ring-1 ring-slate-900/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">KPI & tendance des notes (90 j.)</h3>
              <p className="text-xs text-slate-600 mt-1">
                Moyenne sur 20 par mois · {teachKpi.cards?.gradesRecorded90d ?? 0} note(s) · RDV parents en attente :{' '}
                {teachKpi.cards?.pendingParentAppointments ?? 0}
              </p>
            </div>
            {teachKpi.cards?.averageGradeOn20Last90d != null && (
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-semibold">Moyenne brute (période)</p>
                <p className="text-2xl font-bold text-teal-800">{teachKpi.cards.averageGradeOn20Last90d} / 20</p>
              </div>
            )}
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={teachKpi.charts.gradesByMonth}
                margin={{ ...CHART_MARGIN_COMPACT, top: 8 }}
              >
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 20]} width={28} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v} / 20`, 'Moyenne']} />
                <Line
                  type="monotone"
                  dataKey="average20"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                  isAnimationActive
                  animationDuration={CHART_ANIMATION_MS}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Prochaines actions */}
      {upcomingAssignments.length > 0 && (
        <Card variant="premium" className="ring-1 ring-slate-900/5">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Devoirs à venir</h3>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment: any) => {
              const dueDate = new Date(assignment.dueDate);
              const now = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isToday = daysUntilDue === 0;
              const isTomorrow = daysUntilDue === 1;
              
              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center space-x-3">
                    <FiFileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-600">
                        {assignment.course?.name} - {assignment.course?.class?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={isToday ? 'danger' : isTomorrow ? 'warning' : 'secondary'}
                      size="sm"
                    >
                      {isToday ? 'Aujourd\'hui' : isTomorrow ? 'Demain' : `Dans ${daysUntilDue} jours`}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(dueDate, 'dd MMM', { locale: fr })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Alertes */}
      {totalAbsences > 0 && (
        <Card className="border-l-4 border-orange-500">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <FiAlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Absences enregistrées</h3>
              <p className="text-sm text-gray-700">
                Vous avez enregistré {totalAbsences} absence(s) au total. 
                Pensez à vérifier les justifications des élèves.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeacherOverview;




