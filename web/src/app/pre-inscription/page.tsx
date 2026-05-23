import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Alias public vers le formulaire de pré-inscription. */
export default function PreInscriptionPage() {
  redirect('/inscription');
}
