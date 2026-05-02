import jsPDF from 'jspdf';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { formatFCFA } from '../utils/currency';

export function downloadPaymentReceiptPdf(payment: {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  paymentReference?: string | null;
  transactionId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  payer?: { firstName: string; lastName: string; email?: string; role?: string };
  student?: {
    user?: { firstName: string; lastName: string };
    class?: { name: string };
    studentId?: string;
  };
  tuitionFee?: {
    period?: string;
    academicYear?: string;
    description?: string | null;
  };
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, w, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reçu de paiement', w / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('School Manager — Établissement scolaire', w / 2, 20, { align: 'center' });

  let y = 38;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails du paiement', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const lines: [string, string][] = [
    ['Référence', payment.paymentReference || payment.id.slice(-12)],
    ['Date', format(new Date(payment.paidAt || payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })],
    ['Montant', formatFCFA(payment.amount)],
    ['Statut', payment.status === 'COMPLETED' ? 'Payé' : payment.status],
    ['Mode de règlement', String(payment.paymentMethod || '—')],
  ];
  if (payment.transactionId) {
    lines.push(['Transaction', payment.transactionId]);
  }
  if (payment.payer) {
    lines.push([
      'Payeur',
      `${payment.payer.firstName} ${payment.payer.lastName}${payment.payer.role ? ` (${payment.payer.role})` : ''}`,
    ]);
  }
  if (payment.student?.user) {
    lines.push([
      'Élève',
      `${payment.student.user.firstName} ${payment.student.user.lastName}`,
    ]);
  }
  if (payment.student?.studentId) {
    lines.push(["N° élève", payment.student.studentId]);
  }
  if (payment.student?.class?.name) {
    lines.push(['Classe', payment.student.class.name]);
  }
  if (payment.tuitionFee?.academicYear) {
    lines.push(['Année scolaire', payment.tuitionFee.academicYear]);
  }
  if (payment.tuitionFee?.period) {
    lines.push(['Période', payment.tuitionFee.period]);
  }
  if (payment.tuitionFee?.description) {
    lines.push(['Motif', payment.tuitionFee.description]);
  }

  lines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} :`, 14, y);
    doc.setFont('helvetica', 'normal');
    const split = doc.splitTextToSize(value, w - 60);
    doc.text(split, 55, y);
    y += Math.max(6, split.length * 5);
  });

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Document généré à titre de reçu — conserver pour votre comptabilité.',
    w / 2,
    y,
    { align: 'center' }
  );

  doc.save(
    `recu-paiement-${payment.paymentReference || payment.id.slice(-8)}-${format(new Date(), 'yyyyMMdd')}.pdf`
  );
}
