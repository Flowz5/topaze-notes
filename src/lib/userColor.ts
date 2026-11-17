/**
 * Couleur de curseur d'un collaborateur.
 *
 * Avant : '#' + Math.random()... → 6 % de couleurs invalides (5 chiffres), que Tiptap
 * remplace par "transparent" (curseur invisible), et des couleurs parfois illisibles
 * sous une étiquette en texte blanc. Maintenant : une palette lisible, et la même
 * couleur pour une personne donnée à chaque session (calculée depuis son email).
 */
export const CURSOR_COLORS = [
  '#e11d48', // rose
  '#db2777', // magenta
  '#9333ea', // violet
  '#4f46e5', // indigo
  '#2563eb', // bleu
  '#0e7490', // cyan
  '#0f766e', // sarcelle
  '#15803d', // vert
  '#b45309', // ambre foncé
  '#c2410c', // orange brûlé
] as const;

export function userColor(seed: string | null | undefined): string {
  const text = seed || 'anonyme';
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
