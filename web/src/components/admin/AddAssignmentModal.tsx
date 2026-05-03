import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import { 
  FiBook, 
  FiCalendar,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiUser,
  FiUpload,
  FiX,
  FiFile
} from 'react-icons/fi';

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId?: string | null; // Si fourni, on est en mode édition
}

const AddAssignmentModal: React.FC<AddAssignmentModalProps> = ({ isOpen, onClose, assignmentId }) => {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = !!assignmentId;
  
  // Fetch existing assignment if editing
  const { data: existingAssignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => adminApi.getAssignment(assignmentId!),
    enabled: isEditMode && isOpen && !!assignmentId,
  });

  // Form data
  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default: 7 days from now
    studentIds: [] as string[],
    attachments: [] as string[],
  });

  // Load existing assignment data if editing
  useEffect(() => {
    if (existingAssignment) {
      setFormData({
        courseId: existingAssignment.courseId || '',
        teacherId: existingAssignment.teacherId || '',
        title: existingAssignment.title || '',
        description: existingAssignment.description || '',
        dueDate: existingAssignment.dueDate 
          ? new Date(existingAssignment.dueDate).toISOString().split('T')[0]
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        studentIds: existingAssignment.students?.map((s: any) => s.studentId) || [],
        attachments: existingAssignment.attachments || [],
      });
    }
  }, [existingAssignment]);

  // Fetch data
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

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
    enabled: isOpen && !!formData.courseId,
  });

  // Filter students based on selected course
  const filteredStudents = students?.filter((student: any) => {
    if (!formData.courseId) return false;
    const course = courses?.find((c: any) => c.id === formData.courseId);
    return course && student.classId === course.classId;
  }) || [];

  // Filter teachers based on selected course
  const filteredTeachers = teachers?.filter((teacher: any) => {
    if (!formData.courseId) return true;
    const course = courses?.find((c: any) => c.id === formData.courseId);
    return course?.teacherId === teacher.id;
  }) || [];

  // Create or update mutation
  const createAssignmentMutation = useMutation({
    mutationFn: adminApi.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Devoir créé avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création du devoir';
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

  const updateAssignmentMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateAssignment(assignmentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Devoir mis à jour avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du devoir';
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
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Reset studentIds when course changes
    if (name === 'courseId') {
      setFormData((prev) => ({
        ...prev,
        courseId: value,
        studentIds: [],
      }));
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleSelectAllStudents = () => {
    if (formData.studentIds.length === filteredStudents.length) {
      setFormData((prev) => ({ ...prev, studentIds: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        studentIds: filteredStudents.map((s: any) => s.id),
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseId) newErrors.courseId = 'La matière est requise';
    if (!formData.teacherId) newErrors.teacherId = 'L\'enseignant est requis';
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.dueDate) newErrors.dueDate = 'La date d\'échéance est requise';
    if (formData.studentIds.length === 0) newErrors.studentIds = 'Au moins un élève doit être sélectionné';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const assignmentData = {
      courseId: formData.courseId,
      teacherId: formData.teacherId,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      dueDate: new Date(formData.dueDate).toISOString(),
      studentIds: formData.studentIds,
      attachments: formData.attachments,
    };

    if (isEditMode) {
      updateAssignmentMutation.mutate(assignmentData);
    } else {
      createAssignmentMutation.mutate(assignmentData);
    }
  };

  const handleClose = () => {
    setFormData({
      courseId: '',
      teacherId: '',
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      studentIds: [],
      attachments: [],
    });
    setErrors({});
    onClose();
  };

  const isLoading = isLoadingAssignment || createAssignmentMutation.isPending || updateAssignmentMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? 'Modifier un Devoir' : 'Ajouter un Devoir'} size="lg" compact>
      <form onSubmit={handleSubmit} className="space-y-2">
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
              disabled={isLoading}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                errors.courseId ? 'border-red-500' : 'border-stone-200'
              } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
            >
              <option value="">Sélectionner une matière</option>
              {courses?.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code}) - {course.class?.name || 'N/A'}
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

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
              errors.title ? 'border-red-500' : 'border-stone-200'
            } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
            placeholder="Titre du devoir"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Description (optionnel)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isLoading}
            rows={4}
            className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all resize-none"
            placeholder="Description du devoir..."
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Date d'échéance <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <FiCalendar className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              disabled={isLoading}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                errors.dueDate ? 'border-red-500' : 'border-stone-200'
              } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
            />
          </div>
          {errors.dueDate && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {errors.dueDate}
            </p>
          )}
        </div>

        {/* Students Selection */}
        {formData.courseId && filteredStudents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-stone-700">
                Élèves <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="text-xs text-amber-800 hover:text-amber-950 font-medium"
              >
                {formData.studentIds.length === filteredStudents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="border border-stone-200 rounded-lg p-2 max-h-52 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-3">Aucun élève dans cette classe</p>
              ) : (
                <div className="space-y-1">
                  {filteredStudents.map((student: any) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-stone-50 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.studentIds.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-500/30"
                      />
                      <span className="text-xs text-stone-700">
                        {student.user.firstName} {student.user.lastName}
                        {student.studentId && (
                          <span className="text-stone-500 ml-1.5">({student.studentId})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {errors.studentIds && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {errors.studentIds}
              </p>
            )}
            <p className="mt-1 text-[10px] text-stone-500">
              {formData.studentIds.length} élève(s) sélectionné(s) sur {filteredStudents.length}
            </p>
          </div>
        )}

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
                {isEditMode ? 'Mettre à jour' : 'Créer le devoir'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAssignmentModal;






