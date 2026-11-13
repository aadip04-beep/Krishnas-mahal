import { useMemo, useState } from 'react'
import { FileSpreadsheet, Printer } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { formatINR, formatDate, sum, groupSum, monthKey, monthLabel, todayISO, FLOORS } from '../lib/utils'
import { TopBar, Field } from '../components/ui'
import { downloadExcel, printReport } from '../lib/export'

const TYPES = ['all', 'category', 'floor', 'vendor', 'monthly', 'user', 'unpaid', 'budget']

export default function Reports() {
  const { t, name, lang } = useLang()
  const { expenses, categories, profiles, budgets, settings } = useStore()
  const [type, setType] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [cat, setCat] = useState('')
  const months = t('months')
  const fmtN = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const cname = (id) => name(categories.find(c => c.id === id)) || '—'
  const uname = (id) => profiles.find(p => p.id === id)?.display_name || '—'

  const rows = useMemo(() => expenses.filter(e => (!from || e.expense_date >= from) && (!to || e.expense_date <= to) && (!cat || e.category_id === cat))
    .sort((a, b) => a.expense_date.localeCompare(b.expense_date)), [expenses, from, to, cat])

  // Build {headers, data, totals} for the selected report. Headers are {label, num}.
  const report = useMemo(() => {
    const total = sum(rows)
    const pctOf = (v) => total ? `${Math.round((v / total) * 100)}%` : '0%'
    const summary = (keyFn, labelFn, extra = []) => {
      const m = groupSum(rows, keyFn); const counts = new Map()
      for (const r of rows) counts.set(keyFn(r), (counts.get(keyFn(r)) || 0) + 1)
      const data = [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => [labelFn(k), counts.get(k), fmtN(v), pctOf(v)])
      return { headers: [{ label: t('category') }, { label: t('entries'), num: true }, { label: t('amount'), num: true }, { label: '%', num: true }].map((h, i) => extra[i] ? { ...h, ...extra[i] } : h), data, totals: [t('total'), rows.length, fmtN(total), '100%'] }
    }
    switch (type) {
      case 'category': return summary(r => r.category_id, cname)
      case 'floor': return summary(r => r.floor, k => t('floor_' + k), [{ label: t('floor') }])
      case 'vendor': return summary(r => r.vendor || '—', k => k, [{ label: t('vendor') }])
      case 'user': return summary(r => r.created_by, uname, [{ label: t('addedBy') }])
      case 'monthly': {
        const m = groupSum(rows, r => monthKey(r.expense_date)); let run = 0
        const data = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => { run += v; return [monthLabel(k, months), rows.filter(r => monthKey(r.expense_date) === k).length, fmtN(v), fmtN(run)] })
        return { headers: [{ label: t('period') }, { label: t('entries'), num: true }, { label: t('amount'), num: true }, { label: t('total'), num: true }], data, totals: [t('total'), rows.length, fmtN(total), ''] }
      }
      case 'unpaid': {
        const u = rows.filter(r => !r.is_paid)
        return { headers: [{ label: t('date') }, { label: t('vendor') }, { label: t('description') }, { label: t('category') }, { label: t('dueDate') }, { label: t('amount'), num: true }],
          data: u.map(r => [formatDate(r.expense_date, months), r.vendor || '', r.description || '', cname(r.category_id), r.due_date ? formatDate(r.due_date, months) : '', fmtN(r.amount)]),
          totals: [t('total'), '', '', '', `${u.length}`, fmtN(sum(u))] }
      }
      case 'budget': {
        const m = groupSum(rows, r => r.category_id)
        const data = categories.map(c => { const b = Number(budgets.find(x => x.category_id === c.id)?.amount) || 0; const v = m.get(c.id) || 0; return [name(c), fmtN(b), fmtN(v), fmtN(b - v), b ? `${Math.round((v / b) * 100)}%` : '—'] }).filter(r => r[1] !== '0' || r[2] !== '0')
        const tb = budgets.reduce((a, b) => a + Number(b.amount), 0)
        return { headers: [{ label: t('category') }, { label: t('budget'), num: true }, { label: t('totalSpent'), num: true }, { label: t('remaining'), num: true }, { label: '%', num: true }], data, totals: [t('total'), fmtN(tb), fmtN(total), fmtN(tb - total), tb ? `${Math.round((total / tb) * 100)}%` : '—'] }
      }
      default: return {
        headers: [{ label: t('date') }, { label: t('category') }, { label: t('description') }, { label: t('vendor') }, { label: t('floor') }, { label: t('quantity'), num: true }, { label: t('paymentMode') }, { label: t('paid') }, { label: t('addedBy') }, { label: t('amount'), num: true }],
        data: rows.map(r => [formatDate(r.expense_date, months), cname(r.category_id), r.description || '', r.vendor || '', t('floor_' + r.floor), r.quantity ? `${r.quantity} ${r.unit || ''}` : '', t('pm_' + r.payment_mode), r.is_paid ? t('yes') : t('no'), uname(r.created_by), fmtN(r.amount)]),
        totals: [t('total'), '', '', '', '', '', '', '', `${rows.length}`, fmtN(total)]
      }
    }
  }, [type, rows, categories, budgets, t, name, months, lang]) // eslint-disable-line

  const title = `${settings.project_name || t('appName')} — ${t('rpt_' + type)}`
  const periodTxt = `${t('period')}: ${from ? formatDate(from, months) : '…'} – ${to ? formatDate(to, months) : todayISO() && formatDate(todayISO(), months)}${cat ? ` · ${cname(cat)}` : ''}`
  const stamp = `${t('generatedOn')} ${formatDate(todayISO(), months)}`

  const excel = () => downloadExcel({ fileName: `KrishnasMahal_${type}_${todayISO()}`, sheets: [{ name: t('rpt_' + type).slice(0, 28), headers: report.headers.map(h => h.label), rows: [...report.data.map(r => r.map((c, i) => report.headers[i].num && /^[\d,]+$/.test(String(c)) ? Number(String(c).replace(/,/g, '')) : c)), report.totals.map((c, i) => report.headers[i].num && /^[\d,]+$/.test(String(c)) ? Number(String(c).replace(/,/g, '')) : c)] }] })
  const pdf = () => printReport({ title, subtitle: periodTxt, headers: report.headers, rows: report.data, totals: report.totals, footer: stamp })

  return (
    <>
      <TopBar title={t('reports')} back />
      <main className="page">
        <div className="chips scroll mb-3">{TYPES.map(k => <button key={k} className="chip" aria-pressed={type === k} onClick={() => setType(k)}>{t('rpt_' + k)}</button>)}</div>
        <div className="card">
          <div className="inline" style={{ alignItems: 'flex-start' }}>
            <Field label={t('fromDate')} id="rf"><input id="rf" type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></Field>
            <Field label={t('toDate')} id="rt"><input id="rt" type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></Field>
          </div>
          {type !== 'budget' && <Field label={t('category')} id="rc"><select id="rc" className="input" value={cat} onChange={e => setCat(e.target.value)}><option value="">{t('all')}</option>{categories.map(c => <option key={c.id} value={c.id}>{name(c)}</option>)}</select></Field>}
          <div className="flex">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={excel} disabled={!report.data.length}><FileSpreadsheet size={18} aria-hidden="true" />{t('downloadExcel')}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={pdf} disabled={!report.data.length}><Printer size={18} aria-hidden="true" />{t('downloadPdf')}</button>
          </div>
          <p className="small faint" style={{ margin: '8px 0 0' }}>{t('printHint')}</p>
        </div>

        <div className="card mt-3">
          <h3 className="card-title">{t('preview')} <span>{report.data.length} {t('rows')} · {formatINR(sum(rows))}</span></h3>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr>{report.headers.map((h, i) => <th key={i} className={h.num ? 'num' : ''}>{h.label}</th>)}</tr></thead>
            <tbody>{report.data.slice(0, 100).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={report.headers[j].num ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
            <tfoot><tr>{report.totals.map((c, i) => <td key={i} className={report.headers[i].num ? 'num' : ''}>{c}</td>)}</tr></tfoot>
          </table></div>
          {report.data.length > 100 && <p className="small faint center">… {report.data.length - 100} more in the file</p>}
        </div>
      </main>
    </>
  )
}
