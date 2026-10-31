/**
 * Payment boundary. The checkout UI calls `startPayment`; swap the body for the real WayForPay flow.
 *
 * WayForPay (https://wiki.wayforpay.com/) needs a server-side signature (HMAC_MD5 with the merchant
 * secret), so the browser must never hold the secret: create the invoice/signature on your backend,
 * then redirect to / open the returned pay URL (or use the widget with a server-signed payload).
 */
export interface PaymentRequest {
  planId: string
  email: string
  sessionId: string
  /** Display price, e.g. "£0.99" — real amounts must be decided server-side. */
  priceLabel: string
}

export type PaymentResult = { status: 'success' } | { status: 'failed'; reason: 'generic' | 'insufficient_funds' | 'invalid_card' }

const ENDPOINT = import.meta.env.VITE_WAYFORPAY_INVOICE_ENDPOINT as string | undefined

export async function startPayment(req: PaymentRequest): Promise<PaymentResult> {
  if (!ENDPOINT) {
    // Local mock: no backend configured, behave as if the payment succeeded.
    await new Promise((r) => setTimeout(r, 600))
    return { status: 'success' }
  }
  // Expected contract: POST {planId,email,sessionId} → { payUrl }. The success/return URL configured
  // on the backend should point back to /archetype-test-v9/ricbt1rj.
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) return { status: 'failed', reason: 'generic' }
  const { payUrl } = (await res.json()) as { payUrl: string }
  location.assign(payUrl)
  return new Promise<PaymentResult>(() => {})
}
