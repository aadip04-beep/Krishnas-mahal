import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { STRINGS } from './strings'

const LangCtx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('km_lang') || 'hi')
  useEffect(() => {
    localStorage.setItem('km_lang', lang)
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo(() => {
    const dict = STRINGS[lang] || STRINGS.en
    const t = (key) => dict[key] ?? STRINGS.en[key] ?? key
    // picks name_en / name_hi style field from a row
    const name = (row, base = 'name') => (row ? (lang === 'hi' ? row[`${base}_hi`] || row[`${base}_en`] : row[`${base}_en`] || row[`${base}_hi`]) : '')
    return { lang, setLang, t, name }
  }, [lang])
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
