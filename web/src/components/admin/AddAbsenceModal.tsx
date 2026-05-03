import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiBook, 
  FiCalendar,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiCheck,
  FiClock,
  FiXCircle
} from 'react-icons/fi';

interface AddAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  absenceId?: string | null; // Si fourni, on est en mode édition
}

const AddAbsenceModal: React.FC<AddAbsenceModalProps> = ({ isOpen, onClose, absenceId }) => {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = !!absenceId;
  
  // Fetch existing absence if editing
  const { data: existingAbsence, isLoading: isLoadingAbsence } = useQuery({
    queryKey: ['absence', absenceId],
    queryFn: () => adminApi.getAbsence(absenceId!),
    enabled: isEditMode && isOpen && !!absenceId,
  });

  // Form data
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'ABSENT' as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    reason: '',
    excused: false,
  });

  // Load existing absence data if editing
  useEffect(() => {
    if (existingAbsence) {
      setFormData({
        studentId: existingAbsence.studentId || '',
        courseId: existingAbsence.courseId || '',
        teacherId: existingAbsence.teacherId || '',
        date: existingAbsence.date 
          ? new Date(existingAbsence.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: existingAbsence.status || 'ABSENT',
        reason: existingAbsence.reason || '',
        excused: existingAbsence.excused || false,
      });
    }
  }, [existingAbsence]);

  // Fetch data
  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
    enabled: isOpen,
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminApi.getAllCourses(),
    enabled: isOpen,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: adminApi.getTeachers,
    enabled: isOpen,
  });

  // Filter courses based on selected class
  const filteredCourses = courses?.filter((course: any) => {
    if (!formData.studentId) return true;
    const student = students?.find((s: any) => s.id === formData.studentId);
    return student?.classId === course.classId;
  }) || [];

  // Filter teachers based on selected course
  const filteredTeachers = teachers?.filter((teacher: any) => {
    if (!formData.courseId) return true;
    const course = courses?.find((c: any) => c.id === formData.courseId);
    return course?.teacherId === teacher.id;
  }) || [];

  // Create or update mutation
  const createAbsenceMutation = useMutation({
    mutationFn: adminApi.createAbsence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absences'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Absence créée avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création de l\'absence';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          validationErrors[err.param] = err.msg;
        });
        setErrors(validationErrors);
      }
    },
  });

  const updateAbsenceMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateAbsence(absenceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absences'] });
      queryClient.invalidateQueries({ queryKey: ['absence', absenceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Absence mise à jour avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour de l\'absence';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          validationErrors[err.param] = err.msg;
        });
        setErrors(validationErrors);
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) newErrors.studentId = 'L\'élève est requis';
    if (!formData.courseId) newErrors.courseId = 'La matière est requise';
    if (!formData.teacherId) newErrors.teacherId = 'L\'enseignant est requis';
    if (!formData.date) newErrors.date = 'La date est requise';
    if (!formData.status) newErrors.status = 'Le statut est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const absenceData = {
      studentId: formData.studentId,
      courseId: formData.courseId,
      teacherId: formData.teacherId,
      date: new Date(formData.date).toISOString(),
      status: formData.status,
      reason: formData.reason || null,
      excused: formData.excused,
    };

    if (isEditMode) {
      updateAbsenceMutation.mutate(absenceData);
    } else {
      createAbsenceMutation.mutate(absenceData);
    }
  };

  const handleClose = () => {
    setFormData({
      studentId: '',
      courseId: '',
      teacherId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'ABSENT',
      reason: '',
      excused: false,
    });
    setErrors({});
    onClose();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PRESENT: 'Présent',
      ABSENT: 'Absent',
      LATE: 'Retard',
      EXCUSED: 'Excusé',
    };
    return labels[status] || status;
  };

  const isLoading = isLoadingAbsence || createAbsenceMutation.isPending || updateAbsenceMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? 'Modifier une Absence' : 'Ajouter une Absence'} size="lg" compact>
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Student Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Élève <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FiUser className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                errors.studentId ? 'border-red-500' : 'border-stone-200'
              } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
            >
              <option value="">Sélectionner un élève</option>
              {students?.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.user.firstName} {student.user.lastName} - {student.class?.name || 'Non assigné'}
                </option>
              ))}
            </select>
          </div>
          {errors.studentId && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.studentId}
            </p>
          )}
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Matière <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FiBook className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              disabled={isLoading || !formData.studentId}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                errors.courseId ? 'border-red-500' : 'border-stone-200'
              } ${isLoading || !formData.studentId ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
            >
              <option value="">Sélectionner une matière</option>
              {filteredCourses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          {errors.courseId && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.courseId}
            </p>
          )}
        </div>

        {/* Teacher Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Enseignant <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FiUser className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              disabled={isLoading || !formData.courseId}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                errors.teacherId ? 'border-red-500' : 'border-stone-200'
              } ${isLoading || !formData.courseId ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
            >
              <option value="">Sélectionner un enseignant</option>
              {filteredTeachers.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
          </div>
          {errors.teacherId && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.teacherId}
            </p>
          )}
        </div>

        {/* Date and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <FiCalendar className="h-3.5 w-3.5 text-stone-400" />
              </div>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                  errors.date ? 'border-red-500' : 'border-stone-200'
                } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
              />
            </div>
            {errors.date && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Statut <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                {formData.status === 'PRESENT' ? (
                  <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : formData.status === 'LATE' ? (
                  <FiClock className="h-3.5 w-3.5 text-amber-600" />
                ) : formData.status === 'EXCUSED' ? (
                  <FiCheck className="h-3.5 w-3.5 text-amber-800" />
                ) : (
                  <FiXCircle className="h-3.5 w-3.5 text-red-500" />
                )}
              </div>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                  errors.status ? 'border-red-500' : 'border-stone-200'
                } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
              >
                <option value="PRESENT">Présent</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Retard</option>
                <option value="EXCUSED">Excusé</option>
              </select>
            </div>
            {errors.status && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {errors.status}
              </p>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Raison (optionnel)
          </label>
          <div className="relative">
            <div className="absolute top-2 left-2.5 flex items-start pointer-events-none">
              <FiAlertCircle className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all resize-none"
              placeholder="Raison de l'absence..."
            />
          </div>
        </div>

        {/* Excused Checkbox */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="excused"
              checked={formData.excused}
              onChange={handleChange}
              disabled={isLoading}
              className="h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-500/30"
            />
            <span className="text-xs font-semibold text-stone-700">Absence justifiée</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <FiLoader className="w-4 h-4 mr-1.5 animate-spin inline" />
                {isEditMode ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4 mr-1.5 inline" />
                {isEditMode ? 'Mettre à jour' : 'Créer l&apos;absence'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAbsenceModal;






