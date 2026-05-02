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
  PieGradients,
  BarGradientsMulti,
  CHART_GRID_SOFT,
  CHART_AXIS_TICK,
  CHART_MARGIN_COMPACT,
  CHART_MARGIN_COMPOSED,
  RechartsViewport,
  PremiumPieActiveShape,
  PremiumChartMeshBackground,
  ChartDropShadowFilter,
  LineStrokeGradient,
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
      <div className="space-y-6">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            </Card>
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
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
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 p-[1px] shadow-lg shadow-indigo-500/15">
        <Card variant="premium" className="!p-0 border-0 shadow-none bg-white/98 rounded-[15px] overflow-hidden" hover={false}>
          <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
                Pilotage établissement
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Vue d’ensemble opérationnelle
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                Résumé au {format(new Date(), "d MMMM yyyy", { locale: fr })}
                {totalStudents > 0 && (
                  <>
                    {' — '}
                    <strong className="text-slate-800">{totalStudents}</strong> élève{totalStudents > 1 ? 's' : ''},{' '}
                    <strong className="text-slate-800">{totalStaff}</strong> membres du personnel pédagogique.
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
                <FiTrendingUp className="w-4 h-4 shrink-0" aria-hidden />
                Données consolidées
              </div>
              {lastSync && (
                <div className="text-xs text-slate-500 tabular-nums">
                  {isFetching ? 'Actualisation…' : `Dernière synchro ${lastSync}`}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Indicateurs clés */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em] mb-4">
          Indicateurs clés
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {indicators.map((ind, index) => {
            const Icon = ind.icon;
            return (
              <Card
                key={index}
                variant="premium"
                className="p-5 ring-1 ring-slate-900/5 hover:shadow-lg hover:shadow-slate-900/5 transition-shadow"
                hover={false}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {ind.title}
                    </p>
                    <p className="text-2xl font-black text-slate-900 mt-1.5 tabular-nums tracking-tight">
                      {ind.value}
                    </p>
                    {ind.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">{ind.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl ${ind.bg} shrink-0 ring-1 ring-black/5`}>
                    <Icon className={`w-6 h-6 ${ind.color}`} aria-hidden />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Graphiques + colonne latérale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em] mb-4">
              Répartition des effectifs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                variant="premium"
                hover={false}
                className="relative overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/40 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5"
              >
                <PremiumChartMeshBackground />
                <div className="relative p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                        <FiPieChart className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <span className="font-display text-base font-bold text-slate-900">Donut effectifs</span>
                        <p className="text-xs text-slate-500">Part par classe — survol pour détail</p>
                      </div>
                    </div>
                    {enrollmentTotal > 0 && (
                      <span className="hidden sm:inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-bold tabular-nums text-slate-600">
                        Σ {enrollmentTotal} élèves
                      </span>
                    )}
                  </div>
                  {studentsError ? (
                    <div className="flex h-[280px] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-amber-700">
                      <p className="font-medium">Impossible de charger les élèves</p>
                      <p className="text-xs text-amber-600/90">
                        Vérifiez que le serveur API tourne et que vous êtes connecté (NEXT_PUBLIC_API_URL).
                      </p>
                    </div>
                  ) : chartData.length > 0 ? (
                    <>
                      <RechartsViewport height={280} className="relative z-[1]">
                        <PieChart>
                          <ChartDropShadowFilter id="dash-pie-shadow" />
                          <PieGradients count={chartData.length} />
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={64}
                            outerRadius={96}
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
                            style={{ filter: "url(#dash-pie-shadow)" }}
                          >
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={`url(#premium-pie-${i})`} stroke="#fff" strokeWidth={2} />
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
                      <div className="relative z-[1] mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200/80 pt-4">
                        {chartData.map((d, i) => (
                          <span
                            key={d.fullName}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white"
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
                    <div className="relative z-[1] flex h-[280px] items-center justify-center text-sm font-medium text-slate-400">
                      Aucune donnée
                    </div>
                  )}
                </div>
              </Card>

              <Card
                variant="premium"
                hover={false}
                className="relative overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-indigo-50/25 to-violet-50/35 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5"
              >
                <PremiumChartMeshBackground />
                <div className="relative p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                      <FiActivity className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900">Histogramme</h3>
                      <p className="text-xs text-slate-500">Volume par groupe — dégradé par barre</p>
                    </div>
                  </div>
                  {studentsError ? (
                    <div className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-amber-700">
                      Données élèves indisponibles
                    </div>
                  ) : chartData.length > 0 ? (
                    <RechartsViewport height={280} className="relative z-[1]">
                      <BarChart data={chartData} margin={CHART_MARGIN_COMPACT}>
                        <ChartDropShadowFilter id="dash-bar-shadow" />
                        <BarGradientsMulti count={chartData.length} idPrefix="dash-bar-multi" />
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
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Bar dataKey="value" radius={[14, 14, 4, 4]} maxBarSize={48} style={{ filter: "url(#dash-bar-shadow)" }}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={`url(#dash-bar-multi-${i})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </RechartsViewport>
                  ) : (
                    <div className="relative z-[1] flex h-[280px] items-center justify-center text-sm font-medium text-slate-400">
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
                className="relative mt-6 overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-sky-50/20 to-indigo-50/30 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5"
              >
                <PremiumChartMeshBackground />
                <div className="relative p-5 sm:p-6">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
                        <FiLayers className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-900">Profil cumulatif</h3>
                        <p className="text-xs text-slate-500">
                          Classes triées par effectif — barres (élèves) et courbe (% cumulé)
                        </p>
                      </div>
                    </div>
                  </div>
                  <RechartsViewport height={300} className="relative z-[1]">
                    <ComposedChart data={composedProfileData} margin={CHART_MARGIN_COMPOSED}>
                      <ChartDropShadowFilter id="dash-composed-shadow" />
                      <BarGradientsMulti count={composedProfileData.length} idPrefix="dash-composed-bar" />
                      <LineStrokeGradient id="dash-cumulative-line" from="#0ea5e9" to="#4f46e5" />
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
                        style={{ filter: "url(#dash-composed-shadow)" }}
                      >
                        {composedProfileData.map((_, i) => (
                          <Cell key={i} fill={`url(#dash-composed-bar-${i})`} />
                        ))}
                      </Bar>
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulativePct"
                        stroke="url(#dash-cumulative-line)"
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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em] mb-4">
              Activité récente
            </h3>
            <RecentActivity />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em] mb-4">
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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em] mb-4">
              Notifications
            </h3>
            <NotificationsWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
