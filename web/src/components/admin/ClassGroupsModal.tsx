import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUsers, FiLoader, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

export interface ClassGroupRow {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { students: number };
}

interface ClassGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | null;
  classLabel: string;
  groups: ClassGroupRow[];
}

const ClassGroupsModal: React.FC<ClassGroupsModalProps> = ({
  isOpen,
  onClose,
  classId,
  classLabel,
  groups,
}) => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState('');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['classes'] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      adminApi.createClassGroup(classId!, {
        name: newName.trim(),
        sortOrder: Number(newOrder) || 0,
      }),
    onSuccess: () => {
      toast.success('Groupe créé');
      setNewName('');
      setNewOrder('0');
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name, sortOrder }: { id: string; name: string; sortOrder: number }) =>
      adminApi.updateClassGroup(id, { name, sortOrder }),
    onSuccess: () => {
      toast.success('Groupe mis à jour');
      setEditingId(null);
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteClassGroup(id),
    onSuccess: () => {
      toast.success('Groupe supprimé');
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const startEdit = (g: ClassGroupRow) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditOrder(String(g.sortOrder ?? 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateMut.mutate({
      id: editingId,
      name: editName.trim(),
      sortOrder: Number(editOrder) || 0,
    });
  };

  if (!classId) return null;

  const sorted = [...groups].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Groupes — ${classLabel}`} size="lg" compact>
      <p className="text-xs text-stone-600 mb-3">
        Demi-groupes, TD, TP… Les élèves sont affectés au groupe depuis la fiche élève.
      </p>

      <div className="flex flex-wrap gap-2 items-end mb-4 pb-4 border-b border-stone-200">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Nouveau groupe</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex : Groupe 1, TP B"
            className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg"
          />
        </div>
        <div className="w-20">
          <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Ordre</label>
          <input
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg"
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (!newName.trim()) {
              toast.error('Indiquez un nom');
              return;
            }
            createMut.mutate();
          }}
          disabled={createMut.isPending}
        >
          {createMut.isPending ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <FiPlus className="w-4 h-4 mr-1 inline" />
              Ajouter
            </>
          )}
        </Button>
      </div>

      <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
        {sorted.length === 0 && (
          <li className="text-sm text-stone-500 text-center py-6">Aucun groupe pour cette classe.</li>
        )}
        {sorted.map((g) => (
          <li
            key={g.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-stone-100 bg-stone-50/80"
          >
            {editingId === g.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 text-sm border border-stone-200 rounded"
                />
                <input
                  value={editOrder}
                  onChange={(e) => setEditOrder(e.target.value)}
                  className="w-14 px-2 py-1 text-sm border border-stone-200 rounded"
                />
                <button
                  type="button"
                  onClick={saveEdit}
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                  aria-label="Enregistrer"
                  disabled={updateMut.isPending}
                >
                  <FiCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                  aria-label="Annuler"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{g.name}</p>
                  <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <FiUsers className="w-3 h-3" />
                    {g._count?.students ?? 0} élève(s) · ordre {g.sortOrder ?? 0}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(g)}
                  className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-50"
                  aria-label="Modifier"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Supprimer le groupe « ${g.name} » ? Les élèves seront retirés du groupe.`)) {
                      deleteMut.mutate(g.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                  aria-label="Supprimer"
                  disabled={deleteMut.isPending}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex justify-end pt-3 mt-2 border-t border-stone-200">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
};

export default ClassGroupsModal;
