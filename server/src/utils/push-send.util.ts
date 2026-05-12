import webpush from 'web-push';
import prisma from './prisma';

let configured = false;

export function isWebPushConfigured(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(pub && priv);
}

function ensureWebPushConfigured(): boolean {
  if (configured) return isWebPushConfigured();
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@localhost';
  if (!pub || !priv) {
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export async function sendWebPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!ensureWebPushConfigured() || userIds.length === 0) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: [...new Set(userIds)] } },
  });

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body.slice(0, 240),
    url: payload.url ?? '/',
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          body,
          { TTL: 3600 }
        );
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
        } else {
          console.warn('[push] envoi échoué:', sub.endpoint.slice(0, 48), e);
        }
      }
    })
  );
}
