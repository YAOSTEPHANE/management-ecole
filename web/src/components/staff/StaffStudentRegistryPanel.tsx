'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/services/api/staff.api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function StaffStudentRegistryPanel() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['staff-registry-search', debouncedQ],
    queryFn: () => staffApi.searchRegistryStudents(debouncedQ),
    enabled: debouncedQ.length >= 2,
  });

  const { data: detail } = useQuery({
    queryKey: ['staff-registry-student', selectedId],
    queryFn: () => staffApi.getRegistryStudent(selectedId!),
    enabled: !!selectedId,
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Rechercher un élève (nom, n° élève, email)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isFetching && <p className="text-xs text-stone-500 mt-2">Recherche…</p>}
        <ul className="mt-3 divide-y divide-stone-100 max-h-48 overflow-y-auto">
          {(results as Array<{
            id: string;
            studentId: string;
            user: { firstName: string; lastName: string; email?: string };
            class?: { name: string; level: string } | null;
            _count?: { identityDocuments: number };
          }>).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left py-2 px-1 text-sm hover:bg-stone-50 ${selectedId === s.id ? 'bg-indigo-50' : ''}`}
              >
                <span className="font-medium">
                  {s.user.lastName} {s.user.firstName}
                </span>
                <span className="text-stone-500"> · {s.studentId}</span>
                {s.class && <span className="text-stone-500"> · {s.class.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {detail && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">
            {detail.user.lastName} {detail.user.firstName}
          </h3>
          <p className="text-sm text-stone-600">
            N° {detail.studentId}
            {detail.class ? ` · ${detail.class.name} (${detail.class.level})` : ''}
          </p>
          <p className="text-sm">{detail.user.email}</p>
          {detail.user.phone && <p className="text-sm">{detail.user.phone}</p>}
          <div>
            <p className="text-xs font-semibold text-stone-700 mb-1">Responsables légaux</p>
            <ul className="text-sm space-y-1">
              {(detail.parents as Array<{ parent: { user: { firstName: string; lastName: string; phone?: string } } }>).map(
                (sp, i) => (
                  <li key={i}>
                    {sp.parent.user.lastName} {sp.parent.user.firstName}
                    {sp.parent.user.phone ? ` · ${sp.parent.user.phone}` : ''}
                  </li>
                ),
              )}
            </ul>
          </div>
          <Badge>
            {(detail.identityDocuments as unknown[]).length} pièce(s) d’identité
          </Badge>
        </Card>
      )}
    </div>
  );
}

