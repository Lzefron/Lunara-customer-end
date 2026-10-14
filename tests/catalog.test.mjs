import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dailyFeed, dhakaDay, filterProducts, planText } from '../src/catalogLogic.mjs'
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
