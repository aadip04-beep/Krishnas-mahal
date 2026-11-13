import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { formatINR, groupSum, sum, monthKey, monthLabel, hourGreetingKey, formatDate, todayISO } from '../lib/utils'
import { TopBar, Feather, Empty, CatIcon } from '../components/ui'
import ExpenseRow from '../components/ExpenseRow'

const FLOOR_COLORS = { plot: 'var(--gold-500)', ground: 'var(--mor-400)', first: 'var(--shyam-500)', common: 'var(--kamal-500)' }

export default function Dashboard({ onEdit }) {
  const { t, name, lang } = useLang()
  const { expenses, categories, budgets, milestones, settings, profile, profiles } = useStore()
  const months = t('months')

  const d = useMemo(() => {
    const total = sum(expenses)
    const tm = monthKey(todayISO())
    const thisMonth = sum(expenses.filter(e => monthKey(e.expense_date) === tm))
    const totalBudget = Number(settings.total_budget) || 0
    const catMap = groupSum(expenses, e => e.category_id)
    const byCat = categories.map(c => ({ c, v: catMap.get(c.id) || 0, b: Number(budgets.find(b => b.category_id === c.id)?.amount) || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)
    const floorMap = groupSum(expenses, e => e.floor)
    const mMap = groupSum(expenses, e => monthKey(e.expense_date))
    const monthly = [...mMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([k, v]) => ({ k, label: monthLabel(k, months), v }))
    const userMap = groupSum(expenses, e => e.created_by)
    const byUser = profiles.map(p => ({ p, v: userMap.get(p.id) || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)
    const unpaid = expenses.filter(e => !e.is_paid)
    const done = milestones.filter(m => m.status === 'done').length
    return { total, thisMonth, totalBudget, byCat, floorMap, monthly, byUser, unpaid, unpaidTotal: sum(unpaid), done, recent: expenses.slice(0, 5) }
  }, [expenses, categories, budgets, settings, profiles, milestones, months])

  const pct = d.totalBudget ? Math.min(100, (d.total / d.totalBudget) * 100) : 0
  const over = d.totalBudget && d.total > d.totalBudget

  return (
    <>
      <TopBar title={settings.project_name || t('appName')} sub={`${t(hourGreetingKey())}, ${profile?.display_name || ''}`} />
      <main className="page stack">
        <section className="card hero" aria-label={t('totalSpent')}>
          <Feather size={160} className="feather-bg" />
          <p className="label">{t('totalSpent')}</p>
          <p className="big num">{formatINR(d.total)}</p>
          {d.totalBudget > 0 ? (
            <>
              <div className={'progress' + (over ? ' over' : '')} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: pct + '%' }} /></div>
              <div className="row mt-3">
                <div><span className="label">{t('budget')}</span><b className="num">{formatINR(d.totalBudget, { compact: true })}</b></div>
                <div><span className="label">{over ? t('overBudget') : t('remaining')}</span><b className="num" style={{ color: over ? 'var(--warning)' : undefined }}>{formatINR(Math.abs(d.totalBudget - d.total), { compact: true })}</b></div>
                <div><span className="label">{t('budgetUsed')}</span><b>{Math.round((d.total / d.totalBudget) * 100)}%</b></div>
              </div>
            </>
          ) : (
            <div className="row">
              <div><span className="label">{t('thisMonth')}</span><b className="num">{formatINR(d.thisMonth, { compact: true })}</b></div>
              <div><span className="label">{t('entries')}</span><b>{expenses.length}</b></div>
            </div>
          )}
        </section>

        <div className="grid-2">
          <div className="stat"><p className="label">{t('thisMonth')}</p><p className="value num">{formatINR(d.thisMonth, { compact: true })}</p></div>
          <div className="stat"><p className="label">{t('progress')}</p><p className="value">{d.done}/{milestones.length} <span className="small muted">{t('stagesDone')}</span></p></div>
        </div>

        {d.unpaid.length > 0 && (
          <Link to="/expenses?unpaid=1" className="card flex between" style={{ textDecoration: 'none', color: 'inherit', borderColor: 'var(--warning)' }}>
            <span className="flex"><AlertTriangle size={20} style={{ color: 'var(--warning)' }} aria-hidden="true" /><b>{t('pendingPayments')}</b></span>
            <b className="num">{formatINR(d.unpaidTotal)} <span className="small muted">({d.unpaid.length})</span></b>
          </Link>
        )}

        {expenses.length === 0 ? <div className="card"><Empty text={t('noExpenses')} /></div> : (
          <>
            <section className="card">
              <h3 className="card-title">{t('byCategory')} <Link to="/reports">{t('reports')}</Link></h3>
              {d.byCat.slice(0, 6).map(({ c, v, b }) => (
                <div className="bar-row" key={c.id}>
                  <span className="name"><span className="dot" style={{ background: c.color }} /><CatIcon name={c.icon} size={16} style={{ color: c.color }} />{name(c)}</span>
                  <span className="val">{formatINR(v, { compact: true })}{b > 0 && <span className="small faint"> / {formatINR(b, { compact: true })}</span>}</span>
                  <span className="track"><span style={{ width: `${(v / d.byCat[0].v) * 100}%`, background: c.color }} /></span>
                </div>
              ))}
            </section>

            {d.monthly.length > 1 && (
              <section className="card">
                <h3 className="card-title">{t('monthlyTrend')}</h3>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.monthly} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={v => formatINR(v, { compact: true }).replace('₹', '')} />
                      <Tooltip cursor={{ fill: 'var(--border)' }} content={({ active, payload }) => active && payload?.length ? <div className="chart-tip"><b>{payload[0].payload.label}</b>{formatINR(payload[0].value)}</div> : null} />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]}>{d.monthly.map((m, i) => <Cell key={m.k} fill={i === d.monthly.length - 1 ? 'var(--gold-500)' : 'var(--mor-400)'} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <section className="card">
              <h3 className="card-title">{t('byFloor')}</h3>
              {['plot', 'ground', 'first', 'common'].map(fl => { const v = d.floorMap.get(fl) || 0; return (
                <div className="bar-row" key={fl}>
                  <span className="name"><span className="dot" style={{ background: FLOOR_COLORS[fl] }} />{t('floor_' + fl)}</span>
                  <span className="val">{formatINR(v, { compact: true })} <span className="small faint">{d.total ? Math.round((v / d.total) * 100) : 0}%</span></span>
                  <span className="track"><span style={{ width: `${d.total ? (v / d.total) * 100 : 0}%`, background: FLOOR_COLORS[fl] }} /></span>
                </div>) })}
            </section>

            {d.byUser.length > 1 && (
              <section className="card">
                <h3 className="card-title">{t('byUser')}</h3>
                {d.byUser.map(({ p, v }) => (
                  <div className="bar-row" key={p.id}>
                    <span className="name">{p.display_name}</span><span className="val">{formatINR(v, { compact: true })}</span>
                    <span className="track"><span style={{ width: `${(v / d.byUser[0].v) * 100}%`, background: 'var(--secondary)' }} /></span>
                  </div>
                ))}
              </section>
            )}

            <section>
              <h3 className="card-title">{t('recentExpenses')} <Link to="/expenses">{t('viewAll')}</Link></h3>
              <div className="list">{d.recent.map(e => <ExpenseRow key={e.id} e={e} onClick={() => onEdit(e)} />)}</div>
            </section>
          </>
        )}
        <p className="blessing">{t('blessing')}</p>
      </main>
    </>
  )
}
