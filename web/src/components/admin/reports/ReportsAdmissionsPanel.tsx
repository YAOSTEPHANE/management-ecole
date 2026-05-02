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

const ReportsAdmissionsPanel: React.FC<Props> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const adm = summary.admissions;
  const yearData = (adm.byAcademicYear || []).map((x: any) => ({
    annee: x.academicYear,
    dossiers: x.count,
  }));

  const statusCards = [
    { label: 'En attente', value: adm.pending, color: 'border-amber-100 bg-amber-50/50' },
    { label: 'En examen', value: adm.underReview, color: 'border-sky-100 bg-sky-50/50' },
    { label: 'Acceptés', value: adm.accepted, color: 'border-emerald-100 bg-emerald-50/50' },
    { label: 'Refusés', value: adm.rejected, color: 'border-rose-100 bg-rose-50/50' },
    { label: 'Liste d’attente', value: adm.waitlist, color: 'border-violet-100 bg-violet-50/50' },
    { label: 'Inscrits', value: adm.enrolled, color: 'border-indigo-100 bg-indigo-50/50' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 border border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase">Dossiers total</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">{adm.total}</p>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusCards.map((c) => (
          <Card key={c.label} className={`p-4 border ${c.color}`}>
            <p className="text-xs font-medium text-gray-600">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </Card>
        ))}
      </div>

      {yearData.length > 0 && (
        <Card className="p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Dossiers par année scolaire</h3>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData} margin={CHART_MARGIN_COMPACT}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="dossiers" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsAdmissionsPanel;
