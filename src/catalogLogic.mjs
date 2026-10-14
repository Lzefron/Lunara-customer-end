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
export function filterProducts(products, { category = '', subcategory = '', query = '', available = false, color = '', budget = '' }) {
  const q = query.trim().toLocaleLowerCase()
  return products.filter(p => (!category || p.category === category) && (!subcategory || p.subcategory === subcategory)
    && (!available || p.available) && (!color || p.colors.includes(color)) && (!budget || p.sell_price <= Number(budget))
    && (!q || [p.name, p.description, p.category, p.subcategory, ...p.colors, ...(p.photos ?? []).map(photo => photo.label ?? '')].join(' ').toLocaleLowerCase().includes(q)))
}
export function planText(products, origin) {
  return ['Hello Lunara! I’m interested in these items:', '', ...products.map(p => `${p.name} — ৳${Number(p.sell_price).toLocaleString('en-BD')}\n${origin}/?product=${encodeURIComponent(p.id)}`), '', 'Please confirm availability, delivery charge, and the final total.'].join('\n')
}
