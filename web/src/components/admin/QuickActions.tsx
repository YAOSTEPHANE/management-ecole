import Card from '../ui/Card';
import Button from '../ui/Button';
import { FiUserPlus, FiBook, FiUsers, FiFileText, FiSettings, FiDownload, FiShield } from 'react-icons/fi';

interface QuickActionsProps {
  onAddStudent?: () => void;
  onCreateClass?: () => void;
  onAddTeacher?: () => void;
  onAddEducator?: () => void;
  onGenerateReport?: () => void;
  onExportData?: () => void;
  onSettings?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddStudent,
  onCreateClass,
  onAddTeacher,
  onAddEducator,
  onGenerateReport,
  onExportData,
  onSettings,
}) => {
  const actions = [
    {
      icon: FiUserPlus,
      label: 'Ajouter un élève',
      color: 'from-blue-500 to-blue-600',
      onClick: () => onAddStudent?.(),
    },
    {
      icon: FiBook,
      label: 'Créer une classe',
      color: 'from-green-500 to-green-600',
      onClick: () => onCreateClass?.(),
    },
    {
      icon: FiUsers,
      label: 'Ajouter un enseignant',
      color: 'from-indigo-500 to-indigo-600',
      onClick: () => onAddTeacher?.(),
    },
    {
      icon: FiShield,
      label: 'Ajouter un éducateur',
      color: 'from-purple-500 to-purple-600',
      onClick: () => onAddEducator?.(),
    },
    {
      icon: FiFileText,
      label: 'Générer un rapport',
      color: 'from-orange-500 to-orange-600',
      onClick: () => onGenerateReport?.(),
    },
    {
      icon: FiDownload,
      label: 'Exporter les données',
      color: 'from-indigo-500 to-indigo-600',
      onClick: () => onExportData?.(),
    },
    {
      icon: FiSettings,
      label: 'Paramètres',
      color: 'from-gray-500 to-gray-600',
      onClick: () => onSettings?.(),
    },
  ];

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-left transition-colors"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;

