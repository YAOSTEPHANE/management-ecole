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
  FiClipboard,
  FiCalendar,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiCheck,
  FiAward
} from 'react-icons/fi';

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeId?: string | null; // Si fourni, on est en mode édition
}

const AddGradeModal: React.FC<AddGradeModalProps> = ({ isOpen, onClose, gradeId }) => {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = !!gradeId;
  
  // Fetch existing grade if editing
  const { data: existingGrade, isLoading: isLoadingGrade } = useQuery({
    queryKey: ['grade', gradeId],
    queryFn: () => adminApi.getGrade(gradeId!),
    enabled: isEditMode && isOpen && !!gradeId,
  });

  // Form data
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    teacherId: '',
    evaluationType: 'EXAM' as 'EXAM' | 'QUIZ' | 'HOMEWORK' | 'PROJECT' | 'ORAL',
    title: '',
    score: '',
    maxScore: '20',
    coefficient: '1',
    date: new Date().toISOString().split('T')[0],
    comments: '',
  });

  // Load existing grade data if editing
  useEffect(() => {
    if (existingGrade) {
      setFormData({
        studentId: existingGrade.studentId || '',
        courseId: existingGrade.courseId || '',
        teacherId: existingGrade.teacherId || '',
        evaluationType: existingGrade.evaluationType || 'EXAM',
        title: existingGrade.title || '',
        score: existingGrade.score?.toString() || '',
        maxScore: existingGrade.maxScore?.toString() || '20',
        coefficient: existingGrade.coefficient?.toString() || '1',
        date: existingGrade.date 
          ? new Date(existingGrade.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        comments: existingGrade.comments || '',
      });
    }
  }, [existingGrade]);

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
    // Student has a class object with id, not classId directly
    return student?.class?.id === course.classId;
  }) || [];

  // Filter teachers based on selected course
  const filteredTeachers = teachers?.filter((teacher: any) => {
    if (!formData.courseId) return true;
    const course = courses?.find((c: any) => c.id === formData.courseId);
    // Course has teacher object with id, not teacherId directly
    return course?.teacher?.id === teacher.id;
  }) || [];

  // Auto-select teacher when course is selected
  useEffect(() => {
    if (formData.courseId && !formData.teacherId) {
      const course = courses?.find((c: any) => c.id === formData.courseId);
      // Course has teacher object with id, not teacherId directly
      if (course?.teacher?.id) {
        setFormData(prev => ({ ...prev, teacherId: course.teacher.id }));
      }
    }
  }, [formData.courseId, courses, formData.teacherId]);

  // Mutation pour créer/modifier la note
  const createGradeMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditMode && gradeId) {
        return adminApi.updateGrade(gradeId, data);
      }
      return adminApi.createGrade(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grades'] });
      queryClient.invalidateQueries({ queryKey: ['grade', gradeId] });
      toast.success(isEditMode ? 'Note modifiée avec succès !' : 'Note créée avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || (isEditMode ? 'Erreur lors de la modification de la note' : 'Erreur lors de la création de la note');
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
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
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.score) {
      newErrors.score = 'La note est requise';
    } else {
      const scoreNum = parseFloat(formData.score);
      if (isNaN(scoreNum) || scoreNum < 0) {
        newErrors.score = 'La note doit être un nombre positif';
      }
    }
    if (!formData.maxScore) {
      newErrors.maxScore = 'La note maximale est requise';
    } else {
      const maxScoreNum = parseFloat(formData.maxScore);
      if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
        newErrors.maxScore = 'La note maximale doit être un nombre positif';
      }
      if (parseFloat(formData.score) > maxScoreNum) {
        newErrors.score = 'La note ne peut pas être supérieure à la note maximale';
      }
    }
    if (!formData.coefficient) {
      newErrors.coefficient = 'Le coefficient est requis';
    } else {
      const coeffNum = parseFloat(formData.coefficient);
      if (isNaN(coeffNum) || coeffNum <= 0) {
        newErrors.coefficient = 'Le coefficient doit être un nombre positif';
      }
    }
    if (!formData.date) newErrors.date = 'La date est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      studentId: formData.studentId,
      courseId: formData.courseId,
      teacherId: formData.teacherId,
      evaluationType: formData.evaluationType,
      title: formData.title,
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      coefficient: parseFloat(formData.coefficient),
      date: formData.date,
      ...(formData.comments && { comments: formData.comments }),
    };

    // En mode édition, on envoie seulement les champs modifiables
    if (isEditMode) {
      const updateData: any = {
        title: formData.title,
        score: parseFloat(formData.score),
        maxScore: parseFloat(formData.maxScore),
        coefficient: parseFloat(formData.coefficient),
        date: formData.date,
        ...(formData.comments !== undefined && { comments: formData.comments }),
      };
      createGradeMutation.mutate(updateData);
    } else {
      createGradeMutation.mutate(submitData);
    }
  };

  const handleClose = () => {
    setFormData({
      studentId: '',
      courseId: '',
      teacherId: '',
      evaluationType: 'EXAM',
      title: '',
      score: '',
      maxScore: '20',
      coefficient: '1',
      date: new Date().toISOString().split('T')[0],
      comments: '',
    });
    setErrors({});
    onClose();
  };

  const evaluationTypes = [
    { value: 'EXAM', label: 'Examen' },
    { value: 'QUIZ', label: 'Contrôle' },
    { value: 'HOMEWORK', label: 'Devoir maison' },
    { value: 'PROJECT', label: 'Projet' },
    { value: 'ORAL', label: 'Oral' },
  ];

  const selectedStudent = students?.find((s: any) => s.id === formData.studentId);
  const selectedCourse = courses?.find((c: any) => c.id === formData.courseId);
  const selectedTeacher = teachers?.find((t: any) => t.id === formData.teacherId);

  // Calculate percentage
  const percentage = formData.score && formData.maxScore
    ? ((parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100).toFixed(1)
    : '0';

  if (isEditMode && isLoadingGrade) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Modifier une Note" : "Ajouter une Note"} size="xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement des données de la note...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Modifier une Note" : "Ajouter une Note"} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Élève <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="text-gray-400" />
            </div>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.studentId ? 'border-red-500' : 'border-gray-200'
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Sélectionner un élève</option>
              {students?.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.user.firstName} {student.user.lastName} - {student.studentId} {student.class?.name ? `(${student.class.name})` : ''}
                </option>
              ))}
            </select>
          </div>
          {errors.studentId && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.studentId}
            </p>
          )}
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Matière <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiBook className="text-gray-400" />
            </div>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.courseId ? 'border-red-500' : 'border-gray-200'
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Sélectionner une matière</option>
              {filteredCourses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name} {course.code ? `(${course.code})` : ''} - {course.class?.name || ''}
                </option>
              ))}
            </select>
          </div>
          {errors.courseId && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.courseId}
            </p>
          )}
        </div>

        {/* Teacher Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enseignant <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="text-gray-400" />
            </div>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.teacherId ? 'border-red-500' : 'border-gray-200'
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Sélectionner un enseignant</option>
              {filteredTeachers.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName} - {teacher.specialization}
                </option>
              ))}
            </select>
          </div>
          {errors.teacherId && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.teacherId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Evaluation Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'évaluation <span className="text-red-500">*</span>
            </label>
            <select
              name="evaluationType"
              value={formData.evaluationType}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.evaluationType ? 'border-red-500' : 'border-gray-200'
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              {evaluationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.date ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.date}
              </p>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Titre de l'évaluation <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiClipboard className="text-gray-400" />
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.title ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Ex: Contrôle de mathématiques - Chapitre 3"
            />
          </div>
          {errors.title && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Score and Max Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note obtenue <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiAward className="text-gray-400" />
              </div>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.score ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.score && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.score}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note maximale <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="maxScore"
              value={formData.maxScore}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.maxScore ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="20"
            />
            {errors.maxScore && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.maxScore}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coefficient <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="coefficient"
              value={formData.coefficient}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.coefficient ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="1"
            />
            {errors.coefficient && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.coefficient}
              </p>
            )}
          </div>
        </div>

        {/* Percentage Preview */}
        {formData.score && formData.maxScore && !errors.score && !errors.maxScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiAward className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Pourcentage:</span>
              </div>
              <Badge className={`${
                parseFloat(percentage) >= 80 ? 'bg-green-100 text-green-800' :
                parseFloat(percentage) >= 60 ? 'bg-blue-100 text-blue-800' :
                parseFloat(percentage) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {percentage}%
              </Badge>
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Commentaires (optionnel)
          </label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            placeholder="Commentaires sur la note..."
          />
        </div>

        {/* Summary */}
        {(selectedStudent || selectedCourse || selectedTeacher) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Résumé:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {selectedStudent && (
                <p><span className="font-medium">Élève:</span> {selectedStudent.user.firstName} {selectedStudent.user.lastName} {selectedStudent.class?.name ? `(${selectedStudent.class.name})` : ''}</p>
              )}
              {selectedCourse && (
                <p><span className="font-medium">Matière:</span> {selectedCourse.name} {selectedCourse.code ? `(${selectedCourse.code})` : ''}</p>
              )}
              {selectedTeacher && (
                <p><span className="font-medium">Enseignant:</span> {selectedTeacher.user.firstName} {selectedTeacher.user.lastName}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createGradeMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createGradeMutation.isPending}
            className="min-w-[140px]"
          >
            {createGradeMutation.isPending ? (
              <>
                <FiLoader className="w-5 h-5 mr-2 animate-spin inline" />
                {isEditMode ? 'Modification...' : 'Création...'}
              </>
            ) : (
              <>
                <FiSave className="w-5 h-5 mr-2 inline" />
                {isEditMode ? 'Enregistrer' : 'Créer la note'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGradeModal;




