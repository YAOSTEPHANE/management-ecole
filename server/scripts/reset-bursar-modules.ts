/** Restaure les modules par défaut du métier BURSAR pour bursar@school.com */
import prisma from '../src/utils/prisma';
import { getEligibleModulesForSupportKind } from '../src/utils/staff-visible-modules.util';

async function main() {
  const mods = getEligibleModulesForSupportKind('BURSAR');
  const staff = await prisma.staffMember.findFirst({
    where: { user: { email: 'bursar@school.com' } },
    include: { user: { select: { email: true } } },
  });
  if (!staff) {
    console.log('Économe introuvable.');
    return;
  }
  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { visibleStaffModules: mods },
  });
  console.log(`Modules restaurés pour ${staff.user.email}:`, mods);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
