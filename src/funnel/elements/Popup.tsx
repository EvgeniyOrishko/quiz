import { useFunnel } from '../state'
import { boxStyle } from '../style'
import type { ElProps } from '../Renderer'

export function PopupEl({ el, children }: ElProps) {
  const { isVisible } = useFunnel()
  const open = isVisible(el.id, el.visibility?.value ?? true)
  if (!open) return null
  const c = el.styles?.container ?? {}
  const placement = c.placement ?? 'center'
  return (
    <div className={`ff-popup-overlay anim-${el.props.animation ?? 'fade'}`} role="dialog" aria-modal={!!el.props.modal}>
      <div
        className="ff-popup"
        style={{
          ...boxStyle(c),
          alignSelf: placement === 'bottom' ? 'flex-end' : placement === 'top' ? 'flex-start' : 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
