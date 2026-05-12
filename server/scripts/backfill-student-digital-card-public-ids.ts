import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/utils/prisma';
import { generateDigitalCardPublicId } from '../src/utils/digital-card.util';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function allocateUniquePublicId(): Promise<string> {
  for (let i = 0; i < 25; i += 1) {
    const candidate = generateDigitalCardPublicId();
    const clash = await prisma.student.findFirst({
      where: { digitalCardPublicId: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw new Error('Impossible de générer un digitalCardPublicId unique après plusieurs tentatives');
}

async function run(): Promise<void> {
  // `where: { digitalCardPublicId: null }` n'inclut pas toujours les documents MongoDB
  // où la clé est absente ; un index unique @unique considère absent + null comme doublons.
  const all = await prisma.student.findMany({
    select: { id: true, digitalCardPublicId: true },
  });
  const rows = all.filter(
    (s) =>
      s.digitalCardPublicId == null ||
      (typeof s.digitalCardPublicId === 'string' && s.digitalCardPublicId.trim() === ''),
  );

  if (rows.length === 0) {
    console.log('Aucun élève sans identifiant carte numérique — rien à faire.');
    return;
  }

  console.log(`Mise à jour de ${rows.length} élève(s) sans identifiant carte numérique…`);

  for (const row of rows) {
    const digitalCardPublicId = await allocateUniquePublicId();
    await prisma.student.update({
      where: { id: row.id },
      data: { digitalCardPublicId },
    });
  }

  console.log('Terminé. Relancez : npx prisma db push');
}

async function main(): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
