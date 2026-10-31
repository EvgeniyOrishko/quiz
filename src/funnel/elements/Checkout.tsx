import { useEffect, useState } from 'react'
import { startPayment } from '../payment'
import { useFunnel } from '../state'
import type { ElProps } from '../Renderer'

const PRODUCT_ID = 'archetype-report'

/**
 * Replaces the source funnel's card/wallet checkout with one CTA that opens WayForPay's hosted page.
 * Failure popups reuse the screen's own Popup elements; WayForPay returns users to
 * `/final_paywall?payment=failed`, which re-opens the first (generic) popup.
 */
export function CheckoutEl({ el }: ElProps) {
  const { screen, content, email, run, setVisible } = useFunnel()
  const [busy, setBusy] = useState(false)
  const card = (el.props.methods as any[]).find((m) => m.type === 'card') ?? el.props.methods[0]
  const cfg = card?.config ?? {}
  const success = el.props.providers?.primer?.config?.successAction
  const popups = screen.elements.filter((e) => e.type === 'Popup')
  const firstPopup = popups[0]?.id

  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('payment') !== 'failed' || !firstPopup) return
    setVisible(firstPopup, true)
    // Drop the flag so a reload does not re-open the popup.
    q.delete('payment')
    q.delete('order')
    history.replaceState(history.state, '', `${location.pathname}?${q}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPopup])

  const pay = async () => {
    setBusy(true)
    const r = await startPayment({ productId: PRODUCT_ID, email, locale: content.locale })
    if (r.status === 'redirecting') return // keep the button busy while the browser leaves the page
    setBusy(false)
    if (r.status === 'success') return run(success)
    if (firstPopup) setVisible(firstPopup, true)
  }

  return (
    <div className="ff-checkout">
      <button type="button" className="ff-button" onClick={pay} disabled={busy} aria-busy={busy}>
        {busy ? '…' : (cfg.buttonText ?? 'Продолжить')}
      </button>
      {cfg.footerText && <p className="ff-checkout-footer">🔒 {cfg.footerText}</p>}
    </div>
  )
}
