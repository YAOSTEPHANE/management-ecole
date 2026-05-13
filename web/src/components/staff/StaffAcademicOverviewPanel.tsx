'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/services/api/staff.api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { StaffModuleId } from '@/lib/staffModules';

type Props = { onOpenModule?: (id: StaffModuleId) => void };

export default function StaffAcademicOverviewPanel({ onOpenModule }: Props) {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['staff-academic-overview'],
    queryFn: staffApi.getAcademicOverview,
  });
  const { data: averages = [] } = useQuery({
    queryKey: ['staff-class-averages'],
    queryFn: () => staffApi.getClassAverages(),
  });

  if (isLoading) return <p className="text-sm text-stone-500">Chargement…</p>;
  if (!overview) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{overview.classCount}</p>
          <p className="text-xs text-stone-500">Classes</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{overview.studentCount}</p>
          <p className="text-xs text-stone-500">Élèves actifs</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">{overview.pendingValidations}</p>
          <p className="text-xs text-stone-500">Validations en attente</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{overview.averageScore ?? '—'}</p>
          <p className="text-xs text-stone-500">Moyenne globale /20</p>
        </Card>
      </div>

      {overview.pendingValidations > 0 && onOpenModule && (
        <Button variant="secondary" onClick={() => onOpenModule('validations')}>
          Traiter les validations ({overview.pendingValidations})
        </Button>
      )}

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Effectifs par classe</h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm max-h-72 overflow-y-auto">
          {(overview.classes as Array<{
            id: string;
            name: string;
            level: string;
            academicYear: string;
            _count: { students: number; courses: number };
          }>).map((c) => (
            <li key={c.id} className="rounded-lg border border-stone-200 px-3 py-2">
              <span className="font-medium">{c.name}</span>
              <span className="text-stone-500"> · {c.level}</span>
              <p className="text-xs text-stone-500 mt-0.5">
                {c._count.students} élève(s) · {c._count.courses} cours
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Moyennes par classe (/20)</h3>
        <ul className="space-y-2 text-sm">
          {(averages as Array<{
            classId: string;
            class: { name: string; level: string } | null;
            averageOn20: number | null;
            gradeCount: number;
          }>)
            .sort((a, b) => (b.averageOn20 ?? 0) - (a.averageOn20 ?? 0))
            .map((row) => (
              <li key={row.classId} className="flex justify-between border-b border-stone-100 pb-1">
                <span>
                  {row.class?.name ?? row.classId}
                  <span className="text-stone-500 text-xs"> ({row.gradeCount} notes)</span>
                </span>
                <span className="font-medium">{row.averageOn20 ?? '—'}</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
