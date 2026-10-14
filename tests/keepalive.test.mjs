import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/keep-alive.js'
const originalFetch = globalThis.fetch
const originalUrl = process.env.VITE_SUPABASE_URL
const originalKey = process.env.VITE_SUPABASE_ANON_KEY
afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalUrl === undefined) delete process.env.VITE_SUPABASE_URL; else process.env.VITE_SUPABASE_URL = originalUrl
  if (originalKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY; else process.env.VITE_SUPABASE_ANON_KEY = originalKey
})
const response = () => ({ code: 0, body: null, headers: {}, status(code) { this.code = code; return this }, json(body) { this.body = body; return this }, setHeader(key, value) { this.headers[key] = value } })
test('scheduled check makes three real RPC reads and returns no catalog data', async () => {
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co/'
  process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_test'
  let calls = 0
  globalThis.fetch = async (url, options) => {
    calls++
    assert.equal(url, 'https://test.supabase.co/rest/v1/rpc/customer_catalog')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.apikey, 'sb_publishable_test')
    assert.equal(options.headers.Authorization, undefined)
    return new Response('{"products":[]}')
  }
  const result = response(); await handler({ method: 'GET' }, result)
  assert.equal(calls, 3); assert.equal(result.code, 200); assert.deepEqual(result.body, { ok: true })
})
test('paused or unavailable database reports an unhealthy status', async () => {
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_test'
  globalThis.fetch = async () => new Response('Unavailable', { status: 503 })
  const result = response(); await handler({ method: 'GET' }, result)
  assert.equal(result.code, 503); assert.deepEqual(result.body, { ok: false, reason: 'database_unavailable' })
})
test('missing configuration cannot pretend the database is healthy', async () => {
  delete process.env.VITE_SUPABASE_URL
  const result = response(); await handler({ method: 'GET' }, result)
  assert.equal(result.code, 503); assert.equal(result.body.reason, 'not_configured')
})
