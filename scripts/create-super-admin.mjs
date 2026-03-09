#!/usr/bin/env node
/**
 * Crée un compte super admin en appelant l'Edge Function depuis la machine locale.
 * Pas de CORS, pas besoin de --no-verify-jwt : le script envoie Authorization.
 *
 * Usage: node scripts/create-super-admin.mjs <email> <mot_de_passe> [nom]
 *
 * .env doit contenir (jamais de VITE_ pour le secret) :
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *   CREATE_SUPER_ADMIN_SECRET=ton_secret
 *
 * Supabase Edge Function > Secrets : CREATE_SUPER_ADMIN_SECRET=ton_secret (même valeur)
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  const path = resolve(process.cwd(), '.env')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const secret = process.env.CREATE_SUPER_ADMIN_SECRET

const email = process.argv[2]
const password = process.argv[3]
const fullName = process.argv[4] || undefined

if (!url || !anonKey || !secret) {
  console.error('Erreur: définis dans .env VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY et CREATE_SUPER_ADMIN_SECRET (sans préfixe VITE_)')
  process.exit(1)
}
if (!email || !password) {
  console.error('Usage: node scripts/create-super-admin.mjs <email> <mot_de_passe> [nom]')
  process.exit(1)
}
if (password.length < 6) {
  console.error('Le mot de passe doit faire au moins 6 caractères.')
  process.exit(1)
}

const endpoint = `${url.replace(/\/$/, '')}/functions/v1/create-super-admin`
const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
  body: JSON.stringify({ secret, email: email.trim().toLowerCase(), password, full_name: fullName || undefined }),
})

const data = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error('Erreur:', data.error || res.statusText)
  if (data.details) console.error('Détails:', data.details)
  process.exit(1)
}
console.log('OK – Super admin créé:', data.email)
console.log('Connecte-toi sur l’app puis va sur Admin plateforme.')
