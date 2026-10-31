import { u } from '../style'
import type { ElProps } from '../Renderer'

export function ImageEl({ el }: ElProps) {
  const i = el.styles?.image ?? {}
  const c = el.styles?.container ?? {}
  const w = u(i.width) ?? '100%'
  return (
    <div className="ff-image" style={{ display: 'flex', justifyContent: 'center', backgroundColor: u(c.backgroundColor) as any }}>
      <img
        src={el.props.url}
        alt={el.props.alt ?? ''}
        width={el.props.width}
        height={el.props.height}
        loading="lazy"
        style={{
          width: w,
          height: u(i.height) ?? 'auto',
          maxWidth: '100%',
          objectFit: (i.objectFit?.value ?? 'contain') as any,
          borderRadius: u(i.borderRadius),
          opacity: i.opacity?.value,
          display: 'block',
        }}
      />
    </div>
  )
}
