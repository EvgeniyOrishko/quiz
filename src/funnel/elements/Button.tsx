import { useEffect } from 'react'
import { useFunnel } from '../state'
import { font, u } from '../style'
import type { ElProps } from '../Renderer'

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

export function ButtonEl({ el }: ElProps) {
  const { content, screen, answers, email, run, interpolate } = useFunnel()
  const b = { ...(content.theme.ui.theme.button ?? {}), ...(el.styles?.button ?? {}) }
  const a = el.props.action
  const pending = screen.elements.some(
    (e) => e.type === 'Options' && e.props.required && answers[screen.slug]?.[e.id] == null,
  )
  const needsEmail = screen.elements.some((e) => e.type === 'Input' && e.props.type === 'email')
  const blocked = a?.type === 'navigate' && pending
  const pulse = b.effect === 'pulse'

  const click = () => {
    if (blocked) return
    if (a?.type === 'navigate' && needsEmail && !isEmail(email)) {
      window.dispatchEvent(new Event('ff-touch'))
      return
    }
    run(a)
  }

  // Pressing Enter in a form field submits via the screen's primary Continue button.
  useEffect(() => {
    if (a?.type !== 'navigate') return
    window.addEventListener('ff-submit', click)
    return () => window.removeEventListener('ff-submit', click)
  })

  return (
    <button
      type="button"
      className={`ff-button${pulse ? ' pulse' : ''}`}
      onClick={click}
      aria-disabled={blocked}
      style={
        {
          width: u(b.width),
          minHeight: u(b.height),
          color: u(b.color),
          backgroundColor: u(b.backgroundColor) as any,
          borderRadius: u(b.borderRadius),
          borderWidth: u(b.borderWidth),
          borderColor: u(b.borderColor) as any,
          borderStyle: u(b.borderWidth) ? 'solid' : 'none',
          fontFamily: font(b.fontFamily),
          fontSize: u(b.fontSize),
          fontWeight: u(b.fontWeight) as any,
          lineHeight: u(b.lineHeight),
          paddingTop: u(b.paddingVertical),
          paddingBottom: u(b.paddingVertical),
          textAlign: u(b.textAlign) as any,
          opacity: blocked ? 0.45 : 1,
          '--pulse-size': u(b.pulseShadowSize) ?? '8px',
          '--pulse-color': u(b.pulseShadowColor) ?? 'rgba(0,0,0,.25)',
          '--pulse-grow': `${(Number(b.pulseButtonGrow?.value) || 4) / 100 + 1}`,
        } as React.CSSProperties
      }
    >
      <span dangerouslySetInnerHTML={{ __html: interpolate(String(el.props.text ?? '')) }} />
    </button>
  )
}
