// The cron performs real read-only database queries, without admin credentials.
// Public requests receive only a health status and never catalog/private data.
export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ ok: false })
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return response.status(503).json({ ok: false, reason: 'not_configured' })
  try {
    for (let i = 0; i < 3; i++) {
      const result = await fetch(`${url}/rest/v1/rpc/customer_catalog`, {
        method: 'POST', headers: { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' },
        body: '{}', signal: AbortSignal.timeout(8000),
      })
      if (!result.ok) throw new Error('Database unavailable')
      await result.arrayBuffer()
    }
    response.setHeader('Cache-Control', 'no-store')
    return response.status(200).json({ ok: true })
  } catch { return response.status(503).json({ ok: false, reason: 'database_unavailable' }) }
}
