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
// Seeded Fisher–Yates: stable during a visit and independent of API row order.
// Featured badges stay visible, but no item is permanently pinned to the front.
export function visitFeed(products, seed, previousFirst = '') {
  let state = 2166136261
  for (const c of String(seed)) state = Math.imul(state ^ c.charCodeAt(0), 16777619)
  const random = () => {
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rows = [...products].sort((a, b) => a.id.localeCompare(b.id))
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  if (rows.length > 1 && rows[0].id === previousFirst) {
    const j = 1 + Math.floor(random() * (rows.length - 1))
    ;[rows[0], rows[j]] = [rows[j], rows[0]]
  }
  return rows
}
