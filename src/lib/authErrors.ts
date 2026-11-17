/**
 * Traduit les erreurs Firebase Auth en messages compréhensibles.
 * Avant, on affichait err.message tel quel : « Firebase: Error (auth/invalid-credential). »
 */
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-login-credentials': 'Email ou mot de passe incorrect.',
  'auth/wrong-password': 'Email ou mot de passe incorrect.',
  'auth/user-not-found': 'Email ou mot de passe incorrect.',
  'auth/invalid-email': "Cette adresse email n'est pas valide.",
  'auth/missing-email': 'Indique ton adresse email.',
  'auth/missing-password': 'Indique ton mot de passe.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet email. Connecte-toi plutôt.',
  'auth/weak-password': 'Mot de passe trop faible : 6 caractères minimum.',
  'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Connexion impossible. Vérifie ta connexion internet.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
};

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  console.error("Erreur d'authentification :", err);
  return 'Une erreur est survenue. Réessaie dans un instant.';
}
