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

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const ReportsFinancialPanel: React.FC<Props> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const f = summary.financial;
  const pt = f.paymentTotals;

  const chartData = (f.paymentsByMonth || []).map((x: any) => ({
    ...x,
    amountK: Math.round(x.amount / 1000),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-emerald-100 bg-emerald-50/40">
          <p className="text-xs font-medium text-emerald-900 uppercase">Encaissé (tous statuts cumulés)</p>
          <p className="text-xl font-bold text-emerald-950 mt-1">{fmtMoney(pt.completedAmount)} FCFA</p>
          <p className="text-xs text-emerald-800 mt-1">Paiements « complétés »</p>
        </Card>
        <Card className="p-5 border border-amber-100 bg-amber-50/40">
          <p className="text-xs font-medium text-amber-900 uppercase">En attente</p>
          <p className="text-xl font-bold text-amber-950 mt-1">{fmtMoney(pt.pendingAmount)} FCFA</p>
        </Card>
        <Card className="p-5 border border-rose-100 bg-rose-50/40">
          <p className="text-xs font-medium text-rose-900 uppercase">Échoués</p>
          <p className="text-xl font-bold text-rose-950 mt-1">{fmtMoney(pt.failedAmount)} FCFA</p>
        </Card>
        <Card className="p-5 border border-indigo-100 bg-indigo-50/40">
          <p className="text-xs font-medium text-indigo-900 uppercase">Frais scolarité impayés</p>
          <p className="text-xl font-bold text-indigo-950 mt-1">{fmtMoney(f.tuitionOutstandingAmount)} FCFA</p>
          <p className="text-xs text-indigo-800 mt-1">{f.tuitionOutstandingCount} échéance(s)</p>
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Paiements complétés (6 derniers mois)</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={CHART_MARGIN_COMPACT}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}k`} />
              <Tooltip
                formatter={(value: number) => [`${fmtMoney(value * 1000)} FCFA`, 'Montant']}
                labelFormatter={(label) => `Période ${label}`}
              />
              <Bar dataKey="amountK" name="Montant (milliers FCFA)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">L’axe vertical est exprimé en milliers de FCFA (arrondi).</p>
      </Card>

      <Card className="p-5 border border-gray-200 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Synthèse par statut de paiement</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="py-2 pr-4">Statut</th>
              <th className="py-2 pr-4 text-right">Nombre</th>
              <th className="py-2 text-right">Montant cumulé</th>
            </tr>
          </thead>
          <tbody>
            {(pt.byStatus || []).map((row: any) => (
              <tr key={row.status} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-800">{row.status}</td>
                <td className="py-2 pr-4 text-right text-gray-600">{row.count}</td>
                <td className="py-2 text-right">{fmtMoney(row.sum)} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ReportsFinancialPanel;
