import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const BACKUP_FILE_PREFIX = 'mongo-backup-';
const BACKUP_FILE_SUFFIX = '.archive.gz';

function getBackupDir(): string {
  const raw = process.env.MONGODB_BACKUP_DIR?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  return path.resolve(process.cwd(), 'backups', 'mongodb');
}

function getRetentionDays(): number {
  const n = Number.parseInt(process.env.MONGODB_BACKUP_RETENTION_DAYS ?? '14', 10);
  return Number.isFinite(n) && n >= 1 ? n : 14;
}

async function pruneOldBackups(backupDir: string, retentionDays: number): Promise<void> {
  const names = await fs.readdir(backupDir).catch(() => []);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const name of names) {
    if (!name.startsWith(BACKUP_FILE_PREFIX) || !name.endsWith(BACKUP_FILE_SUFFIX)) continue;
    const full = path.join(backupDir, name);
    const st = await fs.stat(full).catch(() => null);
    if (st && st.mtimeMs < cutoff) {
      await fs.unlink(full).catch(() => {});
    }
  }
}

function runMongodump(uri: string, archivePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('mongodump', [`--uri=${uri}`, `--archive=${archivePath}`, '--gzip'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'mongodump introuvable. Installez MongoDB Database Tools (mongodump) et ajoutez-le au PATH.'
          )
        );
        return;
      }
      reject(err);
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mongodump a quitté avec le code ${code}. ${stderr.trim()}`));
    });
  });
}

export type MongoBackupResult = { ok: true; archivePath: string } | { ok: false; error: string };

/**
 * Sauvegarde complète de la base pointée par DATABASE_URL (mongodump --gzip).
 * Nécessite l’outil en ligne de commande `mongodump` (MongoDB Database Tools).
 */
export async function runMongoBackup(): Promise<MongoBackupResult> {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) {
    return { ok: false, error: 'DATABASE_URL est absent.' };
  }

  const backupDir = getBackupDir();
  await fs.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(backupDir, `${BACKUP_FILE_PREFIX}${stamp}${BACKUP_FILE_SUFFIX}`);

  try {
    await runMongodump(uri, archivePath);
    await pruneOldBackups(backupDir, getRetentionDays());
    return { ok: true, archivePath };
  } catch (e) {
    await fs.unlink(archivePath).catch(() => {});
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
