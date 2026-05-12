/**
 * Utilitaires pour l'envoi de SMS.
 * Si TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER sont définis, envoi via l’API Twilio.
 * Sinon, journalisation console (mode développement).
 */

async function sendViaTwilio(phoneNumber: string, message: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    throw new Error('Variables Twilio incomplètes');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: from,
    To: phoneNumber,
    Body: message,
  });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = (await res.json()) as { sid?: string; message?: string; code?: number };

  if (!res.ok) {
    throw new Error(data.message || `Twilio HTTP ${res.status}`);
  }

  if (!data.sid) {
    throw new Error('Réponse Twilio sans sid');
  }

  return data.sid;
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim()
  );
}

/**
 * Envoie un SMS
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (isTwilioConfigured()) {
      const sid = await sendViaTwilio(phoneNumber, message);
      return { success: true, messageId: sid };
    }

    console.log('\n=== SMS (Twilio non configuré) ===');
    console.log(`Destinataire: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('===========\n');

    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return { success: true, messageId };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de l\'envoi du SMS';
    console.error('Erreur lors de l\'envoi du SMS:', error);
    return { success: false, error: msg };
  }
};

/**
 * Valide un numéro de téléphone
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

/**
 * Formate un numéro de téléphone
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('0')) {
    return '+33' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('+')) {
    return '+33' + cleaned;
  }

  return cleaned;
};
