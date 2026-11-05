export function dhakaDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
// Rotate a stable id order once per Bangladesh calendar day. Featured items
// get the first positions; both groups rotate, including when offline.
export function dailyFeed(products, day = dhakaDay()) {
  const dayNumber = Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000)
  const rotate = rows => {
    const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id))
    const offset = sorted.length ? dayNumber % sorted.length : 0
    return [...sorted.slice(offset), ...sorted.slice(0, offset)]
  }
  return [...rotate(products.filter(p => p.featured)), ...rotate(products.filter(p => !p.featured))]
}
export function filterProducts(products, { category = '', subcategory = '', query = '', available = false, color = '', budget = '', size = '' }) {
  const q = query.trim().toLocaleLowerCase()
  return products.filter(p => (!category || p.category === category) && (!subcategory || p.subcategory === subcategory)
    && (!available || p.available) && (!color || productColors(p).some(c => c.toLowerCase() === color.toLowerCase())) && (!budget || p.sell_price <= Number(budget))
    && (!size || productSizes(p).includes(size))
    && (!q || [p.name, p.description, p.category, p.subcategory, ...productColors(p), ...productSizes(p), ...(p.photos ?? []).flatMap(photo => [photo.label ?? '', photo.design ?? ''])].join(' ').toLocaleLowerCase().includes(q)))
}
export function planText(products, origin) {
  return ['Hello Lunara! I’m interested in these items:', '', ...products.map(p => `${p.name} — ৳${Number(p.sell_price).toLocaleString('en-BD')}\n${origin}/?product=${encodeURIComponent(p.id)}`), '', 'Please confirm availability, delivery charge, and the final total.'].join('\n')
}

export function productColors(p) { return [...new Set([...(p.colors ?? []), ...(p.photos ?? []).map(photo => photo.color).filter(Boolean)])] }
export function productSizes(p) { return [...new Set((p.photos ?? []).map(photo => photo.size).filter(Boolean))] }
// Stable throughout browsing; a new visit changes the seed, never duplicates items.
export function visitFeed(products, seed) {
  const score = id => {
    let h = 2166136261
    for (const c of `${seed}:${id}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
    return h >>> 0
  }
  return [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || score(a.id) - score(b.id) || a.id.localeCompare(b.id))
}
