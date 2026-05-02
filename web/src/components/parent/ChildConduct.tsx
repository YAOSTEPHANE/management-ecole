import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { 
  FiShield, 
  FiUser,
  FiCalendar,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface ChildConductProps {
  studentId: string;
}

const ChildConduct = ({ studentId }: ChildConductProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<string>('all');

  const { data: conducts, isLoading } = useQuery({
    queryKey: ['parent-child-conduct', studentId, selectedPeriod, academicYear],
    queryFn: () => parentApi.getChildConduct(studentId, {
      ...(selectedPeriod !== 'all' && { period: selectedPeriod }),
      ...(academicYear !== 'all' && { academicYear }),
    }),
  });

  const periods: string[] = Array.from(
    new Set((conducts as any[])?.map((c: any) => c.period) || []),
  ).sort() as string[];
  const academicYears: string[] = Array.from(
    new Set((conducts as any[])?.map((c: any) => c.academicYear) || []),
  )
    .sort()
    .reverse() as string[];

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Chargement de la conduite...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      {conducts && conducts.length > 0 && (
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <FiFilter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrer par période:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Toutes</option>
                {periods.map((period) => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Année scolaire:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Toutes</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Liste des évaluations */}
      {!conducts || conducts.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <FiShield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">Aucune évaluation de conduite</p>
            <p className="text-sm">Les évaluations de conduite apparaîtront ici une fois effectuées par l'administration ou le professeur principal</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conducts.map((conduct: any) => (
            <Card key={conduct.id} hover>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{conduct.period}</h3>
                    <p className="text-sm text-gray-600">{conduct.academicYear}</p>
                  </div>
                  <Badge
                    variant={
                      conduct.average >= 16 ? 'success' :
                      conduct.average >= 12 ? 'secondary' :
                      conduct.average >= 10 ? 'warning' : 'danger'
                    }
                    size="sm"
                  >
                    {conduct.average.toFixed(1)}/20
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Ponctualité</p>
                    <p className="text-lg font-bold text-blue-600">{conduct.punctuality}/20</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Respect</p>
                    <p className="text-lg font-bold text-green-600">{conduct.respect}/20</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Participation</p>
                    <p className="text-lg font-bold text-purple-600">{conduct.participation}/20</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Comportement</p>
                    <p className="text-lg font-bold text-orange-600">{conduct.behavior}/20</p>
                  </div>
                </div>

                {conduct.comments && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{conduct.comments}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4" />
                    <span>
                      Évalué par: {conduct.evaluatedBy?.firstName} {conduct.evaluatedBy?.lastName}
                    </span>
                  </div>
                  <Badge
                    variant={conduct.evaluatedByRole === 'ADMIN' ? 'danger' : 'secondary'}
                    size="sm"
                  >
                    {conduct.evaluatedByRole === 'ADMIN' ? 'Administration' : 'Professeur Principal'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildConduct;



