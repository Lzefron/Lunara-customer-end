import { dhakaDay } from './catalogLogic.mjs'

// A resumed PWA can keep React mounted. Watch real visibility/BFCache returns,
// not focus events (which also occur when closing a chooser or browser menu).
export function watchVisits(page, doc, onVisit, day = dhakaDay) {
  let hidden = doc.hidden
  let lastDay = day()
  const resume = () => {
    if (doc.hidden || !hidden) return
    hidden = false
    lastDay = day()
    onVisit()
  }
  const visibility = () => { if (doc.hidden) hidden = true; else resume() }
  const pagehide = () => { hidden = true }
  const pageshow = event => { if (event.persisted) resume() }
  const tick = () => {
    if (!doc.hidden && day() !== lastDay) { lastDay = day(); onVisit() }
  }
  doc.addEventListener('visibilitychange', visibility)
  page.addEventListener('pagehide', pagehide)
  page.addEventListener('pageshow', pageshow)
  const timer = page.setInterval(tick, 60000)
  return () => {
    doc.removeEventListener('visibilitychange', visibility)
    page.removeEventListener('pagehide', pagehide)
    page.removeEventListener('pageshow', pageshow)
    page.clearInterval(timer)
  }
}
