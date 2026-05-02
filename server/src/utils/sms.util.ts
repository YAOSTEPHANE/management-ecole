/**
 * Utilitaires pour l'envoi de SMS
 * TODO: Implémenter avec un vrai service SMS (Twilio, Orange SMS API, etc.)
 */

/**
 * Envoie un SMS
 * @param phoneNumber Numéro de téléphone (format international)
 * @param message Contenu du message
 * @returns Promise<{ success: boolean; messageId?: string; error?: string }>
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // TODO: Implémenter avec un vrai service SMS
    // Exemple avec Twilio:
    // const accountSid = process.env.TWILIO_ACCOUNT_SID;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const client = require('twilio')(accountSid, authToken);
    // 
    // const result = await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
    // 
    // return { success: true, messageId: result.sid };

    // Pour l'instant, on log dans la console (utile pour le développement)
    console.log('\n=== SMS ===');
    console.log(`Destinataire: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('===========\n');

    // Simuler un envoi réussi
    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { success: true, messageId };
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    return { success: false, error: error.message || 'Erreur lors de l\'envoi du SMS' };
  }
};

/**
 * Valide un numéro de téléphone
 * @param phoneNumber Numéro de téléphone à valider
 * @returns boolean
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Format basique: +33 6 12 34 56 78 ou 0612345678
  const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

/**
 * Formate un numéro de téléphone
 * @param phoneNumber Numéro de téléphone
 * @returns Numéro formaté
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Enlever tous les espaces et caractères non numériques sauf +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Si commence par 0, remplacer par +33
  if (cleaned.startsWith('0')) {
    return '+33' + cleaned.substring(1);
  }
  
  // Si ne commence pas par +, ajouter +33
  if (!cleaned.startsWith('+')) {
    return '+33' + cleaned;
  }
  
  return cleaned;
};
