import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Plus, Trash2 } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { FLOORS, PAYMENT_MODES, todayISO } from '../lib/utils'
import { Sheet, Field, CatIcon } from './ui'

const blank = () => ({ amount: '', category_id: '', expense_date: todayISO(), floor: 'common', description: '', vendor: '', payment_mode: 'cash', is_paid: true, due_date: '', quantity: '', unit: '', bill_url: '' })

export default function ExpenseForm({ open, onClose, initial }) {
  const { t, name, lang } = useLang()
  const { categories, addExpense, updateExpense, addCategory, uploadBill, notify, expenses } = useStore()
  const [f, setF] = useState(blank())
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [newCat, setNewCat] = useState(null) // null | ''
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const amountRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setErrs({}); setNewCat(null)
    setF(initial ? { ...blank(), ...initial, amount: String(initial.amount ?? ''), due_date: initial.due_date || '', quantity: initial.quantity ?? '', unit: initial.unit || '', vendor: initial.vendor || '', description: initial.description || '', bill_url: initial.bill_url || '' } : blank())
    setTimeout(() => amountRef.current?.focus(), 80)
  }, [open, initial])

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const vendors = useMemo(() => [...new Set(expenses.map(e => e.vendor).filter(Boolean))].slice(0, 50), [expenses])

  const validate = () => {
    const e = {}
    if (!(Number(f.amount) > 0)) e.amount = t('amountRequired')
    if (!f.category_id) e.category_id = t('categoryRequired')
    if (!f.expense_date) e.expense_date = t('required')
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setBusy(true)
    const row = {
      amount: Number(f.amount), category_id: f.category_id, expense_date: f.expense_date, floor: f.floor,
      description: f.description.trim() || null, vendor: f.vendor.trim() || null, payment_mode: f.payment_mode,
      is_paid: f.payment_mode === 'credit' ? false : f.is_paid, due_date: f.due_date || null,
      quantity: f.quantity === '' ? null : Number(f.quantity), unit: f.unit.trim() || null, bill_url: f.bill_url || null
    }
    try {
      if (initial?.id) await updateExpense(initial.id, row); else await addExpense(row)
      notify(t('saved'))
      onClose()
    } catch (e) { notify(e.message, 'err') }
    setBusy(false)
  }

  const createCategory = async () => {
    const n = (newCat || '').trim()
    if (!n) return
    const row = await addCategory({ name_en: n, name_hi: n })
    set('category_id', row.id); setNewCat(null); notify(t('categoryAdded'))
  }

  const onFile = async (ev) => {
    const file = ev.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { set('bill_url', await uploadBill(file)) } catch (e) { notify(e.message, 'err') }
    setUploading(false)
  }

  const unpaid = f.payment_mode === 'credit' || !f.is_paid

  return (
    <Sheet open={open} onClose={onClose} title={initial?.id ? t('editExpense') : t('addExpense')} footer={<>
      <button className="btn btn-ghost" onClick={onClose} disabled={busy}>{t('cancel')}</button>
      <button className="btn btn-primary" onClick={submit} disabled={busy || uploading}>{busy ? t('loading') : t('save')}</button>
    </>}>
      <Field label={t('amount')} id="amount" error={errs.amount}>
        <input ref={amountRef} id="amount" className="input input-amount" inputMode="decimal" type="number" min="0" step="1" placeholder="0" value={f.amount}
          onChange={e => set('amount', e.target.value)} onBlur={() => f.amount && validate()} aria-invalid={!!errs.amount} />
      </Field>

      <Field label={t('category')} error={errs.category_id}>
        <div className="cat-grid" role="radiogroup" aria-label={t('category')}>
          {categories.map(c => (
            <button type="button" key={c.id} className="cat-tile" role="radio" aria-checked={f.category_id === c.id} aria-pressed={f.category_id === c.id} onClick={() => set('category_id', c.id)}>
              <span className="ic" style={{ background: c.color }}><CatIcon name={c.icon} /></span>
              <span>{name(c)}</span>
            </button>
          ))}
          <button type="button" className="cat-tile add" onClick={() => setNewCat('')}>
            <span className="ic" style={{ background: 'transparent', border: '1.5px dashed currentColor', color: 'var(--secondary)' }}><Plus /></span>
            <span>{t('newCategory')}</span>
          </button>
        </div>
        {newCat !== null && (
          <div className="inline mt-2">
            <input className="input" placeholder={t('newCategoryPh')} value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && createCategory()} />
            <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 'none' }} onClick={createCategory}>{t('add')}</button>
          </div>
        )}
      </Field>

      <div className="inline" style={{ alignItems: 'flex-start' }}>
        <Field label={t('date')} id="date" error={errs.expense_date}>
          <input id="date" className="input" type="date" value={f.expense_date} max={todayISO()} onChange={e => set('expense_date', e.target.value)} />
        </Field>
        <Field label={t('floor')} id="floor">
          <select id="floor" className="input" value={f.floor} onChange={e => set('floor', e.target.value)}>
            {FLOORS.map(fl => <option key={fl} value={fl}>{t('floor_' + fl)}</option>)}
          </select>
        </Field>
      </div>

      <Field label={t('description')} id="desc">
        <input id="desc" className="input" placeholder={t('descPh')} value={f.description} onChange={e => set('description', e.target.value)} />
      </Field>

      <Field label={t('vendor')} id="vendor">
        <input id="vendor" className="input" list="vendor-list" placeholder={t('vendorPh')} value={f.vendor} onChange={e => set('vendor', e.target.value)} />
        <datalist id="vendor-list">{vendors.map(v => <option key={v} value={v} />)}</datalist>
      </Field>

      <div className="inline" style={{ alignItems: 'flex-start' }}>
        <Field label={t('quantity')} id="qty">
          <input id="qty" className="input" type="number" inputMode="decimal" min="0" value={f.quantity} onChange={e => set('quantity', e.target.value)} />
        </Field>
        <Field label={t('unit')} id="unit">
          <input id="unit" className="input" placeholder={t('unitPh')} value={f.unit} onChange={e => set('unit', e.target.value)} />
        </Field>
      </div>

      <Field label={t('paymentMode')}>
        <div className="chips">
          {PAYMENT_MODES.map(pm => (
            <button type="button" key={pm} className="chip" aria-pressed={f.payment_mode === pm} onClick={() => { set('payment_mode', pm); if (pm === 'credit') set('is_paid', false) }}>{t('pm_' + pm)}</button>
          ))}
        </div>
      </Field>

      <div className="chips mb-3">
        <button type="button" className="chip" aria-pressed={!unpaid} onClick={() => { set('is_paid', true); if (f.payment_mode === 'credit') set('payment_mode', 'cash') }}>{t('paid')}</button>
        <button type="button" className="chip" aria-pressed={unpaid} onClick={() => set('is_paid', false)}>{t('unpaid')}</button>
      </div>
      {unpaid && (
        <Field label={t('dueDate')} id="due">
          <input id="due" className="input" type="date" value={f.due_date} onChange={e => set('due_date', e.target.value)} />
        </Field>
      )}

      <Field label={t('billPhoto')}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} id="bill" />
        {f.bill_url ? (
          <div className="flex">
            <a href={f.bill_url} target="_blank" rel="noreferrer"><img src={f.bill_url} alt="Bill" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }} /></a>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => set('bill_url', '')}><Trash2 size={16} aria-hidden="true" />{t('removePhoto')}</button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Camera size={18} aria-hidden="true" />{uploading ? t('uploading') : t('takePhoto')}
          </button>
        )}
      </Field>
      <span className="sr-only" aria-live="polite">{lang}</span>
    </Sheet>
  )
}
