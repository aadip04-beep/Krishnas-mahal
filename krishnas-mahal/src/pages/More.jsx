import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, FileBarChart2, Languages, SunMoon, KeyRound, LogOut, Download, ChevronRight, Info } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { TopBar, Sheet, Field, Feather } from '../components/ui'

let deferredInstall = null
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e })

export default function More({ theme, setTheme }) {
  const { t, lang, setLang } = useLang()
  const { profile, isAdmin, logout, changeMyPassword, notify, online, queue } = useStore()
  const [pw, setPw] = useState(null)
  const [canInstall, setCanInstall] = useState(!!deferredInstall)
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  useEffect(() => { const h = () => setCanInstall(true); window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h) }, [])

  const Row = ({ icon: Icon, label, sub, to, onClick, right }) => {
    const inner = <><Icon size={22} aria-hidden="true" style={{ color: 'var(--secondary)' }} /><div className="grow"><p className="t">{label}</p>{sub && <p className="m">{sub}</p>}</div>{right ?? <ChevronRight size={18} aria-hidden="true" className="faint" />}</>
    return to ? <Link to={to} className="row-item" style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link> : <button className="row-item" style={{ width: '100%', textAlign: 'left', color: 'inherit' }} onClick={onClick}>{inner}</button>
  }

  return (
    <>
      <TopBar title={t('more')} />
      <main className="page">
        <div className="card flex" style={{ gap: 14 }}>
          <Feather size={48} />
          <div className="grow"><p className="t" style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>{profile?.display_name}</p><p className="m muted small" style={{ margin: 0 }}>@{profile?.username} · {t('role_' + (profile?.role || 'member'))}</p></div>
        </div>
        <div className="card mt-3">
          <Row icon={FileBarChart2} label={t('reports')} to="/reports" />
          {isAdmin && <Row icon={ShieldCheck} label={t('admin')} to="/admin" />}
          <Row icon={Languages} label={t('language')} onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} right={<span className="badge">{lang === 'hi' ? 'हिंदी' : 'English'}</span>} />
          <Row icon={SunMoon} label={t('theme')} onClick={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')} right={<span className="badge">{t('theme_' + theme)}</span>} />
          <Row icon={KeyRound} label={t('changeMyPassword')} onClick={() => setPw('')} />
          {!standalone && <Row icon={Download} label={t('installApp')} sub={canInstall ? '' : 'Chrome ⋮ → Add to Home screen'} onClick={async () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; setCanInstall(false) } }} />}
          <Row icon={LogOut} label={t('logout')} onClick={logout} right={<span />} />
        </div>
        <div className="card mt-3 small muted">
          <p className="flex" style={{ margin: 0 }}><Info size={16} aria-hidden="true" /> {t('appName')} · {t('version')} 1.0 · {online ? t('synced') : t('offline')}{queue.length ? ` (${queue.length})` : ''}</p>
        </div>
        <p className="blessing">{t('blessing')}</p>
      </main>
      <Sheet open={pw !== null} onClose={() => setPw(null)} title={t('changeMyPassword')} footer={<>
        <button className="btn btn-ghost" onClick={() => setPw(null)}>{t('cancel')}</button>
        <button className="btn btn-primary" disabled={(pw || '').length < 6} onClick={async () => { try { await changeMyPassword(pw); notify(t('saved')); setPw(null) } catch (e) { notify(e.message, 'err') } }}>{t('save')}</button></>}>
        <Field label={t('newPassword')} id="npw" hint={t('passwordMin')}><input id="npw" className="input" type="password" autoComplete="new-password" value={pw || ''} onChange={e => setPw(e.target.value)} /></Field>
      </Sheet>
    </>
  )
}
