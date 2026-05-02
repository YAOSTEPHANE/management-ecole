import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../services/api';
import StudentScheduleCalendar from './StudentScheduleCalendar';
import Card from '../ui/Card';
import { FiSearch } from 'react-icons/fi';

const StudentSchedule = ({ searchQuery = '' }: { searchQuery?: string }) => {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: studentApi.getSchedule,
  });

  const filteredSchedule = useMemo(() => {
    if (!schedule || !searchQuery) return schedule || [];
    
    const query = searchQuery.toLowerCase();
    return schedule.filter((s: any) => {
      const courseName = s.course?.name?.toLowerCase() || '';
      const teacherName = `${s.course?.teacher?.user?.firstName || ''} ${s.course?.teacher?.user?.lastName || ''}`.toLowerCase();
      const room = s.room?.toLowerCase() || '';
      return courseName.includes(query) || teacherName.includes(query) || room.includes(query);
    });
  }, [schedule, searchQuery]);

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement de l'emploi du temps...</p>
        </div>
      </Card>
    );
  }

  if (!schedule || schedule.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Aucun emploi du temps disponible</p>
          <p className="text-sm">Votre emploi du temps apparaîtra ici une fois configuré</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {searchQuery && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center space-x-3">
            <FiSearch className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">
                Recherche: <span className="text-purple-600">"{searchQuery}"</span>
              </p>
              <p className="text-sm text-gray-600">
                {filteredSchedule.length} cours trouvé(s)
              </p>
            </div>
          </div>
        </Card>
      )}
      {filteredSchedule.length > 0 ? (
        <StudentScheduleCalendar schedule={filteredSchedule} />
      ) : searchQuery ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <FiSearch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">Aucun cours trouvé</p>
            <p className="text-sm">Essayez avec d'autres mots-clés</p>
          </div>
        </Card>
      ) : (
        <StudentScheduleCalendar schedule={schedule} />
      )}
    </div>
  );
};

export default StudentSchedule;

