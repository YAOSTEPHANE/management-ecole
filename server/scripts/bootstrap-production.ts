import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { seedAllSchoolsStaffMetiers } from '../src/utils/school-staff-metiers.util';

const prisma = new PrismaClient();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

async function upsertAdminUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  passwordHash: string;
}): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: params.email.toLowerCase() },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      isActive: true,
    },
    create: {
      email: params.email.toLowerCase(),
      password: params.passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      isActive: true,
    },
    select: { id: true },
  });
  return user.id;
}

async function main() {
  console.log('🚀 Bootstrap production (non destructif)');

  const adminEmail = requiredEnv('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  const adminPassword = requiredEnv('BOOTSTRAP_ADMIN_PASSWORD');
  const superAdminEmail = process.env.BOOTSTRAP_SUPERADMIN_EMAIL?.trim()?.toLowerCase() || null;
  const superAdminPassword = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD?.trim() || null;

  const schoolSlug = optionalEnv('BOOTSTRAP_DEFAULT_SCHOOL_SLUG', 'default-school');
  const schoolName = optionalEnv('BOOTSTRAP_DEFAULT_SCHOOL_NAME', 'Établissement principal');
  const schoolPhone = process.env.BOOTSTRAP_DEFAULT_SCHOOL_PHONE?.trim() || null;
  const schoolAddress = process.env.BOOTSTRAP_DEFAULT_SCHOOL_ADDRESS?.trim() || null;

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const adminId = await upsertAdminUser({
    email: adminEmail,
    firstName: optionalEnv('BOOTSTRAP_ADMIN_FIRST_NAME', 'Admin'),
    lastName: optionalEnv('BOOTSTRAP_ADMIN_LAST_NAME', 'Principal'),
    role: 'ADMIN',
    passwordHash: adminHash,
  });

  if (superAdminEmail && superAdminPassword) {
    const superHash = await bcrypt.hash(superAdminPassword, 10);
    await upsertAdminUser({
      email: superAdminEmail,
      firstName: optionalEnv('BOOTSTRAP_SUPERADMIN_FIRST_NAME', 'Super'),
      lastName: optionalEnv('BOOTSTRAP_SUPERADMIN_LAST_NAME', 'Admin'),
      role: 'SUPER_ADMIN',
      passwordHash: superHash,
    });
  }

  const school = await prisma.school.upsert({
    where: { slug: schoolSlug },
    update: {
      name: schoolName,
      phone: schoolPhone,
      address: schoolAddress,
      isActive: true,
    },
    create: {
      slug: schoolSlug,
      name: schoolName,
      phone: schoolPhone,
      address: schoolAddress,
      isActive: true,
      isDefault: true,
    },
    select: { id: true, name: true, slug: true },
  });

  await prisma.schoolMember.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: adminId } },
    update: { isDefault: true },
    create: { schoolId: school.id, userId: adminId, isDefault: true },
  });

  await prisma.appBranding.upsert({
    where: { id: school.id },
    update: {
      schoolId: school.id,
      schoolDisplayName: school.name,
      schoolPhone: schoolPhone,
      schoolAddress: schoolAddress,
    },
    create: {
      id: school.id,
      schoolId: school.id,
      schoolDisplayName: school.name,
      schoolPhone: schoolPhone,
      schoolAddress: schoolAddress,
    },
  });

  await seedAllSchoolsStaffMetiers();

  console.log('✅ Bootstrap production terminé');
  console.log(`   - École par défaut: ${school.name} (${school.slug})`);
  console.log(`   - Admin initial: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur bootstrap production:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

