'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useAppBranding } from '../contexts/AppBrandingContext';
import Button from '../components/ui/Button';
import Footer from '../components/Footer';
import HomeReveal from '../components/public/HomeReveal';
import HomeDirectorSection from '../components/public/HomeDirectorSection';
import HomePageImage from '../components/public/HomePageImage';
import PreInscriptionSchoolEntry from '../components/public/PreInscriptionSchoolEntry';
import { computeCurrentAcademicYear, getCurrentAcademicYear } from '../utils/academicYear';
import { getRoleDashboardPath } from '../lib/rolePaths';
import {
  DEFAULT_INTRO,
  DEFAULT_MISSION,
  DEFAULT_MOTTO,
  DEFAULT_MOTTO_SHORT,
  HOME_MARQUEE,
  HOME_NEWS,
  HOME_OPENING_HOURS,
  HOME_STATS,
  HOME_TESTIMONIALS,
  HOME_VALUES,
} from '../data/homeDefaults';
import { resolveSchoolContactInfo } from '../lib/schoolContact';
import {
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBook,
  FiCalendar,
  FiCheck,
  FiCompass,
  FiClock,
  FiCpu,
  FiFileText,
  FiHelpCircle,
  FiHeart,
  FiLayers,
  FiMapPin,
  FiMenu,
  FiMessageSquare,
  FiPhone,
  FiShield,
  FiStar,
  FiTarget,
  FiUsers,
  FiX,
  FiZap,
} from 'react-icons/fi';

const NAV_LINKS = [
  { href: '#experience', label: 'Expérience' },
  { href: '#piliers', label: 'Pédagogie' },
  { href: '#mot-direction', label: 'Direction' },
  { href: '#actualites', label: 'Actualités' },
  { href: '#parcours', label: 'Admissions' },
  { href: '#contact', label: 'Contact' },
];

