import Card from '../../ui/Card';

type Props = {
  summary: any;
  isLoading: boolean;
};

const ReportsDashboardPanel: React.FC<Props> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const d = summary.dashboard;
  const perf = summary.performance;

  const cards = [
    { label: 'Élèves (actifs)', value: d.studentsActive, sub: `Total : ${d.studentsTotal}` },
    { label: 'Enseignants', value: d.teachersTotal, sub: null },
    { label: 'Éducateurs', value: d.educatorsTotal, sub: null },
    { label: 'Classes', value: d.classesTotal, sub: `${d.coursesTotal} cours` },
    { label: 'Devoirs publiés', value: d.assignmentsPublished, sub: null },
    { label: 'Utilisateurs', value: d.usersTotal, sub: 'Comptes système' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
            {c.sub && <p className="text-xs text-gray-500 mt-1">{c.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-amber-100 bg-amber-50/50">
          <p className="text-xs font-medium text-amber-900 uppercase">À risque (élevé)</p>
          <p className="text-2xl font-bold text-amber-950 mt-1">{perf.atRiskHigh}</p>
        </Card>
        <Card className="p-5 border border-orange-100 bg-orange-50/50">
          <p className="text-xs font-medium text-orange-900 uppercase">À risque (modéré)</p>
          <p className="text-2xl font-bold text-orange-950 mt-1">{perf.atRiskMedium}</p>
        </Card>
        <Card className="p-5 border border-slate-200 bg-white">
          <p className="text-xs font-medium text-gray-500 uppercase">Taux de rendus devoirs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {perf.submissionRate != null ? `${perf.submissionRate} %` : '—'}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ReportsDashboardPanel;
