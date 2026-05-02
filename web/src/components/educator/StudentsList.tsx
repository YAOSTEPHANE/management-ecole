import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { educatorApi } from '../../services/api';
import Card from '../ui/Card';
import SearchBar from '../ui/SearchBar';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { FiEye, FiUsers } from 'react-icons/fi';
import StudentDetailsModal from '../admin/StudentDetailsModal';
import {
  ENROLLMENT_STATUS_LABELS,
  enrollmentBadgeVariant,
  type EnrollmentStatusValue,
} from '../../lib/enrollmentStatus';

interface StudentsListProps {
  searchQuery?: string;
}

const StudentsList = ({ searchQuery = '' }: StudentsListProps) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: students, isLoading } = useQuery({
    queryKey: ['educator-students'],
    queryFn: educatorApi.getStudents,
  });

  const filteredStudents = students?.filter((student: any) => {
    const matchesSearch =
      student.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDetailsModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Chargement des élèves...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher un élève..."
            />
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <FiUsers className="w-5 h-5" />
            <span className="font-medium">{filteredStudents?.length || 0} élève(s)</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Liste des Élèves ({filteredStudents?.length || 0})
        </h2>
        {filteredStudents && filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Élève</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Classe</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Inscription</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student: any) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={student.user.avatar}
                          name={`${student.user.firstName} ${student.user.lastName}`}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.user.firstName} {student.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{student.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={student.class ? 'info' : 'default'}>
                        {student.class?.name || 'Non assigné'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.studentId}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={enrollmentBadgeVariant(
                          (student.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE'
                        )}
                      >
                        {ENROLLMENT_STATUS_LABELS[
                          (student.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE'
                        ]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewStudent(student.id)}
                      >
                        <FiEye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Aucun élève trouvé
          </div>
        )}
      </Card>

      {/* Modal de détails d'élève */}
      {selectedStudentId && (
        <StudentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedStudentId(null);
          }}
          studentId={selectedStudentId}
        />
      )}
    </div>
  );
};

export default StudentsList;
