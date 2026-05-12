import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function weekBounds() {
  const now = new Date();
  const start = new Date(now);
  const dow = start.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { from: start.toISOString(), to: end.toISOString() };
}

const MaterialRoomReservationsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { from, to } = useMemo(() => weekBounds(), []);
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    roomId: '',
    title: '',
    startLocal: '',
    endLocal: '',
    status: 'CONFIRMED' as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
    requesterName: '',
    notes: '',
  });

  const { data: rooms } = useQuery({
    queryKey: ['material-rooms-resv'],
    queryFn: () => adminApi.getMaterialRooms({ isActive: 'true' }),
  });

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['material-room-reservations', from, to, roomFilter],
    queryFn: () =>
      adminApi.getMaterialRoomReservations({
        from,
        to,
        ...(roomFilter && { roomId: roomFilter }),
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const startAt = new Date(form.startLocal);
      const endAt = new Date(form.endLocal);
      if (!form.roomId) throw new Error('Choisissez une salle');
      if (!form.title.trim()) throw new Error('Titre requis');
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) throw new Error('Dates invalides');
      const payload = {
        roomId: form.roomId,
        title: form.title.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        status: form.status,
        requesterName: form.requesterName.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editId) return adminApi.updateMaterialRoomReservation(editId, payload);
      return adminApi.createMaterialRoomReservation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-room-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['material-rooms'] });
      toast.success(editId ? 'Réservation mise à jour' : 'Réservation créée');
      setModalOpen(false);
      setEditId(null);
      setForm({
        roomId: '',
        title: '',
        startLocal: '',
        endLocal: '',
        status: 'CONFIRMED',
        requesterName: '',
        notes: '',
      });
    },
    onError: (err: any) => toast.error(err?.message || err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteMaterialRoomReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-room-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['material-rooms'] });
      toast.success('Réservation supprimée');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const roomList = (rooms as any[]) ?? [];
  const list = (reservations as any[]) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Réservations ponctuelles (réunions, examens, événements). Les conflits sur créneaux confirmés ou en attente sont
        bloqués automatiquement.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-sm text-gray-700 flex items-center gap-2">
          <span className="whitespace-nowrap">Salle</span>
          <select
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm min-w-[200px]"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            {roomList.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.code ? ` (${r.code})` : ''}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={() => {
            setEditId(null);
            const d = new Date();
            const end = new Date(d.getTime() + 60 * 60 * 1000);
            setForm({
              roomId: roomFilter || (roomList[0]?.id ?? ''),
              title: '',
              startLocal: toLocalInput(d.toISOString()),
              endLocal: toLocalInput(end.toISOString()),
              status: 'CONFIRMED',
              requesterName: '',
              notes: '',
            });
            setModalOpen(true);
          }}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Nouvelle réservation
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune réservation sur la semaine en cours.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold text-gray-700">Début — fin</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Salle</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Titre</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Demandeur</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row: any) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="py-3 px-4 text-gray-800 whitespace-nowrap">
                      {new Date(row.startAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      <span className="text-gray-400"> → </span>
                      {new Date(row.endAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{row.room?.name ?? '—'}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{row.title}</td>
                    <td className="py-3 px-4 text-gray-600">{row.status}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {row.requesterUser
                        ? `${row.requesterUser.firstName} ${row.requesterUser.lastName}`
                        : row.requesterName || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                          onClick={() => {
                            setEditId(row.id);
                            setForm({
                              roomId: row.roomId,
                              title: row.title,
                              startLocal: toLocalInput(row.startAt),
                              endLocal: toLocalInput(row.endAt),
                              status: row.status,
                              requesterName: row.requesterName || '',
                              notes: row.notes || '',
                            });
                            setModalOpen(true);
                          }}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          onClick={() => {
                            if (confirm('Supprimer cette réservation ?')) deleteMutation.mutate(row.id);
                          }}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
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
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        title={editId ? 'Modifier la réservation' : 'Nouvelle réservation'}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Salle *</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Début *</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.startLocal}
                onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fin *</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.endLocal}
                onChange={(e) => setForm((f) => ({ ...f, endLocal: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))
              }
            >
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Demandeur (texte libre)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.requesterName}
              onChange={(e) => setForm((f) => ({ ...f, requesterName: e.target.value }))}
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
              Annuler
            </Button>
            <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialRoomReservationsPanel;
