import { useEffect, useState } from 'react'
import { UserPlus, KeyRound, Trash2 } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { formatINR } from '../lib/utils'
import { TopBar, Sheet, Field, CatIcon, ICON_NAMES, Confirm } from '../components/ui'

const COLORS = ['#F2B33D', '#0FA3A3', '#2F6BC9', '#E05A8A', '#2E9E6B', '#8338EC', '#C1572A', '#FFD166', '#4CC9F0', '#8D99AE', '#B5838D', '#A3B18A']

export default function Admin() {
  const { t, name } = useLang()
  const s = useStore()
  const [tab, setTab] = useState('users')
  if (!s.isAdmin) return <><TopBar title={t('admin')} back /><main className="page"><p className="muted">{t('notAdmin')}</p></main></>
  return (
    <>
      <TopBar title={t('admin')} back />
      <main className="page">
        <div className="tabs" role="tablist">
          {['users', 'categories', 'budgets', 'settings', 'activityLog'].map(k => <button key={k} role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>{t(k)}</button>)}
        </div>
        {tab === 'users' && <Users />}
        {tab === 'categories' && <Categories />}
        {tab === 'budgets' && <Budgets />}
        {tab === 'settings' && <Settings />}
        {tab === 'activityLog' && <Activity />}
      </main>
    </>
  )
}

function Users() {
  const { t } = useLang()
  const { profiles, createUser, updateProfile, notify, profile, loadAll } = useStore()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ username: '', password: '', displayName: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async () => {
    setErr(''); setBusy(true)
    try { await createUser(f); notify(t('userCreated')); setOpen(false); setF({ username: '', password: '', displayName: '' }); setTimeout(loadAll, 800) }
    catch (e) { setErr(t(e.message) !== e.message ? t(e.message) : e.message) }
    setBusy(false)
  }
  return (
    <div className="card">
      <button className="btn btn-primary btn-block mb-3" onClick={() => setOpen(true)}><UserPlus size={18} aria-hidden="true" />{t('addUser')}</button>
      {profiles.map(p => (
        <div key={p.id} className="row-item">
          <div className="grow"><p className="t">{p.display_name} <span className="small faint">@{p.username}</span></p>
            <p className="m">{t('role_' + p.role)} · {p.is_active ? t('active') : t('deactivated')}</p></div>
          {p.id !== profile.id && <>
            <select className="input" style={{ width: 'auto', minHeight: 40 }} value={p.role} onChange={e => updateProfile(p.id, { role: e.target.value })} aria-label={t('role')}>
              <option value="member">{t('role_member')}</option><option value="admin">{t('role_admin')}</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => updateProfile(p.id, { is_active: !p.is_active })}>{p.is_active ? t('deactivate') : t('activate')}</button>
          </>}
        </div>
      ))}
      <p className="small faint mt-3"><KeyRound size={14} aria-hidden="true" /> {t('resetPassword')}: Supabase Dashboard → Authentication → Users → … → Reset password (set a new one), or ask the user to use "{t('changeMyPassword')}" in More.</p>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('addUser')} footer={<>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>{t('cancel')}</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? t('loading') : t('save')}</button></>}>
        <Field label={t('displayName')} id="dn"><input id="dn" className="input" value={f.displayName} onChange={e => setF({ ...f, displayName: e.target.value })} /></Field>
        <Field label={t('username')} id="un" hint={t('usernameRule')}><input id="un" className="input" autoCapitalize="none" value={f.username} onChange={e => setF({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} /></Field>
        <Field label={t('password')} id="pw" hint={t('passwordMin')} error={err}><input id="pw" className="input" type="text" autoComplete="off" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></Field>
      </Sheet>
    </div>
  )
}

