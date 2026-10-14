import { useEffect, useRef, useState } from 'react'
import { getPhoto } from './api'
import type { Product } from './types'

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    bag: <><path d="M5 8h14l2 13H3L5 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></>,
    clothes: <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z"/>,
    cosmetics: <><rect x="4" y="11" width="6" height="10" rx="1"/><path d="M5 11V6l4-3v8M15 8h6v13h-6zM16 8V4h4v4"/></>,
    shoes: <path d="M3 16c5 0 8-2 9-6l3 1c1 4 3 5 6 5v5H3v-5ZM5 21v-4M18 21v-5"/>,
    tote: <><path d="M4 7h16l-1 14H5L4 7Z"/><path d="M8 10V5a4 4 0 0 1 8 0v5"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.bag}</svg>
}
export function categoryIcon(name: string) {
  if (/tote/i.test(name)) return 'tote'
  if (/cloth/i.test(name)) return 'clothes'
  if (/cosm|beauty/i.test(name)) return 'cosmetics'
  if (/shoe/i.test(name)) return 'shoes'
  return 'bag'
}

// Decorative brand artwork; never used as a product photo.
export function BrandArt() {
  return <svg className="brand-art" viewBox="0 0 520 400" role="img" aria-label="Illustration of a handbag, cosmetics and little everyday favourites">
    <defs><linearGradient id="bag" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a77b58"/><stop offset="1" stopColor="#66442f"/></linearGradient><linearGradient id="glass" x1="0" x2="1"><stop stopColor="#dcb7b0"/><stop offset="1" stopColor="#f1dcd5"/></linearGradient><filter id="shadow"><feGaussianBlur stdDeviation="10"/></filter></defs>
    <circle cx="277" cy="191" r="166" fill="#e8ddd0"/><ellipse cx="272" cy="346" rx="188" ry="13" fill="#836f61" opacity=".15" filter="url(#shadow)"/>
    <g transform="rotate(-8 255 220)"><path d="M184 148c0-107 129-107 129 0" fill="none" stroke="#67472f" strokeWidth="12"/><path d="M159 143h183l22 178q0 15-16 15H149q-16 0-14-15z" fill="url(#bag)"/><path d="M164 150h174l17 172H145z" fill="none" stroke="#c29977" strokeDasharray="2 3"/><path d="M161 150q91 65 179 0" stroke="#493423" fill="none" strokeWidth="2"/><rect x="238" y="184" width="27" height="20" rx="4" fill="#caaa70"/><text x="251" y="284" textAnchor="middle" fill="#d1b79e" fontSize="10" fontFamily="serif" letterSpacing="4">LUNARA</text></g>
    <g transform="rotate(8 405 290)"><rect x="368" y="248" width="71" height="94" rx="9" fill="url(#glass)"/><rect x="380" y="216" width="47" height="35" rx="4" fill="#513b52"/><rect x="381" y="276" width="45" height="41" fill="#fcf7f0"/><text x="403" y="297" textAnchor="middle" fill="#725c60" fontSize="9" fontFamily="serif">bloom</text></g>
    <g transform="rotate(-15 111 308)"><rect x="96" y="263" width="33" height="78" rx="3" fill="#533c50"/><rect x="102" y="247" width="21" height="22" fill="#c6a279"/><path d="M102 247v-31q21-15 21-4v35" fill="#a95763"/></g>
    <path d="M388 105l6 17 17 6-17 6-6 17-6-17-17-6 17-6z" fill="#b49870"/><path d="M102 137l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#b49870"/>
  </svg>
}
export function ProductImage({ product, full = false, index = 0, thumbnail = false }: { product: Product; full?: boolean; index?: number; thumbnail?: boolean }) {
  const photo = product.photos[index]
  const path = thumbnail ? photo?.thumb_path : photo?.webp_path
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setSrc(''); setFailed(false)
    if (!path) return
    const controller = new AbortController()
    let objectUrl = ''
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      getPhoto(path, controller.signal).then(value => {
        if (controller.signal.aborted) { URL.revokeObjectURL(value); return }
        objectUrl = value; setSrc(value)
      }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    }, { rootMargin: '250px' })
    if (ref.current) observer.observe(ref.current)
    return () => { observer.disconnect(); controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path, product.updated_at])
  return <div ref={ref} className={`product-image ${full ? 'full' : ''}`}>
    {src && !failed ? <img src={src} alt={photo?.label ? `${product.name} — ${photo.label}` : product.name} onError={() => setFailed(true)} /> : <div className="image-placeholder"><Icon name={categoryIcon(product.category)} size={48} /><span>{failed ? 'Photo unavailable' : path ? 'Loading photo…' : 'Photo coming soon'}</span></div>}
  </div>
}
export const money = (value: number) => `৳${Number(value).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`

export function ProductCard({ product, saved, onSave, onOpen }: { product: Product; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return <article className="product-card">
    <div className="product-visual"><button className="image-button" onClick={onOpen} aria-label={`View ${product.name}`}><ProductImage product={product}/></button>
      {product.featured && <span className="product-badge">Lunara pick</span>}
      <button className={`save-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name}`} aria-pressed={saved} onClick={onSave}><Icon name="heart" size={20}/></button>
    </div>
    <div className="product-info"><span className="product-category">{product.subcategory || product.category}</span><button className="product-name" onClick={onOpen}>{product.name}</button>
      <div className="price-row"><strong>{money(product.sell_price)}</strong><span className={product.available ? 'availability' : 'availability unavailable'}><i/>{product.available ? 'Available' : 'Sold out'}</span></div>
      {product.colors.length > 0 && <p className="color-note">{product.colors.slice(0, 3).join(' · ')}{product.colors.length > 3 ? ` +${product.colors.length - 3}` : ''}</p>}
    </div>
  </article>
}
