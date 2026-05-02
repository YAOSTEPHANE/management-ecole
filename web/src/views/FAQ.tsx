import { useState } from 'react';
import Link from 'next/link';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import {
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiMail,
  FiMessageSquare,
} from 'react-icons/fi';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'Comment créer un compte administrateur ?',
      answer: 'Pour créer un compte administrateur, vous devez contacter le support technique. Les comptes administrateurs sont créés manuellement pour des raisons de sécurité. Envoyez une demande à contact@schoolmanager.com avec vos informations.',
      category: 'compte',
    },
    {
      id: 2,
      question: 'Comment réinitialiser mon mot de passe ?',
      answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe. Si vous ne recevez pas l\'email, vérifiez votre dossier spam.',
      category: 'compte',
    },
    {
      id: 3,
      question: 'Comment ajouter un nouvel élève ?',
      answer: 'Connectez-vous en tant qu\'administrateur, allez dans "Gestion Administrative" > "Élèves", puis cliquez sur "Ajouter un élève". Remplissez le formulaire en plusieurs étapes avec les informations personnelles, académiques et de contact.',
      category: 'gestion',
    },
    {
      id: 4,
      question: 'Comment créer une classe ?',
      answer: 'Dans le tableau de bord administrateur, allez dans "Gestion Administrative" > "Classes", puis cliquez sur "Créer une classe". Remplissez les informations de la classe (nom, niveau, année académique, capacité) et assignez un enseignant principal.',
      category: 'gestion',
    },
    {
      id: 5,
      question: 'Comment saisir les notes des élèves ?',
      answer: 'En tant qu\'enseignant, allez dans "Mes Cours", sélectionnez un cours, puis "Notes". Cliquez sur "Ajouter une note" et remplissez le formulaire avec le type d\'évaluation, la note et le coefficient.',
      category: 'pedagogie',
    },
    {
      id: 6,
      question: 'Comment générer un bulletin de notes ?',
      answer: 'Les bulletins sont générés automatiquement à la fin de chaque trimestre. Vous pouvez également les générer manuellement depuis "Gestion Complète" > "Bulletins" en sélectionnant la classe et le trimestre souhaités.',
      category: 'pedagogie',
    },
    {
      id: 7,
      question: 'Comment gérer les absences ?',
      answer: 'Les enseignants peuvent marquer les absences depuis "Mes Cours" > "Absences". Les absences peuvent être excusées ou non excusées. Les parents reçoivent une notification pour chaque absence non excusée.',
      category: 'pedagogie',
    },
    {
      id: 8,
      question: 'Comment contacter le support technique ?',
      answer: 'Vous pouvez contacter le support par email à support@schoolmanager.com, par téléphone au +33 1 23 45 67 89, ou via le formulaire de contact sur notre site web. Le support est disponible du lundi au vendredi de 9h à 18h.',
      category: 'support',
    },
    {
      id: 9,
      question: 'Quels navigateurs sont supportés ?',
      answer: 'School Manager fonctionne sur tous les navigateurs modernes : Chrome, Firefox, Safari, Edge (versions récentes). Pour une expérience optimale, nous recommandons d\'utiliser la dernière version de votre navigateur.',
      category: 'technique',
    },
    {
      id: 10,
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Oui, toutes les données sont chiffrées en transit (HTTPS) et au repos. Nous respectons le RGPD et mettons en place des mesures de sécurité strictes. Consultez notre Politique de Confidentialité pour plus d\'informations.',
      category: 'securite',
    },
    {
      id: 11,
      question: 'Comment exporter les données ?',
      answer: 'Les administrateurs peuvent exporter les données depuis "Gestion Administrative" > "Exporter les données". Vous pouvez choisir le format (CSV, JSON, PDF) et le type de données à exporter (élèves, classes, enseignants, ou tout).',
      category: 'gestion',
    },
    {
      id: 12,
      question: 'Comment configurer les notifications ?',
      answer: 'Allez dans "Paramètres" > "Notifications" pour configurer vos préférences. Vous pouvez activer ou désactiver les notifications par email, SMS, et notifications push pour différents types d\'événements.',
      category: 'parametres',
    },
  ];

  const categories = [
    { id: 'all', label: 'Toutes les catégories' },
    { id: 'compte', label: 'Compte' },
    { id: 'gestion', label: 'Gestion' },
    { id: 'pedagogie', label: 'Pédagogie' },
    { id: 'support', label: 'Support' },
    { id: 'technique', label: 'Technique' },
    { id: 'securite', label: 'Sécurité' },
    { id: 'parametres', label: 'Paramètres' },
  ];

  const filteredItems = faqItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: number) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">FAQ</h1>
          <p className="text-xl text-blue-100">
            Trouvez rapidement les réponses à vos questions
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <Card className="mb-8">
          <div className="space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans la FAQ..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {filteredItems.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <FiHelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune question trouvée pour votre recherche.</p>
              </div>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <FiHelpCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{item.question}</h3>
                      <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                    </div>
                  </div>
                  {expandedItems.includes(item.id) ? (
                    <FiChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                {expandedItems.includes(item.id) && (
                  <div className="px-6 pb-6 pt-0 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed mt-4">{item.answer}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mb-12">
          <div className="text-center py-8">
            <FiMessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Vous ne trouvez pas la réponse ?
            </h3>
            <p className="text-gray-600 mb-6">
              Notre équipe de support est là pour vous aider
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FiMail className="w-4 h-4 mr-2" />
                  Nous contacter
                </Button>
              </Link>
              <a href="mailto:support@schoolmanager.com">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <FiMail className="w-4 h-4 mr-2" />
                  support@schoolmanager.com
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;






