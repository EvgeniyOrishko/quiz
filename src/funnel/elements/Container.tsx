import { Children, type CSSProperties } from 'react'
import { boxStyle, u } from '../style'
import type { ElProps } from '../Renderer'

const ALIGN: Record<string, string> = { start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch' }

export function ContainerEl({ el, children }: ElProps) {
  const c = el.styles?.container ?? {}
  const horizontal = el.props.orientation === 'horizontal'
  const h = ALIGN[c.hAlign?.value] ?? 'stretch'
  const v = ALIGN[c.vAlign?.value] ?? 'stretch'
  const sizes: number[] | undefined = Array.isArray(c.columnSizes) ? c.columnSizes : undefined
  const kids = Children.toArray(children)
  const base: CSSProperties = { gap: u(c.gap), ...boxStyle(c) }
  // columnSizes behave like `fr` tracks: proportional, but never narrower than their content.
  const style: CSSProperties =
    sizes && horizontal
      ? { ...base, display: 'grid', gridTemplateColumns: sizes.map((n) => `${n}fr`).join(' '), alignItems: v, justifyItems: 'stretch' }
      : {
          ...base,
          display: 'flex',
          flexDirection: horizontal ? 'row' : 'column',
          // Main axis ↔ hAlign for rows, vAlign for columns (matches the source layout engine).
          justifyContent: horizontal ? h : v,
          alignItems: horizontal ? v : h,
        }
  return (
    <div className="ff-container" style={style}>
      {kids}
    </div>
  )
}
