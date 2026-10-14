import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { configured, getCatalog } from './api'
import { BrandArt, categoryIcon, Icon, money, ProductCard, ProductImage } from './components'
import { dailyFeed, dhakaDay, filterProducts, planText } from './catalogLogic.mjs'
import type { Catalog, Category, Product } from './types'

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61562364925221'
const INSTAGRAM = 'https://www.instagram.com/lunara_bd/'
const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Bags', subcategories: ['Shoulder bags', 'Crossbody bags', 'Handbags', 'Backpacks'] },
  { name: 'Clothes', subcategories: ['Tops', 'Dresses', 'Co-ords'] },
  { name: 'Cosmetics', subcategories: ['Makeup', 'Skincare', 'Beauty tools'] },
  { name: 'Shoes', subcategories: ['Flats', 'Heels', 'Sneakers'] },
  { name: 'Tote bags', subcategories: ['Canvas totes', 'Everyday totes'] },
]

function readSaved(): string[] {
  try { const value = JSON.parse(localStorage.getItem('lunara-plan') ?? '[]'); return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [] } catch { return [] }
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = ref.current!
    node.showModal()
    document.body.style.overflow = 'hidden'
    return () => { node.close(); document.body.style.overflow = '' }
  }, [])
  return <dialog ref={ref} className="dialog" aria-label={title} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="dialog-header"><span className="eyebrow">LUNARA · YOUR EVERYDAY EDIT</span><button className="icon-button" aria-label="Close" onClick={onClose}><Icon name="close"/></button></div>{children}
  </dialog>
}

