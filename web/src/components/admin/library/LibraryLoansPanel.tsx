import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Badge from '../../ui/Badge';
import FilterDropdown from '../../ui/FilterDropdown';
import { FiRefreshCw, FiPlus } from 'react-icons/fi';
import { format, addDays } from 'date-fns';
import fr from 'date-fns/locale/fr';
import toast from 'react-hot-toast';

const roles: Record<string, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Enseignant',
  STUDENT: 'Élève',
  PARENT: 'Parent',
  EDUCATOR: 'Éducateur',
};

const LibraryLoansPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'ACTIVE' | 'RETURNED' | 'all'>('ACTIVE');
  const [loanModal, setLoanModal] = useState(false);
  const [bookId, setBookId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [dueDate, setDueDate] = useState(() =>
    format(addDays(new Date(), 21), 'yyyy-MM-dd')
  );

  const { data: loans, isLoading } = useQuery({
    queryKey: ['library-loans', status],
    queryFn: () =>
      status === 'all'
        ? adminApi.getLibraryLoans()
        : adminApi.getLibraryLoans({ status }),
  });

  const { data: books } = useQuery({
    queryKey: ['library-books-loans'],
    queryFn: () => adminApi.getLibraryBooks(),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-library'],
    queryFn: () => adminApi.getAllUsers({ isActive: true }),
  });

  const returnMut = useMutation({
    mutationFn: adminApi.returnLibraryLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-loans'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-reservations'] });
      toast.success('Retour enregistré');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || 'Erreur'),
  });

  const createMut = useMutation({
    mutationFn: () =>
      adminApi.createLibraryLoan({
        bookId,
        borrowerId,
        dueDate: new Date(dueDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-loans'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      toast.success('Emprunt créé');
      setLoanModal(false);
      setBookId('');
      setBorrowerId('');
      setDueDate(format(addDays(new Date(), 21), 'yyyy-MM-dd'));
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || 'Erreur'),
  });

  const list = useMemo(() => {
    const raw = (loans as any[]) ?? [];
    if (status !== 'all') return raw;
    return raw;
  }, [loans, status]);

  const bookOptions = useMemo(() => {
    const b = (books as any[]) ?? [];
    return b.filter((x) => x.isActive && x.copiesAvailable > 0);
  }, [books]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <FilterDropdown
          label="Statut emprunt"
          value={status === 'all' ? 'all' : status}
          onChange={(v) => setStatus(v as 'ACTIVE' | 'RETURNED' | 'all')}
          options={[
            { value: 'ACTIVE', label: 'En cours' },
            { value: 'RETURNED', label: 'Retournés' },
            { value: 'all', label: 'Tous' },
          ]}
        />
        <Button type="button" onClick={() => setLoanModal(true)}>
          <FiPlus className="w-4 h-4 mr-2" />
          Nouvel emprunt
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun emprunt pour ce filtre.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold">Livre</th>
                  <th className="py-3 px-4 font-semibold">Emprunteur</th>
                  <th className="py-3 px-4 font-semibold">Sortie</th>
                  <th className="py-3 px-4 font-semibold">Retour prévu</th>
                  <th className="py-3 px-4 font-semibold">État</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((l: any) => {
                  const overdue =
                    l.status === 'ACTIVE' &&
                    !l.returnedAt &&
                    new Date(l.dueDate) < new Date();
                  return (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium">{l.book?.title}</div>
                        <div className="text-xs text-gray-500">{l.book?.author}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {l.borrower?.firstName} {l.borrower?.lastName}
                        </div>
                        <Badge className="mt-1 bg-gray-100 text-gray-700 text-xs">
                          {roles[l.borrower?.role] ?? l.borrower?.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {format(new Date(l.loanedAt), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {format(new Date(l.dueDate), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="py-3 px-4">
                        {l.status === 'RETURNED' ? (
                          <Badge className="bg-gray-100 text-gray-700">Retourné</Badge>
                        ) : overdue ? (
                          <Badge className="bg-red-100 text-red-800">En retard</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">En cours</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {l.status === 'ACTIVE' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={returnMut.isPending}
                            onClick={() => returnMut.mutate(l.id)}
                          >
                            <FiRefreshCw className="w-3.5 h-3.5 mr-1" />
                            Retour
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={loanModal}
        onClose={() => !createMut.isPending && setLoanModal(false)}
        title="Nouvel emprunt"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrage</label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              aria-label="Choisir un livre"
            >
              <option value="">— Livre disponible —</option>
              {bookOptions.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.copiesAvailable} disp.
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emprunteur</label>
            <select
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              aria-label="Choisir un utilisateur"
            >
              <option value="">— Utilisateur —</option>
              {(users as any[] | undefined)?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({roles[u.role] ?? u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date limite de retour
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              aria-label="Date limite"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setLoanModal(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={createMut.isPending || !bookId || !borrowerId}
              onClick={() => createMut.mutate()}
            >
              Enregistrer l’emprunt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LibraryLoansPanel;
