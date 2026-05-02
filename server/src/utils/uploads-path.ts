import path from 'path';

/**
 * Répertoire racine des uploads.
 * Sur Vercel (Lambda), seul /tmp est writable — sinon mkdir à l'import fait planter toute l'API.
 */
export function getUploadsRootDir(): string {
  if (process.env.VERCEL === '1') {
    return path.join('/tmp', 'school-manager-uploads');
  }
  return path.join(__dirname, '../../uploads');
}
