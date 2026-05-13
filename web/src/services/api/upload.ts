import api from './client';

/** Upload multipart : pièce d'identité (champ fichier `identityDocument`, champs `type`, `label?`, `notes?`, `studentId?` si admin) */
export const uploadIdentityDocument = async (formData: FormData) => {
  const response = await api.post('/upload/identity-document', formData);
  return response.data;
};

export const uploadTeacherAdministrativeDocument = async (formData: FormData) => {
  const response = await api.post('/upload/teacher-admin-document', formData);
  return response.data;
};

/** Upload multipart : pièce jointe de devoir (champ fichier `assignment`) */
export const uploadAssignmentAttachment = async (file: File) => {
  const formData = new FormData();
  formData.append('assignment', file);
  const response = await api.post('/upload/assignment', formData);
  return response.data as { url: string; filename?: string; message?: string };
};

export const uploadDigitalLibraryFile = async (file: File) => {
  const formData = new FormData();
  formData.append('digitalLibrary', file);
  const response = await api.post('/upload/digital-library', formData);
  return response.data as { url: string; filename?: string; mimeType?: string; size?: number };
};
