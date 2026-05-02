import Link from 'next/link';
import Card from '../components/ui/Card';
import Footer from '../components/Footer';
import { FiShield, FiLock, FiDatabase, FiEye, FiCheckCircle } from 'react-icons/fi';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Politique de Confidentialité</h1>
          <p className="text-xl text-blue-100">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="mb-6">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FiShield className="w-6 h-6 mr-2 text-blue-600" />
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-6">
              School Manager s'engage à protéger votre vie privée et vos données personnelles.
              Cette politique de confidentialité explique comment nous collectons, utilisons et
              protégeons vos informations.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FiDatabase className="w-6 h-6 mr-2 text-blue-600" />
              2. Données collectées
            </h2>
            <p className="text-gray-700 mb-4">
              Nous collectons les données suivantes :
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
              <li>Informations personnelles (nom, prénom, email, téléphone)</li>
              <li>Données académiques (notes, absences, bulletins)</li>
              <li>Données de connexion (adresse IP, logs d'accès)</li>
              <li>Cookies et technologies similaires</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FiLock className="w-6 h-6 mr-2 text-blue-600" />
              3. Utilisation des données
            </h2>
            <p className="text-gray-700 mb-4">
              Nous utilisons vos données pour :
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
              <li>Fournir et améliorer nos services</li>
              <li>Gérer les comptes utilisateurs</li>
              <li>Envoyer des notifications importantes</li>
              <li>Assurer la sécurité de la plateforme</li>
              <li>Respecter nos obligations légales</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FiEye className="w-6 h-6 mr-2 text-blue-600" />
              4. Partage des données
            </h2>
            <p className="text-gray-700 mb-6">
              Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données
              uniquement dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
              <li>Avec votre consentement explicite</li>
              <li>Pour respecter une obligation légale</li>
              <li>Avec nos prestataires de services (sous contrat de confidentialité)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FiCheckCircle className="w-6 h-6 mr-2 text-blue-600" />
              5. Vos droits (RGPD)
            </h2>
            <p className="text-gray-700 mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition</li>
              <li>Droit de limitation du traitement</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              6. Sécurité
            </h2>
            <p className="text-gray-700 mb-6">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
              appropriées pour protéger vos données contre tout accès non autorisé, perte ou
              destruction.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              7. Contact
            </h2>
            <p className="text-gray-700 mb-4">
              Pour toute question concernant cette politique de confidentialité, contactez-nous :
            </p>
            <ul className="list-none text-gray-700 mb-6 space-y-2">
              <li>Email : privacy@schoolmanager.com</li>
              <li>Téléphone : +33 1 23 45 67 89</li>
            </ul>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;






