'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { educatorApi } from '../../services/api';
import Card from '../ui/Card';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

const EducatorScheduleTab = () => {
  const [classFilter, setClassFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['educator-classes'],
    queryFn: educatorApi.getClasses,
  });

  const { data: teachers } = useQuery({
    queryKey: ['educator-teachers'],
    queryFn: educatorApi.getTeachers,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['educator-schedules', classFilter, teacherFilter],
    queryFn: () =>
      educatorApi.getSchedules({
        ...(classFilter ? { classId: classFilter } : {}),
        ...(teacherFilter ? { teacherId: teacherFilter } : {}),
      }),
  });

  const slots = (data as { slots?: any[] } | undefined)?.slots ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/20">
        <h2 className="text-lg font-bold text-stone-900">Emplois du temps</h2>
        <p className="text-sm text-stone-600 mt-1">
          Consultation des créneaux par classe ou par enseignant (élèves et enseignants).
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <select
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm flex-1"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">Toutes les classes</option>
            {((classes as any[]) ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.level}
              </option>
            ))}
          </select>
          <select
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm flex-1"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
          >
            <option value="">Tous les enseignants</option>
            {((teachers as any[]) ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.user?.firstName} {t.user?.lastName}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
            <p className="mt-3 text-stone-600 text-sm">Chargement…</p>
          </div>
        </Card>
      ) : slots.length === 0 ? (
        <Card className="p-10 text-center text-stone-500">
          <FiCalendar className="w-14 h-14 mx-auto mb-3 text-stone-300" />
          <p className="font-medium">Aucun créneau pour ces filtres.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-left">
                  <th className="py-3 px-4 font-semibold text-stone-700">Jour</th>
                  <th className="py-3 px-4 font-semibold text-stone-700">Horaire</th>
                  <th className="py-3 px-4 font-semibold text-stone-700">Matière</th>
                  <th className="py-3 px-4 font-semibold text-stone-700">Classe</th>
                  <th className="py-3 px-4 font-semibold text-stone-700">Enseignant</th>
                  <th className="py-3 px-4 font-semibold text-stone-700">Salle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {slots.map((s: any, i: number) => (
                  <tr key={`${s.id}-${i}`} className="hover:bg-violet-50/40">
                    <td className="py-3 px-4 font-medium">{s.dayLabel}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="w-4 h-4 text-violet-600 shrink-0" />
                        {s.startTime} – {s.endTime}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{s.courseName}</span>
                      <span className="text-xs text-stone-500 ml-1 font-mono">{s.courseCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      {s.className} <span className="text-stone-500">({s.classLevel})</span>
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      {s.substituteTeacher
                        ? `${s.substituteTeacher.firstName} ${s.substituteTeacher.lastName} (rempl.)`
                        : s.teacherName}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {s.room ? (
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5" />
                          {s.room}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EducatorScheduleTab;
