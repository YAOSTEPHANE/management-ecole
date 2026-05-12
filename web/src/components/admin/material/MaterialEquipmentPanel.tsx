import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import SearchBar from '../../ui/SearchBar';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  MATERIAL_EQUIPMENT_PRESET_CATEGORIES,
  isPresetMaterialEquipmentCategory,
} from './materialEquipmentPresetCategories';

const CONDITIONS = [
  { value: 'GOOD', label: 'Bon' },
  { value: 'FAIR', label: 'Correct' },
  { value: 'NEEDS_REPAIR', label: 'À réparer' },
  { value: 'OUT_OF_SERVICE', label: 'Hors service' },
];

const CUSTOM_CATEGORY = '__CUSTOM__';

type EquipmentFormState = {
  roomId: string;
  name: string;
  categorySelect: string;
  categoryCustom: string;
  serialNumber: string;
  quantity: number;
  condition: string;
  notes: string;
  purchasedAt: string;
  isActive: boolean;
};

const emptyForm: EquipmentFormState = {
  roomId: '',
  name: '',
  categorySelect: MATERIAL_EQUIPMENT_PRESET_CATEGORIES[0].value,
  categoryCustom: '',
  serialNumber: '',
  quantity: 1,
  condition: 'GOOD',
  notes: '',
  purchasedAt: '',
  isActive: true,
};

function resolvedCategory(form: EquipmentFormState): string {
  if (form.categorySelect === CUSTOM_CATEGORY) {
    return form.categoryCustom.trim();
  }
  return String(form.categorySelect).trim();
}

const MaterialEquipmentPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['material-equipment', search, categoryFilter],
    queryFn: async () => {
      const params: { search?: string; category?: string } = {
        ...(search.trim() && { search: search.trim() }),
      };
      if (categoryFilter !== 'all' && categoryFilter !== '__OTHER__') {
        params.category = categoryFilter;
      }
      const rows = await adminApi.getMaterialEquipment(params);
      if (categoryFilter === '__OTHER__') {
        return (rows as any[]).filter((e) => !isPresetMaterialEquipmentCategory(e.category || ''));
      }
      return rows;
    },
  });

  const { data: countSnapshot } = useQuery({
    queryKey: ['material-equipment', '_counts'],
    queryFn: () => adminApi.getMaterialEquipment({}),
    staleTime: 30_000,
  });

  const { data: rooms } = useQuery({
    queryKey: ['material-rooms-select'],
    queryFn: () => adminApi.getMaterialRooms({ isActive: 'true' }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const category = resolvedCategory(form);
      if (!category) {
        throw new Error('Choisissez une catégorie ou saisissez une catégorie personnalisée');
      }
      const payload = {
        roomId: form.roomId || null,
        name: form.name.trim(),
        category,
        serialNumber: form.serialNumber || null,
        quantity: Number(form.quantity) || 1,
        condition: form.condition,
        notes: form.notes || null,
        purchasedAt: form.purchasedAt || null,
        isActive: form.isActive,
      };
      if (editId) {
        return adminApi.updateMaterialEquipment(editId, payload);
      }
      return adminApi.createMaterialEquipment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['material-allocations'] });
      toast.success(editId ? 'Équipement mis à jour' : 'Équipement ajouté');
      setModalOpen(false);
      setEditId(null);
      setForm({ ...emptyForm });
    },
    onError: (err: any) =>
      toast.error(err?.message || err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteMaterialEquipment,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['material-equipment'] });
      toast.success(data?.deactivated ? 'Équipement désactivé (prêts actifs)' : 'Équipement supprimé');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Suppression impossible'),
  });

  const list = (equipment as any[]) ?? [];
  const roomList = (rooms as any[]) ?? [];

  const condLabel = (c: string) => CONDITIONS.find((x) => x.value === c)?.label ?? c;

  const countsByPreset = useMemo(() => {
    const src = (countSnapshot as any[]) ?? [];
    const map: Record<string, number> = {};
    for (const p of MATERIAL_EQUIPMENT_PRESET_CATEGORIES) {
      map[p.value] = src.filter((e) => e.category === p.value).length;
    }
    return map;
  }, [countSnapshot]);

  const otherCount = useMemo(() => {
    const src = (countSnapshot as any[]) ?? [];
    return src.filter((e) => !isPresetMaterialEquipmentCategory(e.category || '')).length;
  }, [countSnapshot]);

  const totalInventory = (countSnapshot as any[])?.length ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed">
        Inventaire du matériel pédagogique, informatique, sportif et de laboratoire. Chaque article est classé par
        famille ; les prêts et la maintenance se gèrent dans les onglets dédiés.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            categoryFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200'
          }`}
        >
          Toutes ({totalInventory})
        </button>
        {MATERIAL_EQUIPMENT_PRESET_CATEGORIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setCategoryFilter(p.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              categoryFilter === p.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200'
            }`}
          >
            {p.label} ({countsByPreset[p.value] ?? 0})
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCategoryFilter('__OTHER__')}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            categoryFilter === '__OTHER__'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200'
          }`}
        >
          Autre catégorie ({otherCount})
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Nom, n° de série…" />
        <Button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm({ ...emptyForm });
            setModalOpen(true);
          }}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Ajouter un équipement
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun équipement. Créez le premier article.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4 font-semibold text-gray-700">Nom</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Stock</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">État</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Salle (stock)</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e: any) => (
                  <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{e.name}</div>
                      {e.serialNumber && (
                        <div className="text-xs text-gray-500 font-mono">{e.serialNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">{e.category}</td>
                    <td className="py-3 px-4 text-right">{e.quantity}</td>
                    <td className="py-3 px-4">{condLabel(e.condition)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {e.room?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                          onClick={() => {
                            setEditId(e.id);
                            const cat = e.category || '';
                            const isPreset = isPresetMaterialEquipmentCategory(cat);
                            setForm({
                              roomId: e.roomId || '',
                              name: e.name,
                              categorySelect: isPreset ? cat : CUSTOM_CATEGORY,
                              categoryCustom: isPreset ? '' : cat,
                              serialNumber: e.serialNumber || '',
                              quantity: e.quantity,
                              condition: e.condition,
                              notes: e.notes || '',
                              purchasedAt: e.purchasedAt
                                ? new Date(e.purchasedAt).toISOString().slice(0, 10)
                                : '',
                              isActive: e.isActive,
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
                            if (confirm('Supprimer ou désactiver cet équipement ?')) {
                              deleteMutation.mutate(e.id);
                            }
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
          setForm({ ...emptyForm });
        }}
        title={editId ? 'Modifier l’équipement' : 'Nouvel équipement'}
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Famille d’inventaire *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.categorySelect}
              onChange={(e) => setForm((f) => ({ ...f, categorySelect: e.target.value }))}
            >
              {MATERIAL_EQUIPMENT_PRESET_CATEGORIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY}>Autre (saisie libre)…</option>
            </select>
          </div>
          {form.categorySelect === CUSTOM_CATEGORY && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie personnalisée *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.categoryCustom}
                onChange={(e) => setForm((f) => ({ ...f, categoryCustom: e.target.value }))}
                placeholder="Ex. Mobilier, restauration…"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantité (stock)</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">État</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Salle de stockage</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            >
              <option value="">— Aucune —</option>
              {roomList.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.code ? ` (${r.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">N° de série</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.serialNumber}
              onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date d’achat</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.purchasedAt}
              onChange={(e) => setForm((f) => ({ ...f, purchasedAt: e.target.value }))}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Actif
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditId(null);
                setForm({ ...emptyForm });
              }}
            >
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

export default MaterialEquipmentPanel;
