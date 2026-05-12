'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useAppBranding } from '../contexts/AppBrandingContext';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import HomeReveal from '../components/public/HomeReveal';
import { getCurrentAcademicYear } from '../utils/academicYear';
import {
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBook,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFileText,
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

const MARQUEE_ITEMS = [
  'Secrétariat & finances',
  'Suivi pédagogique',
  'Lien avec les familles',
  'Accès maîtrisés',
  'Informations à jour',
  'Bulletins & absences',
];

const TRUST_PILLS = [
  { icon: FiShield, text: 'Données protégées' },
  { icon: FiZap, text: 'Vue claire pour la direction' },
  { icon: FiSmartphone, text: 'Ordinateur & smartphone' },
];

const PILLARS = [
  {
    title: 'Administration',
    text: 'Inscriptions, classes, personnel et finances au même endroit.',
    icon: FiLayers,
    accent: 'from-stone-700 to-amber-800',
    span: 'md:col-span-2',
    image: '/home/pillar-administration.jpg',
    imageAlt: 'Équipe en réunion autour de documents et graphiques de pilotage',
  },
  {
    title: 'Pédagogie',
    text: 'Notes, absences, devoirs et bulletins sans double saisie.',
    icon: FiBook,
    accent: 'from-emerald-500 to-teal-600',
    span: 'md:col-span-1',
    image: '/home/pillar-pedagogy.jpg',
    imageAlt: 'Salle de classe avec élèves et matériel pédagogique',
  },
  {
    title: 'Familles & équipes',
    text: 'Espaces distincts pour les enseignants, les élèves, les parents et le personnel.',
    icon: FiUsers,
    accent: 'from-amber-500 to-orange-600',
    span: 'md:col-span-1',
    image: '/home/pillar-portals.jpg',
    imageAlt: 'Groupe de personnes collaborant autour d’un ordinateur portable',
  },
  {
    title: 'Sécurité',
    text: 'Chaque profil ne voit que ce qui le concerne, avec une connexion sécurisée.',
    icon: FiLock,
    accent: 'from-rose-500 to-pink-600',
    span: 'md:col-span-2',
    image: '/home/pillar-security.jpg',
    imageAlt: 'Sécurité numérique et protection des données sur ordinateur portable',
  },
];

const ROLES = [
  {
    label: 'Direction & administration',
    desc: 'Organisation de l’établissement, suivi et indicateurs utiles au quotidien.',
    gradient: 'from-violet-600 to-indigo-700',
    ring: 'ring-violet-500/25',
    icon: FiBarChart2,
    image: '/home/role-admin.jpg',
    imageAlt: 'Équipe de direction en réunion autour de documents et indicateurs',
  },
  {
    label: 'Enseignant',
    desc: 'Cours, évaluations, pointage et suivi des élèves.',
    gradient: 'from-emerald-600 to-teal-700',
    ring: 'ring-emerald-500/25',
    icon: FiBook,
    image: '/home/role-teacher.jpg',
    imageAlt: 'Enseignant avec des élèves en classe',
  },
  {
    label: 'Élève',
    desc: 'Emploi du temps, notes, devoirs et absences.',
    gradient: 'from-sky-600 to-blue-700',
    ring: 'ring-sky-500/25',
    icon: FiAward,
    image: '/home/role-student.jpg',
    imageAlt: 'Élève concentré sur le travail scolaire',
  },
  {
    label: 'Parent',
    desc: 'Suivi des enfants et informations sur la scolarité.',
    gradient: 'from-amber-600 to-orange-700',
    ring: 'ring-amber-500/25',
    icon: FiHeart,
    image: '/home/role-parent.jpg',
    imageAlt: 'Famille partageant un moment ensemble',
  },
];

const HIGHLIGHTS = [
  {
    title: 'Des espaces sur mesure',
    text: 'Direction, équipes, élèves et parents : chacun retrouve ce qui le concerne.',
    icon: FiUsers,
  },
  {
    title: 'Une seule base',
    text: 'Moins de doubles saisies et d’informations contradictoires entre les services.',
    icon: FiTarget,
  },
  {
    title: 'Confiance & traçabilité',
    text: 'Connexion sécurisée et historique des actions importantes pour l’établissement.',
    icon: FiShield,
  },
];

const HERO_FLOATING = [
  { t: 'Inscriptions', ok: true },
  { t: 'Notes & bulletins', ok: true },
  { t: 'Familles informées', ok: true },
];

export default function Home() {
  const { user } = useAuth();
  const { navigationLogoAbsolute, branding } = useAppBranding();
  const year = getCurrentAcademicYear();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerTitle = (branding.appTitle && branding.appTitle.trim()) || 'Gestion scolaire';
  const headerTagline =
    (branding.appTagline && branding.appTagline.trim()) || 'École & familles';

  useEffect(() => {
    document.title = `${headerTitle} · Accueil`;
  }, [headerTitle]);

  return (
    <div className="home-page min-h-screen premium-body premium-body-v2 font-sans text-stone-900 antialiased">
      <header className="home-header sticky top-0 z-50 glass-nav glass-nav-v2 shadow-[0_8px_30px_-12px_rgba(12,10,9,0.08)]">
        <div className="mx-auto flex h-14 min-h-14 max-w-6xl items-center justify-between px-3 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2"
          >
            <div
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-amber-900/20 ring-2 ring-amber-400/40 ${
                navigationLogoAbsolute
                  ? 'bg-white'
                  : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-amber-100'
              }`}
            >
              {navigationLogoAbsolute ? (
                <img
                  src={navigationLogoAbsolute}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <FiBook className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden />
              )}
            </div>
            <div className="leading-tight">
              <span className="block font-display text-lg font-semibold tracking-tight text-stone-900">
                {headerTitle}
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800/80 sm:block">
                {headerTagline}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-2xl border border-stone-200/90 bg-stone-50/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-stone-900/[0.04] md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-white hover:text-stone-900 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 md:flex">
            {user ? (
                <Link href={`/${user.role.toLowerCase()}`}>
                <Button>Mon espace</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary">Connexion</Button>
                </Link>
                <Link href="/inscription">
                  <Button className="shadow-lg shadow-amber-900/15 ring-1 ring-amber-500/20">
                    Candidature en ligne
                    <FiArrowRight className="ml-1.5 inline h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-stone-100/90 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-stone-200/90 bg-white/95 px-4 py-4 shadow-inner backdrop-blur-sm md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-stone-900 hover:bg-stone-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-stone-200/90 pt-4">
              {user ? (
                <Link href={`/${user.role.toLowerCase()}`} onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Mon espace</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/inscription" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">Candidature en ligne</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="home-hero-shell relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-zinc-950">
          <div className="page-hero-v2__glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="page-hero-v2__noise pointer-events-none absolute inset-0" aria-hidden />
          <div className="home-hero-fine-grid" aria-hidden />
          <div
            className="home-hero-orb home-hero-orb--drift-a absolute -left-24 top-0 h-[min(28rem,50vw)] w-[min(28rem,50vw)] bg-amber-500/25"
            aria-hidden
          />
          <div
            className="home-hero-orb home-hero-orb--drift-b absolute -right-32 bottom-0 h-[min(24rem,45vw)] w-[min(24rem,45vw)] bg-emerald-500/15"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
              <div className="home-section-fade lg:col-span-6">
                <div className="mb-8 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/15 to-amber-600/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-100 shadow-lg shadow-amber-950/30 backdrop-blur-md">
                    <FiCalendar className="h-3.5 w-3.5 shrink-0 text-amber-200" aria-hidden />
                    <span className="flex flex-col items-start gap-0.5 normal-case tracking-normal">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100/95">
                        Année scolaire
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-amber-50">{year}</span>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Une seule plateforme
                  </span>
                </div>

                <h1 className="home-hero-h1 home-hero-title-line font-display text-[2.35rem] font-black leading-[1.06] tracking-tight text-white sm:text-5xl sm:leading-[1.05] lg:text-6xl lg:leading-[1.04]">
                  Simplifiez le quotidien de votre{' '}
                  <span className="bg-gradient-to-r from-amber-200 via-amber-50 to-amber-200/90 bg-clip-text text-transparent">
                    établissement scolaire
                  </span>
                  .
                </h1>
                <p className="home-hero-sub-line mt-7 max-w-xl text-lg leading-relaxed text-stone-400 sm:text-xl">
                  Administration, enseignants et familles s’appuient sur les mêmes informations — claires, à jour et
                  protégées.
                </p>

                <ul className="mt-9 flex flex-wrap gap-3">
                  {TRUST_PILLS.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="home-trust-pill inline-flex cursor-default items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-medium text-stone-200 shadow-lg shadow-black/20 backdrop-blur-md"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>

                {!user && (
                  <>
                  <div className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="w-full border-0 bg-white px-8 font-bold text-stone-900 shadow-xl shadow-black/30 hover:bg-amber-50 sm:w-auto"
                      >
                        Espace sécurisé (équipes)
                        <FiArrowRight className="ml-2 inline h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/help">
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/[0.06] px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:border-amber-400/40 hover:bg-white/10 sm:w-auto">
                        <FiHelpCircle className="h-5 w-5" />
                        Aide & guides
                      </span>
                    </Link>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-6 text-sm">
                    <Link
                      href="/documentation"
                      className="inline-flex items-center gap-2 text-stone-500 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 rounded-lg"
                    >
                      <FiFileText className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden />
                      Guides & parcours
                    </Link>
                    <Link
                      href="/inscription"
                      className="inline-flex items-center gap-2 text-stone-500 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 rounded-lg"
                    >
                      <FiCalendar className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden />
                      Inscription & admission
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 text-stone-500 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 rounded-lg"
                    >
                      <FiMessageSquare className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden />
                      Écrire à l’équipe
                    </Link>
                  </div>
                  </>
                )}
                {user && (
                  <div className="mt-11">
                    <Link href={`/${user.role.toLowerCase()}`}>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="border-0 bg-white px-8 font-bold text-stone-900 shadow-xl hover:bg-amber-50"
                      >
                        Ouvrir mon espace
                        <FiArrowRight className="ml-2 inline h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="mt-14 grid grid-cols-3 gap-3 sm:max-w-lg sm:gap-4">
                  {[
                    { n: '4', l: 'profils', d: 'adaptés' },
                    { n: '1', l: 'école', d: 'une base commune' },
                    { n: '∞', l: 'usages', d: 'selon vos besoins' },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="home-stat-tile rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-4 text-center shadow-inner backdrop-blur-sm sm:px-4 sm:text-left"
                    >
                      <p className="home-stat-num font-display text-2xl font-semibold tabular-nums sm:text-3xl">{s.n}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">{s.l}</p>
                      <p className="text-[10px] font-medium text-stone-600">{s.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="home-section-fade home-section-fade--late relative lg:col-span-6">
                <div className="relative mx-auto max-w-lg lg:max-w-none">
                  <div
                    className="absolute -inset-6 rounded-[2.25rem] bg-gradient-to-tr from-amber-400/20 via-transparent to-emerald-400/15 blur-3xl motion-reduce:opacity-40"
                    aria-hidden
                  />
                  <div className="home-hero-frame-in home-hero-frame-in--elevated relative overflow-hidden rounded-[1.75rem] border border-white/25 bg-gradient-to-br from-white/18 to-white/[0.04] p-[2px] shadow-[0_32px_64px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md ring-1 ring-amber-400/15">
                    <div className="relative overflow-hidden rounded-[1.6rem] bg-stone-950 ring-1 ring-white/10">
                      <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="h-3 w-3 rounded-full bg-red-400/90 shadow-sm" />
                          <span className="h-3 w-3 rounded-full bg-amber-400/90 shadow-sm" />
                          <span className="h-3 w-3 rounded-full bg-emerald-400/90 shadow-sm" />
                        </div>
                        <span className="rounded-lg border border-white/10 bg-stone-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
                          Illustration
                        </span>
                      </div>
                      <div className="relative aspect-[4/3] min-h-[280px] sm:min-h-[320px] lg:min-h-[380px]">
                        <Image
                          src="/home/hero-platform.jpg"
                          alt="Salle de classe : élève levant la main, ambiance d’apprentissage"
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"
                          aria-hidden
                        />
                        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-5">
                          <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-stone-950/75 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            {HERO_FLOATING.map(({ t, ok }) => (
                              <div key={t} className="flex items-center gap-2 text-sm font-medium text-white">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-400/30">
                                  {ok ? <FiCheck className="h-4 w-4" aria-hidden /> : null}
                                </span>
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-5 text-center text-xs text-stone-500 lg:text-left">
                    Images d’ambiance — après connexion, chacun retrouve son espace personnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bandeau défilant */}
        <section className="home-marquee-strip relative overflow-visible border-y border-white/10 py-5 text-white">
          <div className="home-marquee overflow-hidden min-h-[3rem] flex items-center">
            <div className="home-marquee-track items-center gap-10 pr-10 text-sm font-semibold uppercase tracking-[0.2em]">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="flex shrink-0 items-center gap-10 whitespace-nowrap"
                >
                  <span className="text-amber-400/90 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]" aria-hidden>
                    ◆
                  </span>
                  <span className="home-marquee-text">{item}</span>
                </span>
              ))}
            </div>
          </div>
          <div
            className="pointer-events-none absolute -bottom-px left-0 right-0 z-[1] h-12 w-full text-[#fafaf9] sm:h-16"
            aria-hidden
          >
            <svg className="block h-full w-full" viewBox="0 0 1440 64" preserveAspectRatio="none" fill="none">
              <path
                fill="currentColor"
                d="M0 32C180 8 360 52 540 36C720 20 900 48 1080 40C1260 32 1380 20 1440 14V64H0V32Z"
              />
            </svg>
          </div>
        </section>

        {/* Bento — Piliers */}
        <section className="relative z-10 -mt-12 px-4 sm:-mt-16 sm:px-6">
          <HomeReveal>
          <div className="home-bento-outer relative mx-auto max-w-6xl rounded-[2rem] border border-stone-200/90 bg-white/65 p-1.5 shadow-[0_32px_64px_-28px_rgba(12,10,9,0.22)] backdrop-blur-2xl sm:p-2">
            <div className="home-bento-inner relative rounded-[1.65rem] bg-gradient-to-b from-white via-white to-stone-50/95 px-5 py-12 ring-1 ring-stone-900/[0.04] sm:px-8 sm:py-14 lg:px-12 lg:py-16">
              <div className="mb-12 flex flex-col gap-4 text-center lg:mb-14">
                <span className="mx-auto inline-flex w-fit items-center rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-100/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-950 shadow-sm ring-1 ring-amber-900/10">
                  Au quotidien
                </span>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl lg:tracking-tight">
                  Tout ce dont votre école a besoin
                </h2>
                <div className="home-section-accent home-section-accent--glow" aria-hidden />
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-stone-600">
                  Des usages pensés pour le terrain : une seule connexion, la même vision pour les équipes et les
                  familles.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-3 md:gap-6">
                {PILLARS.map(({ title, text, icon: Icon, accent, span, image, imageAlt }, idx) => (
                  <HomeReveal key={title} delayMs={idx * 70} className={span}>
                  <article
                    className="home-pillar-sheen group relative h-full overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(12,10,9,0.12)] transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-300/60 hover:shadow-[0_28px_56px_-22px_rgba(180,83,9,0.15)]"
                  >
                    <div
                      className={`relative w-full overflow-hidden ${span.includes('col-span-2') ? 'h-48 sm:h-56' : 'h-44 sm:h-48'}`}
                    >
                      <Image
                        src={image}
                        alt={imageAlt}
                        fill
                        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-900/15 to-transparent" />
                      <span className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-sm font-bold text-stone-900 shadow-lg ring-1 ring-stone-200/80">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="relative p-6 sm:p-7">
                      <div
                        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg ring-2 ring-white/30 transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-stone-900 sm:text-2xl">{title}</h3>
                      <p className="mt-2 leading-relaxed text-stone-600">{text}</p>
                    </div>
                  </article>
                  </HomeReveal>
                ))}
              </div>
            </div>
          </div>
          </HomeReveal>
        </section>

        {/* Bandeau campus */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
          <div className="home-campus-split group overflow-hidden rounded-[2rem] border border-stone-200/90 bg-white shadow-[0_28px_56px_-24px_rgba(12,10,9,0.18)] ring-1 ring-amber-500/15 transition-all duration-500 hover:ring-amber-500/25 lg:grid lg:grid-cols-2">
            <div className="relative min-h-[260px] lg:min-h-[400px]">
              <Image
                src="/home/split-campus.jpg"
                alt="Bâtiment et campus scolaire, perspective architecturale"
                fill
                className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-stone-950/50 via-stone-950/10 to-transparent lg:from-stone-950/55"
                aria-hidden
              />
              <div className="absolute bottom-6 left-6 right-6 z-10 rounded-2xl border border-white/15 bg-stone-950/50 p-4 backdrop-blur-md lg:max-w-xs">
                <p className="text-sm font-semibold text-white">Une vision partagée</p>
                <p className="mt-1 text-xs text-stone-300">
                  Même information pour la direction, les équipes et les familles.
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
              <span className="inline-flex w-fit items-center rounded-full border border-amber-200/80 bg-amber-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-950">
                Établissement
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                L’école, sans angles morts
              </h2>
              <div className="home-section-accent mx-0 mt-3" aria-hidden />
              <p className="mt-5 text-lg leading-relaxed text-stone-600">
                De la direction aux familles, tout le monde s’appuie sur des données à jour. Moins d’erreurs, moins de
                relances, plus de temps pour l’essentiel.
              </p>
              <ul className="mt-8 space-y-3 text-stone-700">
                {['Données unifiées', 'Notifications ciblées', 'Historique tracé'].map((line) => (
                  <li key={line} className="flex items-center gap-3 text-sm font-medium">
                    <FiCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link href="/inscription">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-stone-900/25 transition-all hover:bg-stone-800 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45">
                    Démarrer une candidature
                    <FiArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </div>
            </div>
          </div>
          </HomeReveal>
        </section>

        {/* Rôles */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
              Une place pour chacun
            </h2>
            <div className="home-section-accent mt-4" aria-hidden />
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
              Chaque personne accède à ce qui la concerne, avec des droits adaptés à son rôle dans l’établissement.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ label, desc, gradient, ring, icon: Icon, image, imageAlt }, idx) => (
              <HomeReveal key={label} delayMs={idx * 55}>
              <div
                className={`home-role-card group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-lg shadow-stone-900/[0.06] ring-2 ${ring} transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/65 via-transparent to-transparent" />
                  <div
                    className={`absolute -bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xl ring-4 ring-white transition-transform duration-300 group-hover:scale-105`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                </div>
                <div className="px-6 pb-7 pt-10">
                  <h3 className="font-display text-lg font-semibold text-stone-900">{label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{desc}</p>
                </div>
              </div>
              </HomeReveal>
            ))}
          </div>
          </HomeReveal>
        </section>

        {/* Points forts */}
        <section className="border-y border-stone-200/80 bg-gradient-to-b from-stone-50/90 via-white to-amber-50/20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <HomeReveal>
            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Pourquoi tout regrouper ici ?
              </h2>
              <div className="home-section-accent mt-4" aria-hidden />
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
                Moins de friction au quotidien, plus de clarté pour les équipes et les familles.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {HIGHLIGHTS.map(({ title, text, icon: Icon }, i) => (
                <HomeReveal key={title} delayMs={i * 80}>
                <div
                  className="group relative rounded-3xl bg-gradient-to-br from-amber-400/30 via-stone-200/40 to-amber-200/20 p-[1px] shadow-lg shadow-amber-900/5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="h-full rounded-[1.4rem] bg-white/95 p-8 shadow-inner ring-1 ring-stone-900/[0.03] backdrop-blur-sm">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800/70">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-900 shadow-md ring-1 ring-amber-200/80 transition-transform group-hover:scale-105">
                      <Icon className="h-7 w-7" aria-hidden />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-stone-900">{title}</h3>
                    <p className="mt-3 leading-relaxed text-stone-600">{text}</p>
                  </div>
                </div>
                </HomeReveal>
              ))}
            </div>
            </HomeReveal>
          </div>
        </section>

        {/* Citation */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
          <div className="home-quote-panel relative overflow-hidden rounded-[2rem] border border-amber-200/50 bg-gradient-to-br from-amber-50/95 via-white to-stone-50 px-6 py-14 text-center shadow-[0_28px_56px_-22px_rgba(180,83,9,0.2)] ring-1 ring-amber-200/60 sm:px-14 sm:py-16">
            <span
              className="pointer-events-none absolute -left-4 top-6 z-[1] font-display text-[8rem] font-bold leading-none text-amber-200/45 sm:left-8"
              aria-hidden
            >
              «
            </span>
            <FiMessageSquare className="relative z-10 mx-auto h-11 w-11 text-amber-800 drop-shadow-sm" aria-hidden />
            <blockquote className="relative z-10 mx-auto mt-8 max-w-3xl font-display text-2xl font-medium leading-snug text-stone-900 sm:text-3xl sm:leading-snug">
              Une école fluide, c’est la même information pour tout le monde — au bon moment, avec le bon niveau de
              détail.
            </blockquote>
            <p className="relative z-10 mt-8 text-sm font-semibold uppercase tracking-wider text-stone-500">
              Notre engagement — {headerTitle}
            </p>
            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
              ))}
              <span className="ml-2 text-sm font-medium text-stone-600">Conçu avec les équipes de terrain</span>
            </div>
          </div>
          </HomeReveal>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <HomeReveal>
          <div className="home-cta-shell relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 px-6 py-16 text-center sm:px-12 sm:py-20 lg:py-24">
            <div className="home-cta-aurora pointer-events-none absolute inset-0 z-[1]" aria-hidden />
            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/15 to-white/[0.04] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md ring-1 ring-amber-400/20">
                <FiClock className="h-8 w-8 text-amber-200" aria-hidden />
              </div>
              <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                Un outil moderne au service de votre établissement
              </h2>
              <p className="mt-5 text-lg text-stone-400">
                Connexion sécurisée, accès adaptés à chaque fonction, et guides pour aider vos équipes à démarrer en
                douceur.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {!user ? (
                  <>
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="min-w-[220px] border-0 bg-white font-bold text-stone-900 shadow-xl hover:bg-amber-50"
                      >
                        Se connecter
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <span className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border-2 border-white/35 bg-transparent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10">
                        Parler à un responsable
                      </span>
                    </Link>
                  </>
                ) : (
                  <Link href={`/${user.role.toLowerCase()}`}>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="border-0 bg-white font-bold text-stone-900 shadow-xl hover:bg-amber-50"
                    >
                      Retour à mon espace
                    </Button>
                  </Link>
                )}
              </div>
              <p className="mt-12 text-sm text-stone-500">
                <Link
                  href="/faq"
                  className="font-medium text-amber-200/90 underline decoration-amber-400/40 underline-offset-4 hover:text-white"
                >
                  Questions fréquentes
                </Link>
                <span className="mx-2 text-stone-600">·</span>
                <Link
                  href="/contact"
                  className="font-medium text-amber-200/90 underline decoration-amber-400/40 underline-offset-4 hover:text-white"
                >
                  Contact
                </Link>
              </p>
            </div>
          </div>
          </HomeReveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
