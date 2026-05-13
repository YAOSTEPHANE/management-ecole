/**
 * Client HTTP et appels API regroupés par rôle / domaine.
 * Importer depuis `@/services/api` ou `../services/api` comme avant.
 */
export { default as api } from './client';
export { default } from './client';
export { authApi } from './auth';
export { publicApi } from './public';
export { adminApi } from './admin.api';
export { adminParentGuardiansApi } from './admin-parent-guardians.api';
export { adminTuitionCatalogApi } from './admin-tuition-catalog.api';
export { teacherApi } from './teacher.api';
export { studentApi } from './student.api';
export { parentApi } from './parent.api';
export { parentFamilyPortalApi } from './parent-family-portal.api';
export { educatorApi } from './educator.api';
export { superAdminApi } from './superAdmin.api';
export { academicValidationApi } from './academicValidation.api';
export { elearningApi, uploadElearningFile } from './elearning.api';
export { uploadIdentityDocument, uploadTeacherAdministrativeDocument, uploadAssignmentAttachment } from './upload';
