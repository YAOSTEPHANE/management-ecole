import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { 
  FiBook, 
  FiUsers, 
  FiCalendar, 
  FiMapPin, 
  FiUser,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiCheck
} from 'react-icons/fi';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
    room: '',
    capacity: 30,
    teacherId: '',
  });

  // Fetch teachers for teacher selection
  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: adminApi.getTeachers,
    enabled: isOpen,
  });

  // Available levels
  const levels = [
    '6ème',
    '5ème',
    '4ème',
    '3ème',
    '2nde',
    '1ère',
    'Terminale',
  ];

  // Level colors for visual feedback
  const levelColors: Record<string, string> = {
    '6ème': 'from-blue-500 to-blue-600',
    '5ème': 'from-green-500 to-green-600',
    '4ème': 'from-yellow-500 to-yellow-600',
    '3ème': 'from-orange-500 to-orange-600',
    '2nde': 'from-purple-500 to-purple-600',
    '1ère': 'from-pink-500 to-pink-600',
    'Terminale': 'from-red-500 to-red-600',
  };

  // Mutation pour créer la classe
  const createClassMutation = useMutation({
    mutationFn: adminApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Classe créée avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création de la classe';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'capacity' ? parseInt(value) || 0 : value 
    }));
    // Clear error when user starts typing
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

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la classe est requis';
    }
    if (!formData.level) {
      newErrors.level = 'Le niveau est requis';
    }
    if (!formData.academicYear.trim()) {
      newErrors.academicYear = 'L\'année académique est requise';
    }
    if (formData.capacity && formData.capacity < 1) {
      newErrors.capacity = 'La capacité doit être supérieure à 0';
    }
    if (formData.capacity && formData.capacity > 50) {
      newErrors.capacity = 'La capacité ne peut pas dépasser 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      level: formData.level,
      academicYear: formData.academicYear,
      room: formData.room.trim() || undefined,
      capacity: formData.capacity || 30,
      teacherId: formData.teacherId || undefined,
    };

    createClassMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      level: '',
      academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
      room: '',
      capacity: 30,
      teacherId: '',
    });
    setErrors({});
    onClose();
  };

  const selectedLevelColor = formData.level ? levelColors[formData.level] || 'from-gray-500 to-gray-600' : 'from-gray-500 to-gray-600';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer une Classe" size="lg">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom de la classe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de la classe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiBook className="text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Ex: 6ème A, Terminale S, etc."
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Niveau et Année académique */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Niveau <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${selectedLevelColor}`}></div>
                </div>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none ${
                    errors.level ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">Sélectionner un niveau</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              {errors.level && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  {errors.level}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Année académique <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.academicYear ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="2024-2025"
                />
              </div>
              {errors.academicYear && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  {errors.academicYear}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Format: AAAA-AAAA</p>
            </div>
          </div>

          {/* Salle et Capacité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Salle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Ex: Salle 101, Labo 2, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Capacité
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUsers className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.capacity ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="30"
                />
              </div>
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  {errors.capacity}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Nombre maximum d'élèves (défaut: 30)</p>
            </div>
          </div>

          {/* Enseignant principal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enseignant principal (optionnel)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">Aucun enseignant assigné</option>
                {teachers?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                    {teacher.specialization && ` - ${teacher.specialization}`}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">Vous pourrez assigner un enseignant plus tard</p>
          </div>

          {/* Preview de la classe */}
          {formData.name && formData.level && (
            <div className={`p-4 rounded-xl bg-gradient-to-br ${selectedLevelColor} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Aperçu de la classe</p>
                  <p className="text-2xl font-black mt-1">{formData.name}</p>
                  <p className="text-sm opacity-90 mt-1">
                    {formData.level} • {formData.academicYear}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <FiUsers className="w-5 h-5 opacity-90" />
                    <span className="text-lg font-bold">{formData.capacity}</span>
                  </div>
                  <p className="text-xs opacity-75 mt-1">élèves max</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={createClassMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createClassMutation.isPending}
              className="min-w-[140px]"
            >
              {createClassMutation.isPending ? (
                <>
                  <FiLoader className="w-5 h-5 mr-2 animate-spin inline" />
                  Création...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5 mr-2 inline" />
                  Créer la classe
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddClassModal;






