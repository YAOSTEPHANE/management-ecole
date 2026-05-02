import Link from 'next/link';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Footer from '../components/Footer';
import {
  FiCheck,
  FiX,
  FiStar,
  FiArrowRight,
  FiCreditCard,
} from 'react-icons/fi';

const Pricing = () => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '49',
      period: 'mois',
      description: 'Parfait pour les petites écoles',
      features: [
        'Jusqu\'à 100 élèves',
        'Jusqu\'à 10 enseignants',
        'Gestion des notes et bulletins',
        'Système d\'absences',
        'Emploi du temps',
        'Support email',
      ],
      limitations: [
        'Pas de module financier',
        'Pas de notifications SMS',
        'Stockage limité à 5GB',
      ],
      popular: false,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'professional',
      name: 'Professionnel',
      price: '99',
      period: 'mois',
      description: 'Idéal pour les établissements moyens',
      features: [
        'Jusqu\'à 500 élèves',
        'Jusqu\'à 50 enseignants',
        'Toutes les fonctionnalités Starter',
        'Module financier',
        'Notifications SMS',
        'Stockage 50GB',
        'Support prioritaire',
        'Formation incluse',
      ],
      limitations: [],
      popular: true,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      price: 'Sur mesure',
      period: '',
      description: 'Pour les grandes institutions',
      features: [
        'Nombre illimité d\'élèves',
        'Nombre illimité d\'enseignants',
        'Toutes les fonctionnalités',
        'API personnalisée',
        'Intégrations sur mesure',
        'Stockage illimité',
        'Support 24/7',
        'Formation dédiée',
        'Gestionnaire de compte dédié',
      ],
      limitations: [],
      popular: false,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Tarifs</h1>
          <p className="text-xl text-blue-100">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'border-4 border-blue-500 shadow-2xl transform scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <FiStar className="w-4 h-4 mr-1 inline" />
                    Le plus populaire
                  </Badge>
                </div>
              )}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <FiCreditCard className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  {plan.price === 'Sur mesure' ? (
                    <div className="text-3xl font-bold text-gray-800">{plan.price}</div>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-gray-800">{plan.price}€</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <FiCheck className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start opacity-60">
                    <FiX className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-500">{limitation}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {plan.price === 'Sur mesure' ? (
                  <>
                    Nous contacter
                    <FiArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Choisir ce plan
                    <FiArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card id="comparison" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Comparaison des plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fonctionnalité</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Starter</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Professionnel</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Entreprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Nombre d'élèves</td>
                  <td className="text-center py-3 px-4">Jusqu'à 100</td>
                  <td className="text-center py-3 px-4">Jusqu'à 500</td>
                  <td className="text-center py-3 px-4">Illimité</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Module financier</td>
                  <td className="text-center py-3 px-4">
                    <FiX className="w-5 h-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center py-3 px-4">
                    <FiCheck className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-3 px-4">
                    <FiCheck className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Support</td>
                  <td className="text-center py-3 px-4">Email</td>
                  <td className="text-center py-3 px-4">Prioritaire</td>
                  <td className="text-center py-3 px-4">24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-center py-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Vous avez des questions sur nos tarifs ?
          </h2>
          <p className="text-gray-600 mb-6">
            Notre équipe commerciale est disponible pour discuter de vos besoins spécifiques
          </p>
          <Link href="/contact">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FiArrowRight className="w-4 h-4 mr-2" />
              Contactez-nous
            </Button>
          </Link>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;






