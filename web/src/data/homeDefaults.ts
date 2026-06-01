/** Contenu générique de la page d'accueil (sans nom d'établissement codé en dur). */

export const DEFAULT_INTRO =
  'Exigence académique, accompagnement humain et outils numériques au service de la réussite de chaque élève.';

export const DEFAULT_MISSION =
  'Offrir une éducation de qualité, dans un cadre structuré, moderne et orienté vers la réussite.';

export const DEFAULT_MOTTO_SHORT = 'Former aujourd’hui, bâtir demain.';

export const DEFAULT_MOTTO =
  'Former les élèves d’aujourd’hui, c’est préparer la société de demain.';

export const HOME_MARQUEE = [
  'Excellence éducative',
  'Cadre structuré & moderne',
  'Vie scolaire exigeante',
  'Partenariat avec les familles',
  'Discipline & accompagnement',
  'Orientation réussite',
] as const;

export const HOME_OPENING_HOURS = [
  { day: 'Lundi', hours: '07:00 – 17:00' },
  { day: 'Mardi', hours: '07:00 – 17:00' },
  { day: 'Mercredi', hours: '07:00 – 12:00' },
  { day: 'Jeudi', hours: '07:00 – 17:00' },
  { day: 'Vendredi', hours: '07:00 – 17:00' },
] as const;

export const HOME_VALUES = [
  {
    title: 'Excellence & innovation',
    text: 'Une pédagogie exigeante et moderne pour révéler le plein potentiel de chaque élève.',
    icon: 'award' as const,
  },
  {
    title: 'Épanouissement global',
    text: 'Intellectuel et personnel : former des citoyens compétents, responsables et confiants.',
    icon: 'heart' as const,
  },
  {
    title: 'Vie scolaire',
    text: 'Discipline, accompagnement et écoute au quotidien pour un climat de travail serein.',
    icon: 'shield' as const,
  },
  {
    title: 'Parents partenaires',
    text: 'Votre suivi et votre collaboration sont essentiels à la réussite de vos enfants.',
    icon: 'users' as const,
  },
] as const;

export const HOME_STATS = [
  { n: '07h–17h', l: 'accueil', d: 'lun. – ven. (sauf mer.)' },
  { n: '4', l: 'portails', d: 'familles, élèves, équipes' },
  { n: '1', l: 'plateforme', d: 'suivi centralisé' },
] as const;

export const HOME_NEWS = [
  {
    date: '19 janv. 2026',
    title: 'En route pour une nouvelle semaine',
    excerpt:
      'Une nouvelle semaine porteuse de défis à relever, de savoirs à acquérir et de réussites à construire.',
  },
  {
    date: '1 janv. 2026',
    title: 'Vœux du Nouvel An',
    excerpt:
      'Meilleurs vœux aux parents, élèves, enseignants et partenaires. Poursuivons notre engagement pour une éducation de qualité.',
  },
  {
    date: '18 déc. 2025',
    title: 'Journée portes ouvertes',
    excerpt:
      'Dialogue parents–enseignants et suivi des bulletins. Ensemble, préparons l’avenir de nos élèves.',
  },
  {
    date: '29 nov. 2025',
    title: 'Notre mission',
    excerpt:
      'Former aujourd’hui, bâtir demain : un cadre structuré, moderne et orienté vers la réussite scolaire.',
  },
] as const;

export const HOME_TESTIMONIALS = [
  {
    quote:
      'Un établissement qui associe exigence, discipline et accompagnement humain dans une vision claire de la réussite.',
    author: 'Communauté éducative',
    role: 'Projet scolaire',
  },
  {
    quote:
      'Chaque élève doit se sentir attendu, guidé et encouragé à progresser avec sérieux et confiance.',
    author: 'Vie scolaire',
    role: 'Encadrement quotidien',
  },
] as const;
