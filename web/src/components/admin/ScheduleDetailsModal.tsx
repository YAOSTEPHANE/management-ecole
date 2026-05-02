import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  FiCalendar,
  FiClock,
  FiBook,
  FiUsers,
  FiMapPin,
  FiUser,
  FiEdit,
  FiX,
} from 'react-icons/fi';

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

interface ScheduleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string | null;
  onEdit: () => void;
}

const ScheduleDetailsModal = ({ isOpen, onClose, scheduleId, onEdit }: ScheduleDetailsModalProps) => {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => adminApi.getSchedule(scheduleId!),
    enabled: isOpen && !!scheduleId,
  });

  if (!isOpen || !scheduleId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de l'emploi du temps" size="lg">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : schedule ? (
        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border-2 border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiBook className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-gray-800">Matière</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{schedule.course?.name}</p>
              {schedule.course?.code && (
                <p className="text-sm text-gray-600 mt-1">Code: {schedule.course.code}</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiUsers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-800">Classe</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{schedule.class?.name}</p>
              {schedule.class?.level && (
                <p className="text-sm text-gray-600 mt-1">Niveau: {schedule.class.level}</p>
              )}
            </div>
          </div>

          {/* Informations temporelles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiCalendar className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Jour</h3>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {DAYS.find((d) => d.value === schedule.dayOfWeek)?.label || 'Inconnu'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiClock className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Heure de début</h3>
              </div>
              <p className="text-lg font-bold text-gray-900">{schedule.startTime}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiClock className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Heure de fin</h3>
              </div>
              <p className="text-lg font-bold text-gray-900">{schedule.endTime}</p>
            </div>
          </div>

          {/* Salle */}
          {schedule.room && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiMapPin className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-800">Salle</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{schedule.room}</p>
            </div>
          )}

          {/* Enseignant */}
          {schedule.course?.teacher && (
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiUser className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-800">Enseignant</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {schedule.course.teacher.user?.firstName} {schedule.course.teacher.user?.lastName}
              </p>
              {schedule.course.teacher.user?.email && (
                <p className="text-sm text-gray-600 mt-1">{schedule.course.teacher.user.email}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              <FiX className="w-4 h-4 mr-2" />
              Fermer
            </Button>
            <Button onClick={onEdit} className="bg-orange-600 hover:bg-orange-700">
              <FiEdit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Emploi du temps non trouvé</p>
        </div>
      )}
    </Modal>
  );
};

export default ScheduleDetailsModal;






