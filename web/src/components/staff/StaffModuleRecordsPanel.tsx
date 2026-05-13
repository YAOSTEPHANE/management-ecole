'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { staffApi } from '@/services/api/staff.api';
import type { StaffModuleId } from '@/lib/staffModules';
import { FiPlus } from 'react-icons/fi';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminé',
  CANCELLED: 'Annulé',
};

type Props = {
  moduleKey: Extract<StaffModuleId, 'health_log' | 'it_requests' | 'maintenance_requests'>;
  title: string;
  newLabel: string;
  withStudent?: boolean;
};

export default function StaffModuleRecordsPanel({ moduleKey, title, newLabel, withStudent }: Props) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [details, setDetails] = useState('');
  const [studentQ, setStudentQ] = useState('');
  const [studentId, setStudentId] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['staff-module-records', moduleKey],
    queryFn: () => staffApi.listModuleRecords(moduleKey),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['staff-students-search', studentQ],
    queryFn: () => staffApi.searchStudents(studentQ),
    enabled: withStudent && studentQ.trim().length >= 2,
  });

  const createMut = useMutation({
    mutationFn: () =>
      staffApi.createModuleRecord({
        moduleKey,
        title: recordTitle.trim(),
        studentId: studentId || undefined,
        payload: details.trim() ? { notes: details.trim() } : undefined,
      }),
    onSuccess: () => {
      toast.success('Enregistrement créé');
      setFormOpen(false);
      setRecordTitle('');
      setDetails('');
      setStudentId('');
      setStudentQ('');
      qc.invalidateQueries({ queryKey: ['staff-module-records', moduleKey] });
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Erreur');
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      staffApi.updateModuleRecord(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-module-records', moduleKey] }),
  });

  const sorted = useMemo(
    () => [...(rows as { id: string; createdAt: string }[])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rows],
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <p className="text-xs text-stone-600 mt-1">Suivi opérationnel — visible uniquement si le module est activé par l&apos;admin.</p>
        </div>
        <Button type="button" size="sm" onClick={() => setFormOpen((v) => !v)}>
          <FiPlus className="w-4 h-4 mr-1" />
          {newLabel}
        </Button>
      </Card>

      {formOpen && (
        <Card className="p-4 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Titre / motif *"
            value={recordTitle}
            onChange={(e) => setRecordTitle(e.target.value)}
          />
          {withStudent && (
            <>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Rechercher un élève (min. 2 caractères)"
                value={studentQ}
                onChange={(e) => setStudentQ(e.target.value)}
              />
              {students.length > 0 && (
                <ul className="border rounded-lg divide-y max-h-40 overflow-y-auto text-sm">
                  {(students as { id: string; studentId: string; user?: { firstName?: string; lastName?: string } }[]).map(
                    (s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-stone-50 ${studentId === s.id ? 'bg-teal-50' : ''}`}
                          onClick={() => setStudentId(s.id)}
                        >
                          {s.user?.lastName} {s.user?.firstName} — {s.studentId}
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </>
          )}
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Détails, actions, observations…"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={!recordTitle.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Enregistrer
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Card><p className="text-center py-6 text-stone-500 text-sm">Chargement…</p></Card>
      ) : sorted.length === 0 ? (
        <Card><p className="text-center py-6 text-stone-500 text-sm">Aucun enregistrement.</p></Card>
      ) : (
        <div className="space-y-2">
          {(sorted as {
            id: string;
            title: string;
            status: string;
            createdAt: string;
            payload?: { notes?: string };
            student?: { user?: { firstName?: string; lastName?: string }; class?: { name?: string } };
          }[]).map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{row.title}</p>
                  {row.student?.user && (
                    <p className="text-xs text-stone-600 mt-0.5">
                      {row.student.user.lastName} {row.student.user.firstName}
                      {row.student.class?.name ? ` · ${row.student.class.name}` : ''}
                    </p>
                  )}
                  {row.payload?.notes && (
                    <p className="text-xs text-stone-600 mt-1 whitespace-pre-wrap">{row.payload.notes}</p>
                  )}
                  <p className="text-[11px] text-stone-400 mt-1">
                    {new Date(row.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{STATUS_LABELS[row.status] ?? row.status}</Badge>
                  {row.status !== 'DONE' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={statusMut.isPending}
                      onClick={() => statusMut.mutate({ id: row.id, status: 'DONE' })}
                    >
                      Clôturer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
