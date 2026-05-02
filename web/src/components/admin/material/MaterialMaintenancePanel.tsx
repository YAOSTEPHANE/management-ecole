import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUSES = [
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RESOLVED', label: 'Résolu' },
  { value: 'CANCELLED', label: 'Annulé' },
];

const emptyCreate = {
  equipmentId: '',
  roomId: '',
  title: '',
  description: '',
  priority: 'normal',
  reportedById: '',
  assigneeId: '',
};

const MaterialMaintenancePanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [patchForm, setPatchForm] = useState<{
    id: string;
    status: string;
    assigneeId: string | null;
    costEstimate: number | null;
    costActual: number | null;
  } | null>(null);
  const [form, setForm] = useState(emptyCreate);

  const { data: list, isLoading } = useQuery({
    queryKey: ['material-maintenance', statusFilter],
    queryFn: () =>
      adminApi.getMaterialMaintenance({
        ...(statusFilter && { status: statusFilter }),
      }),
  });

  const { data: equipment } = useQuery({
    queryKey: ['material-equipment-maint'],
    queryFn: () => adminApi.getMaterialEquipment({ isActive: 'true' }),
  });

  const { data: rooms } = useQuery({
    queryKey: ['material-rooms-maint'],
    queryFn: () => adminApi.getMaterialRooms({ isActive: 'true' }),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-material'],
    queryFn: () => adminApi.getAllUsers({ isActive: true }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const equipmentId = form.equipmentId || undefined;
      const roomId = form.roomId || undefined;
      if (!equipmentId && !roomId) {
        throw new Error('Choisissez un équipement ou une salle');
      }
      return adminApi.createMaterialMaintenance({
        equipmentId: equipmentId || null,
        roomId: roomId || null,
        title: form.title.trim(),
        description: form.description || null,
        priority: form.priority || 'normal',
        reportedById: form.reportedById || null,
        assigneeId: form.assigneeId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-maintenance'] });
      toast.success('Demande enregistrée');
      setCreateOpen(false);
      setForm(emptyCreate);
    },
    onError: (err: any) =>
      toast.error(err.message || err.response?.data?.error || 'Erreur'),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateMaterialMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-maintenance'] });
      toast.success('Mise à jour effectuée');
      setEditOpen(false);
      setPatchForm(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const rows = (list as any[]) ?? [];
  const eqList = (equipment as any[]) ?? [];
  const roomList = (rooms as any[]) ?? [];
  const userList = (users as any[]) ?? [];

  const statusLabel = (s: string) => STATUSES.find((x) => x.value === s)?.label ?? s;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Statut</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyCreate);
            setCreateOpen(true);
          }}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune demande de maintenance.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold text-gray-700">Titre</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Lieu / équipement</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Assigné</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Ouvert le</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-medium text-gray-900">{m.title}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {m.equipment?.name && <div>Éq. {m.equipment.name}</div>}
                      {m.room?.name && <div>Salle {m.room.name}</div>}
                      {!m.equipment && !m.room && '—'}
                    </td>
                    <td className="py-3 px-4">{statusLabel(m.status)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {m.assignee
                        ? `${m.assignee.firstName} ${m.assignee.lastName}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(m.openedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className="text-indigo-600 text-sm font-medium hover:underline"
                        onClick={() => {
                          setPatchForm({
                            id: m.id,
                            status: m.status,
                            assigneeId: m.assigneeId ?? null,
                            costEstimate: m.costEstimate ?? null,
                            costActual: m.costActual ?? null,
                          });
                          setEditOpen(true);
                        }}
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle maintenance" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Renseignez au moins un équipement ou une salle concernée.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Équipement</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.equipmentId}
                onChange={(e) => setForm((f) => ({ ...f, equipmentId: e.target.value }))}
              >
                <option value="">—</option>
                {eqList.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Salle</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.roomId}
                onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              >
                <option value="">—</option>
                {roomList.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Signaleur</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.reportedById}
                onChange={(e) => setForm((f) => ({ ...f, reportedById: e.target.value }))}
              >
                <option value="">—</option>
                {userList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigné à</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.assigneeId}
                onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
              >
                <option value="">—</option>
                {userList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.title.trim()}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setPatchForm(null);
        }}
        title="Modifier la demande"
        size="lg"
      >
        {patchForm && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={patchForm.status}
                onChange={(e) => setPatchForm((p) => (p ? { ...p, status: e.target.value } : p))}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigné à</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={patchForm.assigneeId || ''}
                onChange={(e) =>
                  setPatchForm((p) => (p ? { ...p, assigneeId: e.target.value || null } : p))
                }
              >
                <option value="">—</option>
                {userList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Coût estimé</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={patchForm.costEstimate ?? ''}
                  onChange={(e) =>
                    setPatchForm((p) =>
                      p
                        ? {
                            ...p,
                            costEstimate: e.target.value === '' ? null : Number(e.target.value),
                          }
                        : p
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Coût réel</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={patchForm.costActual ?? ''}
                  onChange={(e) =>
                    setPatchForm((p) =>
                      p
                        ? {
                            ...p,
                            costActual: e.target.value === '' ? null : Number(e.target.value),
                          }
                        : p
                    )
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditOpen(false);
                  setPatchForm(null);
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() =>
                  patchMutation.mutate({
                    id: patchForm.id,
                    data: {
                      status: patchForm.status,
                      assigneeId: patchForm.assigneeId,
                      costEstimate: patchForm.costEstimate,
                      costActual: patchForm.costActual,
                    },
                  })
                }
                disabled={patchMutation.isPending}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaterialMaintenancePanel;
