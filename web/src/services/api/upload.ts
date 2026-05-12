import api from './client';

/** Upload multipart : pièce d'identité (champ fichier `identityDocument`, champs `type`, `label?`, `notes?`, `studentId?` si admin) */
export const uploadIdentityDocument = async (formData: FormData) => {
  const response = await api.post('/upload/identity-document', formData);
  return response.data;
};

/** Upload multipart : document RH enseignant (`teacherAdminDocument`, `type`, `teacherId`, `label?`, `notes?`) */
export const uploadTeacherAdministrativeDocument = async (formData: FormData) => {
  const response = await api.post('/upload/teacher-admin-document', formData);
  return response.data;
};
