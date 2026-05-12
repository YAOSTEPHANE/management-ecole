import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TARGET_TYPES = [
  { value: 'USER', label: 'Utilisateur' },
  { value: 'CLASS', label: 'Classe' },
  { value: 'ROOM', label: 'Salle' },
];

const A_STATUSES = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'RETURNED', label: 'Retourné' },
  { value: 'CANCELLED', label: 'Annulé' },
];

function resolveTargetName(
  targetType: string,
  targetId: string,
  users: any[],
  classes: any[],
  rooms: any[]
): string {
  if (targetType === 'USER') {
    const u = users.find((x) => x.id === targetId);
    return u ? `${u.firstName} ${u.lastName}` : targetId;
  }
  if (targetType === 'CLASS') {
    const c = classes.find((x) => x.id === targetId);
    return c ? c.name : targetId;
  }
  if (targetType === 'ROOM') {
    const r = rooms.find((x) => x.id === targetId);
    return r ? r.name : targetId;
  }
  return targetId;
}

const MaterialAllocationsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    equipmentId: '',
    targetType: 'USER' as 'USER' | 'CLASS' | 'ROOM',
    targetId: '',
    quantity: 1,
    purpose: '',
    notes: '',
  });

  const { data: allocations, isLoading } = useQuery({
    queryKey: ['material-allocations', statusFilter],
    queryFn: () =>
      adminApi.getMaterialAllocations({
        ...(statusFilter && { status: statusFilter }),
      }),
  });

  const { data: equipment } = useQuery({
    queryKey: ['material-equipment-alloc'],
    queryFn: () => adminApi.getMaterialEquipment({ isActive: 'true' }),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-alloc'],
    queryFn: () => adminApi.getAllUsers({ isActive: true }),
  });

  const { data: classes } = useQuery({
    queryKey: ['admin-classes-alloc'],
    queryFn: () => adminApi.getClasses(),
  });

  const { data: rooms } = useQuery({
    queryKey: ['material-rooms-alloc'],
    queryFn: () => adminApi.getMaterialRooms({ isActive: 'true' }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createMaterialAllocation({
        equipmentId: form.equipmentId,
        targetType: form.targetType,
        targetId: form.targetId,
        quantity: form.quantity,
        purpose: form.purpose || null,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-allocations'] });
      toast.success('Prêt enregistré');
      setModalOpen(false);
      setForm({
        equipmentId: '',
        targetType: 'USER',
        targetId: '',
        quantity: 1,
        purpose: '',
        notes: '',
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateMaterialAllocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-allocations'] });
      toast.success('Mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const rows = (allocations as any[]) ?? [];
  const eqList = (equipment as any[]) ?? [];
  const userList = (users as any[]) ?? [];
  const classList = (classes as any[]) ?? [];
  const roomList = (rooms as any[]) ?? [];

  const targetOptions = useMemo(() => {
    if (form.targetType === 'USER') {
      return userList.map((u: any) => ({
        id: u.id,
        label: `${u.firstName} ${u.lastName}`,
      }));
    }
    if (form.targetType === 'CLASS') {
      return classList.map((c: any) => ({ id: c.id, label: c.name }));
    }
    return roomList.map((r: any) => ({ id: r.id, label: r.name }));
  }, [form.targetType, userList, classList, roomList]);

  const statusLabel = (s: string) => A_STATUSES.find((x) => x.value === s)?.label ?? s;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed">
        Prêt de matériel pédagogique ou d’équipement : attribution à un utilisateur, une classe ou une salle, avec suivi
        des retours.
      </p>
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Statut</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous</option>
            {A_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm({
              equipmentId: '',
              targetType: 'USER',
              targetId: '',
              quantity: 1,
              purpose: '',
              notes: '',
            });
            setModalOpen(true);
          }}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Nouveau prêt
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun prêt enregistré.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold text-gray-700">Équipement</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Cible</th>
                  <th className="py-3 px-4 font-semibold text-gray-700 text-right">Qté</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Depuis</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{a.equipment?.name}</div>
                      <div className="text-xs text-gray-500">{a.equipment?.category}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="text-xs text-gray-500">
                        {TARGET_TYPES.find((t) => t.value === a.targetType)?.label}
                      </div>
                      {resolveTargetName(a.targetType, a.targetId, userList, classList, roomList)}
                    </td>
                    <td className="py-3 px-4 text-right">{a.quantity}</td>
                    <td className="py-3 px-4">{statusLabel(a.status)}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(a.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      {a.status === 'ACTIVE' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-sm text-emerald-700 font-medium hover:underline"
                            onClick={() =>
                              patchMutation.mutate({
                                id: a.id,
                                data: { status: 'RETURNED' },
                              })
                            }
                          >
                            Retour
                          </button>
                          <button
                            type="button"
                            className="text-sm text-gray-600 font-medium hover:underline"
                            onClick={() =>
                              patchMutation.mutate({
                                id: a.id,
                                data: { status: 'CANCELLED' },
                              })
                            }
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau prêt de matériel" size="lg">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Équipement *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.equipmentId}
              onChange={(e) => setForm((f) => ({ ...f, equipmentId: e.target.value }))}
            >
              <option value="">— Choisir —</option>
              {eqList.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name} (stock {e.quantity})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de cible</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.targetType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targetType: e.target.value as typeof f.targetType,
                    targetId: '',
                  }))
                }
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cible *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.targetId}
                onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
              >
                <option value="">—</option>
                {targetOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantité</label>
            <input
              type="number"
              min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Objet / usage</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Fermer
            </Button>
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending || !form.equipmentId || !form.targetId
              }
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialAllocationsPanel;
