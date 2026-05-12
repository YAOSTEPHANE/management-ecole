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
    <footer className="relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-zinc-950 text-stone-400 ring-1 ring-amber-500/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201, 162, 39, 0.12), transparent 55%)',
        }}
        aria-hidden
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* À propos */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl flex items-center justify-center text-amber-100 shadow-lg ring-2 ring-amber-500/25">
                <FiBook className="w-5 h-5" aria-hidden />
              </div>
              <span className="text-xl font-bold text-stone-100 font-display tracking-tight">Gestion Scolaire</span>
            </div>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              Centralisez administration, pédagogie et lien avec les familles — une base unique, sécurisée et pensée pour le terrain.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="#"
                className="w-10 h-10 bg-stone-800/90 hover:bg-amber-800/90 rounded-xl flex items-center justify-center transition-colors text-stone-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" aria-hidden />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-stone-800/90 hover:bg-amber-800/90 rounded-xl flex items-center justify-center transition-colors text-stone-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" aria-hidden />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-stone-800/90 hover:bg-amber-800/90 rounded-xl flex items-center justify-center transition-colors text-stone-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-5 h-5" aria-hidden />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-stone-800/90 hover:bg-amber-800/90 rounded-xl flex items-center justify-center transition-colors text-stone-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                aria-label="YouTube"
              >
                <FiYoutube className="w-5 h-5" aria-hidden />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-stone-800/90 hover:bg-stone-700 rounded-xl flex items-center justify-center transition-colors text-stone-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                aria-label="GitHub"
              >
                <FiGithub className="w-5 h-5" aria-hidden />
              </a>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h3 className="text-stone-100 font-bold text-lg mb-4 flex items-center gap-2">
              <FiBook className="w-5 h-5 text-amber-400/90 shrink-0" aria-hidden />
              Fonctionnalités
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiBarChart className="w-4 h-4 mr-2" />
                  Gestion Complète
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiUsers className="w-4 h-4 mr-2 shrink-0" aria-hidden />
                  Multi-Rôles
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiAward className="w-4 h-4 mr-2" />
                  Suivi Pédagogique
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiBell className="w-4 h-4 mr-2" />
                  Communication
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiCalendar className="w-4 h-4 mr-2" />
                  Emploi du Temps
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiShield className="w-4 h-4 mr-2" />
                  Sécurité & Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/home#features"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiZap className="w-4 h-4 mr-2" />
                  Performance & Rapidité
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-stone-100 font-bold text-lg mb-4 flex items-center gap-2">
              <FiFileText className="w-5 h-5 text-amber-400/90 shrink-0" aria-hidden />
              Ressources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiHelpCircle className="w-4 h-4 mr-2" />
                  Aide
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiMessageSquare className="w-4 h-4 mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiMail className="w-4 h-4 mr-2" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiBook className="w-4 h-4 mr-2" />
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Notes de version
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations Légales */}
          <div>
            <h3 className="text-stone-100 font-bold text-lg mb-4 flex items-center gap-2">
              <FiLock className="w-5 h-5 text-amber-400/90 shrink-0" aria-hidden />
              Informations Légales
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiShield className="w-4 h-4 mr-2" />
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiFileText className="w-4 h-4 mr-2" />
                  Conditions d'Utilisation
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Politique des Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-sm text-stone-400 hover:text-amber-100 transition-colors flex items-center rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
                >
                  <FiFileText className="w-4 h-4 mr-2" />
                  Mentions Légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-stone-700/80 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 gap-4">
            <p className="text-sm text-stone-500 text-center md:text-left">
              © {currentYear} Gestion Scolaire. Tous droits réservés.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/privacy"
                className="text-stone-500 hover:text-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 rounded"
              >
                Confidentialité
              </Link>
              <Link
                href="/terms"
                className="text-stone-500 hover:text-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 rounded"
              >
                Conditions
              </Link>
              <Link
                href="/sitemap"
                className="text-stone-500 hover:text-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 rounded"
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

