'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi } from '../../services/api';
import Button from '../ui/Button';
import { FiCheckCircle, FiClock, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * Permet à l’enseignant d’enregistrer sa propre présence (complément au pointage NFC/admin).
 */
const TeacherSelfAttendance: React.FC = () => {
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-my-attendance', todayStr],
    queryFn: () => teacherApi.getMyAttendance({ date: todayStr }),
  });

  const mutation = useMutation({
    mutationFn: () => teacherApi.markMyAttendancePresent({ date: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-my-attendance'] });
      toast.success('Votre présence est enregistrée pour aujourd’hui.');
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Impossible d’enregistrer la présence');
    },
  });

  const record = data?.attendance;

  const statusLine = (() => {
    if (!record) return null;
    if (record.status === 'PRESENT') return { ok: true, text: 'Présent(e)' as const };
    if (record.status === 'LATE') return { ok: true, text: 'En retard' as const };
    if (record.status === 'EXCUSED') return { ok: true, text: 'Excusé(e)' as const };
    if (record.status === 'ABSENT') return { ok: false, text: 'Absent(e)' as const };
    return { ok: false, text: String(record.status) };
  })();

  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-teal-50/80 px-4 py-3 sm:px-5 shadow-sm ring-1 ring-emerald-900/5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 rounded-xl bg-emerald-600 text-white p-2 shrink-0 shadow-sm">
            <FiUserCheck className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900">Ma présence aujourd’hui</p>
            <p className="text-xs text-stone-600 mt-0.5">
              En complément du badge ou de l’empreinte au lecteur, vous pouvez vous marquer présent(e)
              depuis l’application.
            </p>
            {isLoading ? (
              <p className="text-xs text-stone-500 mt-1">Chargement…</p>
            ) : record && statusLine ? (
              <p className="text-xs font-medium text-emerald-900 mt-1.5 flex flex-wrap items-center gap-2">
                {statusLine.ok ? (
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                ) : (
                  <FiClock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden />
                )}
                Pointage : {statusLine.text}
                {record.source && (
                  <span className="text-stone-500 font-normal">
                    ({record.source === 'SELF' ? 'via l’app' : record.source})
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-stone-500 mt-1">Pas encore de pointage pour aujourd’hui.</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 sm:ml-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
            disabled={mutation.isPending || record?.status === 'PRESENT'}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? 'Enregistrement…'
              : record?.status === 'PRESENT'
                ? 'Déjà marqué présent(e)'
                : 'Je suis présent(e)'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSelfAttendance;
