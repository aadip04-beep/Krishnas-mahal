import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Trash2, Pencil, Copy, CheckCircle2, ExternalLink } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { formatINR, formatDate, sum, todayISO, FLOORS } from '../lib/utils'
import { TopBar, Sheet, Empty, Confirm, CatIcon } from '../components/ui'
import ExpenseRow from '../components/ExpenseRow'

export default function Expenses({ onEdit, onDuplicate }) {
  const { t, name } = useLang()
  const { expenses, categories, profiles, deleteExpense, updateExpense, notify, profile, isAdmin } = useStore()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [sel, setSel] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const f = { cat: sp.get('cat') || '', floor: sp.get('floor') || '', from: sp.get('from') || '', to: sp.get('to') || '', unpaid: sp.get('unpaid') === '1', user: sp.get('user') || '', sort: sp.get('sort') || 'dateDesc' }
  const setF = (patch) => { const n = { ...f, ...patch }; const o = {}; for (const k in n) if (n[k] && n[k] !== 'dateDesc') o[k] = n[k] === true ? '1' : n[k]; setSp(o, { replace: true }) }
  const activeFilters = ['cat', 'floor', 'from', 'to', 'unpaid', 'user'].filter(k => f[k]).length

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    let r = expenses.filter(e =>
      (!f.cat || e.category_id === f.cat) && (!f.floor || e.floor === f.floor) && (!f.from || e.expense_date >= f.from) && (!f.to || e.expense_date <= f.to) &&
      (!f.unpaid || !e.is_paid) && (!f.user || e.created_by === f.user) &&
      (!ql || [e.description, e.vendor, String(e.amount), name(categories.find(c => c.id === e.category_id))].some(s => (s || '').toLowerCase().includes(ql))))
    const s = { dateDesc: (a, b) => b.expense_date.localeCompare(a.expense_date) || b.created_at.localeCompare(a.created_at), dateAsc: (a, b) => a.expense_date.localeCompare(b.expense_date), amountDesc: (a, b) => b.amount - a.amount, amountAsc: (a, b) => a.amount - b.amount }
    return [...r].sort(s[f.sort] || s.dateDesc)
  }, [expenses, q, f.cat, f.floor, f.from, f.to, f.unpaid, f.user, f.sort, categories, name])

  // group by date for the list
  const groups = useMemo(() => {
    if (f.sort !== 'dateDesc' && f.sort !== 'dateAsc') return [[null, rows]]
    const m = new Map(); for (const r of rows) { if (!m.has(r.expense_date)) m.set(r.expense_date, []); m.get(r.expense_date).push(r) }
    return [...m.entries()]
  }, [rows, f.sort])

  const canEdit = sel && (isAdmin || sel.created_by === profile?.id)
  const cat = sel && categories.find(c => c.id === sel.category_id)

  return (
    <>
      <TopBar title={t('expenses')} sub={`${rows.length} ${t('entries')} · ${formatINR(sum(rows))}`} right={
        <button className="iconbtn" onClick={() => setShowFilter(true)} aria-label={t('filter')} style={{ color: activeFilters ? 'var(--primary)' : undefined }}>
          <SlidersHorizontal />{activeFilters > 0 && <span className="sr-only">{activeFilters}</span>}
        </button>} />
      <main className="page">
        <div className="field" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 15, color: 'var(--fg-faint)' }} aria-hidden="true" />
          <input className="input" style={{ paddingLeft: 40 }} placeholder={t('searchPh')} value={q} onChange={e => setQ(e.target.value)} type="search" aria-label={t('search')} />
        </div>
        <div className="chips scroll mb-3">
          <button className="chip" aria-pressed={!f.cat} onClick={() => setF({ cat: '' })}>{t('all')}</button>
          {categories.map(c => <button key={c.id} className="chip" aria-pressed={f.cat === c.id} onClick={() => setF({ cat: f.cat === c.id ? '' : c.id })}><CatIcon name={c.icon} size={14} />{name(c)}</button>)}
        </div>

        {rows.length === 0 ? <Empty text={expenses.length ? t('noMatch') : t('noExpenses')} /> : groups.map(([date, list]) => (
          <div key={date || 'all'}>
            {date && <div className="date-head"><span>{date === todayISO() ? t('today') : formatDate(date, t('months'))}</span><span className="num">{formatINR(sum(list))}</span></div>}
            <div className="list">{list.map(e => <ExpenseRow key={e.id} e={e} onClick={() => setSel(e)} />)}</div>
          </div>
        ))}
      </main>

      {/* detail sheet */}
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.description || name(cat) || ''} footer={canEdit ? <>
        <button className="btn btn-danger" onClick={() => setConfirm(true)}><Trash2 size={18} aria-hidden="true" />{t('delete')}</button>
        <button className="btn btn-primary" onClick={() => { const s = sel; setSel(null); onEdit(s) }}><Pencil size={18} aria-hidden="true" />{t('edit')}</button>
      </> : null}>
        {sel && (
          <div>
            <p className="big num" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>{formatINR(sel.amount)}</p>
            <DL rows={[
              [t('category'), <span className="flex"><CatIcon name={cat?.icon} size={16} style={{ color: cat?.color }} />{name(cat)}</span>],
              [t('date'), formatDate(sel.expense_date, t('months'))], [t('floor'), t('floor_' + sel.floor)],
              [t('vendor'), sel.vendor], [t('quantity'), sel.quantity ? `${sel.quantity} ${sel.unit || ''}` : null],
              [t('paymentMode'), t('pm_' + sel.payment_mode)],
              [t('paid'), sel.is_paid ? <span className="badge ok">{t('paid')}</span> : <span className="badge warn">{t('unpaid')}{sel.due_date ? ` · ${formatDate(sel.due_date, t('months'))}` : ''}</span>],
              [t('addedBy'), profiles.find(p => p.id === sel.created_by)?.display_name],
              [t('billPhoto'), sel.bill_url ? <a href={sel.bill_url} target="_blank" rel="noreferrer" className="flex"><img src={sel.bill_url} alt="Bill" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} /><ExternalLink size={16} aria-hidden="true" /></a> : null]
            ]} />
            <div className="flex wrap mt-4">
              {!sel.is_paid && canEdit && <button className="btn btn-secondary btn-sm" onClick={async () => { await updateExpense(sel.id, { is_paid: true, payment_mode: sel.payment_mode === 'credit' ? 'cash' : sel.payment_mode }); notify(t('saved')); setSel(null) }}><CheckCircle2 size={16} aria-hidden="true" />{t('markPaid')}</button>}
              <button className="btn btn-ghost btn-sm" onClick={() => { const s = sel; setSel(null); onDuplicate(s) }}><Copy size={16} aria-hidden="true" />{t('duplicate')}</button>
            </div>
          </div>
        )}
      </Sheet>
      <Confirm open={confirm} text={t('deleteConfirm')} onNo={() => setConfirm(false)} onYes={async () => { await deleteExpense(sel.id); setConfirm(false); setSel(null); notify(t('deleted')) }} />

      {/* filter sheet */}
      <Sheet open={showFilter} onClose={() => setShowFilter(false)} title={t('filter')} footer={<>
        <button className="btn btn-ghost" onClick={() => { setSp({}, { replace: true }) }}>{t('clear')}</button>
        <button className="btn btn-primary" onClick={() => setShowFilter(false)}>{t('close')}</button></>}>
        <div className="field"><label>{t('floor')}</label><div className="chips">
          <button className="chip" aria-pressed={!f.floor} onClick={() => setF({ floor: '' })}>{t('all')}</button>
          {FLOORS.map(fl => <button key={fl} className="chip" aria-pressed={f.floor === fl} onClick={() => setF({ floor: fl })}>{t('floor_' + fl)}</button>)}
        </div></div>
        <div className="inline" style={{ alignItems: 'flex-start' }}>
          <div className="field"><label htmlFor="from">{t('fromDate')}</label><input id="from" type="date" className="input" value={f.from} onChange={e => setF({ from: e.target.value })} /></div>
          <div className="field"><label htmlFor="to">{t('toDate')}</label><input id="to" type="date" className="input" value={f.to} onChange={e => setF({ to: e.target.value })} /></div>
        </div>
        <div className="field"><label htmlFor="user">{t('addedBy')}</label><select id="user" className="input" value={f.user} onChange={e => setF({ user: e.target.value })}>
          <option value="">{t('all')}</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}</select></div>
        <div className="field"><label htmlFor="sort">{t('sortBy')}</label><select id="sort" className="input" value={f.sort} onChange={e => setF({ sort: e.target.value })}>
          {['dateDesc', 'dateAsc', 'amountDesc', 'amountAsc'].map(s => <option key={s} value={s}>{t('sort_' + s)}</option>)}</select></div>
        <button className="chip" aria-pressed={f.unpaid} onClick={() => setF({ unpaid: !f.unpaid })}>{t('onlyUnpaid')}</button>
      </Sheet>
    </>
  )
}

function DL({ rows }) {
  return <dl style={{ margin: 0 }}>{rows.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
    <div key={k} className="flex between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><dt className="muted small">{k}</dt><dd style={{ margin: 0, fontWeight: 600, textAlign: 'right' }}>{v}</dd></div>
  ))}</dl>
}
