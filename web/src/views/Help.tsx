import Link from 'next/link';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import {
  FiHelpCircle,
  FiBook,
  FiVideo,
  FiMessageSquare,
  FiMail,
  FiFileText,
  FiSearch,
  FiVideo as FiVideoIcon,
} from 'react-icons/fi';

const Help = () => {
  const helpCategories = [
    {
      title: 'Guides rapides',
      icon: FiBook,
      color: 'from-blue-500 to-blue-600',
      items: [
        'Créer votre premier compte',
        'Configurer votre établissement',
        'Ajouter des utilisateurs',
        'Importer des données',
      ],
    },
    {
      title: 'Tutoriels vidéo',
      icon: FiVideoIcon,
      color: 'from-green-500 to-green-600',
      items: [
        'Présentation générale',
        'Gestion des élèves',
        'Saisie des notes',
        'Génération de bulletins',
      ],
    },
    {
      title: 'Résolution de problèmes',
      icon: FiHelpCircle,
      color: 'from-orange-500 to-orange-600',
      items: [
        'Problèmes de connexion',
        'Erreurs courantes',
        'Récupération de mot de passe',
        'Problèmes techniques',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Centre d'aide</h1>
          <p className="text-xl text-blue-100">
            Trouvez l'aide dont vous avez besoin pour utiliser School Manager
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <Card className="mb-12">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Rechercher de l'aide..."
              className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </Card>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {helpCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="text-center py-8">
              <FiMessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">FAQ</h3>
              <p className="text-gray-600 mb-4">
                Consultez les questions fréquemment posées
              </p>
              <Link href="/faq">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Voir la FAQ
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="text-center py-8">
              <FiMail className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Contactez-nous</h3>
              <p className="text-gray-600 mb-4">
                Notre équipe est là pour vous aider
              </p>
              <Link href="/contact">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Documentation Link */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="text-center py-8">
            <FiFileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Documentation complète</h3>
            <p className="text-gray-600 mb-6">
              Accédez à la documentation détaillée pour approfondir vos connaissances
            </p>
            <Link href="/documentation">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <FiBook className="w-4 h-4 mr-2" />
                Accéder à la documentation
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Help;






