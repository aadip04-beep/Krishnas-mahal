import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { formatINR, formatDate } from '../lib/utils'
import { CatIcon } from './ui'

export default function ExpenseRow({ e, onClick }) {
  const { t, name } = useLang()
  const { categories, profiles } = useStore()
  const c = categories.find(x => x.id === e.category_id)
  const by = profiles.find(p => p.id === e.created_by)?.display_name
  const title = e.description || name(c) || '—'
  const meta = [name(c), e.vendor, t('floor_' + e.floor), by].filter(Boolean).join(' · ')
  return (
    <button className="exp" onClick={onClick} aria-label={`${title}, ${formatINR(e.amount)}`}>
      <span className="ic" style={{ background: c?.color || 'var(--secondary)' }}><CatIcon name={c?.icon} size={22} /></span>
      <span style={{ minWidth: 0 }}>
        <p className="t">{title}</p>
        <p className="m">{meta}</p>
      </span>
      <span className="amt num">{formatINR(e.amount)}
        {!e.is_paid ? <small className="badge warn">{t('unpaid')}</small> : <small>{formatDate(e.expense_date, t('months'))}</small>}
      </span>
    </button>
  )
}
