/** Contenu générique de la page d'accueil (sans nom d'établissement codé en dur). */

export const DEFAULT_INTRO =
  'Une plateforme pour structurer la scolarité, accompagner les élèves et renforcer le lien avec les familles.';

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
