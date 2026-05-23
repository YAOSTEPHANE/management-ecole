import InscriptionAdmission from '../../views/InscriptionAdmission';

/** Pas de page figée au build — le formulaire public doit refléter le dernier déploiement. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Pré-inscription en ligne | Gestion Scolaire',
  description: 'Formulaire de pré-inscription et suivi de dossier candidature',
};

export default function InscriptionPage() {
  return <InscriptionAdmission />;
}
