import crypto from 'crypto';
import prisma from './prisma';

/**
 * Génère un token de réinitialisation de mot de passe
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Crée et sauvegarde un token de réinitialisation dans la base de données
 */
export const createPasswordResetToken = async (userId: string): Promise<string> => {
  // Supprimer les anciens tokens non utilisés pour cet utilisateur
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      used: false,
      expiresAt: {
        lt: new Date(), // Supprimer les tokens expirés
      },
    },
  });

  // Générer un nouveau token
  const token = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token valide pendant 1 heure

  // Sauvegarder le token
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
};

/**
 * Vérifie si un token de réinitialisation est valide
 */
export const verifyResetToken = async (token: string): Promise<{ valid: boolean; userId?: string }> => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { valid: false };
  }

  // Vérifier si le token a été utilisé
  if (resetToken.used) {
    return { valid: false };
  }

  // Vérifier si le token a expiré
  if (resetToken.expiresAt < new Date()) {
    return { valid: false };
  }

  return { valid: true, userId: resetToken.userId };
};

/**
 * Marque un token comme utilisé
 */
export const markTokenAsUsed = async (token: string): Promise<void> => {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true },
  });
};

/**
 * Génère le lien de réinitialisation de mot de passe
 * Note: En production, remplacez par votre URL frontend réelle
 */
export const getResetPasswordUrl = (token: string): string => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/reset-password?token=${token}`;
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * TODO: Implémenter avec un vrai service d'email (Nodemailer, SendGrid, etc.)
 * Pour l'instant, on log juste le lien dans la console
 */
export const sendPasswordResetEmail = async (email: string, token: string, firstName: string): Promise<void> => {
  const resetUrl = getResetPasswordUrl(token);

  // TODO: Implémenter l'envoi d'email réel
  // Exemple avec Nodemailer:
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to: email,
  //   subject: 'Réinitialisation de votre mot de passe',
  //   html: `...`
  // });

  // Pour l'instant, on log dans la console (utile pour le développement)
  console.log('\n=== EMAIL DE RÉINITIALISATION DE MOT DE PASSE ===');
  console.log(`Destinataire: ${email}`);
  console.log(`Nom: ${firstName}`);
  console.log(`Lien de réinitialisation: ${resetUrl}`);
  console.log(`Token: ${token}`);
  console.log('================================================\n');

  // En production, vous devriez utiliser un vrai service d'email
  // Pour tester, vous pouvez copier le lien depuis la console du serveur
};

/**
 * Envoie un email de message
 * @param email Adresse email du destinataire
 * @param subject Sujet du message
 * @param content Contenu du message
 * @param senderName Nom de l'expéditeur
 * @returns Promise<{ success: boolean; messageId?: string; error?: string }>
 */
export const sendMessageEmail = async (
  email: string,
  subject: string,
  content: string,
  senderName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // TODO: Implémenter avec un vrai service d'email (Nodemailer, SendGrid, etc.)
    // Exemple avec Nodemailer:
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
    // 
    // const mailOptions = {
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: subject || 'Message de School Manager',
    //   html: `
    //     <h2>Message de ${senderName}</h2>
    //     <p>${content}</p>
    //   `,
    // };
    // 
    // const info = await transporter.sendMail(mailOptions);
    // return { success: true, messageId: info.messageId };

    // Pour l'instant, on log dans la console (utile pour le développement)
    console.log('\n=== EMAIL DE MESSAGE ===');
    console.log(`Destinataire: ${email}`);
    console.log(`Expéditeur: ${senderName}`);
    console.log(`Sujet: ${subject || 'Sans objet'}`);
    console.log(`Contenu: ${content}`);
    console.log('========================\n');

    // Simuler un envoi réussi
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { success: true, messageId };
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message || 'Erreur lors de l\'envoi de l\'email' };
  }
};
