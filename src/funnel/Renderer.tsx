import { createContext, useContext, type CSSProperties, type ComponentType, type ReactNode } from 'react'
import { useFunnel } from './state'
import { u } from './style'
import type { FunnelElement, HierarchyNode } from './types'
import { TextEl } from './elements/Text'
import { ContainerEl } from './elements/Container'
import { OptionsEl } from './elements/Options'
import { ButtonEl } from './elements/Button'
import { ImageEl } from './elements/Image'
import { TimerEl } from './elements/Timer'
import { ListEl } from './elements/List'
import { CarouselEl, CustomerCarouselEl } from './elements/Carousel'
import { ReviewsEl } from './elements/Reviews'
import { FaqEl } from './elements/Faq'
import { PopupEl } from './elements/Popup'
import { RawEl } from './elements/Raw'
import { LoaderEl } from './elements/Loader'
import { InputEl } from './elements/Input'
import { ProcessingEl } from './elements/Processing'
import { PlansEl, PlanEl } from './elements/Plans'
import { CheckoutEl } from './elements/Checkout'

export interface ElProps {
  el: FunnelElement
  children?: ReactNode
}

const registry: Record<string, ComponentType<ElProps>> = {
  Text: TextEl,
  Container: ContainerEl,
  Options: OptionsEl,
  Button: ButtonEl,
  Image: ImageEl,
  Timer: TimerEl,
  List: ListEl,
  Carousel: CarouselEl,
  CustomerCarousel: CustomerCarouselEl,
  Reviews: ReviewsEl,
  FAQ: FaqEl,
  Popup: PopupEl,
  Raw: RawEl,
  Loader: LoaderEl,
  Input: InputEl,
  Processing: ProcessingEl,
  Plans: PlansEl,
  Plan: PlanEl,
  Checkout: CheckoutEl,
}

const ElementMap = createContext<Record<string, FunnelElement>>({})

/**
 * The source funnel ships one copy of currency-specific blocks (timer, CTA, plan) per currency
 * and shows only the matching one. We render a single variant, selectable via `?ff-variant=N`.
 */
const VARIANT = Number(new URLSearchParams(location.search).get('ff-variant') ?? 0)
const variantKey = (el: FunnelElement) =>
  el.type === 'Timer' || el.type === 'Plan' || el.type === 'Checkout'
    ? el.type
    : el.type === 'Button' && el.props.action?.type === 'scroll'
      ? 'ScrollButton'
      : null

function Shell({ el, children }: ElProps) {
  const { content, screen, answers, isVisible } = useFunnel()
  // A Continue button that starts hidden on a question screen appears once every required
  // Options block has an answer (screens driven by Loader/Processing reveal it via an action).
  const opts = screen.elements.filter((e) => e.type === 'Options')
  const revealOnAnswer =
    el.type === 'Button' &&
    el.visibility?.value === false &&
    el.props.action?.type === 'navigate' &&
    opts.length > 0 &&
    opts.every((o) => !o.props.required || answers[screen.slug]?.[o.id] != null)
  if (!revealOnAnswer && !isVisible(el.id, el.visibility?.value ?? true)) {
    // Popups manage their own presence (animation); everything else just unmounts.
    if (el.type !== 'Popup') return null
  }
  const Comp = registry[el.type]
  if (!Comp) return null
  const c = el.styles?.container ?? {}
  const t = content.theme.ui.theme
  const noSpacing = el.type === 'Popup' || el.type === 'Checkout'
  const style: CSSProperties = {
    marginTop: noSpacing ? undefined : (u(c.spacingTop) ?? u(t.element?.spacingTop)),
    marginBottom: noSpacing ? undefined : u(c.spacingBottom),
    marginLeft: noSpacing ? undefined : u(c.spacingHorizontal),
    marginRight: noSpacing ? undefined : u(c.spacingHorizontal),
  }
  const pos = c.position?.value
  const fixed = pos === 'fixed' || pos === 'sticky'
  if (fixed && el.type !== 'Popup') {
    Object.assign(style, {
      position: pos,
      top: u(c.top),
      // Fixed elements without an explicit edge pin to the bottom (e.g. the Continue button).
      bottom: u(c.bottom) ?? (pos === 'fixed' && c.top?.value == null ? 0 : undefined),
      left: 0,
      right: 0,
      zIndex: 20,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: u(c.marginHorizontal) ?? 0,
      marginRight: u(c.marginHorizontal) ?? 0,
    })
    if (pos === 'fixed') {
      // Bottom-docked action bar: scrim keeps scrolling content from colliding with the button.
      Object.assign(style, {
        maxWidth: 'var(--page-w)',
        margin: '0 auto',
        padding: `32px var(--pad-x) calc(${u(c.spacingBottom) ?? '16px'} + env(safe-area-inset-bottom))`,
        background: 'linear-gradient(to top, var(--bg) 62%, transparent)',
        pointerEvents: 'none',
      })
    }
  }
  return (
    <div data-el={el.id} data-type={el.type} data-custom={el.customId || undefined} data-fixed={fixed || undefined} style={style} className="ff-el">
      <Comp el={el}>{children}</Comp>
    </div>
  )
}

/** Renders hierarchy nodes to a flat, keyed array so layout elements can slot each child. */
function renderNodes(nodes: HierarchyNode[], map: Record<string, FunnelElement>): ReactNode[] {
  const seen: Record<string, number> = {}
  const out: ReactNode[] = []
  for (const n of nodes) {
    const el = map[n.id]
    if (!el) continue
    const vk = variantKey(el)
    if (vk) {
      const idx = (seen[vk] = (seen[vk] ?? -1) + 1)
      // Checkout: first method variant only; others: pick VARIANT.
      if (vk === 'Checkout' ? idx !== 0 : idx !== VARIANT) continue
    }
    out.push(
      <Shell key={el.id} el={el}>
        {n.children?.length ? renderNodes(n.children, map) : null}
      </Shell>,
    )
  }
  return out
}

export function RenderTree({ nodes }: { nodes: HierarchyNode[] }) {
  const map = useContext(ElementMap)
  return <>{renderNodes(nodes, map)}</>
}

export function ElementProvider({ elements, children }: { elements: FunnelElement[]; children: ReactNode }) {
  const map = Object.fromEntries(elements.map((e) => [e.id, e]))
  return <ElementMap.Provider value={map}>{children}</ElementMap.Provider>
}
