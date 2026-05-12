import api from './client';

/** Formulaire public d'inscription et suivi de dossier (sans compte) */
export const publicApi = {
  submitAdmission: async (data: Record<string, unknown>) => {
    const response = await api.post('/public/admissions', data);
    return response.data;
  },
  trackAdmission: async (reference: string) => {
    const response = await api.get(
      `/public/admissions/track/${encodeURIComponent(reference.trim())}`
    );
    return response.data;
  },
  /** Carte étudiant affichée via lien / QR (sans authentification, identifiant opaque). */
  getStudentCardByPublicId: async (publicId: string) => {
    const response = await api.get(
      `/public/student-card/${encodeURIComponent(publicId.trim())}`
    );
    return response.data;
  },
};
