import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Content, FunnelAction, Screen } from './types'

const BASE = '/archetype-test-v9'

export interface FunnelCtx {
  content: Content
  screen: Screen
  answers: Record<string, Record<string, unknown>>
  email: string
  sessionId: string
  vis: Record<string, boolean>
  setAnswer: (elementId: string, value: unknown) => void
  setEmail: (email: string) => void
  setVisible: (elementId: string, visible: boolean) => void
  isVisible: (elementId: string, initial: boolean) => boolean
  navigate: (target?: string | null) => void
  back: () => void
  run: (action?: FunnelAction | null) => void
  interpolate: (s: string, extra?: Record<string, string>) => string
  hasContinueButton: boolean
}

const Ctx = createContext<FunnelCtx | null>(null)
export const useFunnel = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useFunnel outside provider')
  return c
}

const store = <T,>(key: string, init: T): T => {
  try {
    const v = sessionStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : init
  } catch {
    return init
  }
}

const slugFromPath = (path: string) => path.replace(BASE, '').replace(/^\/+|\/+$/g, '')
export const pathFor = (slug: string, locale: string) => `${BASE}/${slug}?ff-locale=${locale}`

export function FunnelProvider({ content, children }: { content: Content; children: ReactNode }) {
  const [slug, setSlug] = useState(() => slugFromPath(location.pathname) || content.order[0])
  const [answers, setAnswers] = useState<Record<string, Record<string, unknown>>>(() => store('ff-answers', {}))
  const [email, setEmailState] = useState<string>(() => store('ff-email', ''))
  const [sessionId] = useState<string>(() => {
    const id = store<string>('ff-session', '') || crypto.randomUUID()
    sessionStorage.setItem('ff-session', JSON.stringify(id))
    return id
  })
  const [vis, setVis] = useState<Record<string, boolean>>({})

  const screen = content.screens[slug] ?? content.screens[content.order[0]]

  useEffect(() => {
    const onPop = () => setSlug(slugFromPath(location.pathname) || content.order[0])
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [content])

  useEffect(() => {
    sessionStorage.setItem('ff-answers', JSON.stringify(answers))
  }, [answers])

  // Reset per-screen visibility overrides and scroll position on page change.
  useEffect(() => {
    setVis({})
    scrollTo(0, 0)
    document.title = content.theme.meta.title
  }, [screen.slug, content])

  const go = useCallback(
    (to: string) => {
      history.pushState({ ff: true }, '', pathFor(to, content.locale))
      setSlug(to)
    },
    [content.locale],
  )

  const navigate = useCallback(
    (target?: string | null) => {
      if (target) {
        const page = content.pages.find((p) => p.id === target || p.slug === target)
        if (page) return go(page.slug)
      }
      const i = content.order.indexOf(screen.slug)
      const next = content.order[i + 1]
      if (next) go(next)
    },
    [content, screen.slug, go],
  )

  const back = useCallback(() => {
    if (history.state?.ff) history.back()
    else {
      const i = content.order.indexOf(screen.slug)
      if (i > 0) go(content.order[i - 1])
    }
  }, [content, screen.slug, go])

  const setEmail = useCallback((v: string) => {
    setEmailState(v)
    sessionStorage.setItem('ff-email', JSON.stringify(v))
  }, [])

  const interpolate = useCallback(
    (s: string, extra: Record<string, string> = {}) => {
      const vars: Record<string, string> = {
        email,
        encodedEmail: encodeURIComponent(email),
        'user.session_id': sessionId,
        ...extra,
      }
      return s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => vars[k] ?? m)
    },
    [email, sessionId],
  )

  const run = useCallback(
    (action?: FunnelAction | null) => {
      if (!action) return
      const exec = () => {
        const v = action.payload?.value
        switch (action.type) {
          case 'navigate':
            navigate(typeof v === 'string' ? v : null)
            break
          case 'visibility':
            if (v?.elementId) setVis((o) => ({ ...o, [v.elementId]: v.value === 'visible' }))
            break
          case 'scroll':
            document.querySelector(`[data-el="${v?.elementId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            break
          case 'link':
            if (v?.href) window.open(interpolate(v.href), v.target ?? '_self')
            break
        }
      }
      action.delayMs ? setTimeout(exec, action.delayMs) : exec()
    },
    [navigate, interpolate],
  )

  const value = useMemo<FunnelCtx>(
    () => ({
      content,
      screen,
      answers,
      email,
      sessionId,
      vis,
      setAnswer: (elementId, v) => setAnswers((a) => ({ ...a, [screen.slug]: { ...a[screen.slug], [elementId]: v } })),
      setEmail,
      setVisible: (id, v) => setVis((o) => ({ ...o, [id]: v })),
      isVisible: (id, initial) => vis[id] ?? initial,
      navigate,
      back,
      run,
      interpolate,
      hasContinueButton: screen.elements.some((e) => e.type === 'Button' && e.props.action?.type === 'navigate'),
    }),
    [content, screen, answers, email, sessionId, vis, setEmail, navigate, back, run, interpolate],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
