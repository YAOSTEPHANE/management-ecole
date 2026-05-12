import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi } from '../../services/api';
import NFCScanner from '../ui/NFCScanner';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { FiUser, FiCheckCircle, FiXCircle, FiClock, FiBook } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface NFCAttendanceScannerProps {
  courseId: string | null;
  selectedDate: string;
  onStudentScanned: (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => void;
  scannedStudents?: string[];
}

const NFCAttendanceScanner: React.FC<NFCAttendanceScannerProps> = ({
  courseId,
  selectedDate,
  onStudentScanned,
  scannedStudents = [],
}) => {
  const queryClient = useQueryClient();
  const [scannedNFCId, setScannedNFCId] = useState<string | null>(null);

  // Rechercher l'étudiant par NFC ID
  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-student-nfc', scannedNFCId],
    queryFn: () => teacherApi.getStudentByNFC(scannedNFCId!),
    enabled: !!scannedNFCId && !!courseId,
    retry: false,
  });

  // Mutation pour enregistrer automatiquement la présence
  const recordAttendanceMutation = useMutation({
    mutationFn: (data: { courseId: string; studentId: string; date: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }) =>
      teacherApi.recordNFCAttendance(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-course-absences'] });
      const studentName = `${data.student.user.firstName} ${data.student.user.lastName}`;
      toast.success(`${studentName} marqué automatiquement comme présent`);
      onStudentScanned(data.studentId, 'PRESENT');
      setScannedNFCId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    },
  });

  // Enregistrer automatiquement la présence quand un étudiant est trouvé
  // Le scan NFC marque toujours comme PRESENT
  useEffect(() => {
    if (student && !isLoading && !error && courseId && !scannedStudents.includes(student.id)) {
      // Le scan NFC marque toujours comme PRESENT
      // Enregistrer automatiquement
      recordAttendanceMutation.mutate({
        courseId,
        studentId: student.id,
        date: selectedDate,
        status: 'PRESENT', // Scan NFC = toujours présent
      });
    }
  }, [student, isLoading, error, courseId, selectedDate, scannedStudents]);

  const handleScan = (nfcId: string) => {
    if (!courseId) {
      toast.error('Veuillez sélectionner un cours d\'abord');
      return;
    }
    setScannedNFCId(nfcId);
    refetch();
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const handleConfirmPresence = (status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (student && courseId) {
      recordAttendanceMutation.mutate({
        courseId,
        studentId: student.id,
        date: selectedDate,
        status,
      });
    }
  };

  const handleClear = () => {
    setScannedNFCId(null);
  };

  if (!courseId) {
    return (
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <div className="flex items-center space-x-3 py-4">
          <FiBook className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-semibold text-yellow-900">Cours requis</p>
            <p className="text-sm text-yellow-700">
              Veuillez sélectionner un cours pour le pointage automatique (carte ou empreinte)
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card className="bg-blue-50 border-2 border-blue-200">
        <div className="flex items-center space-x-3">
          <FiCheckCircle className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">Enregistrement automatique</p>
            <p className="text-sm text-blue-700">
              Chaque lecture (<strong>carte scolaire</strong> ou <strong>empreinte digitale</strong> si l’identifiant est lié au dossier) marque l’élève comme <strong>PRÉSENT</strong>.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Sans passage lecteur, l’élève reste absent jusqu’à correction manuelle.
            </p>
          </div>
        </div>
      </Card>

      <NFCScanner
        onScan={handleScan}
        onError={handleError}
        className="w-full"
        autoScan={false}
      />

      {/* Résultats du scan */}
      {scannedNFCId && (
        <Card className="w-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Étudiant scanné</h3>
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Recherche de l'étudiant...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FiXCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Étudiant non trouvé</p>
                    <p className="text-sm text-red-700">
                      Aucun étudiant n'est associé à cet ID NFC
                    </p>
                  </div>
                </div>
              </div>
            )}

            {student && !isLoading && (
              <div className="space-y-4">
                {/* Vérifier si déjà scanné */}
                {scannedStudents.includes(student.id) ? (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FiCheckCircle className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-900">Déjà enregistré</p>
                        <p className="text-sm text-blue-700">
                          Cet étudiant a déjà été scanné pour cette date
                        </p>
                      </div>
                    </div>
                  </div>
                ) : recordAttendanceMutation.isPending ? (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                      <div>
                        <p className="font-semibold text-yellow-900">Enregistrement en cours...</p>
                        <p className="text-sm text-yellow-700">
                          Enregistrement de la présence de {student.user.firstName} {student.user.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FiCheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Étudiant trouvé !</p>
                        <p className="text-sm text-green-700">Enregistrement automatique en cours...</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations de l'étudiant */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={student.user?.avatar}
                      name={`${student.user?.firstName} ${student.user?.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">
                        {student.user?.firstName} {student.user?.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                      {student.class && (
                        <p className="text-xs text-gray-500">
                          {student.class.name} - {student.class.level}
                        </p>
                      )}
                    </div>
                    <Badge variant={student.isActive ? 'success' : 'danger'}>
                      {student.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                {/* Boutons d'action */}
                {!scannedStudents.includes(student.id) && (
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleConfirmPresence('PRESENT')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FiCheckCircle className="w-4 h-4 mr-2" />
                      Présent
                    </Button>
                    <Button
                      onClick={() => handleConfirmPresence('LATE')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <FiClock className="w-4 h-4 mr-2" />
                      En retard
                    </Button>
                    <Button
                      onClick={() => handleConfirmPresence('ABSENT')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <FiXCircle className="w-4 h-4 mr-2" />
                      Absent
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NFCAttendanceScanner;

