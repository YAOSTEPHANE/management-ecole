import crypto from 'crypto';
import express from 'express';
import { PaymentStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { autoReceiptUrl } from '../utils/tuition-financial-automation.util';
import { syncTuitionFeePaidStatusForFeeId } from '../utils/tuition-fee-paid-sync.util';

const router = express.Router();

type PaymentWebhookBody = {
  paymentReference?: string;
  status?: string;
  transactionId?: string;
  amount?: number | string;
  providerEventId?: string;
  paidAt?: string;
};

const ALLOWED_STATUS: PaymentStatus[] = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
];

function webhookSecret(): string | null {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  return secret && secret.length > 0 ? secret : null;
}

function verifyWebhookSignature(payload: PaymentWebhookBody, signature: string): boolean {
  const secret = webhookSecret();
  if (!secret) return false;
  const canonical = [
    String(payload.paymentReference || ''),
    String(payload.status || ''),
    String(payload.transactionId || ''),
    payload.amount == null ? '' : String(payload.amount),
    String(payload.providerEventId || ''),
  ].join('|');
  const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

router.post('/provider', async (req, res) => {
  try {
    const secret = webhookSecret();
    if (!secret) {
      return res.status(503).json({ error: 'Webhook de paiement non configuré côté serveur.' });
    }

    const signatureHeader = req.header('x-payment-signature')?.trim() || '';
    if (!signatureHeader) {
      return res.status(401).json({ error: 'Signature webhook manquante.' });
    }

    const body = (req.body || {}) as PaymentWebhookBody;
    if (!body.paymentReference || !body.status) {
      return res.status(400).json({ error: 'paymentReference et status sont requis.' });
    }
    if (!verifyWebhookSignature(body, signatureHeader)) {
      return res.status(401).json({ error: 'Signature webhook invalide.' });
    }

    const normalizedStatus = String(body.status).toUpperCase() as PaymentStatus;
    if (!ALLOWED_STATUS.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Status webhook non supporté.' });
    }

    const payment = await prisma.payment.findFirst({
      where: { paymentReference: body.paymentReference },
      include: { tuitionFee: true },
    });
    if (!payment) {
      return res.status(404).json({ error: 'Paiement introuvable pour cette référence.' });
    }

    const amountNum =
      body.amount == null
        ? null
        : typeof body.amount === 'number'
          ? body.amount
          : Number(body.amount);
    if (normalizedStatus === 'COMPLETED') {
      if (amountNum == null || !Number.isFinite(amountNum)) {
        return res.status(400).json({ error: 'Le montant est requis pour un statut COMPLETED.' });
      }
      if (Math.abs(amountNum - payment.amount) > 0.5) {
        return res.status(400).json({ error: 'Montant webhook incohérent avec le paiement attendu.' });
      }
    }

    if (payment.status === normalizedStatus && normalizedStatus !== 'PENDING') {
      return res.json({ ok: true, paymentId: payment.id, idempotent: true });
    }

    const paidAtDate =
      normalizedStatus === 'COMPLETED'
        ? body.paidAt
          ? new Date(body.paidAt)
          : new Date()
        : null;
    if (paidAtDate && Number.isNaN(paidAtDate.getTime())) {
      return res.status(400).json({ error: 'paidAt invalide.' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: normalizedStatus,
        transactionId: body.transactionId?.trim() || payment.transactionId || undefined,
        paidAt: paidAtDate || null,
        receiptUrl:
          normalizedStatus === 'COMPLETED'
            ? payment.receiptUrl || autoReceiptUrl(payment.paymentReference || payment.id)
            : payment.receiptUrl,
        notes: body.providerEventId
          ? `${payment.notes ? `${payment.notes} — ` : ''}Webhook event: ${body.providerEventId}`
          : payment.notes,
      },
    });

    await syncTuitionFeePaidStatusForFeeId(prisma, payment.tuitionFeeId);

    return res.json({ ok: true, paymentId: updatedPayment.id, status: updatedPayment.status });
  } catch (error: any) {
    console.error('POST /payments/webhook/provider:', error);
    return res.status(500).json({ error: error?.message || 'Erreur serveur' });
  }
});

export default router;

