import Link from 'next/link';
import {
  FiBook,
  FiUsers,
  FiAward,
  FiShield,
  FiBarChart,
  FiCalendar,
  FiBell,
  FiLock,
  FiZap,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMessageSquare,
  FiHelpCircle,
  FiFileText,
  FiSettings,
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiYoutube,
} from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* À propos */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-white">School Manager</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Digitalisez et centralisez la gestion de votre établissement scolaire avec une solution complète et moderne.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-700 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-700 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-700 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <FiYoutube className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <FiGithub className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <FiBook className="w-5 h-5 mr-2" />
              Fonctionnalités
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiBarChart className="w-4 h-4 mr-2" />
                  Gestion Complète
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiUsers className="w-4 h-4 mr-2" />
                  Multi-Rôles
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiAward className="w-4 h-4 mr-2" />
                  Suivi Pédagogique
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiBell className="w-4 h-4 mr-2" />
                  Communication
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiCalendar className="w-4 h-4 mr-2" />
                  Emploi du Temps
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiShield className="w-4 h-4 mr-2" />
                  Sécurité & Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiZap className="w-4 h-4 mr-2" />
                  Performance & Rapidité
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <FiFileText className="w-5 h-5 mr-2" />
              Ressources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiHelpCircle className="w-4 h-4 mr-2" />
                  Aide
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiMessageSquare className="w-4 h-4 mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiMail className="w-4 h-4 mr-2" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiBook className="w-4 h-4 mr-2" />
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Notes de version
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations Légales */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <FiLock className="w-5 h-5 mr-2" />
              Informations Légales
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiShield className="w-4 h-4 mr-2" />
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiFileText className="w-4 h-4 mr-2" />
                  Conditions d'Utilisation
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Politique des Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-sm hover:text-white transition-colors flex items-center"
                >
                  <FiFileText className="w-4 h-4 mr-2" />
                  Mentions Légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} School Manager. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Conditions
              </Link>
              <Link
                href="/sitemap"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Plan du site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

