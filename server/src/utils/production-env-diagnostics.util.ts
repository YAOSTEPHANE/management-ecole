/** Journalise les variables manquantes en production (sans exposer de secrets). */
export function logProductionEnvDiagnostics(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing: string[] = [];
  const jwt = (process.env.JWT_SECRET ?? '').trim();
  if (!jwt || jwt.length < 32) missing.push('JWT_SECRET (≥ 32 caractères)');

  const db = (process.env.DATABASE_URL ?? '').trim();
  if (!db) missing.push('DATABASE_URL');

  const frontend = (process.env.FRONTEND_URL ?? '').trim();
  if (!frontend) missing.push('FRONTEND_URL');

  const nfc = (process.env.NFC_API_KEY ?? '').trim();
  if (!nfc || nfc.length < 32) {
    console.warn(
      '[Config] NFC_API_KEY absent ou faible — les routes NFC / reconnaissance faciale seront indisponibles jusqu’à configuration.',
    );
  }

  if (!process.env.SENSITIVE_FIELD_ENCRYPTION_KEY?.trim()) {
    console.warn(
      '[Config] SENSITIVE_FIELD_ENCRYPTION_KEY absent — champs sensibles élève non chiffrés.',
    );
  }

  if (process.env.VERCEL === '1' && !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.warn('[Config] BLOB_READ_WRITE_TOKEN absent — uploads non persistants sur Vercel.');
  }

  if (missing.length > 0) {
    console.error(
      `[Config] Variables obligatoires manquantes en production : ${missing.join(', ')}`,
    );
  }
}

/** Message d’erreur utilisateur pour échec Prisma (connexion, timeout). */
export function prismaConnectionErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const code = 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'P1001' || code === 'P1017') {
    return 'Base de données inaccessible. Réessayez dans quelques instants ou contactez l’administrateur.';
  }
  if (code === 'P1003' || code === 'P1012') {
    return 'Configuration base de données invalide sur le serveur.';
  }
  const msg = 'message' in error ? String((error as { message: unknown }).message) : '';
  if (/connect|ECONNREFUSED|Server selection timed out/i.test(msg)) {
    return 'Impossible de joindre la base de données.';
  }
  return null;
}
