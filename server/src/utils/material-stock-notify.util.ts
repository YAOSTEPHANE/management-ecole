import prisma from './prisma';
import { notifyUsersImportant } from './notify-important.util';

export type StockItemSnapshot = {
  id: string;
  name: string;
  unit: string;
  safetyQty: number;
  currentQty: number;
};

function isRupture(qty: number): boolean {
  return qty <= 0;
}

function isLowStock(qty: number, safetyQty: number): boolean {
  return qty > 0 && safetyQty > 0 && qty <= safetyQty;
}

async function resolveStockAlertRecipientIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      isActive: true,
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Notifie les administrateurs lors d'une entrée en rupture ou en stock bas (transition uniquement).
 */
export async function maybeNotifyMaterialStockAlert(
  previous: StockItemSnapshot,
  nextQty: number,
  nextSafetyQty?: number,
): Promise<void> {
  if (!Number.isFinite(nextQty)) return;

  const prevQty = Number(previous.currentQty);
  const prevSafety = Math.max(0, Number(previous.safetyQty) || 0);
  const nextSafety = Math.max(0, Number(nextSafetyQty ?? previous.safetyQty) || 0);

  const wasRupture = isRupture(prevQty);
  const nowRupture = isRupture(nextQty);
  const wasLow = isLowStock(prevQty, prevSafety);
  const nowLow = isLowStock(nextQty, nextSafety);

  if (prevQty === nextQty && prevSafety === nextSafety) return;
  if (wasRupture && nowRupture) return;
  if (wasLow && nowLow && !nowRupture) return;

  const recipients = await resolveStockAlertRecipientIds();
  if (recipients.length === 0) return;

  const link = '/admin?tab=material';
  const name = previous.name.trim() || 'Article';
  const unit = previous.unit?.trim() || 'unité';

  if (!wasRupture && nowRupture) {
    await notifyUsersImportant(recipients, {
      type: 'stock_alert',
      title: 'Rupture de stock',
      content: `L'article « ${name} » est en rupture (0 ${unit}). Réapprovisionnement nécessaire.`,
      link,
    });
    return;
  }

  if (!wasLow && nowLow) {
    const qtyLabel = Number.isInteger(nextQty) ? String(nextQty) : nextQty.toFixed(2);
    await notifyUsersImportant(recipients, {
      type: 'stock_alert',
      title: 'Alerte stock bas',
      content: `Stock faible pour « ${name} » : ${qtyLabel} ${unit} restant(s) (seuil : ${nextSafety} ${unit}).`,
      link,
    });
  }
}

export async function notifyCurrentStockAlertsForItem(item: StockItemSnapshot): Promise<void> {
  const fakePreviousQty = Math.max(Number(item.safetyQty) || 0, 1) + 1;
  await maybeNotifyMaterialStockAlert(
    { ...item, currentQty: fakePreviousQty },
    Number(item.currentQty),
  );
}
