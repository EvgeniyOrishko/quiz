import { u } from '../style'
import type { ElProps } from '../Renderer'

export function PlansEl({ el, children }: ElProps) {
  const gap = u(el.styles?.container?.gap)
  return (
    <div className="ff-plans" style={{ display: 'flex', flexDirection: 'column', gap }}>
      {children}
    </div>
  )
}

export function PlanEl({ el, children }: ElProps) {
  const p = el.props
  const pb = p.priceBlock ?? {}
  return (
    <div className="ff-plan" data-plan={el.id}>
      {p.badge && <div className="ff-plan-badge">{p.badge}</div>}
      <div className="ff-plan-body">
        {p.title && <div className="ff-plan-title">{p.title}</div>}
        {(pb.price || pb.oldPrice) && (
          <div className="ff-plan-price">
            {pb.oldPrice && <s>{pb.oldPrice}</s>}
            <strong>{pb.price}</strong>
            {pb.period && <span>/ {pb.period}</span>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
