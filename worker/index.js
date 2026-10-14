import { databaseActivity } from '../server/health.mjs'
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path === '/api/keep-alive') {
      if (request.method !== 'GET') return new Response(null, { status: 405 })
      const result = await databaseActivity(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY)
      return Response.json(result, { status: result.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
    }
    if (path.startsWith('/api/')) return new Response(null, { status: 404 })
    return env.ASSETS.fetch(request)
  },
  async scheduled(_event, env, context) {
    context.waitUntil(databaseActivity(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY).then(result => {
      if (!result.ok) throw new Error(`Supabase activity check failed: ${result.reason}`)
    }))
  },
}
