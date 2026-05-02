import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import { getCurrentAcademicYear } from '../utils/academicYear';

const Hero3D = dynamic(() => import('../components/illustrations/Hero3D'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[260px] w-full items-center justify-center sm:h-[320px] lg:h-[340px]"
      aria-hidden
    >
      <div className="h-40 w-40 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/10" />
    </div>
  ),
});
import {
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBook,
  FiCalendar,
  FiCheck,
  FiClock,
  FiHelpCircle,
  FiHeart,
  FiLayers,
  FiLock,
  FiMenu,
  FiMessageSquare,
  FiShield,
  FiSmartphone,
  FiStar,
  FiTarget,
  FiUsers,
  FiX,
  FiZap,
} from 'react-icons/fi';

const NAV_LINKS = [
  { href: '/inscription', label: 'Inscription' },
  { href: '/faq', label: 'FAQ' },
  { href: '/help', label: 'Aide' },
  { href: '/contact', label: 'Contact' },
];

const TRUST_PILLS = [
  { icon: FiShield, text: 'Données & accès sécurisés' },
  { icon: FiZap, text: 'Temps réel sur les tableaux de bord' },
  { icon: FiSmartphone, text: 'Utilisable sur ordinateur & mobile' },
];

const PILLARS = [
  {
    title: 'Administration',
    text: 'Inscriptions, classes, personnel et finances au même endroit.',
    icon: FiLayers,
    accent: 'from-blue-500 to-indigo-600',
    span: 'md:col-span-2',
  },
  {
    title: 'Pédagogie',
    text: 'Notes, absences, devoirs et bulletins sans double saisie.',
    icon: FiBook,
    accent: 'from-emerald-500 to-teal-600',
    span: 'md:col-span-1',
  },
  {
    title: 'Portails',
    text: 'Espaces dédiés pour enseignants, élèves, parents et équipes.',
    icon: FiUsers,
    accent: 'from-amber-500 to-orange-600',
    span: 'md:col-span-1',
  },
  {
    title: 'Sécurité',
    text: 'Contrôle d’accès par rôle (RBAC) et authentification robuste.',
    icon: FiLock,
    accent: 'from-rose-500 to-pink-600',
    span: 'md:col-span-2',
  },
];

const ROLES = [
  {
    label: 'Administrateur',
    desc: 'Pilotage, statistiques et paramètres de l’établissement.',
    gradient: 'from-violet-600 to-indigo-700',
    ring: 'ring-violet-500/20',
    icon: FiBarChart2,
  },
  {
    label: 'Enseignant',
    desc: 'Cours, évaluations, pointage et suivi des élèves.',
    gradient: 'from-emerald-600 to-teal-700',
    ring: 'ring-emerald-500/20',
    icon: FiBook,
  },
  {
    label: 'Élève',
    desc: 'Emploi du temps, notes, devoirs et absences.',
    gradient: 'from-sky-600 to-blue-700',
    ring: 'ring-sky-500/20',
    icon: FiAward,
  },
  {
    label: 'Parent',
    desc: 'Suivi des enfants et informations sur la scolarité.',
    gradient: 'from-amber-600 to-orange-700',
    ring: 'ring-amber-500/20',
    icon: FiHeart,
  },
];

const HIGHLIGHTS = [
  {
    title: 'Multi-rôles',
    text: 'Chaque utilisateur accède uniquement à ce qui le concerne.',
    icon: FiUsers,
  },
  {
    title: 'Tout centraliser',
    text: 'Fin des fichiers éparpillés : une seule source de vérité.',
    icon: FiTarget,
  },
  {
    title: 'Prêt pour le terrain',
    text: 'JWT, contrôle d’accès et journalisation des actions sensibles.',
    icon: FiShield,
  },
];

