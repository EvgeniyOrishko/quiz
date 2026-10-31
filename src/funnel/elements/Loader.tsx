import { useEffect, useRef, useState } from 'react'
import { useFunnel } from '../state'
import { u } from '../style'
import type { ElProps } from '../Renderer'

/** Circular progress that runs for `duration` seconds, then fires its action. */
export function LoaderEl({ el }: ElProps) {
  const { run, content } = useFunnel()
  const dur = Number(el.props.duration?.value ?? 5) * 1000
  const [pct, setPct] = useState(0)
  const fired = useRef(false)
  const th = content.theme.ui.theme.loader ?? {}
  const l = { ...th, ...(el.styles?.loader ?? {}) }

  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setPct(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else if (!fired.current) {
        fired.current = true
        run(el.props.action)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [dur, el.props.action, run])

  const R = 54
  const C = 2 * Math.PI * R
  const id = `lg-${el.id}`
  return (
    <div className="ff-loader" style={{ display: 'grid', placeItems: 'center' }}>
      <svg viewBox="0 0 120 120" width="160" height="160">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={String(u(l.colorStart))} />
            <stop offset="1" stopColor={String(u(l.colorEnd))} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={R} fill="none" stroke={String(u(l.colorBg))} strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 60 60)"
        />
        {el.props.showPercent && (
          <text x="60" y="68" textAnchor="middle" fontSize="24" fontWeight="700" fill="currentColor">
            {Math.round(pct * 100)}%
          </text>
        )}
      </svg>
    </div>
  )
}
