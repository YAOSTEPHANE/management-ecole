import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Line,
  ReferenceLine,
} from 'recharts';
import {
  PremiumTooltip,
  CHART_GRID_SOFT,
  CHART_AXIS_TICK,
  CHART_MARGIN_COMPACT,
  CHART_MARGIN_COMPOSED,
  RechartsViewport,
  PremiumPieActiveShape,
  PremiumChartMeshBackground,
  PREMIUM_SOLID,
} from '../charts';
import {
  FiUsers,
  FiBook,
  FiUserCheck,
  FiBookOpen,
  FiActivity,
  FiShield,
  FiTrendingUp,
  FiPieChart,
  FiLayers,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import NotificationsWidget from './NotificationsWidget';

interface DashboardStatsProps {
  onAddStudent?: () => void;
  onCreateClass?: () => void;
  onAddTeacher?: () => void;
  onAddEducator?: () => void;
  onGenerateReport?: () => void;
  onExportData?: () => void;
  onSettings?: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  onAddStudent,
  onCreateClass,
  onAddTeacher,
  onAddEducator,
  onGenerateReport,
  onExportData,
  onSettings,
}) => {
  const [pieActiveIndex, setPieActiveIndex] = useState<number | undefined>(undefined);

  const { data: stats, isLoading, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const { data: students, isError: studentsError } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
    retry: 1,
  });

  const classDistribution =
    students?.reduce((acc: Record<string, number>, student: any) => {
      const name = student.class?.name || 'Non assigné';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}) || {};

  const chartData = Object.entries(classDistribution).map(([name, value]) => ({
    name: name.length > 10 ? name.slice(0, 8) + '…' : name,
    value: Number(value),
    fullName: name,
  }));

  const enrollmentTotal = useMemo(
    () => chartData.reduce((s, d) => s + Number(d.value), 0),
    [chartData]
  );

  const composedProfileData = useMemo(() => {
    const sorted = [...chartData].sort((a, b) => Number(b.value) - Number(a.value));
    let run = 0;
    return sorted.map((d) => {
      run += Number(d.value);
      return {
        ...d,
        cumulativePct: enrollmentTotal > 0 ? Math.round((run / enrollmentTotal) * 1000) / 10 : 0,
      };
    });
  }, [chartData, enrollmentTotal]);

  const avgStudentsPerClass =
    chartData.length > 0 ? Math.round((enrollmentTotal / chartData.length) * 10) / 10 : 0;

  const totalStudents = stats?.totalStudents ?? 0;
  const totalStaff = (stats?.totalTeachers ?? 0) + (stats?.totalEducators ?? 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-3">
              <div className="h-3 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />
            </Card>
            <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const indicators = [
    {
      title: 'Élèves',
      value: stats?.totalStudents ?? 0,
      subtitle: `${stats?.activeStudents ?? 0} actifs`,
      icon: FiUsers,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Enseignants',
      value: stats?.totalTeachers ?? 0,
      subtitle: 'En poste',
      icon: FiBookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Éducateurs',
      value: stats?.totalEducators ?? 0,
      subtitle: 'En poste',
      icon: FiShield,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      title: 'Classes',
      value: stats?.totalClasses ?? 0,
      subtitle: 'Niveaux',
      icon: FiBook,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Parents',
      value: stats?.totalParents ?? 0,
      subtitle: 'Inscrits',
      icon: FiUserCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  const lastSync =
    dataUpdatedAt > 0 ? format(new Date(dataUpdatedAt), "HH:mm:ss", { locale: fr }) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 p-px shadow-sm">
        <Card variant="premium" className="!p-0 border-0 shadow-none bg-white/98 rounded-[11px] overflow-hidden" hover={false}>
          <div className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
            <div>
              <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">
                Pilotage établissement
              </p>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Vue d’ensemble opérationnelle
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-600 mt-1 max-w-2xl leading-snug">
                Résumé au {format(new Date(), "d MMMM yyyy", { locale: fr })}
                {totalStudents > 0 && (
                  <>
                    {' — '}
                    <strong className="text-slate-800">{totalStudents}</strong> élève{totalStudents > 1 ? 's' : ''},{' '}
                    <strong className="text-slate-800">{totalStaff}</strong> personnel.
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-[9px] font-semibold">
                <FiTrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
                Données consolidées
              </div>
              {lastSync && (
                <div className="text-[9px] text-slate-500 tabular-nums">
                  {isFetching ? 'Actualisation…' : `Synchro ${lastSync}`}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Indicateurs clés */}
      <div>
        <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Indicateurs clés
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2">
          {indicators.map((ind, index) => {
            const Icon = ind.icon;
            return (
              <Card
                key={index}
                variant="premium"
                className="p-2 sm:p-2.5 ring-1 ring-slate-900/5 hover:shadow-sm transition-shadow rounded-lg"
                hover={false}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">
                      {ind.title}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 tabular-nums tracking-tight leading-none">
                      {ind.value}
                    </p>
                    {ind.subtitle && (
                      <p className="text-[8px] text-slate-500 mt-0.5 leading-tight">{ind.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-1 rounded-md ${ind.bg} shrink-0 ring-1 ring-black/5`}>
                    <Icon className={`w-3.5 h-3.5 ${ind.color}`} aria-hidden />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Actions rapides
        </h3>
        <QuickActions
          onAddStudent={onAddStudent}
          onCreateClass={onCreateClass}
          onAddTeacher={onAddTeacher}
          onAddEducator={onAddEducator}
          onGenerateReport={onGenerateReport}
          onExportData={onExportData}
          onSettings={onSettings}
        />
      </div>

      <div>
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Notifications
        </h3>
        <NotificationsWidget />
      </div>

      {/* Graphiques + activité */}
      <div className="space-y-4">
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Répartition des effectifs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <Card
                variant="premium"
                hover={false}
                className="relative overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/40 shadow-sm ring-1 ring-slate-900/5"
              >
                <PremiumChartMeshBackground />
                <div className="relative p-3 sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                        <FiPieChart className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <span className="font-display text-sm font-bold text-slate-900">Donut effectifs</span>
                        <p className="text-[9px] text-slate-500">Part par classe</p>
                      </div>
                    </div>
                    {enrollmentTotal > 0 && (
                      <span className="hidden sm:inline-flex rounded-full bg-slate-900/5 px-2 py-0.5 text-[9px] font-bold tabular-nums text-slate-600">
                        Σ {enrollmentTotal}
                      </span>
                    )}
                  </div>
                  {studentsError ? (
                    <div className="flex h-[220px] flex-col items-center justify-center gap-2 px-3 text-center text-xs text-amber-700">
                      <p className="font-medium">Impossible de charger les élèves</p>
                      <p className="text-xs text-amber-600/90">
                        Vérifiez que le serveur API tourne et que vous êtes connecté (NEXT_PUBLIC_API_URL).
                      </p>
                    </div>
                  ) : chartData.length > 0 ? (
                    <>
                      <RechartsViewport height={220} className="relative z-[1]">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={4}
                            cornerRadius={8}
                            stroke="#ffffff"
                            strokeWidth={3}
                            label={false}
                            labelLine={false}
                            activeIndex={pieActiveIndex}
                            activeShape={PremiumPieActiveShape}
                            onMouseEnter={(_, i) => setPieActiveIndex(i)}
                            onMouseLeave={() => setPieActiveIndex(undefined)}
                          >
                            {chartData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PREMIUM_SOLID[i % PREMIUM_SOLID.length]}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={(props) => (
                              <PremiumTooltip
                                {...props}
                                label={
                                  (props.payload?.[0]?.payload as { fullName?: string })
                                    ?.fullName ?? props.label
                                }
                                valueLabel="élève(s)"
                              />
                            )}
                          />
                        </PieChart>
                      </RechartsViewport>
                      <div className="relative z-[1] mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-200/80 pt-2">
                        {chartData.map((d, i) => (
                          <span
                            key={d.fullName}
                            className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-600"
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-full shadow-sm ring-1 ring-white"
                              style={{
                                background: PREMIUM_SOLID[i % PREMIUM_SOLID.length],
                              }}
                            />
                            <span className="max-w-[140px] truncate">{d.fullName}</span>
                            <span className="tabular-nums text-slate-900">{d.value}</span>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="relative z-[1] flex h-[220px] items-center justify-center text-xs font-medium text-slate-400">
                      Aucune donnée
                    </div>
                  )}
                </div>
              </Card>

              <Card
                variant="premium"
                hover={false}
                className="relative overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-indigo-50/25 to-violet-50/35 shadow-sm ring-1 ring-slate-900/5"
              >
                <PremiumChartMeshBackground />
                <div className="relative p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                      <FiActivity className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-900">Histogramme</h3>
                      <p className="text-[9px] text-slate-500">Volume par groupe</p>
                    </div>
                  </div>
                  {studentsError ? (
                    <div className="flex h-[220px] items-center justify-center px-3 text-center text-xs text-amber-700">
                      Données élèves indisponibles
                    </div>
                  ) : chartData.length > 0 ? (
                    <RechartsViewport height={220} className="relative z-[1]">
                      <BarChart data={chartData} margin={CHART_MARGIN_COMPACT}>
                        <CartesianGrid {...CHART_GRID_SOFT} />
                        <XAxis
                          dataKey="name"
                          tick={CHART_AXIS_TICK}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={CHART_AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={(props) => (
                            <PremiumTooltip
                              {...props}
                              label={
                                (props.payload?.[0]?.payload as { fullName?: string })
                                  ?.fullName ?? props.label
                              }
                              valueLabel="élève(s)"
                            />
                          )}
                        />
                        {avgStudentsPerClass > 0 && (
                          <ReferenceLine
                            y={avgStudentsPerClass}
                            stroke="#94a3b8"
                            strokeDasharray="6 6"
                            label={{
                              value: `Moy. ${avgStudentsPerClass}`,
                              position: "insideTopRight",
                              fill: "#64748b",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Bar dataKey="value" radius={[10, 10, 3, 3]} maxBarSize={40}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={PREMIUM_SOLID[i % PREMIUM_SOLID.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </RechartsViewport>
                  ) : (
                    <div className="relative z-[1] flex h-[220px] items-center justify-center text-xs font-medium text-slate-400">
                      Aucune donnée
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {chartData.length > 0 && !studentsError && (
              <Card
                variant="premium"
                hover={false}
                className="relative mt-4 overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-sky-50/20 to-indigo-50/30 shadow-sm ring-1 ring-slate-900/5"
              >
                <PremiumChartMeshBackground />
                <div className="relative p-3 sm:p-4">
                  <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
                        <FiLayers className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-slate-900">Profil cumulatif</h3>
                        <p className="text-[9px] text-slate-500">
                          Effectifs et % cumulé
                        </p>
                      </div>
                    </div>
                  </div>
                  <RechartsViewport height={240} className="relative z-[1]">
                    <ComposedChart data={composedProfileData} margin={CHART_MARGIN_COMPOSED}>
                      <CartesianGrid {...CHART_GRID_SOFT} />
                      <XAxis
                        dataKey="name"
                        tick={CHART_AXIS_TICK}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={CHART_AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={CHART_AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={(props) => (
                          <PremiumTooltip
                            {...props}
                            label={
                              (props.payload?.[0]?.payload as { fullName?: string })?.fullName ??
                              props.label
                            }
                          />
                        )}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="value"
                        radius={[14, 14, 4, 4]}
                        maxBarSize={44}
                      >
                        {composedProfileData.map((_, i) => (
                          <Cell key={i} fill={PREMIUM_SOLID[i % PREMIUM_SOLID.length]} />
                        ))}
                      </Bar>
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulativePct"
                        stroke="#4f46e5"
                        strokeWidth={3.5}
                        dot={{ r: 5, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                      />
                    </ComposedChart>
                  </RechartsViewport>
                </div>
              </Card>
            )}
          </div>

          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Activité récente
            </h3>
            <RecentActivity />
          </div>
      </div>
    </div>
  );
};

export default DashboardStats;