function Categories() {
  const { t, name } = useLang()
  const { categories, addCategory, updateCategory, deleteCategory, notify, expenses } = useStore()
  const [sel, setSel] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const isNew = sel && !sel.id
  const save = async () => {
    if (!sel.name_en.trim()) return
    const patch = { name_en: sel.name_en.trim(), name_hi: (sel.name_hi || '').trim() || sel.name_en.trim(), icon: sel.icon, color: sel.color }
    if (isNew) await addCategory(patch); else await updateCategory(sel.id, patch)
    notify(t('saved')); setSel(null)
  }
  const used = (id) => expenses.some(e => e.category_id === id)
  return (
    <div className="card">
      <button className="btn btn-primary btn-block mb-3" onClick={() => setSel({ name_en: '', name_hi: '', icon: 'tag', color: COLORS[1] })}>{t('addCategory')}</button>
      {categories.map(c => (
        <button key={c.id} className="row-item" style={{ width: '100%', textAlign: 'left', color: 'inherit' }} onClick={() => setSel({ ...c })}>
          <span className="ic" style={{ width: 40, height: 40, borderRadius: 10, background: c.color, display: 'grid', placeItems: 'center', color: '#fff' }}><CatIcon name={c.icon} /></span>
          <div className="grow"><p className="t">{name(c)}</p><p className="m">{c.name_en} / {c.name_hi}</p></div>
        </button>
      ))}
      <Sheet open={!!sel} onClose={() => setSel(null)} title={isNew ? t('addCategory') : t('edit')} footer={<>
        {!isNew && !sel?.is_default && !used(sel?.id) && <button className="btn btn-danger" onClick={() => setConfirm(true)}><Trash2 size={18} aria-hidden="true" /></button>}
        <button className="btn btn-primary" onClick={save}>{t('save')}</button></>}>
        {sel && <>
          <Field label={t('nameEn')} id="ne"><input id="ne" className="input" value={sel.name_en} onChange={e => setSel({ ...sel, name_en: e.target.value })} /></Field>
          <Field label={t('nameHi')} id="nh"><input id="nh" className="input" value={sel.name_hi || ''} onChange={e => setSel({ ...sel, name_hi: e.target.value })} /></Field>
          <Field label={t('color')}><div className="chips">{COLORS.map(c => <button key={c} className="chip" aria-pressed={sel.color === c} aria-label={c} style={{ background: c, borderColor: c, minWidth: 40, color: '#fff' }} onClick={() => setSel({ ...sel, color: c })}>{sel.color === c ? '✓' : ''}</button>)}</div></Field>
          <Field label={t('icon')}><div className="chips">{ICON_NAMES.map(i => <button key={i} className="chip" aria-pressed={sel.icon === i} aria-label={i} onClick={() => setSel({ ...sel, icon: i })}><CatIcon name={i} size={18} /></button>)}</div></Field>
        </>}
      </Sheet>
      <Confirm open={confirm} text={t('deleteConfirm')} onNo={() => setConfirm(false)} onYes={async () => { await deleteCategory(sel.id); setConfirm(false); setSel(null) }} />
    </div>
  )
}

function Budgets() {
  const { t, name } = useLang()
  const { categories, budgets, setBudget, expenses, notify } = useStore()
  const [vals, setVals] = useState({})
  useEffect(() => { setVals(Object.fromEntries(budgets.map(b => [b.category_id, b.amount]))) }, [budgets])
  const spent = (id) => expenses.filter(e => e.category_id === id).reduce((a, e) => a + Number(e.amount), 0)
  const total = Object.values(vals).reduce((a, v) => a + (Number(v) || 0), 0)
  return (
    <div className="card">
      <p className="small muted" style={{ marginTop: 0 }}>{t('budgets')} · {t('total')}: <b className="num">{formatINR(total)}</b></p>
      {categories.map(c => (
        <div key={c.id} className="row-item">
          <div className="grow"><p className="t">{name(c)}</p><p className="m">{t('totalSpent')}: {formatINR(spent(c.id))}</p></div>
          <input className="input num" style={{ width: 130 }} type="number" inputMode="numeric" min="0" aria-label={`${name(c)} ${t('budget')}`} value={vals[c.id] ?? ''} placeholder="0"
            onChange={e => setVals({ ...vals, [c.id]: e.target.value })} onBlur={async e => { if (String(e.target.value) !== String(budgets.find(b => b.category_id === c.id)?.amount ?? '')) { await setBudget(c.id, e.target.value); notify(t('saved')) } }} />
        </div>
      ))}
    </div>
  )
}

function Settings() {
  const { t } = useLang()
  const { settings, setSetting, notify } = useStore()
  const [v, setV] = useState(settings)
  useEffect(() => setV(settings), [settings])
  const save = async (k) => { if (v[k] !== settings[k]) { await setSetting(k, v[k] ?? ''); notify(t('saved')) } }
  return (
    <div className="card">
      <Field label={t('projectName')} id="pn"><input id="pn" className="input" value={v.project_name || ''} onChange={e => setV({ ...v, project_name: e.target.value })} onBlur={() => save('project_name')} /></Field>
      <Field label={t('totalBudget')} id="tb" hint={t('setBudgetHint')}><input id="tb" className="input num" type="number" inputMode="numeric" min="0" value={v.total_budget || ''} onChange={e => setV({ ...v, total_budget: e.target.value })} onBlur={() => save('total_budget')} /></Field>
      <Field label={t('startDate')} id="sd"><input id="sd" className="input" type="date" value={v.start_date || ''} onChange={e => setV({ ...v, start_date: e.target.value })} onBlur={() => save('start_date')} /></Field>
      <Field label={t('plotArea')} id="pa"><input id="pa" className="input" type="number" inputMode="numeric" value={v.plot_area || ''} onChange={e => setV({ ...v, plot_area: e.target.value })} onBlur={() => save('plot_area')} /></Field>
    </div>
  )
}

function Activity() {
  const { t } = useLang()
  const { fetchActivity, profiles } = useStore()
  const [rows, setRows] = useState(null)
  useEffect(() => { fetchActivity().then(setRows) }, [fetchActivity])
  if (!rows) return <div className="card"><div className="skeleton" style={{ height: 80 }} /></div>
  return (
    <div className="card">
      {rows.length === 0 && <p className="muted">—</p>}
      {rows.map(r => (
        <div key={r.id} className="row-item">
          <div className="grow"><p className="t small">{profiles.find(p => p.id === r.actor)?.display_name || '—'} · <span className={'badge ' + (r.action === 'delete' ? 'danger' : r.action === 'update' ? 'warn' : 'ok')}>{r.action}</span></p>
            <p className="m">{r.summary} · {new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
        </div>
      ))}
    </div>
  )
}
