import { useEffect, useState } from 'react'
import { useFunnel } from '../state'
import { boxStyle, font, u } from '../style'
import type { ElProps } from '../Renderer'

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function TimerEl({ el }: ElProps) {
  const { run, interpolate } = useFunnel()
  const total = Number(el.props.duration?.value ?? 0)
  const [left, setLeft] = useState(total)
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (left === 0 && el.props.completeAction) run(el.props.completeAction)
  }, [left, el.props.completeAction, run])

  const s = el.styles ?? {}
  const cd = `<span class="ff-countdown" style="color:${u(s.countdown?.color)};font-family:${font(s.countdown?.fontFamily)};font-size:${u(s.countdown?.fontSize)};font-weight:${u(s.countdown?.fontWeight)}">${mmss(left)}</span>`
  const html = interpolate(String(el.props.text ?? ''), { countdown: cd })
  return (
    <div className="ff-timer" style={{ ...boxStyle(s.container), textAlign: 'center', padding: '8px 12px' }}>
      <div
        style={{ color: u(s.text?.color) === '#000' ? '#000' : u(s.text?.color), fontSize: u(s.text?.fontSize) }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
