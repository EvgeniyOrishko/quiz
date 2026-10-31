import { useState } from 'react'
import { startPayment } from '../payment'
import { useFunnel } from '../state'
import type { ElProps } from '../Renderer'

/**
 * Replaces the source funnel's Primer/Stripe checkout. Renders one card-style CTA; the actual
 * charge is delegated to `startPayment` (WayForPay). Failure popups reuse the screen's own Popup
 * elements, in the order generic → insufficient funds → invalid card.
 */
export function CheckoutEl({ el }: ElProps) {
  const { screen, email, sessionId, run, setVisible } = useFunnel()
  const [busy, setBusy] = useState(false)
  const card = (el.props.methods as any[]).find((m) => m.type === 'card') ?? el.props.methods[0]
  const cfg = card?.config ?? {}
  const success = el.props.providers?.primer?.config?.successAction
  const popups = screen.elements.filter((e) => e.type === 'Popup')

  const pay = async () => {
    setBusy(true)
    const r = await startPayment({ planId: el.id, email, sessionId, priceLabel: '' })
    setBusy(false)
    if (r.status === 'success') return run(success)
    const i = { generic: 0, insufficient_funds: 1, invalid_card: 2 }[r.reason]
    const pop = popups[i] ?? popups[0]
    if (pop) setVisible(pop.id, true)
  }

  return (
    <div className="ff-checkout">
      <button type="button" className="ff-button" onClick={pay} disabled={busy}>
        {busy ? '…' : (cfg.buttonText ?? 'Продолжить')}
      </button>
      {cfg.footerText && <p className="ff-checkout-footer">🔒 {cfg.footerText}</p>}
    </div>
  )
}
