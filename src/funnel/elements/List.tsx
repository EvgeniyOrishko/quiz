import { u } from '../style'
import type { ElProps } from '../Renderer'

export function ListEl({ el }: ElProps) {
  const s = el.styles ?? {}
  const c = s.container ?? {}
  return (
    <ul className="ff-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', rowGap: u(c.rowGap) ?? 12, columnGap: u(c.columnGap) }}>
      {(el.props.items as any[]).map((it) => (
        <li key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <span style={{ fontSize: u(s.markerText?.fontSize), color: u(s.markerText?.color) }}>
            {it.marker?.type === 'image' ? (
              <img src={it.marker.value} alt="" style={{ width: u(s.markerImage?.width) ?? 20 }} />
            ) : (
              it.marker?.value
            )}
          </span>
          <span
            style={{
              color: u(s.value?.color),
              fontSize: u(s.value?.fontSize),
              fontWeight: u(s.value?.fontWeight) as any,
              lineHeight: u(s.value?.lineHeight),
              textAlign: (s.value?.textAlign?.value ?? 'left') as any,
            }}
          >
            {it.text}
          </span>
        </li>
      ))}
    </ul>
  )
}
