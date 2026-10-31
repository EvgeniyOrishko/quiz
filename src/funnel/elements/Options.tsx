import { useFunnel } from '../state'
import { font, u } from '../style'
import type { ElProps } from '../Renderer'

interface Opt {
  id: string
  text: string
  value: string
  image?: { type: string; url?: string }
}

export function OptionsEl({ el }: ElProps) {
  const { content, screen, answers, setAnswer, run, hasContinueButton } = useFunnel()
  const p = el.props
  const th = content.theme.ui.theme.option ?? {}
  const o = { ...th, ...(el.styles?.option ?? {}) }
  const c = el.styles?.container ?? {}
  const byId = Object.fromEntries((p.options as Opt[]).map((x) => [x.id, x]))
  const list: Opt[] = (p.displayOrder as string[] | undefined)?.map((id) => byId[id]).filter(Boolean) ?? p.options
  const columns: number = p.columns ?? c.columns?.value ?? 1
  const current = answers[screen.slug]?.[el.id]
  const isOn = (v: string) => (p.multi ? Array.isArray(current) && current.includes(v) : current === v)

  const pick = (v: string) => {
    if (p.multi) {
      const arr = Array.isArray(current) ? (current as string[]) : []
      setAnswer(el.id, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
      return
    }
    setAnswer(el.id, v)
    const a = p.action
    // With an explicit Continue button the choice only records; otherwise the action fires on tap.
    if (a && !(a.type === 'navigate' && hasContinueButton)) setTimeout(() => run(a), 220)
  }

  return (
    <div
      className="ff-options"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: u(c.horizontalGap) ?? u(c.gap) ?? u(th.gap),
        rowGap: u(c.verticalGap) ?? u(c.gap) ?? u(th.gap),
      }}
    >
      {list.map((opt) => {
        const on = isOn(opt.value)
        const img = opt.image?.type && opt.image.type !== 'none' ? opt.image.url : undefined
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={on}
            className={`ff-option${on ? ' is-on' : ''}`}
            onClick={() => pick(opt.value)}
            style={{
              minHeight: u(o.height),
              width: u(o.width),
              color: on ? u(o.activeTextColor) : u(o.color),
              backgroundColor: on ? u(o.activeBgColor) : u(o.backgroundColor),
              borderColor: on ? u(o.activeBorderColor) : u(o.borderColor),
              borderWidth: u(o.borderWidth),
              borderStyle: 'solid',
              borderRadius: u(o.borderRadius),
              fontFamily: font(o.fontFamily),
              fontSize: u(o.fontSize),
              fontWeight: u(o.fontWeight) as any,
              justifyContent: o.align?.value === 'center' ? 'center' : 'flex-start',
              textAlign: (o.align?.value ?? 'left') as any,
              gap: u(th.gap),
              paddingLeft: parseFloat(u(o.paddingHorizontal)) || 16,
              paddingRight: parseFloat(u(o.paddingHorizontal)) || 16,
            }}
          >
            {img && <img src={img} alt="" className="ff-option-img" />}
            <span>{opt.text}</span>
          </button>
        )
      })}
    </div>
  )
}
