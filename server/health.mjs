export async function databaseActivity(url, key) {
  if (!url || !key) return { ok: false, reason: 'not_configured' }
  try {
    for (let i = 0; i < 3; i++) {
      const result = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/customer_catalog`, {
        method: 'POST',
        headers: { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' },
        body: '{}', signal: AbortSignal.timeout(8000),
      })
      if (!result.ok) throw new Error('Database unavailable')
      await result.arrayBuffer()
    }
    return { ok: true }
  } catch { return { ok: false, reason: 'database_unavailable' } }
}
