import fs from 'fs';
import path from 'path';
import { getUploadsRootDir } from './uploads-path';

/**
 * Supprime un fichier local à partir de l’URL publique (/uploads/... ou /api/uploads/... sur Vercel).
 */
export function deleteUploadedFileByPublicUrl(fileUrl: string): void {
  try {
    const m = fileUrl.match(/\/(?:api\/)?uploads\/(.+)$/);
    if (!m?.[1]) return;
    const segments = m[1].split('/').filter(Boolean);
    const fullPath = path.join(getUploadsRootDir(), ...segments);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    /* ignore */
  }
}
