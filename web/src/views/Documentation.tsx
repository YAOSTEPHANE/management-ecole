import Link from 'next/link';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import {
  FiBook,
  FiFileText,
  FiVideo,
  FiDownload,
  FiSearch,
  FiCode,
  FiSettings,
  FiUsers,
  FiBarChart,
  FiShield,
} from 'react-icons/fi';

const Documentation = () => {
  const sections = [
    {
      title: 'Guide de démarrage',
      icon: FiBook,
      color: 'from-blue-500 to-blue-600',
      items: [
        { title: 'Installation', link: '/docs/installation' },
        { title: 'Configuration initiale', link: '/docs/setup' },
        { title: 'Premiers pas', link: '/docs/getting-started' },
        { title: 'Architecture', link: '/docs/architecture' },
      ],
    },
    {
      title: 'Guides utilisateur',
      icon: FiUsers,
      color: 'from-green-500 to-green-600',
      items: [
        { title: 'Guide administrateur', link: '/docs/admin' },
        { title: 'Guide enseignant', link: '/docs/teacher' },
        { title: 'Guide élève', link: '/docs/student' },
        { title: 'Guide parent', link: '/docs/parent' },
      ],
    },
    {
      title: 'API & Développement',
      icon: FiCode,
      color: 'from-purple-500 to-purple-600',
      items: [
        { title: 'Documentation API', link: '/docs/api' },
        { title: 'Authentification', link: '/docs/auth' },
        { title: 'Endpoints', link: '/docs/endpoints' },
        { title: 'Exemples de code', link: '/docs/examples' },
      ],
    },
    {
      title: 'Fonctionnalités',
      icon: FiBarChart,
      color: 'from-orange-500 to-orange-600',
      items: [
        { title: 'Gestion administrative', link: '/docs/features/admin' },
        { title: 'Gestion pédagogique', link: '/docs/features/pedagogy' },
        { title: 'Communication', link: '/docs/features/communication' },
        { title: 'Rapports et analytics', link: '/docs/features/analytics' },
      ],
    },
    {
      title: 'Sécurité',
      icon: FiShield,
      color: 'from-red-500 to-red-600',
      items: [
        { title: 'Politique de sécurité', link: '/docs/security/policy' },
        { title: 'Bonnes pratiques', link: '/docs/security/best-practices' },
        { title: 'RGPD', link: '/docs/security/gdpr' },
        { title: 'Audit', link: '/docs/security/audit' },
      ],
    },
    {
      title: 'Ressources',
      icon: FiFileText,
      color: 'from-indigo-500 to-indigo-600',
      items: [
        { title: 'Tutoriels vidéo', link: '/docs/videos' },
        { title: 'FAQ technique', link: '/docs/faq' },
        { title: 'Changelog', link: '/docs/changelog' },
        { title: 'Support', link: '/contact' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Documentation</h1>
          <p className="text-xl text-blue-100 mb-6">
            Guides complets pour utiliser et intégrer School Manager
          </p>
          <div className="relative max-w-md mx-auto">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher dans la documentation..."
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        href={item.link}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center"
                      >
                        <FiFileText className="w-4 h-4 mr-2" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Besoin d'aide ?</h3>
            <p className="text-gray-600 mb-6">
              Notre équipe est disponible pour vous accompagner
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FiFileText className="w-4 h-4 mr-2" />
                  Nous contacter
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <FiSearch className="w-4 h-4 mr-2" />
                  Consulter la FAQ
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Documentation;






