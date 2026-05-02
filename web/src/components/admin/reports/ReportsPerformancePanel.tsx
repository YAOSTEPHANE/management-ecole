import Card from '../../ui/Card';

type Props = {
  summary: any;
  isLoading: boolean;
};

const ReportsPerformancePanel: React.FC<Props> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const p = summary.performance;
  const a = summary.academic;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-red-100 bg-red-50/40">
          <p className="text-xs font-medium text-red-900 uppercase">Risque élevé</p>
          <p className="text-4xl font-bold text-red-950 mt-1">{p.atRiskHigh}</p>
          <p className="text-xs text-red-800 mt-2">
            Moyenne &lt; 10/20 ou plus de 5 absences non justifiées (règle indicative).
          </p>
        </Card>
        <Card className="p-5 border border-orange-100 bg-orange-50/40">
          <p className="text-xs font-medium text-orange-900 uppercase">Risque modéré</p>
          <p className="text-4xl font-bold text-orange-950 mt-1">{p.atRiskMedium}</p>
          <p className="text-xs text-orange-800 mt-2">Moyenne entre 10 et 12/20.</p>
        </Card>
        <Card className="p-5 border border-slate-200 bg-white">
          <p className="text-xs font-medium text-gray-500 uppercase">Total suivis « à risque »</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">{p.atRiskTotal}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Moyenne générale</h3>
          <p className="text-3xl font-bold text-indigo-700">
            {a.gradeAverage != null ? `${a.gradeAverage} / 20` : '—'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Calcul pondéré sur l’ensemble des notes ({a.gradesCount} enregistrements).
          </p>
        </Card>
        <Card className="p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Assiduité</h3>
          <p className="text-lg text-gray-800">
            Absences : <strong>{a.absenceTotals.total}</strong>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Taux d’absences justifiées :{' '}
            {p.absenceExcusedRate != null ? `${p.absenceExcusedRate} %` : '—'}
          </p>
        </Card>
      </div>

      <Card className="p-5 border border-dashed border-indigo-200 bg-indigo-50/30">
        <p className="text-sm text-indigo-950">
          Pour le détail des élèves concernés, utilisez l’onglet{' '}
          <strong>Suivi pédagogique</strong> du tableau de bord (liste à risque et statistiques par
          classe).
        </p>
      </Card>
    </div>
  );
};

export default ReportsPerformancePanel;
