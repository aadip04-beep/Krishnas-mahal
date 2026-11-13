export const FLOORS = ['plot', 'ground', 'first', 'common']
export const PAYMENT_MODES = ['cash', 'upi', 'bank', 'cheque', 'credit']

// Indian number formatting: 12,34,567
export function formatINR(n, { compact = false } = {}) {
  const num = Number(n) || 0
  if (compact) {
    const abs = Math.abs(num)
    if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`
    if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`
    if (abs >= 1e3) return `₹${(num / 1e3).toFixed(1).replace(/\.?0+$/, '')} K`
  }
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(iso, months) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

export const monthKey = (iso) => iso.slice(0, 7)

export function monthLabel(key, months) {
  const [y, m] = key.split('-').map(Number)
  return `${months[m - 1]} ${String(y).slice(2)}`
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function groupSum(rows, keyFn) {
  const m = new Map()
  for (const r of rows) {
    const k = keyFn(r)
    m.set(k, (m.get(k) || 0) + Number(r.amount))
  }
  return m
}

export const sum = (rows) => rows.reduce((a, r) => a + Number(r.amount || 0), 0)

export function hourGreetingKey() {
  const h = new Date().getHours()
  return h < 12 ? 'greeting_m' : h < 17 ? 'greeting_a' : 'greeting_e'
}