function HomeNavLinks({
  className,
  linkClassName,
  onNavigate,
}: {
  className?: string;
  linkClassName: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className} aria-label="Navigation de la page d'accueil">
      {NAV_LINKS.map(({ href, label }) => (
        <Link key={href} href={href} className={linkClassName} onClick={onNavigate}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

const MARQUEE_ITEMS = [...HOME_MARQUEE];

const TRUST_PILLS = [
  { icon: FiAward, text: 'Excellence éducative' },
  { icon: FiShield, text: 'Cadre structuré' },
  { icon: FiHeart, text: 'Épanouissement des élèves' },
];

const PILLARS = [
  {
    title: 'Formation de qualité',
    text: DEFAULT_MISSION,
    icon: FiBook,
    accent: 'from-tran-mauve-600 to-tran-mauve-800',
    span: 'md:col-span-2',
    imageSlot: 'homePillarPedagogy' as const,
    image: '/home/pillar-pedagogy.jpg',
    imageAlt: 'Salle de classe — apprentissage',
  },
  {
    title: 'Innovation pédagogique',
    text: 'Une approche moderne pour préparer les leaders compétents et responsables de demain.',
    icon: FiZap,
    accent: 'from-tran-mustard-500 to-tran-mustard-700',
    span: 'md:col-span-1',
    imageSlot: 'homePillarPortals' as const,
    image: '/home/pillar-portals.jpg',
    imageAlt: 'Élèves et enseignants en activité pédagogique',
  },
  {
    title: 'Vie scolaire',
    text: 'Discipline, accompagnement et écoute pour garantir un climat de travail serein.',
    icon: FiShield,
    accent: 'from-tran-mauve-500 to-tran-mauve-700',
    span: 'md:col-span-1',
    imageSlot: 'homePillarSecurity' as const,
    image: '/home/pillar-security.jpg',
    imageAlt: 'Encadrement et discipline au quotidien',
  },
  {
    title: 'Administration & familles',
    text: 'Pré-inscriptions, suivi scolaire et lien renforcé avec les parents d’élèves.',
    icon: FiLayers,
    accent: 'from-tran-mauve-800 to-tran-mustard-700',
    span: 'md:col-span-2',
    imageSlot: 'homePillarAdministration' as const,
    image: '/home/pillar-administration.jpg',
    imageAlt: 'Équipe éducative et administrative',
  },
];

const ROLES = [
  {
    label: 'Direction',
    desc: 'Pilotage de l’établissement, vie scolaire et orientation vers la réussite.',
    gradient: 'from-tran-mauve-600 to-tran-mauve-800',
    ring: 'ring-tran-mauve-500/25',
    icon: FiBarChart2,
    imageSlot: 'homeRoleAdmin' as const,
    image: '/home/role-admin.jpg',
    imageAlt: 'Direction de l’établissement',
  },
  {
    label: 'Enseignant',
    desc: 'Transmission des savoirs, évaluations et accompagnement personnalisé.',
    gradient: 'from-tran-mauve-500 to-tran-mauve-700',
    ring: 'ring-tran-mauve-400/25',
    icon: FiBook,
    imageSlot: 'homeRoleTeacher' as const,
    image: '/home/role-teacher.jpg',
    imageAlt: 'Corps enseignant',
  },
  {
    label: 'Élève',
    desc: 'Progression, motivation et révélation du plein potentiel de chaque élève.',
    gradient: 'from-tran-mustard-500 to-tran-mustard-700',
    ring: 'ring-tran-mustard-500/25',
    icon: FiAward,
    imageSlot: 'homeRoleStudent' as const,
    image: '/home/role-student.jpg',
    imageAlt: 'Élèves en activité',
  },
  {
    label: 'Parent',
    desc: 'Partenaire essentiel : suivi, dialogue et engagement pour la réussite scolaire.',
    gradient: 'from-tran-mauve-700 to-tran-mustard-600',
    ring: 'ring-tran-mustard-500/20',
    icon: FiHeart,
    imageSlot: 'homeRoleParent' as const,
    image: '/home/role-parent.jpg',
    imageAlt: 'Familles et parents d’élèves',
  },
];

const VALUE_ICONS = {
  award: FiAward,
  heart: FiHeart,
  shield: FiShield,
  users: FiUsers,
} as const;

const HIGHLIGHTS = HOME_VALUES.map((v) => ({
  title: v.title,
  text: v.text,
  icon: VALUE_ICONS[v.icon],
}));

const EXPERIENCE_CARDS = [
  {
    eyebrow: 'Pédagogie',
    title: 'Un cadre académique exigeant',
    text: 'Des apprentissages structurés, une progression lisible et des repères clairs pour accompagner chaque élève.',
    stat: 'Suivi continu',
    icon: FiTarget,
    accent: 'from-tran-mauve-500 to-tran-mauve-800',
  },
  {
    eyebrow: 'Vie scolaire',
    title: 'Discipline, écoute et sérénité',
    text: 'Un environnement organisé où la rigueur, le dialogue et l’encadrement renforcent la confiance.',
    stat: 'Cadre maîtrisé',
    icon: FiShield,
    accent: 'from-tran-mustard-500 to-tran-mustard-800',
  },
  {
    eyebrow: 'Familles',
    title: 'Parents pleinement associés',
    text: 'Une relation école-famille pensée pour rendre les informations plus accessibles et les décisions plus rapides.',
    stat: 'Lien renforcé',
    icon: FiUsers,
    accent: 'from-tran-mauve-700 to-tran-mustard-700',
  },
] as const;

const ADMISSION_STEPS = [
  {
    step: '01',
    title: 'Préparer le dossier',
    text: 'Choisissez le niveau, renseignez les informations essentielles et rassemblez les pièces demandées.',
    icon: FiFileText,
  },
  {
    step: '02',
    title: 'Soumettre la demande',
    text: 'La pré-inscription est enregistrée avec une référence de suivi pour garder une trace claire du dossier.',
    icon: FiCompass,
  },
  {
    step: '03',
    title: 'Suivi par l’établissement',
    text: 'L’administration examine la demande, oriente la famille et confirme les prochaines étapes.',
    icon: FiCheck,
  },
] as const;

const PLATFORM_FEATURES = [
  { title: 'Portails sécurisés', text: 'Accès dédiés pour l’administration, les équipes, les familles et les élèves.', icon: FiShield },
  { title: 'Suivi scolaire', text: 'Notes, absences, frais et informations importantes centralisés.', icon: FiBarChart2 },
  { title: 'Communication claire', text: 'Informations pratiques, annonces et démarches mieux organisées.', icon: FiMessageSquare },
  { title: 'Pilotage moderne', text: 'Une interface conçue pour accélérer les tâches et réduire les erreurs.', icon: FiCpu },
] as const;

const HERO_FLOATING = [
  { t: 'Excellence', ok: true },
  { t: 'Discipline & écoute', ok: true },
  { t: 'Parents partenaires', ok: true },
];

export default function Home() {
  const { user } = useAuth();
  const { navigationLogoAbsolute, branding } = useAppBranding();
  const contact = useMemo(() => resolveSchoolContactInfo(branding), [branding]);
  const [year, setYear] = useState(() => computeCurrentAcademicYear());
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const schoolDisplayName = contact.name;
  const schoolShortName =
    branding.appTitle?.trim() && branding.appTitle.trim() !== schoolDisplayName
      ? branding.appTitle.trim()
      : schoolDisplayName;
  const headerTitle = schoolDisplayName;
  const headerTagline =
    branding.appTagline?.trim() || 'Gestion scolaire moderne';
  const schoolIntro = DEFAULT_INTRO;
  const schoolMapsUrl = contact.mapsUrl;
  const hasPhone = Boolean(contact.phone && contact.phoneTel);
  const hasAddress = Boolean(contact.address.trim());

  useEffect(() => {
    document.title = `${headerTitle} · Accueil`;
  }, [headerTitle]);

  useEffect(() => {
    setYear(getCurrentAcademicYear());
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="home-page home-page--ultra min-h-screen font-sans text-tran-mauve-950 antialiased">
      <header
        className={`home-header sticky top-0 z-50 transition-all duration-300 home-ultra-nav ${
          navScrolled ? 'home-ultra-nav--scrolled' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex h-14 min-h-14 items-center justify-between gap-3 sm:h-16">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tran-mustard-500/45 focus-visible:ring-offset-2"
          >
            <div
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-tran-mustard-900/20 ring-2 ring-tran-mustard-400/40 ${
                navigationLogoAbsolute
                  ? 'bg-white'
                  : 'bg-gradient-to-br from-tran-mauve-900 via-tran-mauve-800 to-tran-mauve-950 text-tran-mustard-100'
              }`}
            >
              {navigationLogoAbsolute ? (
                // eslint-disable-next-line @next/next/no-img-element
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
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-tran-mustard-800/80 sm:block">
                {headerTagline}
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-2 sm:gap-3 md:flex shrink-0">
            {user ? (
                <Link href={getRoleDashboardPath(user.role)}>
                <Button>Mon espace</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary">Connexion</Button>
                </Link>
                <PreInscriptionSchoolEntry />
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-stone-100/90 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tran-mustard-500/45"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
          </div>

          <HomeNavLinks
            className="home-header-nav hidden flex-wrap items-center justify-center gap-0.5 border-t border-stone-200/80 py-2 md:flex"
            linkClassName="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tran-mustard-500/40"
          />
        </div>

        {menuOpen && (
          <div className="border-t border-stone-200/90 bg-white/95 px-4 py-4 shadow-inner backdrop-blur-sm md:hidden">
            <HomeNavLinks
              className="flex flex-col gap-1"
              linkClassName="rounded-xl px-4 py-3 text-sm font-medium text-stone-900 hover:bg-stone-50"
              onNavigate={() => setMenuOpen(false)}
            />
            <div className="mt-4 flex flex-col gap-2 border-t border-stone-200/90 pt-4">
              {user ? (
                <Link href={getRoleDashboardPath(user.role)} onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Mon espace</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <PreInscriptionSchoolEntry
                    className="w-full"
                    onNavigate={() => setMenuOpen(false)}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="home-ultra-hero relative overflow-hidden">
          <div className="page-hero-v2__glow pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="page-hero-v2__noise pointer-events-none absolute inset-0" aria-hidden />
          <div
            className="home-hero-orb home-hero-orb--drift-a absolute -left-32 top-10 h-[min(32rem,55vw)] w-[min(32rem,55vw)] bg-tran-mustard-500/20"
            aria-hidden
          />
          <div
            className="home-hero-orb home-hero-orb--drift-b absolute -right-40 bottom-0 h-[min(28rem,50vw)] w-[min(28rem,50vw)] bg-tran-mauve-500/12"
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">
              <div className="lg:col-span-6 xl:col-span-5">
                <div className="mb-8 flex flex-wrap items-center gap-3">
                  <span className="home-ultra-label !border-white/20 !bg-white/10 !text-tran-mustard-100 !shadow-none backdrop-blur-md">
                    <FiCalendar className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="normal-case tracking-normal">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
                        Année scolaire
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{year}</span>
                    </span>
                  </span>
                  {hasAddress && (
                    <span className="inline-flex max-w-xs items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-stone-300 backdrop-blur-md">
                      <FiMapPin className="h-3.5 w-3.5 shrink-0 text-tran-mustard-300" aria-hidden />
                      <span className="truncate">{contact.address}</span>
                    </span>
                  )}
                </div>

                <p className="home-hero-title-line text-sm font-bold uppercase tracking-[0.2em] text-tran-mustard-300/90">
                  {headerTagline}
                </p>
                <h1 className="home-hero-h1 home-hero-title-line home-ultra-section-title mt-4 text-4xl font-bold sm:text-5xl lg:text-[3.5rem]">
                  <span className="block text-white">{schoolDisplayName}</span>
                </h1>
                <p className="home-hero-sub-line mt-6 max-w-xl text-lg leading-relaxed text-stone-400/95 sm:text-xl">
                  {schoolIntro}
                </p>

                <ul className="mt-8 flex flex-wrap gap-2.5">
                  {TRUST_PILLS.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-stone-300 backdrop-blur-md"
                    >
                      <Icon className="h-4 w-4 text-tran-mustard-400" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {user ? (
                    <Link href={getRoleDashboardPath(user.role)} className="home-ultra-btn-primary w-full sm:w-auto">
                      Ouvrir mon espace
                      <FiArrowRight className="h-5 w-5" aria-hidden />
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" className="home-ultra-btn-primary w-full sm:w-auto">
                        Espace sécurisé
                        <FiArrowRight className="h-5 w-5" aria-hidden />
                      </Link>
                      <PreInscriptionSchoolEntry
                        variant="button"
                        buttonVariant="secondary"
                        className="home-ultra-btn-ghost w-full border-white/20 !text-white sm:w-auto"
                      />
                    </>
                  )}
                </div>

                {!user && (
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-300">
                    <Link href="/help" className="inline-flex items-center gap-2 transition-colors hover:text-tran-mustard-200">
                      <FiHelpCircle className="h-4 w-4" aria-hidden />
                      Aide
                    </Link>
                    <Link href="/documentation" className="inline-flex items-center gap-2 transition-colors hover:text-tran-mustard-200">
                      <FiFileText className="h-4 w-4" aria-hidden />
                      Guides
                    </Link>
                    <Link href="/contact" className="inline-flex items-center gap-2 transition-colors hover:text-tran-mustard-200">
                      <FiMessageSquare className="h-4 w-4" aria-hidden />
                      Contact
                    </Link>
                  </div>
                )}

                <div className="mt-12 grid grid-cols-3 gap-3 sm:max-w-md">
                  {HOME_STATS.map((s) => (
                    <div key={s.l} className="home-ultra-stat px-3 py-4 text-center sm:text-left">
                      <p className="font-display text-2xl font-semibold tabular-nums text-white sm:text-3xl">{s.n}</p>
                      <p className="home-ultra-stat__label mt-1 text-[10px] font-bold uppercase tracking-wider">
                        {s.l}
                      </p>
                      <p className="home-ultra-stat__detail text-[10px]">{s.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative lg:col-span-6 xl:col-span-7">
                <div className="home-ultra-visual home-hero-frame-in mx-auto max-w-xl lg:max-w-none">
                  <div className="home-ultra-visual__inner">
                    <div className="relative aspect-[5/4] min-h-[300px] sm:min-h-[360px] lg:min-h-[420px]">
                      <HomePageImage
                        slot="homeHeroPlatform"
                        defaultPath="/home/hero-platform.jpg"
                        alt={`${schoolDisplayName} — vie scolaire`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b12] via-transparent to-transparent opacity-90" aria-hidden />
                      <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80 motion-reduce:animate-none" />
                          <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        Portail actif
                      </div>
                      <div className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl border border-white/12 bg-black/50 p-4 backdrop-blur-xl">
                        <div className="flex flex-wrap gap-3">
                          {HERO_FLOATING.map(({ t }) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-2 text-sm font-medium text-white/95"
                            >
                              <FiCheck className="h-4 w-4 text-tran-mustard-400" aria-hidden />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bandeau défilant */}
        <section className="home-ultra-marquee home-marquee-strip relative overflow-hidden py-4 text-white">
          <div className="home-marquee overflow-hidden min-h-[3rem] flex items-center">
            <div className="home-marquee-track items-center gap-10 pr-10 text-sm font-semibold uppercase tracking-[0.2em]">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="flex shrink-0 items-center gap-10 whitespace-nowrap"
                >
                  <span className="text-tran-mustard-400/90 drop-shadow-[0_0_8px_rgba(201,162,39,0.35)]" aria-hidden>
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

        <HomeDirectorSection />

        {/* Expérience premium */}
        <section id="experience" className="relative z-10 px-4 py-16 sm:px-6 sm:py-20 scroll-mt-20">
          <HomeReveal>
            <div className="mx-auto max-w-7xl">
              <div className="home-experience-shell relative overflow-hidden rounded-[2.25rem] border border-stone-200/80 bg-white p-5 shadow-[0_36px_90px_-45px_rgba(30,31,56,0.38)] ring-1 ring-tran-mustard-400/15 sm:p-8 lg:p-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(201,162,39,0.18),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(90,91,154,0.14),transparent_38%)]" aria-hidden />
                <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.35fr] lg:items-end">
                  <div>
                    <span className="home-ultra-label">Expérience scolaire</span>
                    <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl lg:text-5xl">
                      Un parcours de réussite, pensé pour chaque élève.
                    </h2>
                    <div className="home-section-accent mx-0 mt-4" aria-hidden />
                    <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
                      {schoolDisplayName} combine exigence académique, encadrement quotidien et relation famille-école
                      pour offrir une expérience claire, rassurante et ambitieuse.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {EXPERIENCE_CARDS.map(({ eyebrow, title, text, stat, icon: Icon, accent }, idx) => (
                      <HomeReveal key={title} delayMs={idx * 70}>
                        <article className="home-ultra-card home-experience-card group relative h-full overflow-hidden p-6">
                          <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-xl ring-4 ring-white`}>
                            <Icon className="h-6 w-6" aria-hidden />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tran-mustard-800">
                            {eyebrow}
                          </p>
                          <h3 className="mt-2 font-display text-xl font-semibold text-stone-900">{title}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-stone-600">{text}</p>
                          <div className="mt-6 inline-flex rounded-full border border-tran-mauve-100 bg-tran-mauve-50 px-3 py-1 text-xs font-bold text-tran-mauve-800">
                            {stat}
                          </div>
                        </article>
                      </HomeReveal>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </HomeReveal>
        </section>

        {/* Bento — Piliers */}
        <section id="piliers" className="relative z-10 scroll-mt-24 px-4 sm:px-6">
          <HomeReveal>
          <div className="home-bento-outer relative mx-auto max-w-7xl rounded-[2rem] border border-stone-200/90 bg-white/65 p-1.5 shadow-[0_32px_64px_-28px_rgba(12,10,9,0.22)] backdrop-blur-2xl sm:p-2">
            <div className="home-bento-inner relative rounded-[1.65rem] bg-gradient-to-b from-white via-white to-stone-50/95 px-5 py-12 ring-1 ring-stone-900/[0.04] sm:px-8 sm:py-14 lg:px-12 lg:py-16">
              <div className="mb-12 flex flex-col gap-4 text-center lg:mb-14">
                <span className="home-ultra-label mx-auto">Notre projet éducatif</span>
                <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl lg:text-5xl">
                  {DEFAULT_MOTTO_SHORT}
                </h2>
                <div className="home-section-accent home-section-accent--glow" aria-hidden />
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-stone-600">
                  {DEFAULT_MISSION}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-3 md:gap-6">
                {PILLARS.map(({ title, text, icon: Icon, accent, span, image, imageAlt, imageSlot }, idx) => (
                  <HomeReveal key={title} delayMs={idx * 70} className={span}>
                  <article
                    className="home-pillar-sheen group relative h-full overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(30,31,56,0.12)] transition-all duration-500 hover:-translate-y-1.5 hover:border-tran-mustard-300/60 hover:shadow-[0_28px_56px_-22px_rgba(90,91,154,0.18)]"
                  >
                    <div
                      className={`relative w-full overflow-hidden ${span.includes('col-span-2') ? 'h-48 sm:h-56' : 'h-44 sm:h-48'}`}
                    >
                      <HomePageImage
                        slot={imageSlot}
                        defaultPath={image}
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

        {/* Établissement */}
        <section id="etablissement" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 scroll-mt-20">
          <HomeReveal>
          <div className="home-campus-split group overflow-hidden rounded-[2rem] border border-stone-200/90 bg-white shadow-[0_28px_56px_-24px_rgba(12,10,9,0.18)] ring-1 ring-tran-mustard-500/15 transition-all duration-500 hover:ring-tran-mustard-500/25 lg:grid lg:grid-cols-2">
            <div className="relative min-h-[260px] lg:min-h-[400px]">
              <HomePageImage
                slot="homeSplitCampus"
                defaultPath="/home/split-campus.jpg"
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
                {hasAddress && (
                  <>
                    <p className="text-sm font-semibold text-white">{contact.address}</p>
                    <p className="mt-1 text-xs text-stone-300">
                      Établissement scolaire — accueil du lundi au vendredi.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
              <span className="home-ultra-label">{schoolShortName}</span>
              <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl">
                {schoolDisplayName}
              </h2>
              <p className="mt-2 text-lg font-medium text-tran-mauve-700">Un établissement exigeant et accueillant</p>
              <div className="home-section-accent mx-0 mt-3" aria-hidden />
              <p className="mt-5 text-lg leading-relaxed text-stone-600">
                {schoolIntro}
              </p>
              <ul className="mt-8 space-y-3 text-stone-700">
                {[
                  'Éducation complète au-delà des cours',
                  'Équipes pédagogiques à l’écoute',
                  'Partenariat actif avec les familles',
                ].map((line) => (
                  <li key={line} className="flex items-center gap-3 text-sm font-medium">
                    <FiCheck className="h-5 w-5 shrink-0 text-tran-mauve-600" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                {hasPhone && (
                  <a
                    href={contact.phoneTel}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-tran-mauve-900 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-tran-mauve-900/25 transition-all hover:bg-tran-mauve-800"
                  >
                    <FiPhone className="h-4 w-4" aria-hidden />
                    {contact.phone}
                  </a>
                )}
                <PreInscriptionSchoolEntry
                  variant="button"
                  buttonVariant="secondary"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-7 py-4 text-sm font-bold text-stone-900 shadow-sm transition-all hover:border-tran-mustard-400 hover:bg-tran-mustard-50 sm:w-auto"
                />
              </div>
            </div>
          </div>
          </HomeReveal>
        </section>

        {/* Parcours d'admission */}
        <section id="parcours" className="relative overflow-hidden border-y border-stone-200/80 bg-gradient-to-br from-tran-mauve-950 via-tran-mauve-900 to-stone-950 py-20 text-white sm:py-24 scroll-mt-20">
          <div className="page-hero-v2__glow pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="home-journey-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
            <HomeReveal>
              <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <span className="home-ultra-label !border-white/25 !bg-white/10 !text-tran-mustard-100">
                    Admissions
                  </span>
                  <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                    Une inscription claire et rassurante.
                  </h2>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-300">
                    Le parcours est conçu pour guider les familles avec méthode : dossier, référence de suivi,
                    échange avec l’établissement et orientation vers la bonne classe.
                  </p>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    {!user && (
                      <PreInscriptionSchoolEntry
                        variant="button"
                        buttonVariant="secondary"
                        className="inline-flex items-center justify-center rounded-2xl border-0 bg-white px-7 py-4 text-sm font-bold text-stone-900 shadow-xl hover:bg-tran-mustard-50"
                      />
                    )}
                    <Link href="/contact">
                      <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15">
                        <FiMessageSquare className="h-4 w-4" aria-hidden />
                        Demander un renseignement
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {ADMISSION_STEPS.map(({ step, title, text, icon: Icon }, idx) => (
                    <HomeReveal key={title} delayMs={idx * 80}>
                      <article className="home-step-card relative h-full overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/10">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-display text-4xl font-black text-white/15">{step}</span>
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tran-mustard-400 text-tran-mauve-950 shadow-lg shadow-tran-mustard-950/20">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                        </div>
                        <h3 className="mt-7 font-display text-xl font-semibold text-white">{title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-stone-300">{text}</p>
                      </article>
                    </HomeReveal>
                  ))}
                </div>
              </div>
            </HomeReveal>
          </div>
        </section>

        {/* Rôles */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
          <div className="text-center">
            <span className="home-ultra-label mx-auto">Communauté</span>
            <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl lg:text-5xl">
              La communauté éducative
            </h2>
            <div className="home-section-accent mt-4" aria-hidden />
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
              Direction, enseignants, élèves et parents : chacun a sa place dans un projet éducatif commun.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ label, desc, gradient, ring, icon: Icon, image, imageAlt, imageSlot }, idx) => (
              <HomeReveal key={label} delayMs={idx * 55}>
              <div
                className={`home-role-card group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-lg shadow-stone-900/[0.06] ring-2 ${ring} transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <HomePageImage
                    slot={imageSlot}
                    defaultPath={image}
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

        {/* Plateforme digitale */}
        <section id="plateforme" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
            <div className="home-ultra-platform home-platform-panel relative mx-auto max-w-7xl overflow-hidden text-white">
              <div className="page-hero-v2__noise pointer-events-none absolute inset-0 opacity-40" aria-hidden />
              <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
                <div className="flex flex-col justify-between gap-10">
                  <div>
                    <span className="home-ultra-label !border-white/20 !bg-white/10 !text-tran-mustard-100">
                      <FiCpu className="h-3.5 w-3.5" aria-hidden />
                      Écosystème digital
                    </span>
                    <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                      Une gestion scolaire fluide pour toute la communauté.
                    </h2>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">
                      Portails dédiés, suivi en temps réel et communication structurée pour les familles, les élèves
                      et les équipes.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PLATFORM_FEATURES.map(({ title, text, icon: Icon }) => (
                      <article
                        key={title}
                        className="home-ultra-feature-tile rounded-2xl p-5"
                      >
                        <Icon className="h-5 w-5 text-tran-mustard-300" aria-hidden />
                        <h3 className="mt-4 font-display text-lg font-semibold text-white">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-stone-300">{text}</p>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="home-dashboard-mockup relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                  <div className="rounded-[1.35rem] bg-stone-950/90 p-4 ring-1 ring-white/10">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tran-mustard-200">
                          Tableau de bord
                        </p>
                        <p className="mt-1 font-display text-xl font-semibold text-white">Vue établissement</p>
                      </div>
                      <span className="rounded-full bg-tran-mustard-400 px-3 py-1 text-xs font-bold text-tran-mauve-950">
                        Live
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['Admissions', 'Dossiers suivis'],
                        ['Scolarité', 'Paiements contrôlés'],
                        ['Pédagogie', 'Progression visible'],
                        ['Familles', 'Informations centralisées'],
                      ].map(([title, desc], idx) => (
                        <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                idx % 2 === 0 ? 'w-4/5 bg-tran-mustard-400' : 'w-2/3 bg-tran-mauve-400'
                              }`}
                            />
                          </div>
                          <p className="font-semibold text-white">{title}</p>
                          <p className="mt-1 text-xs text-stone-300">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HomeReveal>
        </section>

        {/* Actualités */}
        <section id="actualites" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
            <div className="mb-12 text-center">
              <span className="home-ultra-label mx-auto">Vie de l&apos;établissement</span>
              <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl">
                Actualités
              </h2>
              <div className="home-section-accent mt-4" aria-hidden />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {HOME_NEWS.map((item, idx) => (
                <HomeReveal key={item.title} delayMs={idx * 60}>
                  <article className="home-ultra-card h-full p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-tran-mustard-800">{item.date}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-stone-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.excerpt}</p>
                  </article>
                </HomeReveal>
              ))}
            </div>
          </HomeReveal>
        </section>

        {/* Infos pratiques / Contact */}
        <section
          id="contact"
          className="scroll-mt-24 border-y border-stone-200/80 bg-gradient-to-b from-tran-mustard-50/40 via-white to-stone-50/80 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <HomeReveal>
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                <div>
                  <span className="home-ultra-label">Pratique</span>
                  <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl">
                    Infos pratiques
                  </h2>
                  <div className="home-section-accent mx-0 mt-3" aria-hidden />
                  <div className="mt-6 space-y-4">
                    <p className="flex items-start gap-3 text-stone-700">
                      <FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-tran-mustard-700" aria-hidden />
                      <span>
                        <a
                          href={schoolMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-stone-900 hover:text-tran-mustard-800 underline-offset-2 hover:underline"
                          aria-label={`Voir ${schoolDisplayName} sur Google Maps`}
                        >
                          {hasAddress ? contact.address : schoolDisplayName}
                        </a>
                      </span>
                    </p>
                    {hasPhone && (
                      <p className="flex items-center gap-3 text-stone-700">
                        <FiPhone className="h-5 w-5 shrink-0 text-tran-mustard-700" aria-hidden />
                        <a
                          href={contact.phoneTel}
                          className="font-semibold text-stone-900 hover:text-tran-mustard-800"
                        >
                          {contact.phone}
                        </a>
                      </p>
                    )}
                  </div>
                  <Link href="/contact" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-tran-mustard-900 hover:text-tran-mustard-700">
                    <FiMessageSquare className="h-4 w-4" />
                    Nous écrire
                  </Link>
                </div>
                <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-lg ring-1 ring-stone-900/[0.03] sm:p-8">
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
                    <FiClock className="h-5 w-5 text-tran-mustard-700" aria-hidden />
                    Heures d&apos;ouverture
                  </h3>
                  <table className="mt-5 w-full text-sm">
                    <tbody>
                      {HOME_OPENING_HOURS.map((row) => (
                        <tr key={row.day} className="border-b border-stone-100 last:border-0">
                          <td className="py-2.5 font-medium text-stone-800">{row.day}</td>
                          <td className="py-2.5 text-right tabular-nums text-stone-600">{row.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </HomeReveal>
          </div>
        </section>

        {/* Points forts */}
        <section className="border-y border-stone-200/80 bg-gradient-to-b from-stone-50/90 via-white to-tran-mustard-50/20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <HomeReveal>
            <div className="text-center">
              <span className="home-ultra-label mx-auto">Engagement</span>
              <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl">
                Pourquoi nous choisir ?
              </h2>
              <div className="home-section-accent mt-4" aria-hidden />
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
                Nos élèves sont notre fierté : motivation, courage et détermination au service de la réussite.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {HIGHLIGHTS.map(({ title, text, icon: Icon }, i) => (
                <HomeReveal key={title} delayMs={i * 80}>
                <div
                  className="group relative rounded-3xl bg-gradient-to-br from-tran-mustard-400/30 via-stone-200/40 to-tran-mustard-200/20 p-[1px] shadow-lg shadow-tran-mustard-900/5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="home-ultra-card h-full p-8">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-tran-mustard-800/70">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-tran-mustard-100 to-tran-mustard-50 text-tran-mustard-900 shadow-md ring-1 ring-tran-mustard-200/80 transition-transform group-hover:scale-105">
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

        {/* Témoignages */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
              <div className="home-ultra-card p-8">
                <span className="home-ultra-label">Confiance</span>
                <h2 className="home-ultra-section-title mt-5 text-3xl font-semibold text-stone-900 sm:text-4xl">
                  Une communauté engagée pour la réussite.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-stone-600">
                  Exigence académique, suivi personnalisé et dialogue constant avec les familles : les piliers de notre
                  projet éducatif.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={`star-trust-${i}`} className="h-5 w-5 fill-tran-mustard-400 text-tran-mustard-400" aria-hidden />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-stone-600">Exigence, suivi, réussite</span>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {HOME_TESTIMONIALS.map(({ quote, author, role }, idx) => (
                  <HomeReveal key={author} delayMs={idx * 80}>
                    <figure className="home-ultra-card home-testimonial-card relative h-full p-7">
                      <blockquote className="font-display text-xl font-medium leading-relaxed text-stone-900">
                        « {quote} »
                      </blockquote>
                      <figcaption className="mt-8 border-t border-stone-100 pt-5">
                        <p className="font-semibold text-stone-900">{author}</p>
                        <p className="mt-1 text-sm text-stone-600">{role}</p>
                      </figcaption>
                    </figure>
                  </HomeReveal>
                ))}
              </div>
            </div>
          </HomeReveal>
        </section>

        {/* Vision & citation */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <HomeReveal>
            <div className="home-ultra-quote text-center sm:px-10">
              <FiMessageSquare className="mx-auto h-10 w-10 text-tran-mustard-700" aria-hidden />
              <blockquote className="home-ultra-section-title mx-auto mt-8 max-w-3xl text-2xl font-medium text-stone-900 sm:text-3xl">
                « {DEFAULT_MOTTO} »
              </blockquote>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                {schoolDisplayName}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="h-5 w-5 fill-tran-mustard-400 text-tran-mustard-400" aria-hidden />
                ))}
                <span className="ml-2 text-sm font-medium text-stone-600">Exigence · Suivi · Réussite</span>
              </div>
            </div>
          </HomeReveal>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
          <HomeReveal>
          <div className="home-cta-shell relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-tran-mauve-950 via-tran-mauve-900 to-tran-mustard-950 px-6 py-16 text-center sm:px-12 sm:py-20 lg:py-24">
            <div className="home-cta-aurora pointer-events-none absolute inset-0 z-[1]" aria-hidden />
            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/15 to-white/[0.04] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md ring-1 ring-tran-mustard-400/20">
                <FiClock className="h-8 w-8 text-tran-mustard-200" aria-hidden />
              </div>
              <h2 className="home-ultra-section-title text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                Rejoignez {schoolDisplayName}
              </h2>
              <p className="mt-5 text-lg text-stone-400">
                Inscription en ligne, espace sécurisé pour les familles et l’équipe pédagogique.
                {hasPhone && (
                  <>
                    {' '}
                    Pour toute question :{' '}
                    <a
                      href={contact.phoneTel}
                      className="font-semibold text-tran-mustard-200 hover:text-white"
                    >
                      {contact.phone}
                    </a>
                    .
                  </>
                )}
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {!user ? (
                  <>
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="min-w-[220px] border-0 bg-white font-bold text-stone-900 shadow-xl hover:bg-tran-mustard-50"
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
                  <Link href={getRoleDashboardPath(user.role)}>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="border-0 bg-white font-bold text-stone-900 shadow-xl hover:bg-tran-mustard-50"
                    >
                      Retour à mon espace
                    </Button>
                  </Link>
                )}
              </div>
              <p className="mt-12 text-sm text-stone-300">
                <Link
                  href="/faq"
                  className="font-medium text-tran-mustard-200 underline decoration-tran-mustard-400/40 underline-offset-4 hover:text-white"
                >
                  Questions fréquentes
                </Link>
                <span className="mx-2 text-stone-400">·</span>
                <Link
                  href="/contact"
                  className="font-medium text-tran-mustard-200 underline decoration-tran-mustard-400/40 underline-offset-4 hover:text-white"
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
