import { useEffect, useRef } from 'react'
import { u } from '../style'
import type { ElProps } from '../Renderer'

interface Review {
  id: string
  author: string
  title: string
  text: string
}

export function ReviewsEl({ el }: ElProps) {
  const r = el.styles?.review ?? {}
  const list: Review[] = el.props.reviews ?? []
  const ref = useRef<HTMLDivElement>(null)
  const sec = Number(el.props.duration?.value ?? 3)

  useEffect(() => {
    const node = ref.current
    if (!node || el.props.type !== 'carousel') return
    const id = setInterval(() => {
      const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 4
      node.scrollTo({ left: end ? 0 : node.scrollLeft + node.clientWidth, behavior: 'smooth' })
    }, sec * 1000)
    return () => clearInterval(id)
  }, [el.props.type, sec])

  return (
    <div
      ref={ref}
      className="ff-reviews"
      style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory' }}
    >
      {list.map((x) => (
        <figure
          key={x.id}
          style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'start',
            margin: 0,
            padding: 16,
            boxSizing: 'border-box',
            background: u(r.backgroundColor) as any,
            borderRadius: u(r.borderRadius),
            textAlign: (r.textAlign?.value ?? 'left') as any,
          }}
        >
          <div className="ff-stars" aria-label="5 stars">★★★★★</div>
          <strong style={{ display: 'block', marginTop: 8 }}>{x.title}</strong>
          <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.5 }}>{x.text}</p>
          <figcaption style={{ fontSize: 13, opacity: 0.6 }}>{x.author}</figcaption>
        </figure>
      ))}
    </div>
  )
}
