import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import SearchBar from '../ui/SearchBar';
import FilterDropdown from '../ui/FilterDropdown';
import Avatar from '../ui/Avatar';
import { 
  FiDollarSign, 
  FiUsers, 
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiDownload,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { formatFCFA } from '../../utils/currency';
import toast from 'react-hot-toast';

interface PaymentsManagementProps {
  embedded?: boolean;
}

const PaymentsManagement: React.FC<PaymentsManagementProps> = ({ embedded = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [groupByStudent, setGroupByStudent] = useState(true);

  const { data: paymentsGrouped, isLoading } = useQuery({
    queryKey: ['admin-payments-grouped'],
    queryFn: () => adminApi.getPaymentsGrouped(),
  });

  // Filtrer les paiements
  const filteredPayments = useMemo(() => {
    if (!paymentsGrouped) return [];

    return paymentsGrouped.filter((group: any) => {
      // Recherche par nom d'élève
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const studentName = group.student.name.toLowerCase();
        const studentEmail = group.student.email.toLowerCase();
        const className = group.student.class.toLowerCase();
        
        if (!studentName.includes(query) && !studentEmail.includes(query) && !className.includes(query)) {
          return false;
        }
      }

      // Filtre par statut (si on veut filtrer par statut de paiement)
      // Pour l'instant, on garde tous les paiements

      return true;
    });
  }, [paymentsGrouped, searchQuery, filterStatus]);

  const toggleStudent = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // Expander toutes les sections par défaut au premier chargement
  useEffect(() => {
    if (paymentsGrouped && expandedStudents.size === 0 && paymentsGrouped.length > 0) {
      setExpandedStudents(new Set(paymentsGrouped.map((g: any) => g.student.id)));
    }
  }, [paymentsGrouped]);

  // Liste plate des paiements (pour vue liste et export)
  const flatPayments = useMemo(() => {
    if (!paymentsGrouped) return [];
    const list: Array<{
      id: string;
      studentName: string;
      studentClass: string;
      parentName: string;
      amount: number;
      status: string;
      createdAt: string;
      period?: string;
      academicYear?: string;
    }> = [];
    paymentsGrouped.forEach((group: any) => {
      group.byParent.forEach((parentGroup: any) => {
        parentGroup.payments.forEach((p: any) => {
          list.push({
            id: p.id,
            studentName: group.student.name,
            studentClass: group.student.class,
            parentName: parentGroup.parent.name,
            amount: p.amount,
            status: p.status,
            createdAt: p.createdAt,
            period: p.tuitionFee?.period,
            academicYear: p.tuitionFee?.academicYear,
          });
        });
      });
    });
    return list.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.studentClass.toLowerCase().includes(q) ||
        p.parentName.toLowerCase().includes(q)
      );
    });
  }, [paymentsGrouped, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    if (!paymentsGrouped) return { totalStudents: 0, totalPayments: 0, totalAmount: 0, totalParents: 0 };
    
    let totalPayments = 0;
    let totalAmount = 0;
    const parentSet = new Set<string>();

    paymentsGrouped.forEach((group: any) => {
      totalPayments += group.payments.length;
      totalAmount += group.totalPaid;
      group.byParent.forEach((parentGroup: any) => {
        parentSet.add(parentGroup.parent.id);
      });
    });

    return {
      totalStudents: paymentsGrouped.length,
      totalPayments,
      totalAmount,
      totalParents: parentSet.size,
    };
  }, [paymentsGrouped]);

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des paiements...</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h2>
            <p className="text-gray-600 mt-1">Paiements regroupés par élève et par parent</p>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={groupByStudent ? 'primary' : 'secondary'}
            onClick={() => setGroupByStudent(!groupByStudent)}
          >
            <FiUsers className="w-4 h-4 mr-2" />
            {groupByStudent ? 'Par élève' : 'Liste simple'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const rows = groupByStudent
                ? filteredPayments.flatMap((g: any) =>
                    g.byParent.flatMap((pg: any) =>
                      pg.payments.map((p: any) => ({
                        Élève: g.student.name,
                        Classe: g.student.class,
                        Parent: pg.parent.name,
                        Montant: p.amount,
                        Statut: p.status === 'COMPLETED' ? 'Complété' : p.status === 'PENDING' ? 'En attente' : 'Échoué',
                        Période: p.tuitionFee?.period ?? '',
                        'Année scolaire': p.tuitionFee?.academicYear ?? '',
                        Date: format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
                      }))
                    )
                  )
                : flatPayments.map((p) => ({
                    Élève: p.studentName,
                    Classe: p.studentClass,
                    Parent: p.parentName,
                    Montant: p.amount,
                    Statut: p.status === 'COMPLETED' ? 'Complété' : p.status === 'PENDING' ? 'En attente' : 'Échoué',
                    Période: p.period ?? '',
                    'Année scolaire': p.academicYear ?? '',
                    Date: format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
                  }));
              if (rows.length === 0) {
                toast.error('Aucune donnée à exporter');
                return;
              }
              const headers = Object.keys(rows[0]);
              const csv = [
                headers.join(';'),
                ...rows.map((r: Record<string, unknown>) =>
                  headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';')
                ),
              ].join('\n');
              const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `paiements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Export CSV téléchargé');
            }}
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Élèves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Paiements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total payé</p>
              <p className="text-2xl font-bold text-gray-900">{formatFCFA(stats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Parents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalParents}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white">
              <FiUser className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par élève, classe..."
            />
          </div>
          <FilterDropdown
            options={[
              { label: 'Tous', value: 'all' },
              { label: 'Complétés', value: 'completed' },
              { label: 'En attente', value: 'pending' },
              { label: 'Échoués', value: 'failed' },
            ]}
            selected={filterStatus}
            onChange={setFilterStatus}
            label="Statut"
          />
        </div>
      </Card>

      {/* Payments grouped by student */}
      {groupByStudent ? (
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <FiDollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Aucun paiement trouvé</p>
              </div>
            </Card>
          ) : (
            filteredPayments.map((group: any) => {
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
                        <p className="text-sm text-gray-500">Total payé</p>
                        <p className="font-bold text-green-600">{formatFCFA(group.totalPaid)}</p>
                      </div>
                      <Badge variant="info" className="text-sm">
                        {group.payments.length} paiement{group.payments.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Grouped by parent */}
                      <div className="p-4 space-y-4">
                        {group.byParent.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Aucun paiement enregistré
                          </p>
                        ) : (
                          group.byParent.map((parentGroup: any) => (
                            <div
                              key={parentGroup.parent.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <Avatar
                                    name={parentGroup.parent.name}
                                    size="sm"
                                  />
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {parentGroup.parent.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {parentGroup.parent.email} ({parentGroup.parent.role})
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Total payé</p>
                                  <p className="font-bold text-green-600">
                                    {formatFCFA(parentGroup.totalPaid)}
                                  </p>
                                </div>
                              </div>

                              {/* Liste des paiements de ce parent */}
                              <div className="mt-3 space-y-2">
                                {parentGroup.payments.map((payment: any) => (
                                  <div
                                    key={payment.id}
                                    className="bg-white rounded p-3 border border-gray-200 flex items-center justify-between"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800">
                                        {payment.tuitionFee?.period} - {payment.tuitionFee?.academicYear}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {format(new Date(payment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                          {formatFCFA(payment.amount)}
                                        </p>
                                        <Badge
                                          variant={
                                            payment.status === 'COMPLETED'
                                              ? 'success'
                                              : payment.status === 'PENDING'
                                              ? 'warning'
                                              : 'danger'
                                          }
                                          className="text-xs"
                                        >
                                          {payment.status === 'COMPLETED'
                                            ? 'Complété'
                                            : payment.status === 'PENDING'
                                            ? 'En attente'
                                            : 'Échoué'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            {flatPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiDollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Aucun paiement trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Élève</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Classe</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Parent</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Période</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {flatPayments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{p.studentName}</td>
                      <td className="py-3 px-4 text-gray-600">{p.studentClass}</td>
                      <td className="py-3 px-4 text-gray-600">{p.parentName}</td>
                      <td className="py-3 px-4 text-gray-600">{p.period ?? '-'} {p.academicYear ?? ''}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatFCFA(p.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            p.status === 'COMPLETED' ? 'success' : p.status === 'PENDING' ? 'warning' : 'danger'
                          }
                          size="sm"
                        >
                          {p.status === 'COMPLETED' ? 'Complété' : p.status === 'PENDING' ? 'En attente' : 'Échoué'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {format(new Date(p.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentsManagement;
