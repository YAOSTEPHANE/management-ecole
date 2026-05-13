'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  academicValidationApi,
  type AcademicChangeRequestRow,
} from '@/services/api/academicValidation.api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClipboard } from 'react-icons/fi';
import { getEvaluationTypeLabel } from '@/lib/evaluationTypes';

function describeRequest(row: AcademicChangeRequestRow): string {
  const studentName = row.student?.user
    ? `${row.student.user.firstName ?? ''} ${row.student.user.lastName ?? ''}`.trim()
    : 'Élève';
  const classLabel = row.student?.class?.name ? ` (${row.student.class.name})` : '';

  if (row.target === 'REPORT_CARD') {
    const p = row.payload as { average?: number; period?: string };
    const prev = row.previousPayload as { average?: number } | null | undefined;
    if (row.kind === 'UPDATE' && prev?.average != null && p.average != null) {
      return `${studentName}${classLabel} — moyenne ${prev.average.toFixed(2)} → ${p.average.toFixed(2)} (${p.period ?? ''})`;
    }
    return `${studentName}${classLabel} — bulletin ${p.period ?? ''} · moyenne ${p.average?.toFixed(2) ?? '—'}`;
  }

  const p = row.payload as {
    title?: string;
    score?: number;
    maxScore?: number;
    evaluationType?: string;
  };
  const prev = row.previousPayload as { score?: number; maxScore?: number; title?: string } | null;
  const typeLabel = p.evaluationType ? getEvaluationTypeLabel(p.evaluationType) : 'Note';

  if (row.kind === 'DELETE') {
    return `${studentName}${classLabel} — suppression : ${prev?.title ?? p.title ?? typeLabel}`;
  }
  if (row.kind === 'UPDATE' && prev) {
    const oldOn20 =
      prev.score != null && prev.maxScore
        ? ((prev.score / prev.maxScore) * 20).toFixed(2)
        : '—';
    const newOn20 =
      p.score != null && p.maxScore ? ((p.score / p.maxScore) * 20).toFixed(2) : '—';
    return `${studentName}${classLabel} — ${p.title ?? prev.title} : ${oldOn20}/20 → ${newOn20}/20`;
  }
  const on20 =
    p.score != null && p.maxScore ? ((p.score / p.maxScore) * 20).toFixed(2) : '—';
  return `${studentName}${classLabel} — nouvelle note ${typeLabel} : ${p.title ?? ''} (${on20}/20)`;
}

const kindLabel: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
};

export default function AcademicValidationPanel({
  title = 'Validations notes & moyennes',
  subtitle = 'Circuit : professeur principal → éducateur → directeur des études',
}: {
  title?: string;
  subtitle?: string;
}) {
  const queryClient = useQueryClient();
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['academic-validation-pending'],
    queryFn: academicValidationApi.getPending,
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['academic-validation-pending'] });
    queryClient.invalidateQueries({ queryKey: ['academic-validation-my-requests'] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      academicValidationApi.approve(id, note),
    onSuccess: () => {
      toast.success('Validation enregistrée');
      invalidate();
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Erreur lors de la validation');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      academicValidationApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Demande rejetée');
      invalidate();
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Erreur lors du rejet');
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-50 text-primary-700">
            <FiClipboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-center py-8 text-gray-500">Chargement des demandes…</p>
        </Card>
      ) : pending.length === 0 ? (
        <Card>
          <p className="text-center py-8 text-gray-500">
            Aucune demande en attente de votre validation.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((row) => (
            <Card key={row.id} className="border border-gray-100">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={row.target === 'GRADE' ? 'info' : 'warning'}>
                    {row.target === 'GRADE' ? 'Note' : 'Moyenne'}
                  </Badge>
                  <Badge variant="default">{kindLabel[row.kind] ?? row.kind}</Badge>
                  <span className="text-xs text-gray-500">{row.statusLabel}</span>
                </div>
                <p className="text-sm text-gray-800 font-medium">{describeRequest(row)}</p>
                <textarea
                  className="w-full mt-2 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Commentaire optionnel…"
                  value={noteById[row.id] ?? ''}
                  onChange={(e) =>
                    setNoteById((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() =>
                      approveMutation.mutate({
                        id: row.id,
                        note: noteById[row.id] || undefined,
                      })
                    }
                  >
                    <FiCheck className="w-4 h-4 mr-1" />
                    Valider
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() =>
                      rejectMutation.mutate({
                        id: row.id,
                        reason: noteById[row.id] || undefined,
                      })
                    }
                  >
                    <FiX className="w-4 h-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
