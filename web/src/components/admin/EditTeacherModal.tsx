import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiPhone, 
  FiBriefcase,
  FiDollarSign,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiCheck,
  FiBook
} from 'react-icons/fi';

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
}

const EditTeacherModal: React.FC<EditTeacherModalProps> = ({ isOpen, onClose, teacherId }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch teacher data
  const { data: teacher, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => adminApi.getTeacher(teacherId),
    enabled: isOpen && !!teacherId,
  });

  // Form data
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Informations professionnelles
    specialization: '',
    contractType: 'CDI',
    salary: '',
    isActive: true,
  });

  // Load teacher data into form
  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.user?.firstName || '',
        lastName: teacher.user?.lastName || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        specialization: teacher.specialization || '',
        contractType: teacher.contractType || 'CDI',
        salary: teacher.salary ? teacher.salary.toString() : '',
        isActive: teacher.user?.isActive !== undefined ? teacher.user.isActive : true,
      });
    }
  }, [teacher]);

  // Available specializations
  const specializations = [
    'Mathématiques',
    'Français',
    'Anglais',
    'Histoire-Géographie',
    'Sciences de la Vie et de la Terre',
    'Physique-Chimie',
    'Éducation Physique et Sportive',
    'Arts Plastiques',
    'Musique',
    'Technologie',
    'Espagnol',
    'Allemand',
    'Philosophie',
    'Sciences Économiques et Sociales',
    'Autre',
  ];

  const contractTypes = [
    { value: 'CDI', label: 'CDI (Contrat à Durée Indéterminée)' },
    { value: 'CDD', label: 'CDD (Contrat à Durée Déterminée)' },
    { value: 'STAGE', label: 'Stage' },
    { value: 'INTERIM', label: 'Intérim' },
  ];

  // Mutation pour mettre à jour l'enseignant
  const updateTeacherMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateTeacher(teacherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Enseignant modifié avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la modification de l\'enseignant';
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

  const handleToggleActive = () => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive,
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
      if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
    }

    if (step === 2) {
      if (!formData.specialization.trim()) newErrors.specialization = 'La spécialité est requise';
      if (!formData.contractType) newErrors.contractType = 'Le type de contrat est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < 2) {
      handleNext();
      return;
    }

    // Prepare update data
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      specialization: formData.specialization,
      contractType: formData.contractType,
      salary: formData.salary || undefined,
      isActive: formData.isActive,
    };

    updateTeacherMutation.mutate(updateData);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setErrors({});
    onClose();
  };

  const steps = [
    { number: 1, title: 'Informations Personnelles', icon: FiUser },
    { number: 2, title: 'Informations Professionnelles', icon: FiBriefcase },
  ];

  if (isLoadingTeacher) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Enseignant" size="xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement des données de l'enseignant...</p>
        </div>
      </Modal>
    );
  }

  if (!teacher) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Enseignant" size="xl">
        <div className="text-center py-12">
          <FiAlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Enseignant non trouvé</h3>
          <p className="text-gray-600">L'enseignant demandé n'existe pas ou a été supprimé.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Enseignant" size="xl">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <FiCheck className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium text-center ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Informations Personnelles */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        errors.firstName ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Prénom"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        errors.lastName ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Nom"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informations Professionnelles */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <FiBriefcase className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">
                    ID Employé: <span className="font-mono">{teacher.employeeId}</span>
                  </p>
                </div>
                <p className="text-xs text-blue-700 mt-1">L'ID employé ne peut pas être modifié</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Spécialisation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiBook className="text-gray-400" />
                    </div>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        errors.specialization ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Sélectionner une spécialisation</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de contrat <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.contractType ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    {contractTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.contractType && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.contractType}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Salaire (optionnel)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Ex: 500000 (en FCFA)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Montant en FCFA</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Statut
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      className={`relative inline-flex h-11 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-9 w-9 transform rounded-full bg-white transition-transform ${
                          formData.isActive ? 'translate-x-10' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <Badge variant={formData.isActive ? 'success' : 'danger'}>
                      {formData.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={updateTeacherMutation.isPending}
                >
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={updateTeacherMutation.isPending}
              >
                Annuler
              </Button>
              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={updateTeacherMutation.isPending}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={updateTeacherMutation.isPending}
                  className="min-w-[140px]"
                >
                  {updateTeacherMutation.isPending ? (
                    <>
                      <FiLoader className="w-5 h-5 mr-2 animate-spin inline" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5 mr-2 inline" />
                      Enregistrer
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditTeacherModal;






