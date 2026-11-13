import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LangProvider } from './i18n'
import { StoreProvider, useStore } from './lib/store'
import { BottomNav, Toast, Feather } from './components/ui'
import ExpenseForm from './components/ExpenseForm'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Stages from './pages/Stages'
import More from './pages/More'
const Reports = lazy(() => import('./pages/Reports'))
const Admin = lazy(() => import('./pages/Admin'))

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('km_theme') || 'system')
  useEffect(() => {
    localStorage.setItem('km_theme', theme)
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const mode = theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme
      document.documentElement.dataset.theme = mode
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', mode === 'light' ? '#FFF8EC' : '#0B1F3A')
    }
    apply(); mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  return [theme, setTheme]
}

function Splash() {
  return <div className="login-wrap"><div className="center"><Feather size={72} /><div className="skeleton mt-4" style={{ width: 160, height: 14, margin: '16px auto 0' }} /></div></div>
}

function Shell() {
  const { session, profile } = useStore()
  const [theme, setTheme] = useTheme()
  const [form, setForm] = useState({ open: false, initial: null })
  const loc = useLocation()
  const openAdd = useCallback(() => setForm({ open: true, initial: null }), [])
  const openEdit = useCallback((e) => setForm({ open: true, initial: e }), [])
  const openDup = useCallback((e) => { const { id, created_at, updated_at, created_by, ...rest } = e; setForm({ open: true, initial: { ...rest } }) }, [])
  const close = useCallback(() => setForm(f => ({ ...f, open: false })), [])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  if (session === undefined) return <Splash />
  if (!session) return <Login />
  if (profile && !profile.is_active) return <Login />

  return (
    <div className="app">
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/" element={<Dashboard onEdit={openEdit} />} />
          <Route path="/expenses" element={<Expenses onEdit={openEdit} onDuplicate={openDup} />} />
          <Route path="/stages" element={<Stages />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/more" element={<More theme={theme} setTheme={setTheme} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <BottomNav onAdd={openAdd} />
      <ExpenseForm open={form.open} onClose={close} initial={form.initial} />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <StoreProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </StoreProvider>
    </LangProvider>
  )
}
