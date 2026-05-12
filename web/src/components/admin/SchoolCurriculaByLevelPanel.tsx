import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import SearchBar from '../ui/SearchBar';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import {
  FiBookOpen,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiX,
  FiClock,
  FiLayers,
} from 'react-icons/fi';

const LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'] as const;

function defaultAcademicYear(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

type SchoolCurriculaByLevelPanelProps = {
  compact?: boolean;
};

const SchoolCurriculaByLevelPanel: React.FC<SchoolCurriculaByLevelPanelProps> = ({
  compact = false,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    level: '6ème',
    academicYear: defaultAcademicYear(),
    label: '',
    trackId: '' as string,
  });

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    weeklyHours: '',
    gradingCoefficient: '',
    sortOrder: '0',
  });

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    name: '',
    code: '',
    weeklyHours: '',
    gradingCoefficient: '',
    sortOrder: '0',
  });

  const [metaEdit, setMetaEdit] = useState(false);
  const [metaForm, setMetaForm] = useState({ label: '', notes: '', trackId: '' as string });

  const { data: curricula, isLoading } = useQuery({
    queryKey: ['school-curricula'],
    queryFn: () => adminApi.getSchoolCurricula(),
  });

  const { data: schoolTracks } = useQuery({
    queryKey: ['school-tracks'],
    queryFn: () => adminApi.getSchoolTracks(),
  });

  const { data: selectedDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['school-curriculum', selectedId],
    queryFn: () => adminApi.getSchoolCurriculumById(selectedId!),
    enabled: !!selectedId,
  });

  const filtered = useMemo(() => {
    if (!curricula) return [];
    const term = search.toLowerCase().trim();
    const yf = yearFilter.trim();
    return (curricula as any[]).filter((c) => {
      if (yf && c.academicYear !== yf) return false;
      if (!term) return true;
      return (
        (c.level || '').toLowerCase().includes(term) ||
        (c.academicYear || '').toLowerCase().includes(term) ||
        (c.label || '').toLowerCase().includes(term) ||
        (c.track?.name || '').toLowerCase().includes(term) ||
        (c.track?.code || '').toLowerCase().includes(term)
      );
    });
  }, [curricula, search, yearFilter]);

  const createCurriculum = useMutation({
    mutationFn: () =>
      adminApi.createSchoolCurriculum({
        level: createForm.level,
        academicYear: createForm.academicYear.trim(),
        label: createForm.label.trim() || null,
        trackId: createForm.trackId.trim() ? createForm.trackId.trim() : null,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
      setCreateOpen(false);
      setSelectedId(data.id);
      toast.success('Programme créé');
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error;
      if (e.response?.status === 409 && e.response?.data?.id) {
        toast.error(msg || 'Programme déjà existant');
        setSelectedId(e.response.data.id);
        setCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
        return;
      }
      toast.error(msg || 'Erreur');
    },
  });

  const deleteCurriculum = useMutation({
    mutationFn: (id: string) => adminApi.deleteSchoolCurriculum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
      queryClient.invalidateQueries({ queryKey: ['school-curriculum'] });
      setSelectedId(null);
      toast.success('Programme supprimé');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const patchCurriculum = useMutation({
    mutationFn: () =>
      adminApi.updateSchoolCurriculum(selectedId!, {
        label: metaForm.label.trim() || null,
        notes: metaForm.notes.trim() || null,
        trackId: metaForm.trackId.trim() ? metaForm.trackId.trim() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
      queryClient.invalidateQueries({ queryKey: ['school-curriculum', selectedId] });
      setMetaEdit(false);
      toast.success('Enregistré');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const addSubject = useMutation({
    mutationFn: () =>
      adminApi.createSchoolCurriculumSubject(selectedId!, {
        name: newSubject.name.trim(),
        code: newSubject.code.trim(),
        weeklyHours:
          newSubject.weeklyHours.trim() === '' ? null : Number(newSubject.weeklyHours),
        gradingCoefficient:
          newSubject.gradingCoefficient.trim() === ''
            ? null
            : Number(newSubject.gradingCoefficient),
        sortOrder: Number(newSubject.sortOrder) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-curriculum', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
      setNewSubject({ name: '', code: '', weeklyHours: '', gradingCoefficient: '', sortOrder: '0' });
      toast.success('Matière ajoutée au programme');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const saveSubject = useMutation({
    mutationFn: () =>
      adminApi.updateSchoolCurriculumSubject(editingSubjectId!, {
        name: editSubjectForm.name.trim(),
        code: editSubjectForm.code.trim(),
        weeklyHours:
          editSubjectForm.weeklyHours.trim() === '' ? null : Number(editSubjectForm.weeklyHours),
        gradingCoefficient:
          editSubjectForm.gradingCoefficient.trim() === ''
            ? null
            : Number(editSubjectForm.gradingCoefficient),
        sortOrder: Number(editSubjectForm.sortOrder) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-curriculum', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
      setEditingSubjectId(null);
      toast.success('Matière mise à jour');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const removeSubject = useMutation({
    mutationFn: (id: string) => adminApi.deleteSchoolCurriculumSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-curriculum', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['school-curricula'] });
      toast.success('Matière retirée');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const openMetaEdit = () => {
    if (!selectedDetail) return;
    setMetaForm({
      label: (selectedDetail as any).label || '',
      notes: (selectedDetail as any).notes || '',
      trackId: (selectedDetail as any).track?.id || '',
    });
    setMetaEdit(true);
  };

  const startEditSubject = (s: any) => {
    setEditingSubjectId(s.id);
    setEditSubjectForm({
      name: s.name || '',
      code: s.code || '',
      weeklyHours: s.weeklyHours != null ? String(s.weeklyHours) : '',
      gradingCoefficient:
        s.gradingCoefficient != null ? String(s.gradingCoefficient) : '',
      sortOrder: String(s.sortOrder ?? 0),
    });
  };

  const distinctYears = useMemo(() => {
    if (!curricula) return [];
    const ys = new Set((curricula as any[]).map((c) => c.academicYear).filter(Boolean));
    return Array.from(ys).sort().reverse();
  }, [curricula]);

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
      <div>
        <h3 className={compact ? 'text-base font-semibold text-gray-900' : 'text-lg font-semibold text-gray-900'}>
          Programmes par niveau
        </h3>
        <p className={compact ? 'text-xs text-gray-500 mt-1' : 'text-sm text-gray-500 mt-1'}>
          Référentiel officiel : matières, volumes horaires et{' '}
          <strong>coefficients indicatifs</strong> par niveau, année et éventuellement{' '}
          <strong>filière</strong> (sinon tronc commun). Indépendant des matières ouvertes dans chaque
          classe.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="lg:w-[340px] shrink-0 p-3 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <FiLayers className="w-3.5 h-3.5" />
              Programmes
            </span>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <FiPlus className="w-4 h-4 mr-1 inline" />
              Nouveau
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrer par année scolaire"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Toutes les années</option>
              {distinctYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <SearchBar
            compact={compact}
            value={search}
            onChange={setSearch}
            placeholder="Niveau, année, filière, libellé…"
          />
          <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
            {isLoading && (
              <p className="text-xs text-gray-500 py-6 text-center">Chargement…</p>
            )}
            {!isLoading && filtered.length === 0 && (
              <p className="text-xs text-gray-500 py-6 text-center">Aucun programme</p>
            )}
            {filtered.map((c: any) => {
              const active = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left rounded-lg border px-2.5 py-2 transition-colors ${
                    active
                      ? 'border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{c.level}</span>
                    <Badge size="sm" variant="default">
                      {c._count?.subjects ?? 0} mat.
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-1">
                    <span>{c.academicYear}</span>
                    {c.track ? (
                      <Badge size="sm" variant="default" className="bg-violet-50 text-violet-800">
                        {c.track.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Tronc commun</span>
                    )}
                  </p>
                  {c.label && (
                    <p className="text-[11px] text-indigo-700 mt-0.5 truncate">{c.label}</p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex-1 min-w-0 p-3 border border-gray-200">
          {!selectedId && (
            <div className="py-16 text-center text-gray-500 text-sm">
              <FiBookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              Sélectionnez un programme ou créez-en un pour ce niveau.
            </div>
          )}
          {selectedId && loadingDetail && (
            <p className="text-sm text-gray-500 py-12 text-center">Chargement du détail…</p>
          )}
          {selectedId && selectedDetail && !loadingDetail && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                    {(selectedDetail as any).level}
                    <Badge size="sm">{(selectedDetail as any).academicYear}</Badge>
                    {(selectedDetail as any).track ? (
                      <Badge size="sm" className="bg-violet-50 text-violet-800 border border-violet-100">
                        {(selectedDetail as any).track.name}
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="default">
                        Tronc commun
                      </Badge>
                    )}
                  </h4>
                  {(selectedDetail as any).label && (
                    <p className="text-sm text-indigo-800 mt-1">{(selectedDetail as any).label}</p>
                  )}
                  {(selectedDetail as any).notes && !metaEdit && (
                    <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                      {(selectedDetail as any).notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={openMetaEdit}>
                    <FiEdit2 className="w-3.5 h-3.5 mr-1 inline" />
                    Libellé & notes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (
                        confirm(
                          'Supprimer ce programme et toutes ses matières de référence ? (Les cours en classe ne sont pas supprimés.)'
                        )
                      ) {
                        deleteCurriculum.mutate(selectedId);
                      }
                    }}
                  >
                    <FiTrash2 className="w-3.5 h-3.5 mr-1 inline" />
                    Supprimer
                  </Button>
                </div>
              </div>

              {metaEdit && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Libellé</label>
                  <input
                    value={metaForm.label}
                    onChange={(e) => setMetaForm((m) => ({ ...m, label: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                    placeholder="Ex : Cycle 4 — conformité BO"
                  />
                  <label className="block text-xs font-medium text-gray-700">Notes</label>
                  <textarea
                    value={metaForm.notes}
                    onChange={(e) => setMetaForm((m) => ({ ...m, notes: e.target.value }))}
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                    placeholder="Références officielles, précisions pédagogiques…"
                  />
                  <label className="block text-xs font-medium text-gray-700">Filière</label>
                  <select
                    value={metaForm.trackId}
                    onChange={(e) => setMetaForm((m) => ({ ...m, trackId: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                  >
                    <option value="">Tronc commun (aucune filière)</option>
                    {(schoolTracks as any[])?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-800">
                    Changer la filière est refusé si un autre programme existe déjà pour le même niveau,
                    la même année et la filière cible.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setMetaEdit(false)}>
                      Annuler
                    </Button>
                    <Button type="button" size="sm" onClick={() => patchCurriculum.mutate()} disabled={patchCurriculum.isPending}>
                      <FiSave className="w-3.5 h-3.5 mr-1 inline" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Matières du programme
                </p>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Ordre</th>
                        <th className="px-2 py-2">Matière</th>
                        <th className="px-2 py-2">Code</th>
                        <th className="px-2 py-2">
                          <span className="inline-flex items-center gap-0.5">
                            <FiClock className="w-3 h-3" /> h/sem.
                          </span>
                        </th>
                        <th className="px-2 py-2">Coef.</th>
                        <th className="px-2 py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!(selectedDetail as any).subjects ||
                        (selectedDetail as any).subjects.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-2 py-6 text-center text-gray-500 text-xs">
                            Aucune matière. Ajoutez-les ci-dessous.
                          </td>
                        </tr>
                      )}
                      {((selectedDetail as any).subjects || []).map((s: any) =>
                        editingSubjectId === s.id ? (
                          <tr key={s.id} className="border-t border-gray-100 bg-amber-50/30">
                            <td className="px-2 py-1.5">
                              <input
                                aria-label="Ordre d’affichage"
                                className="w-12 text-xs border rounded px-1 py-0.5"
                                value={editSubjectForm.sortOrder}
                                onChange={(e) =>
                                  setEditSubjectForm((f) => ({ ...f, sortOrder: e.target.value }))
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                aria-label="Nom de la matière"
                                className="w-full text-xs border rounded px-1 py-0.5"
                                value={editSubjectForm.name}
                                onChange={(e) =>
                                  setEditSubjectForm((f) => ({ ...f, name: e.target.value }))
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                aria-label="Code matière"
                                className="w-full text-xs border rounded px-1 py-0.5 font-mono"
                                value={editSubjectForm.code}
                                onChange={(e) =>
                                  setEditSubjectForm((f) => ({ ...f, code: e.target.value }))
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                aria-label="Heures par semaine"
                                className="w-14 text-xs border rounded px-1 py-0.5"
                                value={editSubjectForm.weeklyHours}
                                onChange={(e) =>
                                  setEditSubjectForm((f) => ({ ...f, weeklyHours: e.target.value }))
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                aria-label="Coefficient"
                                className="w-12 text-xs border rounded px-1 py-0.5"
                                value={editSubjectForm.gradingCoefficient}
                                onChange={(e) =>
                                  setEditSubjectForm((f) => ({
                                    ...f,
                                    gradingCoefficient: e.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-1 justify-end">
                                <button
                                  type="button"
                                  title="Enregistrer la matière"
                                  aria-label="Enregistrer la matière"
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => saveSubject.mutate()}
                                  disabled={saveSubject.isPending}
                                >
                                  <FiSave className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Annuler la modification"
                                  aria-label="Annuler la modification"
                                  className="p-1 rounded text-gray-600 hover:bg-gray-100"
                                  onClick={() => setEditingSubjectId(null)}
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={s.id} className="border-t border-gray-100">
                            <td className="px-2 py-2 text-gray-600 tabular-nums">{s.sortOrder}</td>
                            <td className="px-2 py-2 font-medium text-gray-900">{s.name}</td>
                            <td className="px-2 py-2 font-mono text-xs text-gray-600">{s.code}</td>
                            <td className="px-2 py-2 text-gray-700 tabular-nums">
                              {s.weeklyHours != null ? s.weeklyHours : '—'}
                            </td>
                            <td className="px-2 py-2 text-gray-700 tabular-nums">
                              {s.gradingCoefficient != null ? s.gradingCoefficient : '—'}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  title={`Modifier ${s.name}`}
                                  aria-label={`Modifier ${s.name}`}
                                  className="p-1 rounded text-amber-800 hover:bg-amber-50"
                                  onClick={() => startEditSubject(s)}
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title={`Retirer ${s.name}`}
                                  aria-label={`Retirer ${s.name}`}
                                  className="p-1 rounded text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm(`Retirer « ${s.name} » du programme ?`)) {
                                      removeSubject.mutate(s.id);
                                    }
                                  }}
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-1">
                    <label htmlFor="new-subject-order" className="text-[10px] font-medium text-gray-500">
                      Ordre
                    </label>
                    <input
                      id="new-subject-order"
                      value={newSubject.sortOrder}
                      onChange={(e) => setNewSubject((n) => ({ ...n, sortOrder: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="new-subject-name" className="text-[10px] font-medium text-gray-500">
                      Matière
                    </label>
                    <input
                      id="new-subject-name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject((n) => ({ ...n, name: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                      placeholder="Français"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="new-subject-code" className="text-[10px] font-medium text-gray-500">
                      Code
                    </label>
                    <input
                      id="new-subject-code"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject((n) => ({ ...n, code: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 font-mono"
                      placeholder="FR"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="new-subject-hours" className="text-[10px] font-medium text-gray-500">
                      H/sem.
                    </label>
                    <input
                      id="new-subject-hours"
                      value={newSubject.weeklyHours}
                      onChange={(e) => setNewSubject((n) => ({ ...n, weeklyHours: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                      placeholder="4.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="new-subject-coef" className="text-[10px] font-medium text-gray-500">
                      Coef.
                    </label>
                    <input
                      id="new-subject-coef"
                      value={newSubject.gradingCoefficient}
                      onChange={(e) =>
                        setNewSubject((n) => ({ ...n, gradingCoefficient: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                      placeholder="2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (!newSubject.name.trim() || !newSubject.code.trim()) {
                          toast.error('Nom et code requis');
                          return;
                        }
                        addSubject.mutate();
                      }}
                      disabled={addSubject.isPending}
                    >
                      <FiPlus className="w-4 h-4 mr-1 inline" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouveau programme par niveau"
        size="md"
        compact
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs text-gray-600">
            Un référentiel par triple <strong>niveau</strong> + <strong>année</strong> +{' '}
            <strong>filière</strong> (ou tronc commun si aucune filière n’est choisie).
          </p>
          <div>
            <label htmlFor="create-curriculum-level" className="block text-xs font-semibold text-gray-700 mb-1">
              Niveau
            </label>
            <select
              id="create-curriculum-level"
              value={createForm.level}
              onChange={(e) => setCreateForm((f) => ({ ...f, level: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="create-curriculum-year" className="block text-xs font-semibold text-gray-700 mb-1">
              Année scolaire
            </label>
            <input
              id="create-curriculum-year"
              value={createForm.academicYear}
              onChange={(e) => setCreateForm((f) => ({ ...f, academicYear: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
              placeholder="2025-2026"
            />
          </div>
          <div>
            <label htmlFor="create-curriculum-label" className="block text-xs font-semibold text-gray-700 mb-1">
              Libellé <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              id="create-curriculum-label"
              value={createForm.label}
              onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
              placeholder="Ex : Programme 6ème 2025-2026"
            />
          </div>
          <div>
            <label htmlFor="create-curriculum-track" className="block text-xs font-semibold text-gray-700 mb-1">
              Filière <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <select
              id="create-curriculum-track"
              value={createForm.trackId}
              onChange={(e) => setCreateForm((f) => ({ ...f, trackId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
            >
              <option value="">Tronc commun</option>
              {(schoolTracks as any[])?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => createCurriculum.mutate()}
              disabled={createCurriculum.isPending || !createForm.academicYear.trim()}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SchoolCurriculaByLevelPanel;
