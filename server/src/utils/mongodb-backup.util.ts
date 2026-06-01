import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const BACKUP_FILE_PREFIX = 'mongo-backup-';
const BACKUP_FILE_SUFFIX = '.archive.gz';
const BACKUP_FILENAME_RE = /^mongo-backup-[0-9TZ-]+\.archive\.gz$/;

export function getMongoBackupDir(): string {
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

function runMongoTool(
  command: 'mongodump' | 'mongorestore',
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
            `${command} introuvable. Installez MongoDB Database Tools et ajoutez-le au PATH.`,
          ),
        );
        return;
      }
      reject(err);
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} a quitté avec le code ${code}. ${stderr.trim()}`));
    });
  });
}

function runMongodump(uri: string, archivePath: string): Promise<void> {
  return runMongoTool('mongodump', [`--uri=${uri}`, `--archive=${archivePath}`, '--gzip']);
}

function runMongorestore(uri: string, archivePath: string): Promise<void> {
  return runMongoTool('mongorestore', [
    `--uri=${uri}`,
    `--archive=${archivePath}`,
    '--gzip',
    '--drop',
  ]);
}

export type MongoBackupResult = { ok: true; archivePath: string; filename: string } | { ok: false; error: string };

export type MongoRestoreResult = { ok: true; filename: string } | { ok: false; error: string };

export type MongoBackupArchive = {
  filename: string;
  sizeBytes: number;
  createdAt: string;
};

/** Valide un nom d’archive et retourne le chemin absolu sécurisé. */
export function resolveMongoBackupArchivePath(filename: string): string | null {
  const base = path.basename(filename);
  if (!BACKUP_FILENAME_RE.test(base)) return null;
  const backupDir = path.resolve(getMongoBackupDir());
  const full = path.resolve(path.join(backupDir, base));
  const rel = path.relative(backupDir, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
}

export async function listMongoBackups(): Promise<MongoBackupArchive[]> {
  const backupDir = getMongoBackupDir();
  const names = await fs.readdir(backupDir).catch(() => []);
  const archives: MongoBackupArchive[] = [];

  for (const name of names) {
    if (!name.startsWith(BACKUP_FILE_PREFIX) || !name.endsWith(BACKUP_FILE_SUFFIX)) continue;
    const full = path.join(backupDir, name);
    const st = await fs.stat(full).catch(() => null);
    if (!st?.isFile()) continue;
    archives.push({
      filename: name,
      sizeBytes: st.size,
      createdAt: st.mtime.toISOString(),
    });
  }

  return archives.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Sauvegarde complète de la base pointée par DATABASE_URL (mongodump --gzip).
 */
export async function runMongoBackup(): Promise<MongoBackupResult> {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) {
    return { ok: false, error: 'DATABASE_URL est absent.' };
  }

  const backupDir = getMongoBackupDir();
  await fs.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${BACKUP_FILE_PREFIX}${stamp}${BACKUP_FILE_SUFFIX}`;
  const archivePath = path.join(backupDir, filename);

  try {
    await runMongodump(uri, archivePath);
    await pruneOldBackups(backupDir, getRetentionDays());
    return { ok: true, archivePath, filename };
  } catch (e) {
    await fs.unlink(archivePath).catch(() => {});
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * Restauration complète depuis une archive serveur (mongorestore --gzip --drop).
 * Remplace toutes les collections de la base ciblée par DATABASE_URL.
 */
export async function runMongoRestore(filename: string): Promise<MongoRestoreResult> {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) {
    return { ok: false, error: 'DATABASE_URL est absent.' };
  }

  const archivePath = resolveMongoBackupArchivePath(filename);
  if (!archivePath) {
    return { ok: false, error: 'Nom de fichier de sauvegarde invalide.' };
  }

  try {
    await fs.access(archivePath);
  } catch {
    return { ok: false, error: 'Archive de sauvegarde introuvable sur le serveur.' };
  }

  try {
    await runMongorestore(uri, archivePath);
    return { ok: true, filename: path.basename(filename) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
