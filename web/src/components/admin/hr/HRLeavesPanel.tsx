import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import toast from 'react-hot-toast';

const LEAVE_TYPES: Record<string, string> = {
  ANNUAL: 'Congés annuels',
  SICK: 'Arrêt maladie',
  PERSONAL: 'Motif personnel',
  TRAINING: 'Formation',
  OTHER: 'Autre',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  CANCELLED: 'Annulé',
};

const HRLeavesPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['admin-hr-teacher-leaves', filter],
    queryFn: () =>
      filter === 'all'
        ? adminApi.getHrTeacherLeaves()
        : adminApi.getHrTeacherLeaves({ status: filter }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      teacherId,
      leaveId,
      status,
    }: {
      teacherId: string;
      leaveId: string;
      status: 'APPROVED' | 'REJECTED';
    }) => adminApi.updateTeacherLeaveStatus(teacherId, leaveId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hr-teacher-leaves'] });
      toast.success('Demande mise à jour');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || 'Mise à jour impossible'),
  });

  const list = (leaves as any[]) ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-orange-100 bg-orange-50/40">
        <p className="text-sm text-gray-700 flex items-start gap-2">
          <FiCalendar className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          Demandes de <strong>congés et permissions</strong> déposées par les enseignants. Validez ou
          refusez depuis la direction (les enseignants créent leurs demandes depuis leur espace).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tous' : STATUS_LABEL[f] ?? f}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune demande pour ce filtre.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                  <th className="py-3 px-4 font-semibold">Enseignant</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Du</th>
                  <th className="py-3 px-4 font-semibold">Au</th>
                  <th className="py-3 px-4 font-semibold">Statut</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((lv: any) => (
                  <tr key={lv.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {lv.teacher?.user?.firstName} {lv.teacher?.user?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{lv.teacher?.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">{LEAVE_TYPES[lv.type] ?? lv.type}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {lv.startDate
                        ? format(new Date(lv.startDate), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {lv.endDate
                        ? format(new Date(lv.endDate), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          lv.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : lv.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : lv.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {STATUS_LABEL[lv.status] ?? lv.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {lv.status === 'PENDING' ? (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({
                                teacherId: lv.teacherId,
                                leaveId: lv.id,
                                status: 'APPROVED',
                              })
                            }
                          >
                            <FiCheck className="w-3.5 h-3.5 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({
                                teacherId: lv.teacherId,
                                leaveId: lv.id,
                                status: 'REJECTED',
                              })
                            }
                          >
                            <FiX className="w-3.5 h-3.5 mr-1" />
                            Refuser
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HRLeavesPanel;
