import { useState } from 'react'
import { u } from '../style'
import type { ElProps } from '../Renderer'

export function FaqEl({ el }: ElProps) {
  const s = el.styles ?? {}
  const items: { id: string; title: string; answer: string; open?: boolean }[] = el.props.items
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.id, !!i.open])))
  return (
    <div
      className="ff-faq"
      style={{
        background: u(s.container?.backgroundColor) as any,
        borderRadius: u(s.container?.borderRadius),
        padding: `${u(s.container?.paddingVertical) ?? 0} ${u(s.container?.paddingHorizontal) ?? 0}`,
      }}
    >
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            borderBottom: `${u(s.item?.borderWidth) ?? '1px'} solid ${u(s.item?.borderColor) ?? '#eee'}`,
            padding: `${u(s.item?.paddingVertical) ?? '12px'} 0`,
          }}
        >
          <button
            type="button"
            className="ff-faq-q"
            aria-expanded={!!open[it.id]}
            onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))}
            style={{ fontSize: u(s.question?.fontSize), textAlign: 'left' }}
          >
            <span>{it.title}</span>
            {el.props.showArrow && <span className={`ff-chevron${open[it.id] ? ' open' : ''}`}>⌄</span>}
          </button>
          {open[it.id] && (
            <div
              style={{
                marginTop: u(s.answer?.gap) ?? 8,
                color: u(s.answer?.color),
                fontSize: u(s.answer?.fontSize),
                textAlign: 'left',
              }}
            >
              {it.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
