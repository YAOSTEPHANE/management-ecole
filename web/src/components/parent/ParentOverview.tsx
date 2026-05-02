import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { FiCalendar, FiClipboard, FiAward, FiUsers, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

const ParentOverview = () => {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: parentApi.getChildren,
  });

  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['parent-grades', selectedChild],
    queryFn: () => parentApi.getChildGrades(selectedChild!),
    enabled: !!selectedChild,
  });

  const { data: absences, isLoading: absencesLoading } = useQuery({
    queryKey: ['parent-absences', selectedChild],
    queryFn: () => parentApi.getChildAbsences(selectedChild!),
    enabled: !!selectedChild,
  });

  // Sélectionner automatiquement le premier enfant si aucun n'est sélectionné (TOUJOURS avant tout return)
  useEffect(() => {
    if (!selectedChild && children && children.length > 0) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  // Loading state - après tous les hooks
  if (childrenLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const selectedChildData = children?.find((c: any) => c.id === selectedChild);

  // Calculer les statistiques pour l'enfant sélectionné
  const allGrades = grades?.grades || [];
  const totalScore = allGrades.reduce((sum: number, g: any) => {
    return sum + (g.score / g.maxScore) * 20 * g.coefficient;
  }, 0);
  const totalCoefficient = allGrades.reduce((sum: number, g: any) => sum + g.coefficient, 0);
  const overallAverage = totalCoefficient > 0 ? totalScore / totalCoefficient : 0;

  const totalAbsences = absences?.length || 0;
  const unexcusedAbsences = absences?.filter((a: any) => !a.excused).length || 0;

  const stats = [
    {
      title: 'Moyenne Générale',
      value: overallAverage > 0 ? overallAverage.toFixed(2) : '-',
      subtitle: '/ 20',
      icon: FiAward,
      color: overallAverage >= 16 ? 'from-green-500 to-green-600' : overallAverage >= 12 ? 'from-blue-500 to-blue-600' : overallAverage >= 10 ? 'from-yellow-500 to-yellow-600' : overallAverage > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600',
      badge: overallAverage >= 10 ? 'Admis' : overallAverage > 0 ? 'Non admis' : 'N/A',
      badgeVariant:
        overallAverage >= 10
          ? ('success' as const)
          : overallAverage > 0
            ? ('danger' as const)
            : ('default' as const),
    },
    {
      title: 'Notes',
      value: allGrades.length,
      subtitle: 'Total',
      icon: FiClipboard,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Absences',
      value: totalAbsences,
      subtitle: `${unexcusedAbsences} non justifiées`,
      icon: FiCalendar,
      color: unexcusedAbsences > 0 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600',
      badge: unexcusedAbsences > 0 ? 'Attention' : 'OK',
      badgeVariant: unexcusedAbsences > 0 ? ('warning' as const) : ('success' as const),
    },
    {
      title: 'Enfants',
      value: children?.length || 0,
      subtitle: 'Inscrits',
      icon: FiUsers,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-[1px] shadow-lg shadow-orange-500/15">
        <div className="rounded-[15px] bg-white/97 backdrop-blur-xl px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
            Espace familles
          </p>
          <p className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Vue consolidée par enfant : résultats, assiduité et messages. Sélectionnez un profil ci-dessous lorsque vous
            avez plusieurs enfants inscrits.
          </p>
        </div>
      </div>

      {/* Sélection d'enfant */}
      {children && children.length > 1 && (
        <Card variant="premium" className="ring-1 ring-slate-900/5">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Sélectionner un enfant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedChild === child.id
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-500/10'
                    : 'border-slate-200 hover:border-orange-200 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={child.user.avatar}
                    name={`${child.user.firstName} ${child.user.lastName}`}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {child.user.firstName} {child.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{child.class?.name || 'Non assigné'}</p>
                  </div>
                  {selectedChild === child.id && (
                    <Badge variant="info" size="sm">Sélectionné</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Statistiques */}
      {selectedChildData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} variant="premium" hover className="overflow-hidden ring-1 ring-slate-900/5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <div className="flex items-baseline space-x-1">
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        {stat.subtitle && (
                          <p className="text-sm text-gray-500">{stat.subtitle}</p>
                        )}
                      </div>
                      {stat.badge && (
                        <div className="mt-2">
                          <Badge variant={stat.badgeVariant} size="sm">
                            {stat.badge}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white transform rotate-3 hover:rotate-6 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Informations de l'enfant sélectionné */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="premium" className="ring-1 ring-slate-900/5">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar
                  src={selectedChildData.user.avatar}
                  name={`${selectedChildData.user.firstName} ${selectedChildData.user.lastName}`}
                  size="lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedChildData.user.firstName} {selectedChildData.user.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedChildData.class?.name || 'Non assigné'}</p>
                  <p className="text-sm text-gray-500">ID: {selectedChildData.studentId}</p>
                </div>
              </div>
            </Card>

            {/* Alertes */}
            {(unexcusedAbsences > 0 || overallAverage < 10) && (
              <Card className="border-l-4 border-orange-500">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Attention requise</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      {unexcusedAbsences > 0 && (
                        <p>• {unexcusedAbsences} absence(s) non justifiée(s)</p>
                      )}
                      {overallAverage > 0 && overallAverage < 10 && (
                        <p>• Moyenne générale en dessous de 10/20</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {(!children || children.length === 0) && (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">Aucun enfant enregistré</p>
            <p className="text-sm">Contactez l'administration pour lier vos enfants à votre compte</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ParentOverview;

