'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { staffApi } from '@/services/api/staff.api';
import { FiBook, FiRotateCcw } from 'react-icons/fi';

export default function StaffLibraryPanel() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [bookId, setBookId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['staff-library-books', q],
    queryFn: () => staffApi.listLibraryBooks(q || undefined),
  });

  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['staff-library-loans'],
    queryFn: () => staffApi.listLibraryLoans('ACTIVE'),
  });

  const loanMut = useMutation({
    mutationFn: () => staffApi.createLibraryLoan({ bookId, borrowerId, dueDate }),
    onSuccess: () => {
      toast.success('Emprunt enregistré');
      qc.invalidateQueries({ queryKey: ['staff-library-loans'] });
      qc.invalidateQueries({ queryKey: ['staff-library-books'] });
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Erreur emprunt');
    },
  });

  const returnMut = useMutation({
    mutationFn: (loanId: string) => staffApi.returnLibraryLoan(loanId),
    onSuccess: () => {
      toast.success('Retour enregistré');
      qc.invalidateQueries({ queryKey: ['staff-library-loans'] });
      qc.invalidateQueries({ queryKey: ['staff-library-books'] });
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Erreur retour');
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <FiBook className="w-5 h-5 text-amber-700" />
          Bibliothèque — prêts
        </h2>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Rechercher un ouvrage (titre, auteur, ISBN)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="grid sm:grid-cols-3 gap-2">
          <select className="border rounded-lg px-2 py-2 text-sm" value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">Ouvrage…</option>
            {(books as { id: string; title: string; copiesAvailable: number }[]).map((b) => (
              <option key={b.id} value={b.id} disabled={b.copiesAvailable < 1}>
                {b.title} ({b.copiesAvailable} dispo.)
              </option>
            ))}
          </select>
          <input
            className="border rounded-lg px-2 py-2 text-sm"
            placeholder="ID utilisateur emprunteur"
            value={borrowerId}
            onChange={(e) => setBorrowerId(e.target.value)}
          />
          <input type="date" className="border rounded-lg px-2 py-2 text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!bookId || !borrowerId || loanMut.isPending}
          onClick={() => loanMut.mutate()}
        >
          Créer l&apos;emprunt
        </Button>
        {booksLoading && <p className="text-xs text-stone-500">Chargement du catalogue…</p>}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-bold text-stone-900 mb-3">Emprunts en cours</h3>
        {loansLoading ? (
          <p className="text-sm text-stone-500">Chargement…</p>
        ) : (loans as { id: string; book?: { title?: string }; borrower?: { firstName?: string; lastName?: string }; dueDate: string; isOverdue?: boolean }[]).length === 0 ? (
          <p className="text-sm text-stone-500">Aucun emprunt actif.</p>
        ) : (
          <ul className="space-y-2">
            {(loans as { id: string; book?: { title?: string }; borrower?: { firstName?: string; lastName?: string }; dueDate: string; isOverdue?: boolean }[]).map((loan) => (
              <li key={loan.id} className="flex flex-wrap items-center justify-between gap-2 border border-stone-100 rounded-lg px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{loan.book?.title ?? 'Ouvrage'}</p>
                  <p className="text-xs text-stone-600">
                    {loan.borrower?.lastName} {loan.borrower?.firstName} — échéance {new Date(loan.dueDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {loan.isOverdue && <Badge variant="warning">En retard</Badge>}
                  <Button type="button" size="sm" variant="outline" disabled={returnMut.isPending} onClick={() => returnMut.mutate(loan.id)}>
                    <FiRotateCcw className="w-3.5 h-3.5 mr-1" />
                    Retour
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
