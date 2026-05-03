import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiMail, 
  FiPhone,
  FiAlertCircle,
  FiSave,
  FiLoader,
} from 'react-icons/fi';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, userId }) => {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing user data
  const { data: existingUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => adminApi.getUser(userId),
    enabled: isOpen && !!userId,
  });

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isActive: true,
  });

  // Load existing user data
  useEffect(() => {
    if (existingUser) {
      setFormData({
        firstName: existingUser.firstName || '',
        lastName: existingUser.lastName || '',
        email: existingUser.email || '',
        phone: existingUser.phone || '',
        isActive: existingUser.isActive !== undefined ? existingUser.isActive : true,
      });
    }
  }, [existingUser]);

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-role-stats'] });
      toast.success('Utilisateur mis à jour avec succès !');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour de l\'utilisateur';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    updateUserMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      isActive: formData.isActive,
    });
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const isLoading = isLoadingUser || updateUserMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Modifier un Utilisateur" size="lg" compact>
      <form onSubmit={handleSubmit} className="space-y-2">
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
                disabled={isLoading}
                className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                  errors.firstName ? 'border-red-500' : 'border-stone-200'
                } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
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
                disabled={isLoading}
                className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                  errors.lastName ? 'border-red-500' : 'border-stone-200'
                } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
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
            Adresse email <span className="text-red-500">*</span>
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
              disabled={isLoading}
              className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all ${
                errors.email ? 'border-red-500' : 'border-stone-200'
              } ${isLoading ? 'bg-stone-100 cursor-not-allowed opacity-90' : ''}`}
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
              disabled={isLoading}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Statut
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={isLoading}
                className="form-checkbox h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-500/30"
              />
              <span className="ml-2 text-xs text-stone-700">Actif</span>
            </label>
          </div>
        </div>

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
                Mise à jour...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4 mr-1.5 inline" />
                Mettre à jour
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;






