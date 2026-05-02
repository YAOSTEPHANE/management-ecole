import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import NFCScanner from '../ui/NFCScanner';
import { FiUserCheck, FiCheck, FiX, FiClock, FiWifi } from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface PointageElevesProps {
  /** Masque le bandeau titre (intégration dans le module Présences) */
  embedded?: boolean;
}

export default function PointageEleves({ embedded = false }: PointageElevesProps) {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [scannedNFCId, setScannedNFCId] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminApi.getAllCourses(),
  });

  const { data: courseDetail, isLoading: courseDetailLoading } = useQuery({
    queryKey: ['admin-course', selectedCourseId],
    queryFn: () => adminApi.getCourseById(selectedCourseId!),
    enabled: !!selectedCourseId,
  });

  const { data: studentByNFC, isLoading: studentByNFCLoading } = useQuery({
    queryKey: ['admin-student-nfc', scannedNFCId],
    queryFn: () => adminApi.getStudentByNFC(scannedNFCId!),
    enabled: !!scannedNFCId && !!selectedCourseId,
    retry: false,
  });

  const initAttendanceMutation = useMutation({
    mutationFn: adminApi.initAttendance,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-absences'] });
      toast.success(data?.message || 'Pointage démarré. Scannez les badges.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const recordNFCMutation = useMutation({
    mutationFn: (data: { courseId: string; studentId: string; date: string; status?: 'PRESENT' | 'ABSENT' | 'LATE' }) =>
      adminApi.recordNFCAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absences'] });
      setScannedNFCId(null);
      toast.success('Présence enregistrée');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const processedNFCRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !studentByNFC ||
      studentByNFCLoading ||
      !selectedCourseId ||
      !selectedDate ||
      !scannedNFCId ||
      processedNFCRef.current === scannedNFCId
    ) return;
    processedNFCRef.current = scannedNFCId;
    recordNFCMutation.mutate({
      courseId: selectedCourseId,
      studentId: studentByNFC.id,
      date: selectedDate,
      status: 'PRESENT',
    });
  }, [studentByNFC, studentByNFCLoading, selectedCourseId, selectedDate, scannedNFCId]);

  useEffect(() => {
    if (!scannedNFCId) processedNFCRef.current = null;
  }, [scannedNFCId]);

  const { data: absences } = useQuery({
    queryKey: ['admin-absences', selectedCourseId, selectedDate],
    queryFn: () => adminApi.getCourseAbsences(selectedCourseId!, selectedDate),
    enabled: !!selectedCourseId,
  });

  const students = useMemo(
    () => (courseDetail?.class?.students || []).filter((s: any) => s.isActive !== false),
    [courseDetail]
  );

  useEffect(() => {
    if (students.length === 0) return;
    const status: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    const dayAbsences = Array.isArray(absences) ? absences : [];
    students.forEach((student: any) => {
      const record = dayAbsences.find((a: any) => a.studentId === student.id);
      if (record) {
        status[student.id] =
          record.status === 'PRESENT' ? 'PRESENT' : record.status === 'LATE' ? 'LATE' : 'ABSENT';
      } else {
        status[student.id] = 'ABSENT';
      }
    });
    setAttendanceStatus(status);
  }, [absences, students]);

  const takeAttendanceMutation = useMutation({
    mutationFn: adminApi.takeAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absences'] });
      toast.success('Pointage enregistré.');
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    },
  });

  const handleSave = () => {
    if (!selectedCourseId || !selectedDate) return;
    const attendance = students.map((s: any) => ({
      studentId: s.id,
      status: attendanceStatus[s.id] || 'ABSENT',
      excused: false,
    }));
    takeAttendanceMutation.mutate({
      courseId: selectedCourseId,
      date: selectedDate,
      attendance,
    });
  };

  const toggleStatus = (studentId: string) => {
    setAttendanceStatus((prev) => {
      const current = prev[studentId] || 'PRESENT';
      const next =
        current === 'PRESENT' ? 'ABSENT' : current === 'ABSENT' ? 'LATE' : 'PRESENT';
      return { ...prev, [studentId]: next };
    });
  };

  const selectedCourse = courses?.find((c: any) => c.id === selectedCourseId);

  if (coursesLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">Chargement des cours...</p>
        </div>
      </Card>
    );
  }

  if (!courses?.length) {
    return (
      <Card>
        <div className="text-center py-12">
          <FiUserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Aucun cours dans l'établissement.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {!embedded && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pointage des élèves</h2>
              <p className="text-gray-600">
                Le pointage se fait en <strong>scannant le badge NFC</strong> de chaque élève. Choisissez le cours et la date, démarrez le pointage, puis scannez les badges. Saisie manuelle possible en secours.
              </p>
            </div>
          )}
          <div className={`flex flex-wrap items-center gap-2 ${embedded ? 'w-full md:justify-end' : ''}`}>
            <select
              aria-label="Choisir un cours"
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value || null)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choisir un cours</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} – {c.class?.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Date du pointage"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {selectedCourseId && (
              <>
                <Button
                  onClick={() => initAttendanceMutation.mutate({ courseId: selectedCourseId, date: selectedDate })}
                  disabled={initAttendanceMutation.isPending}
                  variant="primary"
                  size="md"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {initAttendanceMutation.isPending ? 'Initialisation...' : 'Démarrer le pointage'}
                </Button>
                <Button onClick={() => setModalOpen(true)} variant="secondary" size="md">
                  <FiUserCheck className="w-4 h-4 mr-2" />
                  Saisie manuelle (sans badge)
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {selectedCourseId && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
            <FiWifi className="w-5 h-5 text-green-600" />
            Scannez les badges des élèves
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Chaque élève présente son badge NFC au lecteur pour être marqué présent.
          </p>
          <NFCScanner
            onScan={(nfcId) => setScannedNFCId(nfcId)}
            onError={(msg) => toast.error(msg)}
            className="w-full"
            autoScan={false}
          />
          {scannedNFCId && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              {studentByNFCLoading && <p className="text-sm text-gray-600">Recherche de l'élève...</p>}
              {studentByNFC && !studentByNFCLoading && (
                <p className="text-sm text-green-700 font-medium">
                  {studentByNFC.user?.firstName} {studentByNFC.user?.lastName} – enregistrement…
                </p>
              )}
              {scannedNFCId && !studentByNFC && !studentByNFCLoading && (
                <p className="text-sm text-red-600">Aucun élève associé à ce badge NFC.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {selectedCourseId && courseDetail && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Récapitulatif</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <span className="text-sm text-gray-600">
              Présents : <strong className="text-green-600">{Object.values(attendanceStatus).filter((s) => s === 'PRESENT').length}</strong>
            </span>
            <span className="text-sm text-gray-600">
              Absents : <strong className="text-red-600">{Object.values(attendanceStatus).filter((s) => s === 'ABSENT').length}</strong>
            </span>
            <span className="text-sm text-gray-600">
              Retard : <strong className="text-orange-600">{Object.values(attendanceStatus).filter((s) => s === 'LATE').length}</strong>
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {(courseDetail?.class?.students || [])
              .filter((s: any) => s.isActive !== false)
              .map((student: any) => {
                const status = attendanceStatus[student.id] || 'ABSENT';
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">
                      {student.user?.firstName} {student.user?.lastName}
                    </span>
                    <Badge variant={status === 'PRESENT' ? 'success' : status === 'LATE' ? 'warning' : 'danger'} size="sm">
                      {status === 'PRESENT' ? 'Présent' : status === 'LATE' ? 'En retard' : 'Absent'}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {modalOpen && selectedCourseId && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Pointage - ${selectedCourse?.name || 'Cours'} - ${format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Cliquez sur un élève pour changer son statut : Présent → Absent → En retard → Présent.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const next: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
                  students.forEach((s: any) => { next[s.id] = 'PRESENT'; });
                  setAttendanceStatus(next);
                }}
              >
                Tous présents
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const next: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
                  students.forEach((s: any) => { next[s.id] = 'ABSENT'; });
                  setAttendanceStatus(next);
                }}
              >
                Tous absents
              </Button>
            </div>

            {courseDetailLoading ? (
              <div className="py-8 text-center text-gray-500">Chargement des élèves...</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {students.map((student: any) => {
                  const status = attendanceStatus[student.id] || 'ABSENT';
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStatus(student.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        status === 'PRESENT'
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : status === 'ABSENT'
                            ? 'bg-red-50 border-red-200 hover:bg-red-100'
                            : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            status === 'PRESENT'
                              ? 'bg-green-500'
                              : status === 'ABSENT'
                                ? 'bg-red-500'
                                : 'bg-orange-500'
                          }`}
                        >
                          {status === 'PRESENT' ? (
                            <FiCheck className="w-5 h-5 text-white" />
                          ) : status === 'ABSENT' ? (
                            <FiX className="w-5 h-5 text-white" />
                          ) : (
                            <FiClock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.user?.firstName} {student.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {status === 'PRESENT' ? 'Présent' : status === 'ABSENT' ? 'Absent' : 'En retard'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          status === 'PRESENT' ? 'success' : status === 'ABSENT' ? 'danger' : 'warning'
                        }
                        size="sm"
                      >
                        {status === 'PRESENT' ? 'Présent' : status === 'ABSENT' ? 'Absent' : 'En retard'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={takeAttendanceMutation.isPending || students.length === 0}
              >
                {takeAttendanceMutation.isPending ? 'Enregistrement...' : 'Enregistrer le pointage'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
