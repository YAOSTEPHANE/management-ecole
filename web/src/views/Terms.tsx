import Link from 'next/link';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import { 
  FiFileText, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiShield, 
  FiLock, 
  FiUser, 
  FiXCircle,
  FiInfo,
  FiMail,
  FiPhone,
} from 'react-icons/fi';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Conditions d'Utilisation</h1>
          <p className="text-xl text-blue-100 mb-2">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-blue-200 text-sm">
            En utilisant School Manager, vous acceptez ces conditions
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiInfo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Introduction</h3>
              <p className="text-gray-700">
                Les présentes Conditions d'Utilisation régissent votre accès et votre utilisation de la plateforme 
                School Manager. En accédant ou en utilisant notre service, vous acceptez d'être lié par ces conditions. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {/* Section 1 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiCheckCircle className="w-6 h-6 mr-2 text-green-600" />
                1. Acceptation des Conditions
              </h2>
              <p className="text-gray-700 mb-4">
                En accédant et en utilisant School Manager, vous reconnaissez avoir lu, compris et accepté d'être 
                lié par les présentes Conditions d'Utilisation ainsi que par notre 
                <Link href="/privacy" className="text-blue-600 hover:underline ml-1">
                  Politique de Confidentialité
                </Link>.
              </p>
              <p className="text-gray-700 mb-4">
                Si vous n'acceptez pas ces conditions, vous devez immédiatement cesser d'utiliser le service.
              </p>
              <p className="text-gray-700">
                Ces conditions s'appliquent à tous les utilisateurs de la plateforme, y compris les administrateurs, 
                enseignants, élèves et parents.
              </p>
            </div>
          </Card>

          {/* Section 2 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiUser className="w-6 h-6 mr-2 text-blue-600" />
                2. Utilisation du Service
              </h2>
              <p className="text-gray-700 mb-4 font-semibold">
                Vous vous engagez à :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Utiliser le service uniquement à des fins légales et conformément à ces conditions</li>
                <li>Ne pas partager, vendre ou transférer vos identifiants de connexion à des tiers</li>
                <li>Respecter les droits de propriété intellectuelle de School Manager et des autres utilisateurs</li>
                <li>Ne pas utiliser le service à des fins frauduleuses, malveillantes ou illégales</li>
                <li>Ne pas tenter d'accéder à des zones non autorisées du système</li>
                <li>Ne pas perturber ou nuire au fonctionnement du service</li>
                <li>Respecter la confidentialité des données des autres utilisateurs</li>
                <li>Fournir des informations exactes et à jour lors de l'inscription</li>
              </ul>
              <p className="text-gray-700 mb-4 font-semibold">
                Il est strictement interdit de :
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Utiliser le service pour diffuser du contenu illégal, offensant ou inapproprié</li>
                <li>Modifier, copier ou reproduire le code source ou les fonctionnalités du service</li>
                <li>Utiliser des robots, scripts automatisés ou autres moyens pour accéder au service</li>
                <li>Transmettre des virus, vers ou autres codes malveillants</li>
                <li>Collecter des données personnelles d'autres utilisateurs sans autorisation</li>
              </ul>
            </div>
          </Card>

          {/* Section 3 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiShield className="w-6 h-6 mr-2 text-purple-600" />
                3. Comptes Utilisateurs
              </h2>
              <p className="text-gray-700 mb-4">
                Pour accéder à certaines fonctionnalités de School Manager, vous devez créer un compte utilisateur.
              </p>
              <p className="text-gray-700 mb-4 font-semibold">
                Responsabilités liées au compte :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion</li>
                <li>Vous êtes responsable de toutes les activités qui se produisent sous votre compte</li>
                <li>Vous devez nous notifier immédiatement de toute utilisation non autorisée de votre compte</li>
                <li>Vous devez utiliser un mot de passe fort et unique</li>
                <li>Vous ne devez pas créer plusieurs comptes pour contourner les restrictions</li>
              </ul>
              <p className="text-gray-700">
                School Manager se réserve le droit de suspendre ou de supprimer votre compte en cas de violation 
                de ces conditions ou de comportement inapproprié.
              </p>
            </div>
          </Card>

          {/* Section 4 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiLock className="w-6 h-6 mr-2 text-indigo-600" />
                4. Propriété Intellectuelle
              </h2>
              <p className="text-gray-700 mb-4">
                Tous les contenus présents sur School Manager, incluant mais sans s'y limiter :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Les textes, graphiques, logos, icônes et images</li>
                <li>Le code source, les logiciels et les fonctionnalités</li>
                <li>La structure, l'organisation et le design de l'interface</li>
                <li>Les bases de données et leur structure</li>
                <li>Les marques de commerce et les noms de domaine</li>
              </ul>
              <p className="text-gray-700 mb-4">
                sont la propriété exclusive de School Manager ou de ses concédants de licence et sont protégés par 
                les lois françaises et internationales sur la propriété intellectuelle.
              </p>
              <p className="text-gray-700">
                Vous n'êtes pas autorisé à reproduire, modifier, distribuer, afficher publiquement ou créer des 
                œuvres dérivées basées sur le contenu de School Manager sans notre autorisation écrite préalable.
              </p>
            </div>
          </Card>

          {/* Section 5 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiAlertCircle className="w-6 h-6 mr-2 text-orange-600" />
                5. Limitations de Responsabilité
              </h2>
              <p className="text-gray-700 mb-4">
                School Manager est fourni "tel quel" et "selon disponibilité". Nous ne garantissons pas que :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Le service sera ininterrompu, sécurisé ou exempt d'erreurs</li>
                <li>Les résultats obtenus seront exacts ou fiables</li>
                <li>Les défauts seront corrigés</li>
                <li>Le service répondra à vos besoins spécifiques</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Dans la mesure permise par la loi, School Manager décline toute responsabilité concernant :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Les dommages directs, indirects, accessoires ou consécutifs</li>
                <li>La perte de données, de profits ou d'opportunités commerciales</li>
                <li>Les interruptions de service ou les pannes techniques</li>
                <li>Les erreurs ou omissions dans le contenu</li>
              </ul>
              <p className="text-gray-700">
                Vous utilisez le service à vos propres risques. Il est de votre responsabilité de sauvegarder 
                régulièrement vos données importantes.
              </p>
            </div>
          </Card>

          {/* Section 6 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiXCircle className="w-6 h-6 mr-2 text-red-600" />
                6. Résiliation
              </h2>
              <p className="text-gray-700 mb-4">
                Vous pouvez résilier votre compte à tout moment en contactant notre service client.
              </p>
              <p className="text-gray-700 mb-4">
                School Manager se réserve le droit de suspendre ou de résilier votre accès au service, 
                sans préavis, en cas de :
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Violation des présentes Conditions d'Utilisation</li>
                <li>Utilisation frauduleuse ou malveillante du service</li>
                <li>Non-paiement des frais d'abonnement (le cas échéant)</li>
                <li>Inactivité prolongée du compte</li>
                <li>Demande des autorités compétentes</li>
              </ul>
              <p className="text-gray-700">
                En cas de résiliation, votre droit d'utilisation du service prendra fin immédiatement. 
                Nous nous réservons le droit de supprimer ou de conserver vos données conformément à notre 
                Politique de Confidentialité.
              </p>
            </div>
          </Card>

          {/* Section 7 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiFileText className="w-6 h-6 mr-2 text-blue-600" />
                7. Modification des Conditions
              </h2>
              <p className="text-gray-700 mb-4">
                Nous nous réservons le droit de modifier ces Conditions d'Utilisation à tout moment. 
                Les modifications entreront en vigueur dès leur publication sur cette page.
              </p>
              <p className="text-gray-700 mb-4">
                Il est de votre responsabilité de consulter régulièrement cette page pour prendre connaissance 
                des éventuelles modifications.
              </p>
              <p className="text-gray-700">
                Votre utilisation continue du service après la publication des modifications constitue votre 
                acceptation des nouvelles conditions. Si vous n'acceptez pas les modifications, vous devez 
                cesser d'utiliser le service.
              </p>
            </div>
          </Card>

          {/* Section 8 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiShield className="w-6 h-6 mr-2 text-green-600" />
                8. Protection des Données
              </h2>
              <p className="text-gray-700 mb-4">
                Le traitement de vos données personnelles est régi par notre 
                <Link href="/privacy" className="text-blue-600 hover:underline ml-1">
                  Politique de Confidentialité
                </Link>, 
                qui fait partie intégrante de ces Conditions d'Utilisation.
              </p>
              <p className="text-gray-700">
                En utilisant School Manager, vous consentez au traitement de vos données personnelles conformément 
                à notre Politique de Confidentialité et au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </div>
          </Card>

          {/* Section 9 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiFileText className="w-6 h-6 mr-2 text-purple-600" />
                9. Droit Applicable et Juridiction
              </h2>
              <p className="text-gray-700 mb-4">
                Les présentes Conditions d'Utilisation sont régies par le droit français.
              </p>
              <p className="text-gray-700 mb-4">
                En cas de litige, et après une tentative de résolution amiable, les parties conviennent que 
                les tribunaux français seront seuls compétents.
              </p>
              <p className="text-gray-700">
                Si vous êtes un consommateur résidant dans l'Union Européenne, vous bénéficiez également des 
                droits de protection des consommateurs prévus par la législation de votre pays de résidence.
              </p>
            </div>
          </Card>

          {/* Section 10 */}
          <Card>
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiCheckCircle className="w-6 h-6 mr-2 text-blue-600" />
                10. Dispositions Générales
              </h2>
              <p className="text-gray-700 mb-4">
                Si une disposition de ces Conditions d'Utilisation est jugée invalide ou inapplicable, 
                les autres dispositions resteront en vigueur.
              </p>
              <p className="text-gray-700 mb-4">
                Le fait que nous n'exercions pas un droit ou une disposition de ces conditions ne constitue 
                pas une renonciation à ce droit ou à cette disposition.
              </p>
              <p className="text-gray-700">
                Ces Conditions d'Utilisation constituent l'accord complet entre vous et School Manager concernant 
                l'utilisation du service et remplacent tous les accords antérieurs.
              </p>
            </div>
          </Card>

          {/* Section 11 - Contact */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiMail className="w-6 h-6 mr-2 text-blue-600" />
                11. Contact
              </h2>
              <p className="text-gray-700 mb-4">
                Pour toute question, préoccupation ou réclamation concernant ces Conditions d'Utilisation, 
                vous pouvez nous contacter :
              </p>
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <FiMail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <a href="mailto:legal@schoolmanager.com" className="text-blue-600 hover:underline">
                      legal@schoolmanager.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiPhone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Téléphone</p>
                    <a href="tel:+33123456789" className="text-gray-700 hover:text-blue-600">
                      +33 1 23 45 67 89
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FiFileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Adresse</p>
                    <p className="text-gray-700">
                      123 Rue de l'Éducation<br />
                      75001 Paris, France
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                Nous nous engageons à répondre à toutes vos demandes dans les meilleurs délais.
              </p>
            </div>
          </Card>

          {/* Acceptation */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="text-center py-6">
              <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Acceptation des Conditions
              </h3>
              <p className="text-gray-700 mb-4">
                En utilisant School Manager, vous confirmez avoir lu, compris et accepté les présentes 
                Conditions d'Utilisation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/home">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Retour à l'accueil
                  </Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="secondary" className="border-2 border-green-600 text-green-700 hover:bg-green-50">
                    Voir la Politique de Confidentialité
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;

