/**
 * Formate un montant en FCFA (Franc CFA)
 * @param amount - Montant à formater
 * @returns Montant formaté en FCFA (ex: "2 295 850 FCFA")
 */
export const formatFCFA = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0 FCFA';
  }

  // Formater avec des espaces comme séparateurs de milliers
  const formatted = Math.round(numAmount).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${formatted} FCFA`;
};

/**
 * Variante compatible jsPDF (espaces ASCII, pas de séparateurs Unicode fr-FR).
 */
export const formatFCFAForPdf = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0 FCFA';
  }

  const formatted = Math.round(numAmount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${formatted} FCFA`;
};

/**
 * Parse un montant FCFA (retire "FCFA" et les espaces)
 * @param value - Valeur à parser
 * @returns Nombre ou null si invalide
 */
export const parseFCFA = (value: string): number | null => {
  if (!value) return null;
  
  // Retirer "FCFA", espaces et autres caractères non numériques sauf point/virgule
  const cleaned = value.replace(/FCFA/gi, '').replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
};



