import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../ui/Card';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { CHART_GRID, CHART_MARGIN_COMPACT, chartBlueRed, CHART_ANIMATION_MS } from '../../charts';
import { adminApi } from '../../../services/api';

type Props = {
  summary: any;
  isLoading: boolean;
};

function guessDefaultAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (m >= 8) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: 'full', label: 'Année complète' },
  { value: 'trim1', label: 'Trimestre 1' },
  { value: 'trim2', label: 'Trimestre 2' },
  { value: 'trim3', label: 'Trimestre 3' },
  { value: 'sem1', label: 'Semestre 1' },
  { value: 'sem2', label: 'Semestre 2' },
];

const ReportsAcademicPanel: React.FC<Props> = ({ summary, isLoading }) => {
  const [academicYear, setAcademicYear] = useState(guessDefaultAcademicYear);
  const [period, setPeriod] = useState('full');
  const [classId, setClassId] = useState('');

  const { data: classes = [] } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => adminApi.getClasses(),
    staleTime: 120_000,
  });

  const academicYears = useMemo(() => {
    const s = new Set<string>();
    for (const c of classes as { academicYear?: string }[]) {
      if (c.academicYear) s.add(c.academicYear);
    }
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [classes]);

  const classOptions = useMemo(() => {
    const list = classes as { id: string; name: string; academicYear?: string }[];
    if (!academicYear) return list;
    return list.filter((c) => c.academicYear === academicYear);
  }, [classes, academicYear]);

  const {
    data: academic,
    isLoading: academicLoading,
    isFetching: academicFetching,
  } = useQuery({
    queryKey: ['admin-reports-academic', academicYear, period, classId],
    queryFn: () =>
      adminApi.getAcademicReports({
        academicYear: academicYear || undefined,
        period,
        classId: classId || undefined,
      }),
    staleTime: 30_000,
  });

  if (isLoading || !summary) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const a = summary.academic;
  const sa = a.studentAssignmentStats;
  const chartData = (a.averagesByClass || []).map((x: any) => ({
    name:
      x.className.length > 18 ? `${x.className.slice(0, 16)}…` : x.className,
    fullName: x.className,
    moyenne: x.average ?? 0,
  }));

  const compChart =
    academic?.classComparison?.map((x: any) => ({
      name: x.className?.length > 16 ? `${x.className.slice(0, 14)}…` : x.className,
      fullName: x.className,
      moyenne: x.average20 ?? 0,
      rang: x.rank,
      taux: x.successRate,
    })) ?? [];

  const evoData =
    academic?.evolutionByMonth?.map((x: any) => ({
      label: x.label,
      moyenne: x.average20 ?? 0,
    })) ?? [];

  const filtersBusy = academicLoading || academicFetching;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-violet-100 bg-violet-50/40">
          <p className="text-xs font-medium text-violet-900 uppercase">Moyenne générale (pondérée)</p>
          <p className="text-3xl font-bold text-violet-950 mt-1">
            {a.gradeAverage != null ? `${a.gradeAverage} / 20` : '—'}
          </p>
        </Card>
        <Card className="p-5 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Notes enregistrées</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{a.gradesCount}</p>
        </Card>
        <Card className="p-5 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Devoirs publiés</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{a.assignmentsPublished}</p>
        </Card>
        <Card className="p-5 border border-teal-100 bg-teal-50/40">
          <p className="text-xs font-medium text-teal-900 uppercase">Rendus élèves</p>
          <p className="text-3xl font-bold text-teal-950 mt-1">
            {sa.total > 0 ? `${sa.submitted} / ${sa.total}` : '—'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Absences</h3>
          <p className="text-2xl font-bold text-gray-900">{a.absenceTotals.total}</p>
          <p className="text-sm text-gray-600 mt-1">
            Justifiées : {a.absenceTotals.excused} · Non justifiées :{' '}
            {a.absenceTotals.total - a.absenceTotals.excused}
          </p>
        </Card>
        <Card className="p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Taux de rendu (devoirs)</h3>
          <p className="text-2xl font-bold text-gray-900">
            {summary.performance.submissionRate != null
              ? `${summary.performance.submissionRate} %`
              : '—'}
          </p>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Moyenne par classe (top 12)</h3>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ ...CHART_MARGIN_COMPACT, left: 12 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} / 20`, 'Moyenne']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar
                  dataKey="moyenne"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive
                  animationDuration={CHART_ANIMATION_MS}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartBlueRed(i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {chartData.length === 0 && (
        <Card className="p-8 border border-dashed border-gray-200 text-center text-gray-500 text-sm">
          Pas assez de notes par classe pour afficher un graphique. Les moyennes nécessitent des notes
          associées à des élèves affectés à une classe.
        </Card>
      )}

      <Card className="p-5 border border-indigo-100 bg-indigo-50/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-950">Rapports académiques détaillés (11.1)</h3>
            <p className="text-xs text-indigo-900/80 mt-1">
              Résultats par classe et matière, taux de réussite, comparaisons et évolution sur la période
              choisie.
            </p>
          </div>
          {filtersBusy && (
            <span className="text-xs text-indigo-600 animate-pulse">Chargement des agrégats…</span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block text-xs font-medium text-gray-700">
            Année scolaire
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setClassId('');
              }}
            >
              <option value="">Toutes les années</option>
              {academicYear && !academicYears.includes(academicYear) && (
                <option value={academicYear}>{academicYear}</option>
              )}
              {academicYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-700">
            Période
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={!academicYear}
              title={!academicYear ? 'Choisissez une année pour filtrer par période' : undefined}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-700">
            Classe
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!academicYear && (
          <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Sans année scolaire, les notes de toutes les années sont incluses et le filtre « période » est
            désactivé.
          </p>
        )}
      </Card>

      {academic && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border border-violet-100 bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase">Moyenne (filtre)</p>
              <p className="text-2xl font-bold text-violet-950 mt-1">
                {academic.summary?.globalAverage20 != null
                  ? `${academic.summary.globalAverage20} / 20`
                  : '—'}
              </p>
            </Card>
            <Card className="p-5 border border-gray-200 bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase">Taux de réussite</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {academic.summary?.globalSuccessRate != null
                  ? `${academic.summary.globalSuccessRate} %`
                  : '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Moyenne individuelle ≥ 10/20</p>
            </Card>
            <Card className="p-5 border border-gray-200 bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase">Notes (filtre)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{academic.summary?.gradesCount ?? 0}</p>
            </Card>
            <Card className="p-5 border border-gray-200 bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase">Élèves évalués</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {academic.summary?.studentsEvaluated ?? 0}
              </p>
            </Card>
          </div>

          <Card className="p-5 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {academic.endOfPeriodReport?.title ?? 'Synthèse de fin de période'}
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {(academic.endOfPeriodReport?.bullets ?? []).map((b: string, i: number) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {compChart.length > 0 && (
              <Card className="p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Comparaison inter-classes (moyenne /20)
                </h3>
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compChart} layout="vertical" margin={{ ...CHART_MARGIN_COMPACT, left: 8 }}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 9 }} />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === 'moyenne' ? [`${value} / 20`, 'Moyenne'] : [`${value} %`, 'Réussite']
                        }
                        labelFormatter={(_, p) => {
                          const row = p?.[0]?.payload;
                          if (!row) return '';
                          return `${row.fullName} · Rang ${row.rang}${row.taux != null ? ` · Réussite ${row.taux}%` : ''}`;
                        }}
                      />
                      <Bar
                        dataKey="moyenne"
                        radius={[0, 4, 4, 0]}
                        fill="#6366f1"
                        isAnimationActive
                        animationDuration={CHART_ANIMATION_MS}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {evoData.length > 0 && (
              <Card className="p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Évolution mensuelle (moyenne /20)</h3>
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evoData} margin={{ ...CHART_MARGIN_COMPACT, bottom: 4 }}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} width={28} />
                      <Tooltip formatter={(v: number) => [`${v} / 20`, 'Moyenne']} />
                      <Line
                        type="monotone"
                        dataKey="moyenne"
                        stroke="#0d9488"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        isAnimationActive
                        animationDuration={CHART_ANIMATION_MS}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>

          <Card className="p-5 border border-gray-200 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Résultats par classe et matière</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left font-medium text-gray-600 px-3 py-2">Classe</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2">Matière</th>
                    <th className="text-right font-medium text-gray-600 px-3 py-2">Moy. /20</th>
                    <th className="text-right font-medium text-gray-600 px-3 py-2">Nb notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(academic.byClassSubject ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                        Aucune note pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    (academic.byClassSubject as any[]).map((row) => (
                      <tr key={`${row.classId}-${row.courseId}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{row.className}</td>
                        <td className="px-3 py-2 text-gray-700">{row.courseName}</td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {row.average20 != null ? row.average20 : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 tabular-nums">{row.gradesCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsAcademicPanel;