export default function Home() {
  const { user } = useAuth();
  const year = getCurrentAcademicYear();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#fafbfc] text-[#1a1d29] antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e8eaef]/80 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white">
              <FiBook className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-bold tracking-tight text-[#1a1d29]">Gestion Scolaire</span>
              <span className="hidden text-[11px] font-medium uppercase tracking-wider text-[#5c617a] sm:block">
                Pilotage & pédagogie
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5c617a] transition-colors hover:bg-slate-100 hover:text-[#1a1d29]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 md:flex">
            {user ? (
              <Link href={`/${user.role.toLowerCase()}`}>
                <Button className="shadow-md shadow-indigo-500/20">Tableau de bord</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary">Connexion</Button>
                </Link>
                <Link href="/login">
                  <Button>
                    Commencer
                    <FiArrowRight className="ml-1.5 inline h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5c617a] transition-colors hover:bg-slate-100 md:hidden"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#e8eaef] bg-white px-4 py-4 shadow-inner md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-[#1a1d29] hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-[#e8eaef] pt-4">
              {user ? (
                <Link href={`/${user.role.toLowerCase()}`} onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Tableau de bord</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">Commencer</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0c1222] via-[#111827] to-[#0f172a]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 100% 80% at 50% -30%, rgba(59, 130, 246, 0.45), transparent 55%), radial-gradient(ellipse 50% 50% at 90% 20%, rgba(139, 92, 246, 0.25), transparent), radial-gradient(ellipse 40% 40% at 10% 60%, rgba(16, 185, 129, 0.12), transparent)',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-6">
                <div className="mb-6 inline-flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                    <FiCalendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Année scolaire {year}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Solution tout-en-un
                  </span>
                </div>

                <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                  La gestion de votre{' '}
                  <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                    établissement
                  </span>
                  , clarifiée.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                  Une plateforme unique pour l’administration, le suivi pédagogique et le lien avec les familles —
                  sans tableurs ni informations éclatées.
                </p>

                <ul className="mt-8 flex flex-wrap gap-3">
                  {TRUST_PILLS.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-sm sm:text-sm"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>

                {!user && (
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/login">
                      <Button
                        size="lg"
                        className="w-full bg-white font-semibold text-slate-900 shadow-xl shadow-slate-950/40 hover:bg-slate-100 sm:w-auto"
                      >
                        Accéder à la plateforme
                        <FiArrowRight className="ml-2 inline h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/help">
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:w-auto">
                        <FiHelpCircle className="h-5 w-5" />
                        Découvrir l’aide
                      </span>
                    </Link>
                  </div>
                )}
                {user && (
                  <div className="mt-10">
                    <Link href={`/${user.role.toLowerCase()}`}>
                      <Button size="lg" className="bg-white font-semibold text-slate-900 shadow-xl hover:bg-slate-100">
                        Ouvrir mon espace
                        <FiArrowRight className="ml-2 inline h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-10 sm:max-w-md">
                  {[
                    { n: '4', l: 'portails métiers' },
                    { n: '1', l: 'vue centralisée' },
                    { n: '24/7', l: 'accès web' },
                  ].map((s) => (
                    <div key={s.l} className="text-center sm:text-left">
                      <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">{s.n}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                        {s.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative mx-auto max-w-lg lg:max-w-none">
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-transparent to-emerald-500/20 blur-2xl lg:-inset-6" aria-hidden />
                  <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-1 shadow-2xl shadow-black/40 backdrop-blur-md">
                    <div className="rounded-[1.35rem] bg-slate-950/40 p-6 sm:p-8">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="h-3 w-3 rounded-full bg-red-400/80" />
                          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                        </div>
                        <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Aperçu
                        </span>
                      </div>
                      <div className="flex min-h-[260px] items-center justify-center sm:min-h-[320px] lg:min-h-[340px]">
                        <Hero3D />
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs text-slate-500 lg:text-left">
                    Illustration décorative — votre tableau de bord réel s’affiche après connexion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento — Piliers */}
        <section className="relative z-10 -mt-8 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-[#e8eaef] bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
            <div className="mb-10 text-center">
              <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                Fonctionnalités
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1a1d29] sm:text-4xl">
                Tout ce dont votre école a besoin
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-[#5c617a]">
                Une base solide pour administrer, enseigner et communiquer — avec une seule connexion.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PILLARS.map(({ title, text, icon: Icon, accent, span }) => (
                <article
                  key={title}
                  className={`group relative overflow-hidden rounded-2xl border border-[#e8eaef] bg-[#fafbfc] p-6 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 ${span}`}
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1d29]">{title}</h3>
                  <p className="mt-2 leading-relaxed text-[#5c617a]">{text}</p>
                  <div
                    className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-[0.07] transition-opacity group-hover:opacity-[0.12]`}
                    aria-hidden
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Rôles */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1a1d29] sm:text-4xl">
              Un espace pour chaque acteur
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-[#5c617a]">
              Des interfaces adaptées au métier, avec des droits strictement définis.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ label, desc, gradient, ring, icon: Icon }) => (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-900/5 ring-2 ${ring} transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-[#1a1d29]">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5c617a]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Points forts — 3 colonnes */}
        <section className="border-y border-[#e8eaef] bg-gradient-to-b from-white to-[#f6f7fa] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#1a1d29] sm:text-4xl">
                Pourquoi centraliser ici ?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-[#5c617a]">
                Moins de friction au quotidien, plus de visibilité pour les équipes et les familles.
              </p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {HIGHLIGHTS.map(({ title, text, icon: Icon }) => (
                <div
                  key={title}
                  className="relative rounded-2xl border border-white bg-white/80 p-8 shadow-lg shadow-slate-900/5 backdrop-blur-sm"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <Icon className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1d29]">{title}</h3>
                  <p className="mt-3 leading-relaxed text-[#5c617a]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bandeau citation */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-12 text-center shadow-inner shadow-indigo-500/5 sm:px-12">
            <FiMessageSquare className="mx-auto h-10 w-10 text-indigo-400" aria-hidden />
            <blockquote className="mx-auto mt-6 max-w-3xl text-xl font-semibold leading-relaxed text-[#1a1d29] sm:text-2xl">
              « Une école fluide, c’est la même information pour tout le monde — au bon moment, avec le bon niveau de
              détail. »
            </blockquote>
            <p className="mt-6 text-sm font-medium text-[#5c617a]">Vision produit — Gestion Scolaire</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
              ))}
              <span className="ml-2 text-sm text-[#5c617a]">Conçu pour les équipes éducatives</span>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#6366f1] px-6 py-16 text-center shadow-2xl shadow-indigo-500/30 sm:px-12 sm:py-20">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.5), transparent 40%)',
              }}
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <FiClock className="h-8 w-8 text-white" aria-hidden />
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Donnez à votre établissement un cockpit moderne
              </h2>
              <p className="mt-4 text-lg text-indigo-100">
                Connexion sécurisée, parcours clairs pour chaque rôle, et pages d’aide pour accompagner vos équipes.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {!user ? (
                  <>
                    <Link href="/login">
                      <Button
                        size="lg"
                        className="min-w-[200px] bg-white font-bold text-indigo-700 shadow-xl hover:bg-indigo-50"
                      >
                        Se connecter
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <span className="inline-flex min-w-[200px] items-center justify-center rounded-lg border-2 border-white/40 bg-transparent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10">
                        Parler à un responsable
                      </span>
                    </Link>
                  </>
                ) : (
                  <Link href={`/${user.role.toLowerCase()}`}>
                    <Button size="lg" className="bg-white font-bold text-indigo-700 shadow-xl">
                      Retour au tableau de bord
                    </Button>
                  </Link>
                )}
              </div>
              <p className="mt-10 text-sm text-indigo-200">
                <Link href="/faq" className="font-medium underline decoration-indigo-300/60 underline-offset-4 hover:text-white">
                  Questions fréquentes
                </Link>
                <span className="mx-2 text-indigo-300">·</span>
                <Link
                  href="/contact"
                  className="font-medium underline decoration-indigo-300/60 underline-offset-4 hover:text-white"
                >
                  Contact
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
