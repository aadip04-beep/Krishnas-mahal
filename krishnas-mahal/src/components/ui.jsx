import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, ReceiptText, Plus, ListChecks, FileBarChart2, Menu, X, Tag, Map, Package, Anchor, Mountain, BrickWall, Layers, Boxes,
  HardHat, Zap, Droplets, Grid3x3, DoorOpen, Paintbrush, Ruler, FileBadge, MoreHorizontal, Hammer, Truck, Wrench, Trees,
  Sofa, Lightbulb, Fence, Warehouse, ChevronLeft, WifiOff, CloudUpload
} from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'

// Single icon family (Lucide), consistent 2px stroke. Category icons resolved by name.
export const ICONS = {
  tag: Tag, map: Map, package: Package, anchor: Anchor, mountain: Mountain, 'brick-wall': BrickWall, layers: Layers, boxes: Boxes,
  'hard-hat': HardHat, zap: Zap, droplets: Droplets, 'grid-3x3': Grid3x3, 'door-open': DoorOpen, paintbrush: Paintbrush, ruler: Ruler,
  'file-badge': FileBadge, 'more-horizontal': MoreHorizontal, hammer: Hammer, truck: Truck, wrench: Wrench, trees: Trees, sofa: Sofa,
  lightbulb: Lightbulb, fence: Fence, warehouse: Warehouse
}
export const ICON_NAMES = Object.keys(ICONS)
export function CatIcon({ name, size = 20, ...rest }) {
  const C = ICONS[name] || Tag
  return <C size={size} strokeWidth={2} aria-hidden="true" {...rest} />
}

// Peacock feather (mor-pankh) — Krishna's crown ornament, drawn as an original SVG mark.
export function Feather({ size = 40, className = '', style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2DC4BE" /><stop offset="1" stopColor="#0FA3A3" /></linearGradient>
        <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F6BC9" /><stop offset="1" stopColor="#1E4E9E" /></linearGradient>
      </defs>
      <path d="M33 62 C30 44 29 28 34 6" stroke="#F2B33D" strokeWidth="2" fill="none" strokeLinecap="round" />
      {[...Array(9)].map((_, i) => (
        <path key={i} d={`M32 ${22 + i * 2} L${12 + i * 1.5} ${28 + i * 2.2}`} stroke="#2DC4BE" strokeWidth="1" opacity="0.5" />
      ))}
      {[...Array(9)].map((_, i) => (
        <path key={'r' + i} d={`M32 ${22 + i * 2} L${52 - i * 1.5} ${28 + i * 2.2}`} stroke="#2DC4BE" strokeWidth="1" opacity="0.5" />
      ))}
      <ellipse cx="32" cy="22" rx="14" ry="19" fill="url(#fg1)" />
      <ellipse cx="32" cy="22" rx="9.5" ry="12.5" fill="url(#fg2)" />
      <ellipse cx="32" cy="24" rx="5.5" ry="7.5" fill="#F2B33D" />
      <ellipse cx="32" cy="25" rx="2.8" ry="3.8" fill="#0B1F3A" />
    </svg>
  )
}

export function Logo({ size = 36, showText = true }) {
  const { t } = useLang()
  return (
    <div className="brand">
      <Feather size={size} />
      {showText && <div><div className="brand-name">{t('appName')}</div><div className="brand-tag">{t('tagline')}</div></div>}
    </div>
  )
}

export function TopBar({ title, sub, back, right }) {
  const nav = useNavigate()
  const { t } = useLang()
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {back ? <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('back')}><ChevronLeft /></button> : <Feather size={32} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {right}
      </div>
      <StatusBanner />
    </header>
  )
}

function StatusBanner() {
  const { online, queue, demo } = useStore()
  const { t } = useLang()
  if (demo) return <div className="banner" role="status" style={{ color: 'var(--secondary)' }}>Demo mode — sample data, saved only on this phone. Add Supabase keys to go live (README).</div>
  if (online && queue.length === 0) return null
  return (
    <div className="banner" role="status">
      {online ? <CloudUpload size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
      {online ? `${queue.length} ${t('pendingSync')}` : t('offline')}
    </div>
  )
}

export function BottomNav({ onAdd }) {
  const { t } = useLang()
  const items = [
    { to: '/', icon: Home, label: t('nav_home'), end: true },
    { to: '/expenses', icon: ReceiptText, label: t('nav_expenses') },
    null,
    { to: '/stages', icon: ListChecks, label: t('nav_stages') },
    { to: '/more', icon: Menu, label: t('nav_more') }
  ]
  return (
    <nav className="bottomnav" aria-label="Main">
      <div className="bottomnav-inner">
        {items.map((it, i) => it ? (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => 'navbtn' + (isActive ? ' active' : '')}>
            <it.icon size={24} strokeWidth={2} aria-hidden="true" /><span>{it.label}</span>
          </NavLink>
        ) : (
          <button key="add" className="navbtn navbtn-add" onClick={onAdd} aria-label={t('addExpense')}>
            <span className="fab"><Plus size={28} strokeWidth={2.5} aria-hidden="true" /></span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export function Sheet({ open, onClose, title, children, footer }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.querySelector('input,select,button,textarea')?.focus(), 50)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <>
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h2>{title}</h2><button className="iconbtn" onClick={onClose} aria-label="Close"><X /></button></div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>
  )
}

export function Toast() {
  const { toast } = useStore()
  const [show, setShow] = useState(null)
  useEffect(() => {
    if (!toast) return
    setShow(toast)
    const id = setTimeout(() => setShow(null), 2600)
    return () => clearTimeout(id)
  }, [toast])
  if (!show) return null
  return <div className={'toast ' + (show.kind === 'err' ? 'err' : '')} role="status" aria-live="polite">{show.msg}</div>
}

export function Field({ label, hint, error, children, id }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  )
}

export function Empty({ icon: Icon = ReceiptText, text }) {
  return <div className="empty"><Icon size={44} strokeWidth={1.5} aria-hidden="true" /><p>{text}</p></div>
}

export function Confirm({ open, text, onYes, onNo }) {
  const { t } = useLang()
  return (
    <Sheet open={open} onClose={onNo} title={t('confirm')} footer={<>
      <button className="btn btn-ghost" onClick={onNo}>{t('cancel')}</button>
      <button className="btn btn-primary" style={{ background: 'var(--danger)', color: '#fff' }} onClick={onYes}>{t('delete')}</button>
    </>}>
      <p>{text}</p>
    </Sheet>
  )
}

export { FileBarChart2 }
