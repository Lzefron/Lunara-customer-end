import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from '../worker/index.js'
test('non-API requests use static assets, without a database request', async () => {
  let calls = 0
  const result = await worker.fetch(new Request('https://lunara.example/'), { ASSETS: { fetch: async () => { calls++; return new Response('storefront') } } })
  assert.equal(await result.text(), 'storefront'); assert.equal(calls, 1)
})
test('scheduled activity uses the runtime public key and completes its work', async () => {
  const original = globalThis.fetch
  let calls = 0; let task
  globalThis.fetch = async () => { calls++; return new Response('{}') }
  try {
    await worker.scheduled({}, { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }, { waitUntil(promise) { task = promise } })
    await task; assert.equal(calls, 3)
  } finally { globalThis.fetch = original }
})
