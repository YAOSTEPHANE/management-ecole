import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Supprime un fichier local à partir de l’URL publique (/uploads/...).
 */
export function deleteUploadedFileByPublicUrl(fileUrl: string): void {
  try {
    const m = fileUrl.match(/\/uploads\/(.+)$/);
    if (!m?.[1]) return;
    const segments = m[1].split('/').filter(Boolean);
    const fullPath = path.join(UPLOADS_DIR, ...segments);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    /* ignore */
  }
}
