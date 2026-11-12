import { test } from 'node:test'
import assert from 'node:assert/strict'
import { watchVisits } from '../src/visitLifecycle.mjs'

function setup() {
  const page = new EventTarget(), doc = new EventTarget()
  doc.hidden = false
  let tick, count = 0, day = '2026-11-12', cleared = false
  page.setInterval = fn => { tick = fn; return 1 }
  page.clearInterval = id => { assert.equal(id, 1); cleared = true }
  const stop = watchVisits(page, doc, () => count++, () => day)
  return { page, doc, stop, tick: () => tick(), count: () => count, cleared: () => cleared,
    setDay: value => { day = value },
    visible: value => { doc.hidden = !value; doc.dispatchEvent(new Event('visibilitychange')) },
    restore: () => { const event = new Event('pageshow'); event.persisted = true; page.dispatchEvent(event) } }
}

test('reopening an installed app refreshes once while ordinary focus and polling do not', () => {
  const app = setup()
  app.page.dispatchEvent(new Event('focus')); app.tick(); app.visible(true)
  assert.equal(app.count(), 0)
  app.visible(false); app.visible(true); app.restore()
  assert.equal(app.count(), 1)
  app.visible(false); app.visible(true)
  assert.equal(app.count(), 2)
  app.stop()
  app.visible(false); app.visible(true)
  assert.equal(app.count(), 2)
  assert.ok(app.cleared())
})

test('browser history restore and Bangladesh date rollover each refresh once', () => {
  const app = setup()
  app.page.dispatchEvent(new Event('pagehide')); app.restore(); app.visible(true)
  assert.equal(app.count(), 1)
  app.setDay('2026-11-13'); app.tick(); app.tick()
  assert.equal(app.count(), 2)
  app.visible(false); app.setDay('2026-11-14'); app.tick()
  assert.equal(app.count(), 2)
  app.visible(true); app.tick()
  assert.equal(app.count(), 3)
  app.stop()
})
