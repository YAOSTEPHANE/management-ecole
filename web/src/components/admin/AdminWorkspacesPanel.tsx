'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import AdminModuleAccessField from '@/components/admin/AdminModuleAccessField';
import { ADM } from '@/components/admin/adminModuleLayout';
import { ADMIN_MODULE_LABELS, type AdminModuleId } from '@/lib/adminModules';
import toast from 'react-hot-toast';
import { FiEdit2, FiLayers, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  enabledModules: string[];
  isActive: boolean;
  isDefault: boolean;
  _count?: { members: number };
  members?: {
    user: { id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean };
  }[];
};

const emptyForm = {
  name: '',
  description: '',
  enabledModules: [] as AdminModuleId[],
  isDefault: false,
  memberUserIds: [] as string[],
};

export default function AdminWorkspacesPanel() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['admin-workspaces'],
    queryFn: () => adminApi.getAdminWorkspaces(),
  });

  const { data: admins } = useQuery({
    queryKey: ['admin-users-workspaces'],
    queryFn: () => adminApi.getAllUsers({ role: 'ADMIN', isActive: true }),
  });

  const list = (workspaces as WorkspaceRow[] | undefined) ?? [];
  const adminUsers = useMemo(
    () => ((admins as any[]) ?? []).filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'),
    [admins],
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        enabledModules: form.enabledModules,
        isDefault: form.isDefault,
        memberUserIds: form.memberUserIds,
      };
      if (editId) return adminApi.updateAdminWorkspace(editId, payload);
      return adminApi.createAdminWorkspace(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-context'] });
      toast.success(editId ? 'Espace mis à jour' : 'Espace créé');
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deleteMut = useMutation({
    mutationFn: adminApi.deactivateAdminWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-context'] });
      toast.success('Espace désactivé');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: WorkspaceRow) => {
    setEditId(row.id);
    setForm({
      name: row.name,
      description: row.description || '',
      enabledModules: (row.enabledModules || []).filter(Boolean) as AdminModuleId[],
      isDefault: row.isDefault,
      memberUserIds: (row.members || []).map((m) => m.user.id),
    });
    setModalOpen(true);
  };

  const toggleMember = (userId: string) => {
    setForm((f) => {
      const set = new Set(f.memberUserIds);
      if (set.has(userId)) set.delete(userId);
      else set.add(userId);
      return { ...f, memberUserIds: [...set] };
    });
  };

  if (isLoading) {
    return <Card className="p-10 text-center text-gray-500">Chargement des espaces…</Card>;
  }

  return (
    <div className={ADM.root}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className={ADM.h2}>Espaces & modules</h2>
          <p className={ADM.intro}>
            Créez des espaces d&apos;administration (comptabilité, pédagogie, vie scolaire…) et attribuez
            les modules visibles à chaque administrateur membre.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <FiPlus className="w-4 h-4 mr-2" />
          Nouvel espace
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center text-gray-500 border border-dashed border-stone-200">
          <FiLayers className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-700">Aucun espace configuré</p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            Sans espace, tous les administrateurs conservent l&apos;accès complet. Créez un premier espace pour
            segmenter les accès.
          </p>
          <Button type="button" className="mt-4" onClick={openCreate}>
            Créer un espace
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list
            .filter((w) => w.isActive)
            .map((w) => (
              <Card key={w.id} className="p-4 border border-stone-200/90">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{w.name}</h3>
                      {w.isDefault ? <Badge variant="secondary">Par défaut</Badge> : null}
                    </div>
                    {w.description ? (
                      <p className="text-sm text-stone-600 mt-1">{w.description}</p>
                    ) : null}
                    <p className="text-xs text-stone-400 mt-1 font-mono">{w.slug}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                      title="Modifier"
                      onClick={() => openEdit(w)}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Désactiver"
                      onClick={() => {
                        if (confirm(`Désactiver l'espace « ${w.name} » ?`)) deleteMut.mutate(w.id);
                      }}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide w-full mb-0.5">
                    Modules ({w.enabledModules?.length ?? 0})
                  </span>
                  {(w.enabledModules || []).slice(0, 8).map((id) => (
                    <span
                      key={id}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-100"
                    >
                      {ADMIN_MODULE_LABELS[id as AdminModuleId] ?? id}
                    </span>
                  ))}
                  {(w.enabledModules?.length ?? 0) > 8 ? (
                    <span className="text-[10px] text-stone-500">+{(w.enabledModules?.length ?? 0) - 8}</span>
                  ) : null}
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-600 flex items-center gap-1 mb-2">
                    <FiUsers className="w-3.5 h-3.5" />
                    Membres ({w._count?.members ?? w.members?.length ?? 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(w.members || []).map((m) => (
                      <span
                        key={m.user.id}
                        className="text-xs px-2 py-1 rounded-lg bg-stone-100 text-stone-700"
                      >
                        {m.user.firstName} {m.user.lastName}
                      </span>
                    ))}
                    {(w.members?.length ?? 0) === 0 ? (
                      <span className="text-xs text-stone-400">Aucun administrateur assigné</span>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saveMut.isPending && setModalOpen(false)}
        title={editId ? 'Modifier l’espace' : 'Nouvel espace d’administration'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom de l&apos;espace *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex. Comptabilité & frais"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Périmètre de cet espace…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Espace par défaut (suggestion à la création)
          </label>

          <AdminModuleAccessField
            value={form.enabledModules}
            onChange={(enabledModules) => setForm((f) => ({ ...f, enabledModules }))}
          />

          <div className="rounded-xl border border-stone-200 p-3 space-y-2">
            <p className="text-sm font-semibold text-stone-800">Administrateurs membres</p>
            <p className="text-xs text-stone-500">
              Seuls les membres voient les modules cochés ci-dessus (hors super-administrateur).
            </p>
            <div className="grid sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {adminUsers.map((u: any) => (
                <label
                  key={u.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm cursor-pointer ${
                    form.memberUserIds.includes(u.id)
                      ? 'border-indigo-300 bg-indigo-50/50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.memberUserIds.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                  />
                  <span>
                    {u.firstName} {u.lastName}
                    <span className="block text-[10px] text-stone-500">{u.email}</span>
                  </span>
                </label>
              ))}
              {adminUsers.length === 0 ? (
                <p className="text-sm text-stone-500 sm:col-span-2">Aucun compte administrateur actif.</p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!form.name.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
