import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../services/api';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { FiUsers, FiBook, FiSearch } from 'react-icons/fi';

interface ChildrenListProps {
  onSelectChild: (childId: string) => void;
  selectedChild: string | null;
  searchQuery?: string;
}

const ChildrenList: React.FC<ChildrenListProps> = ({ onSelectChild, selectedChild, searchQuery = '' }) => {
  const { data: children, isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: parentApi.getChildren,
  });

  const filteredChildren = useMemo(() => {
    if (!children) return [];
    if (!searchQuery) return children;
    
    const query = searchQuery.toLowerCase();
    return children.filter((child: any) => {
      const firstName = child.user?.firstName?.toLowerCase() || '';
      const lastName = child.user?.lastName?.toLowerCase() || '';
      const className = child.class?.name?.toLowerCase() || '';
      const studentId = child.studentId?.toLowerCase() || '';
      return firstName.includes(query) || lastName.includes(query) || className.includes(query) || studentId.includes(query);
    });
  }, [children, searchQuery]);

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de recherche */}
      {searchQuery && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
          <div className="flex items-center space-x-3">
            <FiSearch className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-semibold text-gray-900">
                Recherche: <span className="text-orange-600">"{searchQuery}"</span>
              </p>
              <p className="text-sm text-gray-600">
                {filteredChildren.length} enfant(s) trouvé(s)
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Enfants</h2>
        {filteredChildren && filteredChildren.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChildren.map((child: any) => (
              <Card
                key={child.id}
                onClick={() => onSelectChild(child.id)}
                hover
                className={`cursor-pointer transition-all ${
                  selectedChild === child.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar
                    src={child.user.avatar}
                    name={`${child.user.firstName} ${child.user.lastName}`}
                    size="lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                      {child.user.firstName} {child.user.lastName}
                    </h3>
                    <Badge variant="info" size="sm" className="mt-1">
                      {child.relation}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiBook className="w-4 h-4" />
                    <span>Classe: {child.class?.name || 'Non assigné'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiUsers className="w-4 h-4" />
                    <span>ID: {child.studentId}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">
              {searchQuery ? 'Aucun enfant trouvé' : 'Aucun enfant enregistré'}
            </p>
            <p className="text-sm">
              {searchQuery 
                ? 'Essayez avec d\'autres critères de recherche'
                : 'Contactez l\'administration pour lier vos enfants à votre compte'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChildrenList;

