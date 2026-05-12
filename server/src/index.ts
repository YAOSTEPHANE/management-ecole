import dotenv from 'dotenv';
import { ensureJwtConfiguration } from './utils/jwt.util';
import { createApp } from './app/createApp';
import { startScheduledMongoBackups } from './jobs/scheduled-mongodb-backup';
import { startScheduledTuitionReminders } from './jobs/scheduled-tuition-reminders';
import { startScheduledAppointmentReminders } from './jobs/scheduled-appointment-reminders';

dotenv.config();

try {
  ensureJwtConfiguration();
} catch (e) {
  console.error(e);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.NFC_API_KEY || process.env.NFC_API_KEY === 'nfc-device-key-2024')
) {
  console.warn(
    '[Sécurité] NFC_API_KEY est absent ou vaut la valeur par défaut — définissez une clé forte en production.'
  );
}

if (process.env.NODE_ENV === 'production' && !process.env.SENSITIVE_FIELD_ENCRYPTION_KEY?.trim()) {
  console.warn(
    '[Sécurité] SENSITIVE_FIELD_ENCRYPTION_KEY est absent — les champs élève sensibles (adresse, urgence, santé) sont stockés en clair. Définissez une clé forte et ré-enregistrez les données si besoin.'
  );
}

const app = createApp();
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  startScheduledMongoBackups();
  startScheduledTuitionReminders();
  startScheduledAppointmentReminders();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
