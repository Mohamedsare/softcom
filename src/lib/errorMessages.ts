/**
 * Traduction des messages d'erreur (auth Supabase, API) en français
 * pour afficher des messages cohérents à l'utilisateur.
 */

const AUTH_MESSAGES: Record<string, string> = {
  // Connexion
  'Invalid login credentials': 'Identifiants incorrects.',
  invalid_login_credentials: 'Identifiants incorrects.',
  // Inscription / email
  'Email not confirmed': 'Adresse email non confirmée.',
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Signup disabled': 'Inscription désactivée.',
  'Sign up disabled': 'Inscription désactivée.',
  // Mot de passe
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'New password should be different from the old password': "Le nouveau mot de passe doit être différent de l'ancien.",
  'Token has expired or is invalid': 'Le lien a expiré ou est invalide. Demandez un nouveau lien.',
  'Password recovery requires a valid email': 'Veuillez entrer une adresse email valide.',
  // Compte
  'User not found': 'Utilisateur introuvable.',
  'User already exists': 'Un compte existe déjà avec cet email.',
  'A user with this email already exists': 'Un compte existe déjà avec cet email.',
  'Email rate limit exceeded': 'Trop de tentatives. Réessayez plus tard.',
  'Forbidden': 'Accès refusé.',
  'Invalid request': 'Requête invalide.',
  'Session expired': 'Session expirée. Reconnectez-vous.',
  'Unable to validate email address: invalid format': 'Adresse email invalide.',
  'Signup requires a valid password': 'Le mot de passe doit contenir au moins 6 caractères.',
}

/**
 * Messages d'erreur API / PostgREST courants
 */
const API_MESSAGES: Record<string, string> = {
  'new row violates row-level security policy': "Vous n'avez pas les droits pour effectuer cette action.",
  'duplicate key value violates unique constraint': 'Cette valeur existe déjà.',
  'foreign key violation': 'Référence invalide.',
  'JWT expired': 'Session expirée. Reconnectez-vous.',
  'Permission denied': 'Accès refusé.',
}

function normalizeMessage(msg: string): string {
  return msg.trim()
}

/**
 * Retourne la version française du message d'erreur si une traduction existe,
 * sinon retourne un message générique pour éviter d'afficher de l'anglais.
 */
export function translateErrorMessage(message: string | undefined, code?: string): string {
  if (!message || typeof message !== 'string') return "Une erreur s'est produite."
  const normalized = normalizeMessage(message)
  // Priorité au code auth (ex. invalid_login_credentials)
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]
  if (AUTH_MESSAGES[normalized]) return AUTH_MESSAGES[normalized]
  // Correspondance partielle (certains messages peuvent varier légèrement)
  const lower = normalized.toLowerCase()
  for (const [en, fr] of Object.entries(AUTH_MESSAGES)) {
    if (lower.includes(en.toLowerCase())) return fr
  }
  for (const [en, fr] of Object.entries(API_MESSAGES)) {
    if (lower.includes(en.toLowerCase())) return fr
  }
  // Si le message a l'air déjà en français (caractères accentués ou mots courants), le garder
  if (/[\u00C0-\u024F]|erreur|incorrect|refusé|expiré|invalide|requis|désactivé/i.test(normalized)) {
    return normalized
  }
  // Sinon message générique pour ne pas afficher de l'anglais brut
  return "Une erreur s'est produite."
}
