/**
 * Valeur pseudo-aléatoire dans [0, 1), identique côté serveur et client pour un seed donné.
 * À utiliser pour les styles décoratifs afin d'éviter les erreurs d'hydratation React.
 */
export function stable01(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
