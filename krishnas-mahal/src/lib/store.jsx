import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, signupClient, usernameToEmail, isConfigured } from './supabase'
import { uid } from './utils'
import { demoSeed, DEMO_USERS } from './demo'

export const DEMO = !isConfigured

const Ctx = createContext(null)
const CACHE_KEY = 'km_cache_v1'
const QUEUE_KEY = 'km_queue_v1'

const readJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } }
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

const emptyData = { expenses: [], categories: [], budgets: [], milestones: [], settings: {}, profiles: [] }

export function StoreProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState(() => ({ ...emptyData, ...readJSON(CACHE_KEY, {}) }))
  const [queue, setQueue] = useState(() => readJSON(QUEUE_KEY, []))
  const [online, setOnline] = useState(navigator.onLine)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [toast, setToast] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const flushing = useRef(false)

  const notify = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, id: Date.now() })
  }, [])

  // ---------- auth ----------
  useEffect(() => {
    if (DEMO) { setSession({ user: { id: 'demo-admin' }, demo: true }); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Does any profile exist? (first-time setup screen)
  useEffect(() => {
    if (DEMO || session !== null) return
    // RLS blocks anonymous reads, so a public RPC tells us whether any user exists yet
    supabase.rpc('has_any_user').then(({ data, error }) => setNeedsSetup(!error && data === false))
  }, [session])

  const login = useCallback(async (username, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    if (DEMO) { localStorage.removeItem(CACHE_KEY); setData({ ...emptyData, ...demoSeed() }); notify('Demo mode: data reset'); return }
    await supabase.auth.signOut()
    setProfile(null)
    localStorage.removeItem(CACHE_KEY)
    setData(emptyData)
  }, [])

  const createUser = useCallback(async ({ username, password, displayName }) => {
    const u = String(username).trim().toLowerCase()
    if (!/^[a-z0-9_]{2,20}$/.test(u)) throw new Error('usernameRule')
    if (password.length < 6) throw new Error('passwordMin')
    if (DEMO) {
      setData(p => { const next = { ...p, profiles: [...p.profiles, { id: 'demo-' + u, username: u, display_name: displayName || u, role: 'member', is_active: true, created_at: new Date().toISOString() }] }; writeJSON(CACHE_KEY, next); return next })
      return
    }
    const { error } = await signupClient.auth.signUp({
      email: usernameToEmail(u), password,
      options: { data: { username: u, display_name: displayName || u } }
    })
    if (error) {
      if (/already|registered|exists/i.test(error.message)) throw new Error('userExists')
      throw error
    }
    await signupClient.auth.signOut().catch(() => {})
  }, [])

  // ---------- data loading ----------
  const loadAll = useCallback(async () => {
    if (!session) return
    if (DEMO) {
      setData(p => { const next = p.categories.length ? p : { ...emptyData, ...demoSeed() }; writeJSON(CACHE_KEY, next); setProfile(next.profiles.find(x => x.id === 'demo-admin') || DEMO_USERS[0]); return next })
      return
    }
    setSyncing(true)
    const [exp, cat, bud, ms, set, prof] = await Promise.all([
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }).order('created_at', { ascending: false }).limit(5000),
      supabase.from('categories').select('*').order('sort').order('created_at'),
      supabase.from('budgets').select('*'),
      supabase.from('milestones').select('*').order('sort'),
      supabase.from('settings').select('*'),
      supabase.from('profiles').select('*').order('created_at')
    ])
    const next = {
      expenses: exp.data ?? data.expenses,
      categories: cat.data ?? data.categories,
      budgets: bud.data ?? data.budgets,
      milestones: ms.data ?? data.milestones,
      settings: set.data ? Object.fromEntries(set.data.map(r => [r.key, r.value])) : data.settings,
      profiles: prof.data ?? data.profiles
    }
    setData(next)
    writeJSON(CACHE_KEY, next)
    const me = next.profiles.find(p => p.id === session.user.id)
    if (me) setProfile(me)
    setSyncing(false)
  }, [session]) // eslint-disable-line

  useEffect(() => { if (session) loadAll() }, [session, loadAll])

  // realtime: refetch the changed table (cheap for a family-sized dataset)
  useEffect(() => {
    if (!session || DEMO) return
    const ch = supabase.channel('km-live')
    for (const table of ['expenses', 'categories', 'milestones', 'budgets']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => loadAll())
    }
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session, loadAll])

  // ---------- online / offline queue ----------
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => { writeJSON(QUEUE_KEY, queue) }, [queue])

  const runOp = useCallback(async (op) => {
    if (DEMO) return
    const { table, type, payload, id } = op
    let res
    if (type === 'insert') res = await supabase.from(table).insert(payload)
    else if (type === 'update') res = await supabase.from(table).update(payload).eq('id', id)
    else if (type === 'delete') res = await supabase.from(table).delete().eq('id', id)
    else if (type === 'upsert') res = await supabase.from(table).upsert(payload)
    if (res?.error) throw res.error
  }, [])

  const flushQueue = useCallback(async () => {
    if (flushing.current || !online || !session || queue.length === 0) return
    flushing.current = true
    let remaining = [...queue]
    for (const op of queue) {
      try { await runOp(op); remaining = remaining.filter(o => o.opId !== op.opId) }
      catch (e) { if (!/fetch|network/i.test(String(e.message))) remaining = remaining.filter(o => o.opId !== op.opId); else break }
    }
    setQueue(remaining)
    flushing.current = false
    if (remaining.length === 0) loadAll()
  }, [online, session, queue, runOp, loadAll])

  useEffect(() => { flushQueue() }, [online, flushQueue])

  // mutate(): optimistic local update + server write (or queue if offline)
  const mutate = useCallback(async (op, localUpdater) => {
    setData(prev => { const next = localUpdater(prev); writeJSON(CACHE_KEY, next); return next })
    if (!online) { setQueue(q => [...q, { ...op, opId: uid() }]); return }
    try { await runOp(op) }
    catch (e) {
      if (/fetch|network/i.test(String(e.message))) setQueue(q => [...q, { ...op, opId: uid() }])
      else { notify(e.message, 'err'); loadAll() }
    }
  }, [online, runOp, notify, loadAll])

  // ---------- domain actions ----------
  const addExpense = useCallback(async (e) => {
    const row = { ...e, id: e.id || uid(), created_by: session.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    await mutate({ table: 'expenses', type: 'insert', payload: row }, p => ({ ...p, expenses: [row, ...p.expenses] }))
    return row
  }, [mutate, session])

  const updateExpense = useCallback(async (id, patch) => {
    await mutate({ table: 'expenses', type: 'update', id, payload: patch },
      p => ({ ...p, expenses: p.expenses.map(x => x.id === id ? { ...x, ...patch } : x) }))
  }, [mutate])

  const deleteExpense = useCallback(async (id) => {
    await mutate({ table: 'expenses', type: 'delete', id }, p => ({ ...p, expenses: p.expenses.filter(x => x.id !== id) }))
  }, [mutate])

  const addCategory = useCallback(async (c) => {
    const row = { id: uid(), icon: 'tag', color: '#0FA3A3', sort: 50, is_default: false, created_by: session.user.id, created_at: new Date().toISOString(), ...c }
    await mutate({ table: 'categories', type: 'insert', payload: row }, p => ({ ...p, categories: [...p.categories, row] }))
    return row
  }, [mutate, session])

  const updateCategory = useCallback(async (id, patch) => {
    await mutate({ table: 'categories', type: 'update', id, payload: patch },
      p => ({ ...p, categories: p.categories.map(x => x.id === id ? { ...x, ...patch } : x) }))
  }, [mutate])

  const deleteCategory = useCallback(async (id) => {
    await mutate({ table: 'categories', type: 'delete', id }, p => ({ ...p, categories: p.categories.filter(x => x.id !== id) }))
  }, [mutate])

  const setBudget = useCallback(async (category_id, amount) => {
    const row = { category_id, amount: Number(amount) || 0, updated_at: new Date().toISOString() }
    await mutate({ table: 'budgets', type: 'upsert', payload: row },
      p => ({ ...p, budgets: [...p.budgets.filter(b => b.category_id !== category_id), row] }))
  }, [mutate])

  const setSetting = useCallback(async (key, value) => {
    await mutate({ table: 'settings', type: 'upsert', payload: { key, value: String(value), updated_at: new Date().toISOString() } },
      p => ({ ...p, settings: { ...p.settings, [key]: String(value) } }))
  }, [mutate])

  const updateMilestone = useCallback(async (id, patch) => {
    await mutate({ table: 'milestones', type: 'update', id, payload: patch },
      p => ({ ...p, milestones: p.milestones.map(x => x.id === id ? { ...x, ...patch } : x) }))
  }, [mutate])

  const addMilestone = useCallback(async (m) => {
    const row = { id: uid(), status: 'pending', floor: 'common', sort: 50, created_at: new Date().toISOString(), ...m }
    await mutate({ table: 'milestones', type: 'insert', payload: row }, p => ({ ...p, milestones: [...p.milestones, row] }))
  }, [mutate])

  const deleteMilestone = useCallback(async (id) => {
    await mutate({ table: 'milestones', type: 'delete', id }, p => ({ ...p, milestones: p.milestones.filter(x => x.id !== id) }))
  }, [mutate])

  const updateProfile = useCallback(async (id, patch) => {
    await mutate({ table: 'profiles', type: 'update', id, payload: patch },
      p => ({ ...p, profiles: p.profiles.map(x => x.id === id ? { ...x, ...patch } : x) }))
  }, [mutate])

  const changeMyPassword = useCallback(async (password) => {
    if (DEMO) return
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const uploadBill = useCallback(async (file) => {
    if (DEMO) return URL.createObjectURL(file)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${session.user.id}/${uid()}.${ext}`
    const { error } = await supabase.storage.from('bills').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    return supabase.storage.from('bills').getPublicUrl(path).data.publicUrl
  }, [session])

  const fetchActivity = useCallback(async () => {
    if (DEMO) return []
    const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200)
    return data ?? []
  }, [])

  const value = useMemo(() => ({
    isConfigured, demo: DEMO, session, profile, isAdmin: profile?.role === 'admin', needsSetup, online, queue, syncing, toast, notify,
    ...data, login, logout, createUser, loadAll,
    addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory, setBudget, setSetting,
    updateMilestone, addMilestone, deleteMilestone, updateProfile, changeMyPassword, uploadBill, fetchActivity
  }), [session, profile, needsSetup, online, queue, syncing, toast, notify, data, login, logout, createUser, loadAll,
    addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory, setBudget, setSetting,
    updateMilestone, addMilestone, deleteMilestone, updateProfile, changeMyPassword, uploadBill, fetchActivity])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
