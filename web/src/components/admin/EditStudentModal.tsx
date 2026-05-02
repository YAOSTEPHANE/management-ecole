import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import IdentityDocumentsPanel from '../identity/IdentityDocumentsPanel';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiMapPin, 
  FiPhone, 
  FiUserCheck, 
  FiAlertCircle,
  FiBook,
  FiCheck,
  FiSave,
  FiLoader
} from 'react-icons/fi';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, studentId }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch student data
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => adminApi.getStudent(studentId),
    enabled: isOpen && !!studentId,
  });

  // Form data
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    
    // Informations académiques
    classId: '',
    enrollmentStatus: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'GRADUATED',
    isActive: true,
    
    // Informations de contact
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalInfo: '',
  });

  // Load student data into form
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.user?.firstName || '',
        lastName: student.user?.lastName || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        dateOfBirth: student.dateOfBirth 
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: student.gender || 'MALE',
        classId: student.classId || '',
        enrollmentStatus:
          (student.enrollmentStatus as 'ACTIVE' | 'SUSPENDED' | 'GRADUATED') || 'ACTIVE',
        isActive: student.isActive !== undefined ? student.isActive : true,
        address: student.address || '',
        emergencyContact: student.emergencyContact || '',
        emergencyPhone: student.emergencyPhone || '',
        medicalInfo: student.medicalInfo || '',
      });
    }
  }, [student]);

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
    enabled: isOpen,
  });

  // Mutation pour mettre à jour l'élève
  const updateStudentMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Élève modifié avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la modification de l\'élève';
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
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'La date de naissance est requise';
      if (!formData.gender) newErrors.gender = 'Le genre est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
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

    if (currentStep < 3) {
      handleNext();
      return;
    }

    // Prepare update data
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      classId: formData.classId || undefined,
      enrollmentStatus: formData.enrollmentStatus,
      isActive: formData.isActive,
      address: formData.address || undefined,
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined,
      medicalInfo: formData.medicalInfo || undefined,
    };

    updateStudentMutation.mutate(updateData);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setErrors({});
    onClose();
  };

  const steps = [
    { number: 1, title: 'Informations Personnelles', icon: FiUser },
    { number: 2, title: 'Informations Académiques', icon: FiBook },
    { number: 3, title: 'Contact & Santé', icon: FiPhone },
  ];

  if (isLoadingStudent) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Élève" size="xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement des données de l'élève...</p>
        </div>
      </Modal>
    );
  }

  if (!student) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Élève" size="xl">
        <div className="text-center py-12">
          <FiAlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Élève non trouvé</h3>
          <p className="text-gray-600">L'élève demandé n'existe pas ou a été supprimé.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Élève" size="xl">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date de naissance <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Genre <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.gender ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="MALE">Masculin</option>
                    <option value="FEMALE">Féminin</option>
                    <option value="OTHER">Autre</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informations Académiques */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <FiBook className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">
                    Numéro d'élève: <span className="font-mono">{student.studentId}</span>
                  </p>
                </div>
                <p className="text-xs text-blue-700 mt-1">Le numéro d'élève ne peut pas être modifié</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Classe
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes?.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {cls.level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enrollmentStatus" className="block text-sm font-semibold text-gray-700 mb-2">
                    Statut d&apos;inscription
                  </label>
                  <select
                    id="enrollmentStatus"
                    name="enrollmentStatus"
                    value={formData.enrollmentStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="ACTIVE">Inscription active</option>
                    <option value="SUSPENDED">Inscription suspendue</option>
                    <option value="GRADUATED">Diplômé·e</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Suspendu : l&apos;élève ne peut plus se connecter à l&apos;espace élève.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fiche élève (affichage admin)
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
                    {formData.isActive ? 'Fiche active' : 'Fiche inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Santé */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <FiMapPin className="text-gray-400" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact d'urgence
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUserCheck className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Nom du contact"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone d'urgence
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Informations médicales
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <FiAlertCircle className="text-gray-400" />
                  </div>
                  <textarea
                    name="medicalInfo"
                    value={formData.medicalInfo}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Allergies, conditions médicales, etc."
                  />
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
                  disabled={updateStudentMutation.isPending}
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
                disabled={updateStudentMutation.isPending}
              >
                Annuler
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={updateStudentMutation.isPending}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={updateStudentMutation.isPending}
                  className="min-w-[140px]"
                >
                  {updateStudentMutation.isPending ? (
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

        <div className="border-t border-gray-200 pt-8 mt-2">
          <IdentityDocumentsPanel mode="admin" studentId={studentId} />
        </div>
      </div>
    </Modal>
  );
};

export default EditStudentModal;






