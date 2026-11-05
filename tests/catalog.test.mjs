import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dailyFeed, dhakaDay, filterProducts, planText, visitFeed } from '../src/catalogLogic.mjs'
import { mergeCategories } from '../src/categories.mjs'
import { readFileSync } from 'node:fs'
const products = [
  { id: 'a', name: 'Mini bag', category: 'Bags', subcategory: 'Crossbody bags', colors: ['Black'], description: '', available: true, featured: true, sell_price: 650 },
  { id: 'b', name: 'Tote', category: 'Tote bags', subcategory: 'Canvas totes', colors: ['Cream'], description: 'Cotton', available: false, featured: false, sell_price: 450 },
  { id: 'c', name: 'Shoulder bag', category: 'Bags', subcategory: 'Shoulder bags', colors: ['Brown'], description: '', available: true, featured: true, sell_price: 950 },
]
test('daily feed changes at Bangladesh midnight, keeps featured first and loses no products', () => {
  assert.equal(dhakaDay(new Date('2026-10-13T17:59:59Z')), '2026-10-13')
  assert.equal(dhakaDay(new Date('2026-10-13T18:00:00Z')), '2026-10-14')
  const today = dailyFeed(products, '2026-10-14')
  assert.notDeepEqual(today, dailyFeed(products, '2026-10-15'))
  assert.deepEqual(new Set(today.map(p => p.id)), new Set(['a','b','c']))
  assert.equal(today.at(-1).featured, false)
  assert.deepEqual(today, dailyFeed([...products].reverse(), '2026-10-14'))
})
test('category, subcategory, search, and availability combine', () => {
  assert.deepEqual(filterProducts(products, { category: 'Bags', subcategory: 'Crossbody bags', query: 'black', available: true }).map(p => p.id), ['a'])
  assert.equal(filterProducts(products, { category: 'Bags', query: 'Cream' }).length, 0)
  assert.equal(filterProducts(products, { available: true }).length, 2)
})
test('saved plan contains current prices and shareable product links', () => {
  const text = planText([products[0]], 'https://lunara.example')
  assert.match(text, /Mini bag — ৳650/)
  assert.match(text, /https:\/\/lunara.example\/\?product=a/)
  assert.match(text, /confirm availability/)
})
test('color and budget filters combine with search', () => {
  assert.deepEqual(filterProducts(products, { color: 'Black', budget: '1000' }).map(p => p.id), ['a'])
  assert.equal(filterProducts(products, { color: 'Black', budget: '500' }).length, 0)
  const variant = { ...products[0], photos: [{ label: 'Mini pearl strap' }] }
  assert.deepEqual(filterProducts([variant], { query: 'pearl' }).map(p => p.id), ['a'])
})

test('visit feed is stable within a visit, changes between visits and retains every item', () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({ ...products[0], id: `p${i}` }))
  assert.deepEqual(visitFeed(rows, 'visit-1'), visitFeed([...rows].reverse(), 'visit-1'))
  assert.notDeepEqual(visitFeed(rows, 'visit-1'), visitFeed(rows, 'visit-2'))
  assert.equal(new Set(visitFeed(rows, 'visit-2').map(p => p.id)).size, 60)
})
test('photo sizes, colors and designs are searchable and filterable together', () => {
  const row = { ...products[0], photos: [{ color: 'Rose', size: 'M', design: 'Pearl strap' }] }
  assert.deepEqual(filterProducts([row], { query: 'pearl', color: 'Rose', size: 'M', budget: '700' }), [row])
  assert.equal(filterProducts([row], { size: 'L' }).length, 0)
})
test('expanded departments preserve custom sections and merge legacy tote assignments', () => {
  const defaults = JSON.parse(readFileSync(new URL('../src/catalogCategories.json', import.meta.url)))
  const merged = mergeCategories(defaults, [{ name: 'Tote bags', subcategories: ['Custom totes'] }, { name: 'Gifts', subcategories: ['Gift boxes'] }], [{ category: 'Bags', subcategory: 'Venti bags' }])
  assert.equal(merged.filter(c => c.name === 'Bags').length, 1)
  assert.ok(merged.find(c => c.name === 'Bags').subcategories.includes('Custom totes'))
  assert.ok(merged.find(c => c.name === 'Bags').subcategories.includes('Venti bags'))
  assert.ok(merged.find(c => c.name === 'Gifts'))
  assert.equal(merged.some(c => c.name === 'Tote bags'), false)
})
