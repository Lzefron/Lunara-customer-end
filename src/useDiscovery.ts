import { useCallback, useEffect, useRef, useState } from 'react'
import { watchVisits } from './visitLifecycle.mjs'

const HISTORY_KEY = 'lunara-discovery-leads-v1'
type Leads = Record<string, string>
function readLeads(): Leads {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string').slice(-250))
  } catch { return {} }
}
const seed = () => `${Date.now()}-${Math.random()}`

export function useDiscovery(detailOpen: boolean) {
  const leads = useRef<Leads>(readLeads())
  const [visit, setVisit] = useState(() => ({ seed: seed(), previous: { ...leads.current } }))
  const [pending, setPending] = useState(false)
  const newVisit = useCallback(() => setPending(true), [])
  useEffect(() => watchVisits(window, document, newVisit), [newVisit])
  // Keep the open photo gallery intact; refresh the underlying collection on close.
  useEffect(() => {
    if (!pending || detailOpen) return
    setVisit({ seed: seed(), previous: { ...leads.current } })
    setPending(false)
  }, [pending, detailOpen])
  const remember = useCallback((entries: Leads) => {
    leads.current = Object.fromEntries(Object.entries({ ...leads.current, ...entries }).slice(-250))
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(leads.current)) } catch { /* Shuffle still works without storage. */ }
  }, [])
  return { visit, newVisit, remember }
}
