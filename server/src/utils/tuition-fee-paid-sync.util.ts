import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Recalcule le total des paiements COMPLETED pour une ligne de frais et met à jour `isPaid` / `paidAt`.
 */
export async function syncTuitionFeePaidStatusForFeeId(
  db: DbClient,
  tuitionFeeId: string,
): Promise<void> {
  const tuitionFee = await db.tuitionFee.findUnique({ where: { id: tuitionFeeId } });
  if (!tuitionFee) return;

  const completedPayments = await db.payment.findMany({
    where: { tuitionFeeId, status: 'COMPLETED' },
  });
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const isFullyPaid = totalPaid >= tuitionFee.amount;

  await db.tuitionFee.update({
    where: { id: tuitionFeeId },
    data: {
      isPaid: isFullyPaid,
      paidAt: isFullyPaid ? new Date() : null,
    },
  });
}
