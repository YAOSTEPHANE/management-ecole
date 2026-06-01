import { isVercelBlobUrl } from './blob-storage.util';
import {
  isSensitiveUploadPath,
  normalizeUploadRequestPath,
  uploadRelativePathFromStoredUrl,
} from './sensitive-upload-path.util';
import { getPublicUploadsUrlPrefix } from './uploads-path';

/**
 * URL utilisable par le client.
 * Pour les fichiers sensibles sur Blob, on force un passage via le backend
 * afin d'appliquer l'autorisation applicative avant délivrance.
 */
export function resolveStoredFileAccessUrl(storedUrl: string): string {
  const rel = uploadRelativePathFromStoredUrl(storedUrl);
  if (!rel) return storedUrl;

  if (isSensitiveUploadPath(rel)) {
    if (isVercelBlobUrl(storedUrl)) {
      // Ex: identity-documents/file.pdf -> /api/uploads/identity-documents/file.pdf
      const pathNoPrefix = normalizeUploadRequestPath(rel)
        .replace(/^\/uploads\//, '')
        .replace(/^\//, '');
      return `${getPublicUploadsUrlPrefix()}/${pathNoPrefix}`;
    }
    return storedUrl;
  }

  return storedUrl;
}

/**
 * Compat: garde une API existante sans exposer de jeton URL.
 * Les liens sensibles sont désormais protégés par autorisation backend uniquement.
 */
export function withUploadAccessQuery(storedUrl: string): string {
  return resolveStoredFileAccessUrl(storedUrl);
}
