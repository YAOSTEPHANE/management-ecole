import Card from '../../ui/Card';
import { FiHeart, FiBookOpen, FiShield, FiCoffee } from 'react-icons/fi';

const items = [
  {
    icon: FiShield,
    title: 'Protection sociale & mutuelle',
    body:
      'Paramétrez les garanties collectives (santé, prévoyance) et communiquez les plafonds / remboursements auprès des équipes. Les adhésions individuelles peuvent être suivies dans les dossiers.',
    color: 'border-blue-100 bg-blue-50/50',
    iconClass: 'text-blue-600',
  },
  {
    icon: FiHeart,
    title: 'Congés payés & temps',
    body:
      'Les droits aux congés annuels et aux repos sont pilotés avec le module Congés (demandes enseignants). Pensez à aligner la politique interne sur le code du travail applicable.',
    color: 'border-rose-100 bg-rose-50/50',
    iconClass: 'text-rose-600',
  },
  {
    icon: FiBookOpen,
    title: 'Formation continue',
    body:
      'Planifiez les budgets formation, les certifications obligatoires et le suivi des heures (plan de développement des compétences).',
    color: 'border-violet-100 bg-violet-50/50',
    iconClass: 'text-violet-600',
  },
  {
    icon: FiCoffee,
    title: 'Qualité de vie au travail',
    body:
      'Télétravail ponctuel, aménagement du temps, équipements : centralisez les décisions et les contacts utiles (médecine du travail, CSE si applicable).',
    color: 'border-emerald-100 bg-emerald-50/50',
    iconClass: 'text-emerald-600',
  },
];

const HRBenefitsPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="p-4 border border-gray-200">
        <p className="text-sm text-gray-700">
          Cadre de pilotage des <strong>avantages sociaux</strong> et dispositifs d’accompagnement du
          personnel. Les montants et affiliations précises sont à consigner dans vos outils métier ou
          conventions collectives ; cette vue sert de <strong>référentiel</strong> pour la direction.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={`p-5 border ${item.color}`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  <Icon className={`w-6 h-6 ${item.iconClass}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HRBenefitsPanel;
