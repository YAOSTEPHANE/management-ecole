/** Aligné sur `DEV_TEST_PASSWORD` dans prisma/seed.ts (comptes `prisma:seed:dev`). */
export const DEV_TEST_PASSWORD = 'Test@1234';

/** Surcharge : `TEST_PASSWORD` en variable d'environnement. */
export const TEST_PASSWORD = process.env.TEST_PASSWORD?.trim() || DEV_TEST_PASSWORD;
