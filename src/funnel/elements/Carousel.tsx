import { Children, useEffect, useRef } from 'react'
import { u } from '../style'
import type { ElProps } from '../Renderer'

/** Scroll-snap carousel with optional autoplay; children are the slides. */
export function CarouselEl({ el, children }: ElProps) {
  const ref = useRef<HTMLDivElement>(null)
  const slides = Children.toArray(children)
  const size = Number(el.styles?.slide?.size?.value ?? 100)
  const gap = u(el.styles?.slide?.spacing) ?? '10px'
  const sec = Number(el.props.durationSec?.value ?? 3)

  useEffect(() => {
    if (!el.props.autoplay || !ref.current) return
    const node = ref.current
    const id = setInterval(() => {
      const step = node.clientWidth * (size / 100)
      const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 4
      if (end && el.props.loop) node.scrollTo({ left: 0, behavior: 'smooth' })
      else node.scrollBy({ left: step, behavior: 'smooth' })
    }, sec * 1000)
    return () => clearInterval(id)
  }, [el.props.autoplay, el.props.loop, sec, size])

  return (
    <div ref={ref} className="ff-carousel" style={{ display: 'flex', gap, overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
      {slides.map((s, i) => (
        <div key={i} style={{ flex: `0 0 ${size}%`, scrollSnapAlign: 'start' }}>
          {s}
        </div>
      ))}
    </div>
  )
}

/** Scrolling ticker of masked customer e-mails ("social proof"). */
export function CustomerCarouselEl({ el }: ElProps) {
  const s = el.styles ?? {}
  const items: { text: string }[] = el.props.customers ?? []
  return (
    <div className="ff-ticker" style={{ overflow: 'hidden', padding: `${u(s.container?.paddingVertical) ?? 5}px 0` }}>
      <div className="ff-ticker-track" style={{ display: 'flex', gap: u(s.container?.gap) ?? 8, width: 'max-content' }}>
        {[...items, ...items].map((c, i) => (
          <span
            key={i}
            style={{ background: u(s.item?.backgroundColor) as any, padding: '6px 12px', borderRadius: 999, fontSize: 14, whiteSpace: 'nowrap' }}
          >
            {c.text}
          </span>
        ))}
      </div>
    </div>
  )
}
