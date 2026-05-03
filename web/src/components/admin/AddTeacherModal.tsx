import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
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

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Informations professionnelles
    employeeId: '',
    specialization: '',
    hireDate: new Date().toISOString().split('T')[0],
    contractType: 'CDI',
    salary: '',
  });

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

  // Generate employee ID automatically
  useEffect(() => {
    if (!formData.employeeId && formData.firstName && formData.lastName) {
      const initials = `${formData.firstName[0]?.toUpperCase() || ''}${formData.lastName[0]?.toUpperCase() || ''}`;
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData(prev => ({
        ...prev,
        employeeId: `EMP${initials}${random}`,
      }));
    }
  }, [formData.firstName, formData.lastName]);

  // Mutation pour créer l'enseignant
  const createTeacherMutation = useMutation({
    mutationFn: adminApi.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Enseignant créé avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création de l\'enseignant';
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
      [name]: name === 'salary' ? (value ? parseFloat(value) : '') : value 
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
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    if (step === 2) {
      if (!formData.employeeId.trim()) newErrors.employeeId = 'Le numéro d\'employé est requis';
      if (!formData.specialization.trim()) newErrors.specialization = 'La spécialité est requise';
      if (!formData.hireDate) newErrors.hireDate = 'La date d\'embauche est requise';
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
    
    if (!validateStep(2)) {
      return;
    }

    const submitData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      employeeId: formData.employeeId,
      specialization: formData.specialization,
      hireDate: formData.hireDate,
      contractType: formData.contractType,
      salary: formData.salary ? parseFloat(formData.salary.toString()) : undefined,
    };

    createTeacherMutation.mutate(submitData);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      employeeId: '',
      specialization: '',
      hireDate: new Date().toISOString().split('T')[0],
      contractType: 'CDI',
      salary: '',
    });
    setErrors({});
    onClose();
  };

  const steps = [
    { number: 1, title: 'Informations Personnelles', icon: FiUser },
    { number: 2, title: 'Informations Professionnelles', icon: FiBriefcase },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un Enseignant" size="lg" compact>
      <div className="space-y-2">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-stone-900 via-amber-900 to-stone-950 text-amber-50 ring-1 ring-amber-400/35 shadow-lg'
                        : isCompleted
                        ? 'bg-gradient-to-br from-emerald-800 to-teal-900 text-emerald-50 ring-1 ring-emerald-400/25'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isCompleted ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <p className={`mt-1 text-[10px] font-medium text-center leading-tight px-0.5 ${
                    isActive ? 'text-amber-800' : isCompleted ? 'text-emerald-800' : 'text-stone-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${
                    isCompleted ? 'bg-gradient-to-r from-emerald-700 to-teal-700' : 'bg-stone-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Step 1: Informations Personnelles */}
          {currentStep === 1 && (
            <div className="space-y-2 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiUser className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                        errors.firstName ? 'border-red-500' : 'border-stone-200'
                      }`}
                      placeholder="Prénom"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiUser className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                        errors.lastName ? 'border-red-500' : 'border-stone-200'
                      }`}
                      placeholder="Nom"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <FiMail className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                      errors.email ? 'border-red-500' : 'border-stone-200'
                    }`}
                    placeholder="email@exemple.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiLock className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                        errors.password ? 'border-red-500' : 'border-stone-200'
                      }`}
                      placeholder="Minimum 6 caractères"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiLock className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                        errors.confirmPassword ? 'border-red-500' : 'border-stone-200'
                      }`}
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <FiPhone className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informations Professionnelles */}
          {currentStep === 2 && (
            <div className="space-y-2 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Numéro d'employé <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <FiBriefcase className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                      errors.employeeId ? 'border-red-500' : 'border-stone-200'
                    }`}
                    placeholder="EMP001234"
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-stone-500">Généré automatiquement si vide</p>
                {errors.employeeId && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {errors.employeeId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Spécialité <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiBook className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all appearance-none ${
                        errors.specialization ? 'border-red-500' : 'border-stone-200'
                      }`}
                    >
                      <option value="">Sélectionner une spécialité</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.specialization && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date d'embauche <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiCalendar className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                        errors.hireDate ? 'border-red-500' : 'border-stone-200'
                      }`}
                    />
                  </div>
                  {errors.hireDate && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.hireDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Type de contrat <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleChange}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                      errors.contractType ? 'border-red-500' : 'border-stone-200'
                    }`}
                  >
                    {contractTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.contractType && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.contractType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Salaire (optionnel)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiDollarSign className="h-3.5 w-3.5 text-stone-400" />
                    </div>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
                      placeholder="Ex: 500000 (en FCFA)"
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-stone-500">Montant en FCFA</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200/80">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={createTeacherMutation.isPending}
                >
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={createTeacherMutation.isPending}
              >
                Annuler
              </Button>
              {currentStep < 2 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  disabled={createTeacherMutation.isPending}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={createTeacherMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createTeacherMutation.isPending ? (
                    <>
                      <FiLoader className="w-4 h-4 mr-1.5 animate-spin inline" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-1.5 inline" />
                      Créer l&apos;enseignant
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

export default AddTeacherModal;

