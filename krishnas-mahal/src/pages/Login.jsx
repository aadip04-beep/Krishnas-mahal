import { useState } from 'react'
import { Languages } from 'lucide-react'
import { useLang } from '../i18n'
import { useStore } from '../lib/store'
import { supabase, usernameToEmail } from '../lib/supabase'
import { Feather, Field } from '../components/ui'

export default function Login() {
  const { t, lang, setLang } = useLang()
  const { login, needsSetup, isConfigured } = useStore()
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [n, setN] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (needsSetup) {
        const un = u.trim().toLowerCase()
        if (!/^[a-z0-9_]{2,20}$/.test(un)) throw new Error(t('usernameRule'))
        if (p.length < 6) throw new Error(t('passwordMin'))
        const { error } = await supabase.auth.signUp({ email: usernameToEmail(un), password: p, options: { data: { username: un, display_name: n.trim() || un } } })
        if (error) throw error
      } else await login(u, p)
    } catch (ex) { setErr(needsSetup ? ex.message : t('loginError')) }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <Feather size={84} />
          <h1>{t('appName')}</h1>
          <p>{t('tagline')}</p>
        </div>
        {!isConfigured && <div className="card" style={{ borderColor: 'var(--danger)' }}><b>Setup needed:</b> add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see README).</div>}
        <form className="card" onSubmit={submit} noValidate>
          {needsSetup && <><h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{t('setupTitle')}</h2><p className="muted small" style={{ marginTop: 0 }}>{t('setupSub')}</p>
            <Field label={t('displayName')} id="n"><input id="n" className="input" value={n} onChange={e => setN(e.target.value)} autoComplete="name" /></Field></>}
          <Field label={t('username')} id="u">
            <input id="u" className="input" value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoCapitalize="none" inputMode="text" required />
          </Field>
          <Field label={t('password')} id="p" error={err}>
            <input id="p" className="input" type="password" value={p} onChange={e => setP(e.target.value)} autoComplete={needsSetup ? 'new-password' : 'current-password'} required />
          </Field>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !isConfigured}>{busy ? t('loggingIn') : needsSetup ? t('createAdmin') : t('loginBtn')}</button>
          {!needsSetup && <p className="small muted center" style={{ marginBottom: 0 }}>{t('loginHint')}</p>}
        </form>
        <div className="center mt-4">
          <button className="chip" onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} aria-label={t('language')}>
            <Languages size={16} aria-hidden="true" /> {lang === 'hi' ? 'English' : 'हिंदी'}
          </button>
        </div>
        <p className="blessing">{t('blessing')}</p>
      </div>
    </div>
  )
}
