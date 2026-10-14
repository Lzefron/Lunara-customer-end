import type { Catalog } from './types'
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configured = Boolean(url && key)
const headers: Record<string, string> = { apikey: key ?? '', 'Content-Type': 'application/json', ...(key?.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) }

export async function getCatalog(signal: AbortSignal): Promise<Catalog> {
  const response = await fetch(`${url}/rest/v1/rpc/customer_catalog`, { method: 'POST', headers, body: '{}', signal, cache: 'no-store' })
  if (!response.ok) throw new Error(response.status === 404 ? 'Catalog setup is being completed. Please check back soon.' : 'Our catalog is temporarily unavailable. Please try again shortly.')
  const data = await response.json()
  if (!Array.isArray(data.products) || !Array.isArray(data.categories)) throw new Error('The catalog could not be loaded. Please try again.')
  return data
}
export async function getPhoto(path: string, signal: AbortSignal): Promise<string> {
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(`${url}/storage/v1/object/authenticated/product-photos/${encoded}`, { headers, signal })
  if (!response.ok) throw new Error('Photo unavailable')
  return URL.createObjectURL(await response.blob())
}
