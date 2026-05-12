import dotenv from 'dotenv';
import path from 'path';
import { runMongoBackup } from '../src/utils/mongodb-backup.util';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function main(): Promise<void> {
  const result = await runMongoBackup();
  if (result.ok) {
    console.log('Sauvegarde terminée :', result.archivePath);
    process.exit(0);
  } else {
    console.error('Échec de la sauvegarde :', result.error);
    process.exit(1);
  }
}

main();
