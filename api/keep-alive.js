import { databaseActivity } from '../server/health.mjs'
// The cron performs real read-only database queries, without admin credentials.
// Public requests receive only a health status and never catalog/private data.
export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ ok: false })
  const result = await databaseActivity(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  response.setHeader('Cache-Control', 'no-store')
  return response.status(result.ok ? 200 : 503).json(result)
}
