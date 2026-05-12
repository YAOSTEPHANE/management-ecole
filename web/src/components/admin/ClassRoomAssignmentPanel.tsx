import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import toast from 'react-hot-toast';
import { FiMapPin } from 'react-icons/fi';

type ClassRoomAssignmentPanelProps = {
  compact?: boolean;
};

const ClassRoomAssignmentPanel: React.FC<ClassRoomAssignmentPanelProps> = ({ compact = false }) => {
  const queryClient = useQueryClient();
  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
  });
  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['material-rooms', 'class-assign'],
    queryFn: () => adminApi.getMaterialRooms({ isActive: 'true' }),
  });

  const assign = useMutation({
    mutationFn: ({ id, materialRoomId }: { id: string; materialRoomId: string | null }) =>
      adminApi.updateClass(id, { materialRoomId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Salle mise à jour');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  if (loadingClasses || loadingRooms) {
    return (
      <Card className="p-3 border border-gray-200">
        <p className="text-xs text-gray-500">Chargement des salles…</p>
      </Card>
    );
  }

  const list = (classes as any[]) ?? [];
  const roomList = ((rooms as any[]) ?? [])
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'));

  return (
    <Card className={`p-3 border border-gray-200 ${compact ? 'text-sm' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <FiMapPin className="w-4 h-4 text-indigo-600 shrink-0" />
        <h3
          className={
            compact ? 'text-sm font-semibold text-gray-900' : 'text-base font-semibold text-gray-900'
          }
        >
          Affectation des salles de classe
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-snug">
        Rattachez chaque classe à une salle du référentiel{' '}
        <span className="text-gray-700">(Matériel → Salles et lieux)</span>. Le champ « salle » de la
        classe est alors aligné sur le nom de la salle ; vous pouvez l’ajuster dans la fiche « Modifier la
        classe » si besoin.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-left text-[10px] uppercase tracking-wide text-gray-500">
              <th className="px-2 py-2">Classe</th>
              <th className="px-2 py-2">Niveau</th>
              <th className="px-2 py-2">Année</th>
              <th className="px-2 py-2">Affichage</th>
              <th className="px-2 py-2 min-w-[220px]">Salle (référentiel)</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-gray-500">
                  Aucune classe à afficher.
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-2 py-1.5 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{c.level}</td>
                  <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">{c.academicYear}</td>
                  <td className="px-2 py-1.5 text-gray-700">
                    {c.materialRoom ? (
                      <span>
                        {c.materialRoom.name}
                        {c.materialRoom.building ? (
                          <span className="text-gray-400"> · {c.materialRoom.building}</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-gray-400">{c.room || '—'}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      className="w-full max-w-[280px] text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      value={c.materialRoom?.id || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        assign.mutate({ id: c.id, materialRoomId: v || null });
                      }}
                      disabled={assign.isPending}
                      aria-label={`Salle pour ${c.name}`}
                    >
                      <option value="">— Non affectée (saisie libre dans la fiche classe) —</option>
                      {roomList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                          {r.building ? ` · ${r.building}` : ''}
                          {r.code ? ` (${r.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ClassRoomAssignmentPanel;
