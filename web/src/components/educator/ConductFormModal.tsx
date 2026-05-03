import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educatorApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
interface ConductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  conductId?: string | null;
}

const ConductFormModal = ({ isOpen, onClose, conductId }: ConductFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    studentId: '',
    period: 'Trimestre 1',
    academicYear: new Date().getFullYear().toString(),
    punctuality: 0,
    respect: 0,
    participation: 0,
    behavior: 0,
    comments: '',
  });

  const { data: students } = useQuery({
    queryKey: ['educator-students'],
    queryFn: educatorApi.getStudents,
  });

  const { data: existingConduct } = useQuery({
    queryKey: ['educator-conduct', conductId],
    queryFn: () => (conductId ? educatorApi.getConduct(conductId) : null),
    enabled: !!conductId && isOpen,
  });

  useEffect(() => {
    if (existingConduct) {
      setFormData({
        studentId: existingConduct.studentId,
        period: existingConduct.period,
        academicYear: existingConduct.academicYear,
        punctuality: existingConduct.punctuality,
        respect: existingConduct.respect,
        participation: existingConduct.participation,
        behavior: existingConduct.behavior,
        comments: existingConduct.comments || '',
      });
    } else if (!conductId) {
      // Reset form for new conduct
      setFormData({
        studentId: '',
        period: 'Trimestre 1',
        academicYear: new Date().getFullYear().toString(),
        punctuality: 0,
        respect: 0,
        participation: 0,
        behavior: 0,
        comments: '',
      });
    }
  }, [existingConduct, conductId, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (conductId) {
        return educatorApi.updateConduct(conductId, data);
      }
      return educatorApi.createConduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educator-conducts'] });
      toast.success(conductId ? 'Évaluation modifiée avec succès' : 'Évaluation créée avec succès');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId) {
      toast.error('Veuillez sélectionner un élève');
      return;
    }

    if (conductId) {
      createMutation.mutate({
        punctuality: formData.punctuality,
        respect: formData.respect,
        participation: formData.participation,
        behavior: formData.behavior,
        comments: formData.comments,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const periods = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2', 'Année complète'];
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 3 }, (_, i) => (currentYear - 1 + i).toString());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={conductId ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'} size="lg" compact>
      <form onSubmit={handleSubmit} className="space-y-2">
        {!conductId && (
          <>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Élève *
              </label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
                required
              >
                <option value="">Sélectionner un élève</option>
                {students?.map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.user.firstName} {student.user.lastName} - {student.class?.name || 'Non assigné'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Période *
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
                  required
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Année scolaire *
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
                  required
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}-{parseInt(year) + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ponctualité (0-20) *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.punctuality}
              onChange={(e) => setFormData({ ...formData, punctuality: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Respect (0-20) *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.respect}
              onChange={(e) => setFormData({ ...formData, respect: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Participation (0-20) *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.participation}
              onChange={(e) => setFormData({ ...formData, participation: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Comportement (0-20) *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.behavior}
              onChange={(e) => setFormData({ ...formData, behavior: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Commentaires
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            rows={4}
            className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all"
            placeholder="Commentaires sur la conduite de l'élève..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/80">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Enregistrement...' : conductId ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConductFormModal;
