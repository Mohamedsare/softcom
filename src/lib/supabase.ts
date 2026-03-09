import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// En build (Vercel), si les variables ne sont pas définies, on utilise des placeholders
// pour que le build ne plante pas. En prod, définir VITE_SUPABASE_* dans Vercel puis redéployer.
const hasEnv = url && anonKey
if (!hasEnv && typeof window !== 'undefined') {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in Vercel: Project → Settings → Environment Variables, then redeploy.'
  )
}

const supabaseUrl = url || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciJ9.placeholder'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
