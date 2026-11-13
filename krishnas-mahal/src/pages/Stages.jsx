import { useMemo, useState } from 'react'
import { Check, Circle, Loader, Plus, Trash2 } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { formatDate, todayISO, FLOORS } from '../lib/utils'
import { TopBar, Sheet, Field, Confirm } from '../components/ui'

const NEXT = { pending: 'in_progress', in_progress: 'done', done: 'pending' }

export default function Stages() {
  const { t, name } = useLang()
  const { milestones, updateMilestone, addMilestone, deleteMilestone, isAdmin, notify } = useStore()
  const [tab, setTab] = useState('all')
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(false)
  const [nm, setNm] = useState({ title_en: '', title_hi: '', floor: 'common', target_date: '' })
  const [confirm, setConfirm] = useState(false)

  const list = useMemo(() => milestones.filter(m => tab === 'all' || m.floor === tab), [milestones, tab])
  const done = milestones.filter(m => m.status === 'done').length
  const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0

  const cycle = (m) => {
    const status = NEXT[m.status]
    updateMilestone(m.id, { status, completed_on: status === 'done' ? todayISO() : null })
  }

  return (
    <>
      <TopBar title={t('stages')} sub={`${done}/${milestones.length} ${t('stagesDone')} · ${pct}%`} right={isAdmin && <button className="iconbtn" aria-label={t('addStage')} onClick={() => setAdding(true)}><Plus /></button>} />
      <main className="page">
        <div className="progress mb-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ background: 'var(--border)' }}><span style={{ width: pct + '%' }} /></div>
        <div className="tabs" role="tablist">
          {['all', ...FLOORS].map(k => <button key={k} role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>{k === 'all' ? t('all') : t('floor_' + k)}</button>)}
        </div>
        <div className="card">
          {list.map(m => (
            <div key={m.id} className={'ms ' + m.status}>
              <button className="dotc" onClick={() => cycle(m)} aria-label={`${name(m, 'title')}: ${t('stage_' + m.status)}`} aria-pressed={m.status === 'done'}>
                {m.status === 'done' ? <Check size={18} /> : m.status === 'in_progress' ? <Loader size={18} /> : <Circle size={10} />}
              </button>
              <button style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setSel({ ...m })}>
                <p className="t">{name(m, 'title')}</p>
                <p className="m">{t('floor_' + m.floor)} · {t('stage_' + m.status)}{m.target_date && ` · ${t('targetDate')}: ${formatDate(m.target_date, t('months'))}`}{m.completed_on && ` · ${formatDate(m.completed_on, t('months'))}`}</p>
                {m.note && <p className="m">{m.note}</p>}
              </button>
              <span className={'badge ' + (m.status === 'done' ? 'ok' : m.status === 'in_progress' ? 'warn' : '')}>{t('stage_' + m.status)}</span>
            </div>
          ))}
        </div>
      </main>

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? name(sel, 'title') : ''} footer={<>
        {isAdmin && <button className="btn btn-danger" onClick={() => setConfirm(true)}><Trash2 size={18} aria-hidden="true" /></button>}
        <button className="btn btn-primary" onClick={async () => { await updateMilestone(sel.id, { status: sel.status, target_date: sel.target_date || null, completed_on: sel.status === 'done' ? (sel.completed_on || todayISO()) : null, note: sel.note || null }); notify(t('saved')); setSel(null) }}>{t('save')}</button></>}>
        {sel && <>
          <div className="chips mb-3">{['pending', 'in_progress', 'done'].map(s => <button key={s} className="chip" aria-pressed={sel.status === s} onClick={() => setSel({ ...sel, status: s })}>{t('stage_' + s)}</button>)}</div>
          <Field label={t('targetDate')} id="td"><input id="td" type="date" className="input" value={sel.target_date || ''} onChange={e => setSel({ ...sel, target_date: e.target.value })} /></Field>
          {sel.status === 'done' && <Field label={t('completedOn')} id="cd"><input id="cd" type="date" className="input" value={sel.completed_on || todayISO()} onChange={e => setSel({ ...sel, completed_on: e.target.value })} /></Field>}
          <Field label={t('note')} id="note"><textarea id="note" className="input" value={sel.note || ''} onChange={e => setSel({ ...sel, note: e.target.value })} /></Field>
        </>}
      </Sheet>
      <Confirm open={confirm} text={t('deleteConfirm')} onNo={() => setConfirm(false)} onYes={async () => { await deleteMilestone(sel.id); setConfirm(false); setSel(null) }} />

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('addStage')} footer={<>
        <button className="btn btn-ghost" onClick={() => setAdding(false)}>{t('cancel')}</button>
        <button className="btn btn-primary" disabled={!nm.title_en.trim()} onClick={async () => { await addMilestone({ ...nm, title_hi: nm.title_hi.trim() || nm.title_en.trim(), target_date: nm.target_date || null }); setAdding(false); setNm({ title_en: '', title_hi: '', floor: 'common', target_date: '' }) }}>{t('add')}</button></>}>
        <Field label={t('stageTitle')} id="te"><input id="te" className="input" value={nm.title_en} onChange={e => setNm({ ...nm, title_en: e.target.value })} /></Field>
        <Field label={t('stageHi')} id="th"><input id="th" className="input" value={nm.title_hi} onChange={e => setNm({ ...nm, title_hi: e.target.value })} /></Field>
        <Field label={t('floor')} id="fl"><select id="fl" className="input" value={nm.floor} onChange={e => setNm({ ...nm, floor: e.target.value })}>{FLOORS.map(f => <option key={f} value={f}>{t('floor_' + f)}</option>)}</select></Field>
        <Field label={t('targetDate')} id="ntd"><input id="ntd" type="date" className="input" value={nm.target_date} onChange={e => setNm({ ...nm, target_date: e.target.value })} /></Field>
      </Sheet>
    </>
  )
}
