import { useEffect, useState } from 'react'
import { useFunnel } from '../state'
import { u } from '../style'
import type { ElProps } from '../Renderer'

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

export function InputEl({ el }: ElProps) {
  const { email, setEmail, content } = useFunnel()
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    const f = () => setTouched(true)
    window.addEventListener('ff-touch', f)
    return () => window.removeEventListener('ff-touch', f)
  }, [])
  const o = { ...(content.theme.ui.theme.input ?? {}), ...(el.styles?.input ?? {}) }
  const invalid = touched && el.props.validate && !isEmail(email)
  return (
    <div>
      <input
        className="ff-input"
        type={el.props.type ?? 'text'}
        inputMode={el.props.type === 'email' ? 'email' : undefined}
        autoComplete={el.props.type === 'email' ? 'email' : undefined}
        placeholder={el.props.placeholder}
        value={email}
        onBlur={() => setTouched(true)}
        onChange={(e) => {
          let v = e.target.value
          if (el.props.transform === 'lowercase') v = v.toLowerCase()
          setEmail(v.trim())
        }}
        style={{
          width: u(o.width),
          height: u(o.height),
          color: invalid ? u(o.invalidColor) : u(o.color),
          backgroundColor: u(o.backgroundColor) as any,
          border: `${u(o.borderWidth)} solid ${invalid ? u(o.invalidBorderColor) : u(o.borderColor)}`,
          borderRadius: u(o.borderRadius),
          fontSize: u(o.fontSize),
          fontWeight: u(o.fontWeight) as any,
          padding: `${u(o.paddingVertical)} ${u(o.paddingHorizontal)}`,
        }}
      />
      {invalid && <div className="ff-error">Введите корректный email</div>}
    </div>
  )
}
