import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LibraryInventoryPanel: React.FC = () => {
  const { data: books, isLoading } = useQuery({
    queryKey: ['library-books-inventory'],
    queryFn: () => adminApi.getLibraryBooks({ isActive: 'all' }),
  });

  const stats = useMemo(() => {
    const list = (books as any[]) ?? [];
    let totalCopies = 0;
    let available = 0;
    let titles = 0;
    for (const b of list) {
      if (!b.isActive) continue;
      titles++;
      totalCopies += b.copiesTotal ?? 0;
      available += b.copiesAvailable ?? 0;
    }
    const loaned = totalCopies - available;
    return { titles, totalCopies, available, loaned };
  }, [books]);

  const exportCsv = () => {
    const list = ((books as any[]) ?? []).filter((b) => b.isActive);
    const header = ['Titre', 'Auteur', 'ISBN', 'Catégorie', 'Rayon', 'Total', 'Disponibles', 'Empruntés'];
    const rows = list.map((b: any) =>
      [
        b.title,
        b.author,
        b.isbn ?? '',
        b.category ?? '',
        b.shelfLocation ?? '',
        String(b.copiesTotal),
        String(b.copiesAvailable),
        String((b.copiesTotal ?? 0) - (b.copiesAvailable ?? 0)),
      ].join(';')
    );
    const csv = ['\ufeff' + header.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inventaire_bibliotheque_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Export téléchargé');
  };

  const list = ((books as any[]) ?? []).filter((b) => b.isActive);

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-slate-200 bg-slate-50/50">
        <p className="text-sm text-gray-700">
          Vue <strong>stock</strong> pour inventaire physique : comparez les exemplaires disponibles avec les
          rayons. Ajustez les quantités depuis l’onglet <strong>Catalogue</strong> en éditant chaque fiche.
        </p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Titres actifs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.titles}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Exemplaires total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCopies}</p>
        </Card>
        <Card className="p-4 border border-emerald-100 bg-emerald-50/40">
          <p className="text-xs text-emerald-800 uppercase">En rayon</p>
          <p className="text-2xl font-bold text-emerald-900">{stats.available}</p>
        </Card>
        <Card className="p-4 border border-amber-100 bg-amber-50/40">
          <p className="text-xs text-amber-800 uppercase">Empruntés</p>
          <p className="text-2xl font-bold text-amber-900">{stats.loaned}</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={exportCsv} disabled={!list.length}>
          <FiDownload className="w-4 h-4 mr-2" />
          Export inventaire (CSV)
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun titre actif.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold">Titre</th>
                  <th className="py-3 px-4 font-semibold">Rayon</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Rayon (dispo)</th>
                  <th className="py-3 px-4 font-semibold text-right">Sortis</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b: any) => {
                  const out = (b.copiesTotal ?? 0) - (b.copiesAvailable ?? 0);
                  return (
                    <tr key={b.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{b.title}</td>
                      <td className="py-3 px-4 text-gray-600">{b.shelfLocation || '—'}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{b.copiesTotal}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-emerald-700">
                        {b.copiesAvailable}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-amber-800">{out}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LibraryInventoryPanel;
