import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { FiDownload, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { formatFCFA } from '../../../utils/currency';

const HRPayrollPanel: React.FC = () => {
  const { data: teachers, isLoading: lt } = useQuery({
    queryKey: ['admin-teachers-hr-payroll'],
    queryFn: adminApi.getTeachers,
  });
  const { data: educators, isLoading: le } = useQuery({
    queryKey: ['admin-educators-hr-payroll'],
    queryFn: adminApi.getEducators,
  });

  const { rows, totalMonthly, withSalary } = useMemo(() => {
    const t = teachers as any[] | undefined;
    const e = educators as any[] | undefined;
    const rows: { name: string; role: string; salary: number }[] = [];
    let sum = 0;
    let count = 0;
    for (const x of t ?? []) {
      if (x.salary != null && !Number.isNaN(Number(x.salary))) {
        const s = Number(x.salary);
        sum += s;
        count++;
        rows.push({
          name: `${x.user?.firstName ?? ''} ${x.user?.lastName ?? ''}`.trim(),
          role: 'Enseignant',
          salary: s,
        });
      }
    }
    for (const x of e ?? []) {
      if (x.salary != null && !Number.isNaN(Number(x.salary))) {
        const s = Number(x.salary);
        sum += s;
        count++;
        rows.push({
          name: `${x.user?.firstName ?? ''} ${x.user?.lastName ?? ''}`.trim(),
          role: 'Éducateur',
          salary: s,
        });
      }
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return { rows, totalMonthly: sum, withSalary: count };
  }, [teachers, educators]);

  const loading = lt || le;

  const exportCsv = () => {
    const header = ['Nom', 'Rôle', 'Salaire brut mensuel (référence)'];
    const lines = rows.map((r) => [r.name, r.role, String(r.salary)].join(';'));
    const csv = ['\ufeff' + header.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masse_salariale_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-amber-100 bg-amber-50/50">
        <div className="flex gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Les montants proviennent du <strong>salaire de référence</strong> saisi sur chaque fiche
            personnel. Ce module fournit une <strong>vision indicative</strong> de la masse salariale
            mensuelle (pas de bulletins de paie ni cotisations calculées ici).
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
            <FiDollarSign className="w-4 h-4" /> Masse salariale mensuelle (indicatif)
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2 tabular-nums">
            {loading ? '…' : formatFCFA(totalMonthly)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Somme des salaires renseignés — {withSalary} fiche{withSalary > 1 ? 's' : ''}
          </p>
        </Card>
        <Card className="p-5 border border-gray-200 flex flex-col justify-center">
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <FiDownload className="w-4 h-4 mr-2" />
            Exporter la grille (CSV)
          </Button>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Détail par personne</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun salaire renseigné sur les fiches enseignants / éducateurs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-3 px-4 font-semibold">Nom</th>
                  <th className="py-3 px-4 font-semibold">Rôle</th>
                  <th className="py-3 px-4 font-semibold text-right">Salaire mensuel (réf.)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.name}-${i}`} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 px-4 text-gray-600">{r.role}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">
                      {formatFCFA(r.salary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HRPayrollPanel;
