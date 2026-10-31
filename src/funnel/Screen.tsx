import { useFunnel } from './state'
import { ElementProvider, RenderTree } from './Renderer'
import { u } from './style'

function Header() {
  const { content, screen, back } = useFunnel()
  const h = screen.props.header
  const pb = content.theme.ui.components.progressBar
  const th = content.theme.ui.theme.progressBar ?? {}
  const show = h.back || h.progressBar || h.image
  if (!show) return null
  const first = content.order.indexOf(screen.slug) === 0
  const ratio = Math.min(1, (screen.index + 1) / (pb.total || 1))
  const segs = pb.segments || 1
  return (
    <header className="ff-header">
      <div className="ff-header-row">
        <div className="ff-header-side">
          {h.back && !first && (
            <button type="button" className="ff-back" onClick={back} aria-label="Назад">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={String(u(th.backColor))} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
        </div>
        <div className="ff-header-mid">
          {h.image && <img src={h.image} alt={h.alt ?? ''} style={{ height: u(th.logoSize) ?? 24 }} />}
          {h.title && <span className="ff-header-title">{h.title}</span>}
        </div>
        <div className="ff-header-side" />
      </div>
      {h.progressBar && (
        <div className="ff-progress" style={{ gap: u(th.gap) }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label="Прогресс">
          {Array.from({ length: segs }).map((_, i) => {
            const fill = Math.max(0, Math.min(1, ratio * segs - i))
            return (
              <div key={i} className="ff-seg" style={{ background: String(u(th.lineBgColor)), height: u(th.lineHeight) }}>
                <div style={{ width: `${fill * 100}%`, background: String(u(th.lineColor)) }} />
              </div>
            )
          })}
        </div>
      )}
    </header>
  )
}

export function ScreenView() {
  const { screen } = useFunnel()
  return (
    <ElementProvider elements={screen.elements}>
      <div className="ff-screen" data-screen={screen.slug} data-type={screen.props.type ?? 'default'}>
        <Header />
        <main className="ff-main" key={screen.slug}>
          <RenderTree nodes={screen.hierarchy.children ?? []} />
        </main>
      </div>
    </ElementProvider>
  )
}
