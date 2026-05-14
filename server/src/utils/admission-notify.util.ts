import prisma from './prisma';
import { APP_BRANDING_ID, getAppBrandingDelegate } from './app-branding-prisma.util';
import { getPublicFrontendBase, sendTransactionalHtmlEmail } from './email.util';
import { notifyUsersImportant } from './notify-important.util';

export type NewAdmissionNotifyPayload = {
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  desiredLevel: string;
  academicYear: string;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function resolveAdminNotificationEmails(): Promise<string[]> {
  const emails = new Set<string>();

  const envEmail =
    process.env.ADMISSION_ADMIN_EMAIL?.trim() || process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (envEmail) {
    emails.add(envEmail.toLowerCase());
  }

  const brandingDelegate = getAppBrandingDelegate();
  if (brandingDelegate) {
    const row = await brandingDelegate.findUnique({ where: { id: APP_BRANDING_ID } });
    if (row?.schoolEmail?.trim()) {
      emails.add(row.schoolEmail.trim().toLowerCase());
    }
  }

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { email: true },
  });
  for (const admin of admins) {
    if (admin.email?.trim()) {
      emails.add(admin.email.trim().toLowerCase());
    }
  }

  return [...emails];
}

export async function notifyAdminsOfNewAdmission(
  admission: NewAdmissionNotifyPayload,
): Promise<void> {
  const adminEmails = await resolveAdminNotificationEmails();
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });

  const studentName = `${admission.firstName} ${admission.lastName}`.trim();
  const base = getPublicFrontendBase().replace(/\/+$/, '');
  const adminUrl = `${base}/admin`;

  const detailLines = [
    `Dossier : ${admission.reference}`,
    `Élève : ${studentName}`,
    `E-mail : ${admission.email}`,
    admission.phone ? `Téléphone : ${admission.phone}` : null,
    `Niveau souhaité : ${admission.desiredLevel}`,
    `Année scolaire : ${admission.academicYear}`,
    admission.parentName ? `Parent / tuteur : ${admission.parentName}` : null,
    admission.parentPhone ? `Tél. parent : ${admission.parentPhone}` : null,
    admission.parentEmail ? `E-mail parent : ${admission.parentEmail}` : null,
  ].filter((line): line is string => Boolean(line));

  const subject = `Nouvelle demande d'inscription — ${admission.reference}`;
  const text = [
    'Une nouvelle demande d\'inscription vient d\'être déposée en ligne.',
    '',
    ...detailLines,
    '',
    `Consulter les admissions : ${adminUrl}`,
  ].join('\n');

  const html = [
    '<p>Une nouvelle <strong>demande d\'inscription</strong> vient d\'être déposée en ligne.</p>',
    '<ul>',
    ...detailLines.map((line) => `<li>${escapeHtml(line)}</li>`),
    '</ul>',
    `<p><a href="${adminUrl}">Ouvrir le tableau de bord administrateur</a></p>`,
  ].join('');

  for (const to of adminEmails) {
    await sendTransactionalHtmlEmail(to, subject, text, html);
  }

  if (adminUsers.length > 0) {
    await notifyUsersImportant(
      adminUsers.map((user) => user.id),
      {
        type: 'admission',
        title: 'Nouvelle inscription',
        content: `${studentName} — dossier ${admission.reference} (${admission.desiredLevel}, ${admission.academicYear})`,
        link: '/admin',
        email: null,
      },
    );
  }
}
