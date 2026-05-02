import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { 
  FiDollarSign, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch,
  FiFilter,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiTrendingUp
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import toast from 'react-hot-toast';
import { formatFCFA } from '../../utils/currency';
import { getCurrentAcademicYear } from '../../utils/academicYear';

interface TuitionFeesManagementProps {
  /** Masque le titre principal (module Gestion des frais) */
  embedded?: boolean;
}

const TuitionFeesManagement: React.FC<TuitionFeesManagementProps> = ({ embedded = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [groupByStudent, setGroupByStudent] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    academicYear: getCurrentAcademicYear(),
    period: '',
    amount: '',
    dueDate: '',
    description: '',
  });

  const [bulkFormData, setBulkFormData] = useState({
    classId: '',
    academicYear: getCurrentAcademicYear(),
    period: '',
    amount: '',
    dueDate: '',
    description: '',
  });

  // Fetch data
  const { data: tuitionFees, isLoading } = useQuery({
    queryKey: ['admin-tuition-fees'],
    queryFn: () => adminApi.getTuitionFees(),
  });

  const { data: tuitionFeesGrouped, isLoading: isLoadingGrouped } = useQuery({
    queryKey: ['admin-tuition-fees-grouped', filterClass, filterStatus, filterPeriod],
    queryFn: () => adminApi.getTuitionFeesGrouped({
      ...(filterClass !== 'all' && { classId: filterClass }),
      ...(filterStatus === 'paid' && { isPaid: true }),
      ...(filterStatus === 'pending' && { isPaid: false }),
      ...(filterPeriod !== 'all' && { period: filterPeriod }),
    }),
    enabled: groupByStudent,
  });

  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => adminApi.getStudents(),
  });

  const { data: classes } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => adminApi.getClasses(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: adminApi.createTuitionFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tuition-fees'] });
      toast.success('Frais de scolarité créé avec succès');
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: adminApi.createTuitionFeesBulk,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tuition-fees'] });
      toast.success(`${data.created} frais créés avec succès${data.skipped > 0 ? `, ${data.skipped} ignorés` : ''}`);
      setShowBulkModal(false);
      resetBulkForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création en masse');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateTuitionFee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tuition-fees'] });
      toast.success('Frais de scolarité mis à jour avec succès');
      setShowEditModal(false);
      setSelectedFee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteTuitionFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tuition-fees'] });
      toast.success('Frais de scolarité supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const createTestMutation = useMutation({
    mutationFn: adminApi.createTestTuitionFees,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tuition-fees'] });
      toast.success(`${data.summary.totalCreated} frais de test créés avec succès !`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création des frais de test');
    },
  });

  // Filter and search
  const filteredFees = useMemo(() => {
    if (!tuitionFees) return [];
    
    return tuitionFees.filter((fee: any) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const studentName = `${fee.student?.user?.firstName || ''} ${fee.student?.user?.lastName || ''}`.toLowerCase();
        const period = fee.period?.toLowerCase() || '';
        const academicYear = fee.academicYear?.toLowerCase() || '';
        if (!studentName.includes(query) && !period.includes(query) && !academicYear.includes(query)) {
          return false;
        }
      }

      // Class filter
      if (filterClass !== 'all' && fee.student?.classId !== filterClass) {
        return false;
      }

      // Status filter
      if (filterStatus === 'paid' && !fee.isPaid) return false;
      if (filterStatus === 'pending' && fee.isPaid) return false;
      if (filterStatus === 'overdue' && (fee.isPaid || new Date(fee.dueDate) >= new Date())) return false;

      // Period filter
      if (filterPeriod !== 'all' && fee.period !== filterPeriod) {
        return false;
      }

      return true;
    });
  }, [tuitionFees, searchQuery, filterClass, filterStatus, filterPeriod]);

  // Filtrer les frais groupés
  const filteredGroupedFees = useMemo(() => {
    if (!tuitionFeesGrouped) return [];

    return tuitionFeesGrouped.filter((group: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const studentName = group.student.name.toLowerCase();
        const studentEmail = group.student.email.toLowerCase();
        const className = group.student.class.toLowerCase();
        
        if (!studentName.includes(query) && !studentEmail.includes(query) && !className.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [tuitionFeesGrouped, searchQuery]);

  // Expander toutes les sections par défaut au premier chargement
  useEffect(() => {
    if (groupByStudent && tuitionFeesGrouped && expandedStudents.size === 0 && tuitionFeesGrouped.length > 0) {
      setExpandedStudents(new Set(tuitionFeesGrouped.map((g: any) => g.student.id)));
    }
  }, [groupByStudent, tuitionFeesGrouped?.length]);

  const toggleStudent = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // Reset forms
  const resetForm = () => {
    setFormData({
      studentId: '',
      classId: '',
      academicYear: getCurrentAcademicYear(),
      period: '',
      amount: '',
      dueDate: '',
      description: '',
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      classId: '',
      academicYear: getCurrentAcademicYear(),
      period: '',
      amount: '',
      dueDate: '',
      description: '',
    });
  };

  // Handlers
  const handleCreate = () => {
    if (!formData.studentId || !formData.academicYear || !formData.period || !formData.amount || !formData.dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du montant
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Le montant doit être un nombre positif');
      return;
    }

    // Validation de la date
    const dueDateValue = new Date(formData.dueDate);
    if (isNaN(dueDateValue.getTime())) {
      toast.error('La date d\'échéance est invalide');
      return;
    }

    // Formatage de la date au format ISO
    const formattedDate = dueDateValue.toISOString().split('T')[0];

    console.log('Création d\'un frais avec les données:', {
      studentId: formData.studentId,
      academicYear: formData.academicYear,
      period: formData.period,
      amount: amountValue,
      dueDate: formattedDate,
      description: formData.description || undefined,
    });

    createMutation.mutate({
      studentId: formData.studentId,
      academicYear: formData.academicYear,
      period: formData.period,
      amount: amountValue,
      dueDate: formattedDate,
      description: formData.description || undefined,
    });
  };

  const handleBulkCreate = () => {
    if (!bulkFormData.classId || !bulkFormData.academicYear || !bulkFormData.period || !bulkFormData.amount || !bulkFormData.dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    bulkCreateMutation.mutate({
      classId: bulkFormData.classId,
      academicYear: bulkFormData.academicYear,
      period: bulkFormData.period,
      amount: parseFloat(bulkFormData.amount),
      dueDate: bulkFormData.dueDate,
      description: bulkFormData.description || undefined,
    });
  };

  const handleEdit = (fee: any) => {
    setSelectedFee(fee);
    setFormData({
      studentId: fee.studentId,
      classId: fee.student?.classId || '',
      academicYear: fee.academicYear,
      period: fee.period,
      amount: fee.amount.toString(),
      dueDate: format(new Date(fee.dueDate), 'yyyy-MM-dd'),
      description: fee.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!selectedFee) return;
    updateMutation.mutate({
      id: selectedFee.id,
      data: {
        academicYear: formData.academicYear,
        period: formData.period,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description || undefined,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce frais de scolarité ?')) {
      deleteMutation.mutate(id);
    }
  };

  // Get unique periods
  const periods = useMemo((): string[] => {
    if (!tuitionFees) return [];
    const uniquePeriods = new Set(tuitionFees.map((fee: any) => fee.period));
    return Array.from(uniquePeriods).filter(Boolean) as string[];
  }, [tuitionFees]);

  // Statistics
  const stats = useMemo(() => {
    if (!tuitionFees) return { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0, paidAmount: 0 };
    
    const total = tuitionFees.length;
    const paid = tuitionFees.filter((f: any) => f.isPaid).length;
    const pending = tuitionFees.filter((f: any) => !f.isPaid && new Date(f.dueDate) >= new Date()).length;
    const overdue = tuitionFees.filter((f: any) => !f.isPaid && new Date(f.dueDate) < new Date()).length;
    const totalAmount = tuitionFees.reduce((sum: number, f: any) => sum + f.amount, 0);
    const paidAmount = tuitionFees.filter((f: any) => f.isPaid).reduce((sum: number, f: any) => sum + f.amount, 0);

    return { total, paid, pending, overdue, totalAmount, paidAmount };
  }, [tuitionFees]);

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des frais de scolarité...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 ${embedded ? 'justify-end' : ''}`}
      >
        {!embedded && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Frais de Scolarité</h2>
            <p className="text-gray-600 mt-1">Attribuez et gérez les frais de scolarité des élèves</p>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={groupByStudent ? 'primary' : 'secondary'}
            onClick={() => {
              setGroupByStudent(!groupByStudent);
              if (!groupByStudent) {
                const allStudents = tuitionFeesGrouped?.map((g: any) => g.student.id) || [];
                setExpandedStudents(new Set(allStudents));
              }
            }}
          >
            <FiUsers className="w-4 h-4 mr-2" />
            {groupByStudent ? 'Par élève' : 'Liste simple'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => createTestMutation.mutate()}
            disabled={createTestMutation.isPending}
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Créer des frais de test
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowBulkModal(true)}
          >
            <FiUsers className="w-4 h-4 mr-2" />
            Attribuer à une classe
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Ajouter un frais
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">{formatFCFA(stats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Payés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
              <p className="text-xs text-gray-500 mt-1">{formatFCFA(stats.paidAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <FiCheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white">
              <FiClock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En retard</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white">
              <FiXCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par élève, période, année..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Toutes les classes</option>
            {classes?.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payés</option>
            <option value="pending">En attente</option>
            <option value="overdue">En retard</option>
          </select>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Toutes les périodes</option>
            {periods.map((period) => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table ou Vue groupée */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {groupByStudent 
              ? `Frais de Scolarité (${filteredGroupedFees?.length || 0} élève(s))`
              : `Liste des Frais (${filteredFees?.length || 0})`
            }
          </h2>
        </div>

        {groupByStudent ? (
          <div className="space-y-4">
            {filteredGroupedFees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiDollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Aucun frais de scolarité trouvé</p>
                <p className="text-sm">Créez un nouveau frais ou attribuez des frais à une classe</p>
              </div>
            ) : (
              filteredGroupedFees.map((group: any) => {
                const isExpanded = expandedStudents.has(group.student.id);
                
                return (
                  <Card key={group.student.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleStudent(group.student.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {isExpanded ? (
                          <FiChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <FiChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                        <Avatar
                          name={group.student.name}
                          size="md"
                        />
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {group.student.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {group.student.class} - {group.student.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-bold text-gray-900">{formatFCFA(group.totalAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Payé</p>
                          <p className="font-bold text-green-600">{formatFCFA(group.totalPaid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Restant</p>
                          <p className="font-bold text-orange-600">{formatFCFA(group.remainingAmount)}</p>
                        </div>
                        <div className="w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                              className={`h-2 rounded-full ${
                                group.paymentProgress >= 100
                                  ? 'bg-green-500'
                                  : group.paymentProgress >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(group.paymentProgress, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            {group.paymentProgress.toFixed(0)}%
                          </p>
                        </div>
                        <Badge variant="info" className="text-sm">
                          {group.fees.length} frais
                        </Badge>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200">
                        {/* Liste des frais pour cet élève */}
                        <div className="p-4 space-y-4">
                          {group.fees.map((fee: any) => {
                            const feeTotalPaid = fee.payments
                              ?.filter((p: any) => p.status === 'COMPLETED')
                              .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                            const feeRemaining = fee.amount - feeTotalPaid;
                            const feeProgress = fee.amount > 0 ? (feeTotalPaid / fee.amount) * 100 : 0;

                            return (
                              <div
                                key={fee.id}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {fee.period} - {fee.academicYear}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Échéance: {format(new Date(fee.dueDate), 'dd MMM yyyy', { locale: fr })}
                                    </p>
                                    {fee.description && (
                                      <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <p className="text-sm text-gray-500">Montant</p>
                                      <p className="font-bold text-gray-900">{formatFCFA(fee.amount)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-500">Payé</p>
                                      <p className="font-bold text-green-600">{formatFCFA(feeTotalPaid)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-500">Restant</p>
                                      <p className="font-bold text-orange-600">{formatFCFA(feeRemaining)}</p>
                                    </div>
                                    <Badge
                                      variant={
                                        feeProgress >= 100
                                          ? 'success'
                                          : feeProgress >= 50
                                          ? 'warning'
                                          : 'danger'
                                      }
                                      className="text-sm"
                                    >
                                      {feeProgress.toFixed(0)}%
                                    </Badge>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleEdit(fee)}
                                      >
                                        <FiEdit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(fee.id)}
                                      >
                                        <FiTrash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Paiements par parent */}
                                {group.byParent && group.byParent.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Paiements par parent :</p>
                                    <div className="space-y-2">
                                      {group.byParent.map((parentGroup: any) => (
                                        <div
                                          key={parentGroup.payer.id}
                                          className="bg-white rounded p-3 border border-gray-200 flex items-center justify-between"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <FiUser className="w-4 h-4 text-gray-400" />
                                            <div>
                                              <p className="text-sm font-medium text-gray-800">
                                                {parentGroup.payer.name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {parentGroup.payer.email} ({parentGroup.payer.role})
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-3">
                                            <div className="text-right">
                                              <p className="text-sm font-semibold text-gray-900">
                                                {formatFCFA(parentGroup.totalPaid)}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {parentGroup.payments.length} paiement{parentGroup.payments.length > 1 ? 's' : ''}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Élève</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Classe</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Période</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Année scolaire</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Échéance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      <FiDollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg mb-2">Aucun frais de scolarité trouvé</p>
                      <p className="text-sm">Créez un nouveau frais ou attribuez des frais à une classe</p>
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee: any) => (
                    <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {fee.student?.user?.firstName} {fee.student?.user?.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {fee.student?.class?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{fee.period}</td>
                      <td className="py-3 px-4 text-gray-600">{fee.academicYear}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{formatFCFA(fee.amount)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(new Date(fee.dueDate), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="py-3 px-4">
                        {fee.isPaid ? (
                          <Badge variant="success" size="sm">Payé</Badge>
                        ) : new Date(fee.dueDate) < new Date() ? (
                          <Badge variant="danger" size="sm">En retard</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">En attente</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(fee)}
                          >
                            <FiEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(fee.id)}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Ajouter un frais de scolarité"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Élève <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => {
                const student = students?.find((s: any) => s.id === e.target.value);
                setFormData({
                  ...formData,
                  studentId: e.target.value,
                  classId: student?.classId || '',
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner un élève</option>
              {students?.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.user.firstName} {student.user.lastName} {student.class?.name ? `(${student.class.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année scolaire <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner une période</option>
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
                <option value="Frais d'inscription">Frais d'inscription</option>
                <option value="Frais de scolarité annuelle">Frais de scolarité annuelle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description du frais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          resetBulkForm();
        }}
        title="Attribuer des frais à une classe"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classe <span className="text-red-500">*</span>
            </label>
            <select
              value={bulkFormData.classId}
              onChange={(e) => setBulkFormData({ ...bulkFormData, classId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner une classe</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.level}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Les frais seront attribués à tous les élèves actifs de cette classe
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année scolaire <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bulkFormData.academicYear}
                onChange={(e) => setBulkFormData({ ...bulkFormData, academicYear: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période <span className="text-red-500">*</span>
              </label>
              <select
                value={bulkFormData.period}
                onChange={(e) => setBulkFormData({ ...bulkFormData, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner une période</option>
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
                <option value="Frais d'inscription">Frais d'inscription</option>
                <option value="Frais de scolarité annuelle">Frais de scolarité annuelle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={bulkFormData.amount}
                onChange={(e) => setBulkFormData({ ...bulkFormData, amount: e.target.value })}
                placeholder="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={bulkFormData.dueDate}
                onChange={(e) => setBulkFormData({ ...bulkFormData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={bulkFormData.description}
              onChange={(e) => setBulkFormData({ ...bulkFormData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description du frais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBulkModal(false);
                resetBulkForm();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkCreate}
              disabled={bulkCreateMutation.isPending}
            >
              {bulkCreateMutation.isPending ? 'Création...' : 'Attribuer à la classe'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFee(null);
          resetForm();
        }}
        title="Modifier un frais de scolarité"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année scolaire <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
                <option value="Semestre 1">Semestre 1</option>
                <option value="Semestre 2">Semestre 2</option>
                <option value="Frais d'inscription">Frais d'inscription</option>
                <option value="Frais de scolarité annuelle">Frais de scolarité annuelle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description du frais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedFee(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TuitionFeesManagement;

