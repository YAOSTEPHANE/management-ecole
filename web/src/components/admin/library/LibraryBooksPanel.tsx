import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLibraryManagement } from '@/contexts/LibraryManagementContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import SearchBar from '../../ui/SearchBar';
import Badge from '../../ui/Badge';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const emptyForm = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publicationYear: '' as string | number,
  category: '',
  description: '',
  copiesTotal: 1,
  copiesAvailable: 1,
  shelfLocation: '',
};

const LibraryBooksPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { libraryApi, scope } = useLibraryManagement();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: books, isLoading } = useQuery({
    queryKey: ['library-books', scope, search],
    queryFn: () =>
      libraryApi.getLibraryBooks({
        ...(search.trim() && { search: search.trim() }),
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        isbn: form.isbn || null,
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher || null,
        publicationYear:
          form.publicationYear === '' || form.publicationYear == null
            ? null
            : Number(form.publicationYear),
        category: form.category || null,
        description: form.description || null,
        copiesTotal: Number(form.copiesTotal) || 1,
        copiesAvailable:
          Number(form.copiesAvailable) >= 0
            ? Number(form.copiesAvailable)
            : Number(form.copiesTotal) || 1,
        shelfLocation: form.shelfLocation || null,
      };
      if (editId) {
        return libraryApi.updateLibraryBook(editId, payload);
      }
      return libraryApi.createLibraryBook(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      toast.success(editId ? 'Livre mis à jour' : 'Livre ajouté');
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: libraryApi.deleteLibraryBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      toast.success('Livre retiré du catalogue actif');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || 'Suppression impossible'),
  });

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      isbn: b.isbn || '',
      title: b.title,
      author: b.author,
      publisher: b.publisher || '',
      publicationYear: b.publicationYear ?? '',
      category: b.category || '',
      description: b.description || '',
      copiesTotal: b.copiesTotal,
      copiesAvailable: b.copiesAvailable,
      shelfLocation: b.shelfLocation || '',
    });
    setModalOpen(true);
  };

  const list = (books as any[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Titre, auteur, ISBN…" />
        <Button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm(emptyForm);
            setModalOpen(true);
          }}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Ajouter un livre
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun ouvrage. Ajoutez le premier titre.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold text-gray-700">Titre</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Auteur</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 text-right">Dispo / Total</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Rayon</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b: any) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{b.title}</div>
                      {b.isbn && (
                        <div className="text-xs text-gray-500 font-mono">ISBN {b.isbn}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">{b.author}</td>
                    <td className="py-3 px-4">{b.category || '—'}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <Badge
                        className={
                          b.copiesAvailable === 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }
                      >
                        {b.copiesAvailable} / {b.copiesTotal}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{b.shelfLocation || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(b)}
                          aria-label="Modifier"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200"
                          onClick={() => {
                            if (
                              window.confirm(
                                'Retirer ce livre du catalogue actif ? (emprunts en cours interdits)'
                              )
                            ) {
                              deleteMutation.mutate(b.id);
                            }
                          }}
                          aria-label="Retirer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saveMutation.isPending && (setModalOpen(false), setEditId(null))}
        title={editId ? 'Modifier le livre' : 'Nouveau livre'}
        size="lg"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.author.trim()) {
              toast.error('Titre et auteur requis');
              return;
            }
            saveMutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Titre du livre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auteur *</label>
              <input
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Auteur"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <input
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="ISBN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Catégorie"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Éditeur</label>
              <input
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Éditeur"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
              <input
                type="number"
                value={form.publicationYear}
                onChange={(e) => setForm({ ...form, publicationYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Année de publication"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exemplaires (total)</label>
              <input
                type="number"
                min={1}
                value={form.copiesTotal}
                onChange={(e) =>
                  setForm({ ...form, copiesTotal: Number(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Nombre d’exemplaires total"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disponibles</label>
              <input
                type="number"
                min={0}
                value={form.copiesAvailable}
                onChange={(e) =>
                  setForm({ ...form, copiesAvailable: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Exemplaires disponibles"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rayon / cote</label>
              <input
                value={form.shelfLocation}
                onChange={(e) => setForm({ ...form, shelfLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                aria-label="Rayon ou cote"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibraryBooksPanel;
