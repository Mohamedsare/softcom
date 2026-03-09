import { supabase } from '@/lib/supabase'

/**
 * Enregistre un message du chatbot landing (anon autorisé).
 * À appeler depuis la landing pour chaque message utilisateur et chaque réponse assistant.
 */
export async function saveLandingChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const { error } = await supabase.from('landing_chat_messages').insert({
    session_id: sessionId,
    role,
    content: content.slice(0, 10000),
  })
  if (error) throw error
}
