import Card from '../../ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_GRID, CHART_MARGIN_COMPACT } from '../../charts';

type Props = {
  summary: any;
  isLoading: boolean;
};

const ReportsAcademicPanel: React.FC<Props> = ({ summary, isLoading }) => {
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
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} / 20`, 'Moyenne']}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ''
                  }
                />
                <Bar dataKey="moyenne" fill="#7c3aed" radius={[0, 4, 4, 0]} />
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
    </div>
  );
};

export default ReportsAcademicPanel;