function ProductDetail({ product, saved, onSave, onClose }: { product: Product; saved: boolean; onSave: () => void; onClose: () => void }) {
  const [photo, setPhoto] = useState(0)
  const [photoKind, setPhotoKind] = useState('all')
  const gallery = product.photos.map((p, i) => ({ ...p, index: i })).filter(p => photoKind === 'all' || (p.kind ?? 'catalog') === photoKind)
  const [notice, setNotice] = useState('')
  const share = async () => {
    const url = `${location.origin}/?product=${encodeURIComponent(product.id)}`
    try { await navigator.clipboard.writeText(url); setNotice('Product link copied') } catch { setNotice(url) }
  }
  return <Modal title={product.name} onClose={onClose}><div className="detail-layout"><div><ProductImage product={product} full index={photo}/>
    {product.photos[photo]?.label && <p className="photo-caption">{product.photos[photo].label}</p>}
    {product.photos.length > 1 && <><div className="gallery-tabs" aria-label="Photo types">{[['all','All photos'],['variant','Colors & designs'],['real','Real photos']].filter(([kind]) => kind === 'all' || product.photos.some(p => p.kind === kind)).map(([kind, label]) => <button key={kind} className={photoKind === kind ? 'active' : ''} onClick={() => { setPhotoKind(kind); setPhoto(kind === 'all' ? 0 : product.photos.findIndex(p => p.kind === kind)) }}>{label}</button>)}</div><div className="gallery-options">{gallery.map(p => <button key={p.id} aria-label={p.label || `Photo ${p.index + 1}`} aria-pressed={photo === p.index} onClick={() => setPhoto(p.index)} className={photo === p.index ? 'active' : ''}><ProductImage product={product} index={p.index} thumbnail/><span>{p.label || `Photo ${p.index + 1}`}</span></button>)}</div></>}
    </div><div className="detail-info"><span className="eyebrow">{product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}</span><h2>{product.name}</h2><p className="detail-price">{money(product.sell_price)}</p><p className="availability">{product.available ? 'Available to enquire' : 'Currently sold out'}</p>
    {product.description && <p className="description">{product.description}</p>}
    {product.colors.length > 0 && <div className="detail-colors"><span className="eyebrow">COLORS</span><div>{product.colors.map(color => <span key={color}>{color}</span>)}</div></div>}
    <button className={`primary-button ${saved ? 'is-saved' : ''}`} onClick={onSave}><Icon name={saved ? 'check' : 'heart'} size={18}/>{saved ? 'Saved to my plan' : 'Save to my plan'}</button>
    <button className="secondary-button" onClick={share}>Copy product link <Icon name="arrow" size={18}/></button>
    <p className="small-note">Love it? Save it, then chat with us to confirm availability and delivery.</p><div className="social-links"><a href={FACEBOOK} target="_blank" rel="noreferrer">Facebook ↗</a><a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram ↗</a></div><p role="status">{notice}</p>
  </div></div></Modal>
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog>({ products: [], categories: DEFAULT_CATEGORIES })
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<'feed' | 'catalog' | 'plan'>('feed')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recommended')
  const [available, setAvailable] = useState(false)
  const [color, setColor] = useState('')
  const [budget, setBudget] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>(readSaved)
  const [selectedId, setSelectedId] = useState(new URLSearchParams(location.search).get('product'))
  const [day, setDay] = useState(dhakaDay())
  const [notice, setNotice] = useState('')
  const activeRequest = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    if (!configured || activeRequest.current) return
    const controller = new AbortController(); activeRequest.current = controller
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const data = await getCatalog(controller.signal)
      setCatalog({ products: data.products, categories: data.categories.length ? data.categories : DEFAULT_CATEGORIES })
      setError(''); setLoaded(true)
    } catch {
      setError(navigator.onLine ? 'The catalog is temporarily unavailable. Please try again, or visit us on Facebook.' : 'You’re offline. Reconnect to see the latest products.')
    } finally { clearTimeout(timeout); activeRequest.current = null; setLoading(false) }
  }, [])
  useEffect(() => {
    refresh()
    const tick = () => { setDay(dhakaDay()); if (!document.hidden) refresh() }
    const interval = setInterval(tick, 60000)
    window.addEventListener('online', tick); window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(interval); window.removeEventListener('online', tick); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick) }
  }, [refresh])
  useEffect(() => { try { localStorage.setItem('lunara-plan', JSON.stringify(savedIds)) } catch { setNotice('Your browser could not save this list. Keep this page open to retain it.') } }, [savedIds])
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'lunara-plan') setSavedIds(readSaved()) }
    const onPop = () => setSelectedId(new URLSearchParams(location.search).get('product'))
    window.addEventListener('storage', onStorage); window.addEventListener('popstate', onPop)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('popstate', onPop) }
  }, [])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(t) }, [notice])

  const categories = useMemo(() => {
    const result = catalog.categories.map(c => ({ ...c, subcategories: [...c.subcategories] }))
    for (const p of catalog.products) {
      if (!p.category) continue
      let c = result.find(c => c.name === p.category)
      if (!c) { c = { name: p.category, subcategories: [] }; result.push(c) }
      if (p.subcategory && !c.subcategories.includes(p.subcategory)) c.subcategories.push(p.subcategory)
    }
    return result
  }, [catalog])
  const savedProducts = catalog.products.filter(p => savedIds.includes(p.id))
  const unavailableCount = savedIds.filter(id => !catalog.products.some(p => p.id === id)).length
  const selected = catalog.products.find(p => p.id === selectedId)
  const products = useMemo(() => {
    const source = view === 'plan' ? savedProducts : view === 'feed' ? dailyFeed(catalog.products, day) : catalog.products
    const result = filterProducts(source, { category: view === 'plan' ? '' : category, subcategory: view === 'plan' ? '' : subcategory, query, available, color, budget }) as Product[]
    if (sort === 'low') result.sort((a, b) => a.sell_price - b.sell_price)
    if (sort === 'high') result.sort((a, b) => b.sell_price - a.sell_price)
    if (sort === 'new') result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    return result
  }, [view, savedProducts, catalog.products, day, category, subcategory, query, available, sort, color, budget])
  function navigate(next: typeof view, cat = '') {
    setView(next); setCategory(cat); setSubcategory(''); setQuery(''); setSort('recommended'); setAvailable(false); setColor(''); setBudget('')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  function toggleSave(id: string) {
    const exists = savedIds.includes(id)
    setSavedIds(ids => exists ? ids.filter(i => i !== id) : [...ids, id])
    setNotice(exists ? 'Removed from your plan' : 'Saved to your plan ♡')
  }
  function openProduct(id: string) { history.pushState(null, '', `?product=${encodeURIComponent(id)}`); setSelectedId(id) }
  function closeProduct() { history.replaceState(null, '', location.pathname); setSelectedId(null) }
  async function copyPlan() {
    const text = planText(savedProducts, location.origin)
    try { await navigator.clipboard.writeText(text); setNotice('List copied. Paste it in your chat with Lunara.'); }
    catch { setNotice('Copy is unavailable in this browser. Open each product and copy its link.'); }
  }

  return <>
    <div className="announcement"><span>A little lovely, every day.</span><span>CURATED IN BANGLADESH <span aria-hidden="true">✧</span></span></div>
    <header className="header"><div className="header-inner"><button className="wordmark" onClick={() => navigate('feed')} aria-label="Lunara home">lunara<span>✧</span></button>
      <nav className="main-nav" aria-label="Main navigation"><button className={view === 'feed' ? 'active' : ''} onClick={() => navigate('feed')}>The daily edit</button><button className={view === 'catalog' ? 'active' : ''} onClick={() => navigate('catalog')}>Explore collection</button><a href={INSTAGRAM} target="_blank" rel="noreferrer">Our Instagram ↗</a></nav>
      <button className={`plan-button ${view === 'plan' ? 'active' : ''}`} onClick={() => navigate('plan')}><Icon name="heart" size={19}/><span>My plan</span><b>{savedIds.length}</b></button></div></header>
    <main>
      {view === 'feed' && !query && <section className="hero"><div className="hero-copy"><span className="eyebrow"><i/> THE LUNARA EDIT</span><h1>Little things.<br/><em>Lovely days.</em></h1><p>Your next favourite bag. A touch of beauty.<br/>Everyday pieces, picked with you in mind.</p><button className="primary-button" onClick={() => navigate('catalog')}>Find your favourites <Icon name="arrow" size={19}/></button><div className="hero-footnote"><span>Made for your wish list</span><span aria-hidden="true">✧</span><span>Prices in BDT</span></div></div><div className="hero-art"><BrandArt/><span className="art-caption">the everyday essentials</span><div className="hero-stamp">A LITTLE<br/><em>lovely</em><br/>FOR YOU</div></div></section>}
      <div className="content-wrap">
        {view !== 'plan' && <section className="category-section" aria-label="Browse categories"><div className="section-kicker">A WORLD OF LITTLE FAVOURITES</div><div className="category-row"><button className={!category ? 'category active' : 'category'} onClick={() => { setCategory(''); setSubcategory('') }}><span className="category-icon"><Icon name="grid" size={27}/></span><span>Everything</span></button>{categories.map(c => <button key={c.name} className={category === c.name ? 'category active' : 'category'} onClick={() => { setCategory(c.name); setSubcategory(''); setView('catalog') }}><span className="category-icon"><Icon name={categoryIcon(c.name)} size={29}/></span><span>{c.name}</span></button>)}</div></section>}
        <section className="collection-section" id="collection"><div className="collection-heading"><div><span className="eyebrow">{view === 'plan' ? 'YOUR LITTLE WISH LIST' : view === 'feed' ? `FRESH PERSPECTIVE · ${new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' }).format(new Date())}` : 'FIND SOMETHING YOU LOVE'}</span><h2>{view === 'plan' ? 'Your plan to order' : category || (view === 'feed' ? 'Today’s little favourites' : 'Explore the collection')}<span className="heading-sparkle">✧</span></h2><p>{view === 'plan' ? 'Keep your favourites together. Send us your list whenever you’re ready.' : view === 'feed' ? 'A new mix every day. Come back for a little inspiration.' : 'Thoughtfully picked pieces for every kind of day.'}</p></div>{view === 'feed' && <span className="daily-label"><Icon name="sun" size={16}/> Refreshes daily</span>}</div>
          {category && view !== 'plan' && <div className="subcategories" aria-label="Subcategories"><button className={!subcategory ? 'active' : ''} onClick={() => setSubcategory('')}>All {category.toLowerCase()}</button>{categories.find(c => c.name === category)?.subcategories.map(s => <button key={s} className={subcategory === s ? 'active' : ''} onClick={() => setSubcategory(s)}>{s}</button>)}</div>}
          <div className="toolbar"><label className="search"><Icon name="search" size={19}/><input type="search" placeholder="Search for something lovely…" aria-label="Search products" value={query} onChange={e => setQuery(e.target.value)}/></label><div className="filters"><label className="available-filter"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)}/> Available only</label><label className="sort"><span>Sort:</span><select aria-label="Sort products" value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">{view === 'feed' ? 'Today’s edit' : 'Recommended'}</option><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div></div>
          <div className="extra-filters"><label>Color<select aria-label="Filter by color" value={color} onChange={e => setColor(e.target.value)}><option value="">Every color</option>{[...new Set(catalog.products.flatMap(p => p.colors))].sort().map(c => <option key={c} value={c}>{c}</option>)}</select></label><label>Budget<select aria-label="Filter by budget" value={budget} onChange={e => setBudget(e.target.value)}><option value="">Any price</option><option value="500">Up to ৳500</option><option value="1000">Up to ৳1,000</option><option value="2000">Up to ৳2,000</option><option value="5000">Up to ৳5,000</option></select></label>{(color || budget || query || available) && <button onClick={() => { setColor(''); setBudget(''); setQuery(''); setAvailable(false) }}>Clear filters</button>}</div>
          {error && <div className="connection-notice" role="status"><span>{error}{loaded ? ' Showing the last loaded collection; prices and availability may have changed.' : ''}</span><button onClick={refresh}>Try again</button></div>}
          {selectedId && loaded && !selected && <div className="connection-notice" role="status">This product is no longer in the catalog.<button onClick={closeProduct}>Dismiss</button></div>}
          {view === 'plan' && unavailableCount > 0 && loaded && <div className="connection-notice">{unavailableCount} saved {unavailableCount === 1 ? 'item is' : 'items are'} no longer published.<button onClick={() => setSavedIds(savedProducts.map(p => p.id))}>Clear unavailable items</button></div>}
          {loading ? <div className="product-grid" aria-label="Loading products" aria-busy="true">{[1,2,3,4].map(i => <div className="skeleton" key={i}/>)}</div> : products.length ? <><div className="result-count">{products.length} {products.length === 1 ? 'little favourite' : 'little favourites'}</div><div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p} saved={savedIds.includes(p.id)} onSave={() => toggleSave(p.id)} onOpen={() => openProduct(p.id)}/>)}</div></> : <div className="empty-state"><span className="empty-icon"><Icon name={view === 'plan' ? 'heart' : 'bag'} size={36}/></span><h3>{view === 'plan' ? 'A little room for your favourites' : query || category || available ? 'Still looking for your lovely?' : 'Something lovely is on its way'}</h3><p>{view === 'plan' ? 'Tap the heart on any product to keep it here.' : query || category || available ? 'Try another search or explore the whole collection.' : 'We’re preparing our collection. Follow Lunara for the latest finds.'}</p><button className="secondary-button" onClick={() => navigate('catalog')}>{view === 'plan' ? 'Explore the collection' : 'Show all products'}<Icon name="arrow" size={18}/></button></div>}
          {view === 'plan' && savedProducts.length > 0 && <div className="plan-summary"><div><span className="eyebrow">YOUR SAVED SELECTION</span><h3>{savedProducts.length} favourites · {money(savedProducts.reduce((total, p) => total + p.sell_price, 0))}</h3><p>Product prices only. Chat with us to confirm stock and delivery.</p></div><div className="plan-actions"><button className="primary-button" onClick={copyPlan}>Copy my list <Icon name="arrow" size={18}/></button><a className="secondary-button" href={FACEBOOK} target="_blank" rel="noreferrer">Chat on Facebook ↗</a></div></div>}
        </section>
        <section className="social-banner"><div className="social-decoration" aria-hidden="true">✧</div><div><span className="eyebrow">LET’S KEEP IN TOUCH</span><h2>Found your kind of lovely?</h2><p>Save your favourites and say hello. We’re just a message away.</p></div><div className="social-cta"><a href={FACEBOOK} target="_blank" rel="noreferrer">Find us on Facebook <Icon name="arrow" size={18}/></a><a href={INSTAGRAM} target="_blank" rel="noreferrer">@lunara_bd on Instagram ↗</a></div></section>
      </div>
    </main>
    <footer><div><button className="wordmark" onClick={() => navigate('feed')}>lunara<span>✧</span></button><p>A little lovely, every day.</p></div><span>Curated with love in Bangladesh</span><span>© {new Date().getFullYear()} Lunara</span></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === 'feed' ? 'active' : ''} onClick={() => navigate('feed')}><Icon name="sun" size={20}/>Daily edit</button><button className={view === 'catalog' ? 'active' : ''} onClick={() => navigate('catalog')}><Icon name="grid" size={20}/>Explore</button><button className={view === 'plan' ? 'active' : ''} onClick={() => navigate('plan')}><Icon name="heart" size={20}/>My plan {savedIds.length ? `(${savedIds.length})` : ''}</button></nav>
    {selected && <ProductDetail key={selected.id} product={selected} saved={savedIds.includes(selected.id)} onSave={() => toggleSave(selected.id)} onClose={closeProduct}/>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </>
}
