import { useEffect, useRef, useState } from 'react'
import { useFunnel } from '../state'
import { u } from '../style'
import type { ElProps } from '../Renderer'

interface Step {
  label: string
  doneText: string
  duration: { value: number }
  progressAction?: any
}

/**
 * Sequential progress bars. At the midpoint of a step its `progressAction` fires (a popup with a
 * question); the bar waits until that popup is dismissed again, then continues. When the last step
 * completes the element's own action runs.
 */
export function ProcessingEl({ el }: ElProps) {
  const { run, vis, content, screen } = useFunnel()
  const steps: Step[] = el.props.loaders ?? []
  const [idx, setIdx] = useState(0)
  const [pct, setPct] = useState<number[]>(() => steps.map(() => 0))
  const shownFor = useRef<number | null>(null)
  // Only steps whose target element really exists pause the bar (the source data has a dangling id).
  const popupId = (i: number): string | undefined => {
    const id: string | undefined = steps[i]?.progressAction?.payload?.value?.elementId
    return id && screen.elements.some((e) => e.id === id) ? id : undefined
  }
  const waiting = shownFor.current === idx && !!popupId(idx) && vis[popupId(idx)!] === true

  const l = el.styles?.loaders ?? {}
  const t = el.styles?.text ?? {}
  const th = content.theme.ui.theme.progressBar

  useEffect(() => {
    if (idx >= steps.length) return run(el.props.action)
    if (waiting) return
    const dur = Number(steps[idx].duration?.value ?? 2) * 1000
    const t0 = performance.now() - (pct[idx] ?? 0) * dur
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      setPct((a) => a.map((v, i) => (i === idx ? p : v)))
      if (p >= 0.5 && shownFor.current !== idx && popupId(idx)) {
        shownFor.current = idx
        run(steps[idx].progressAction)
        return
      }
      if (p < 1) raf = requestAnimationFrame(tick)
      else setIdx((i) => i + 1)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, waiting])

  return (
    <div className="ff-processing" style={{ display: 'grid', gap: 20 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ opacity: i <= idx ? 1 : 0.35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: u(t.color), fontSize: u(t.fontSize), fontWeight: u(t.fontWeight) as any }}>
            <span>{s.label}</span>
            <span>{pct[i] >= 1 ? s.doneText : `${Math.round(pct[i] * 100)}%`}</span>
          </div>
          <div style={{ height: u(l.height) ?? 10, background: String(u(th?.lineBgColor) ?? '#eee'), borderRadius: u(l.borderRadius), marginTop: 8, overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct[i] * 100}%`,
                height: '100%',
                borderRadius: u(l.borderRadius),
                background: `linear-gradient(90deg, ${u(l.colorStart)}, ${u(l.colorEnd)})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
