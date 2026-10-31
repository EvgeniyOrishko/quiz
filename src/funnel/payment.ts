/**
 * Payment boundary — WayForPay hosted checkout.
 *
 * Flow: the browser asks `/api/wayforpay-sign` for a signed order (prices and the merchant secret stay on
 * the server), then POSTs a real <form> to WayForPay. WayForPay later redirects the browser to
 * `/api/wayforpay-return`, which 302s to `/ricbt1rj` (paid) or back to `/final_paywall?payment=failed`.
 * Access is granted only by the server-to-server webhook (`api/wayforpay-webhook.js` → `api/_fulfil.js`).
 */
const SIGN_ENDPOINT = '/api/wayforpay-sign'
const CHECKOUT_URL = 'https://secure.wayforpay.com/pay'

export interface PaymentRequest {
  /** Key of the server-side catalog in `api/wayforpay-sign.js`; the client never sends an amount. */
  productId: string
  email: string
  locale: string
}

export type PaymentResult =
  | { status: 'redirecting' } // the page is navigating to WayForPay
  | { status: 'success' } // local dev only: no /api available, behave as if paid
  | { status: 'failed'; reason: 'generic' }

export async function startPayment(req: PaymentRequest): Promise<PaymentResult> {
  let fields: Record<string, string>
  try {
    const res = await fetch(SIGN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(`sign endpoint responded ${res.status}`)
    fields = ((await res.json()) as { fields: Record<string, string> }).fields
    if (!fields) throw new Error('no fields in sign response')
  } catch (err) {
    // `vite dev` does not serve /api; keep the post-payment screens explorable locally.
    if (import.meta.env.DEV) {
      console.warn('[payment] /api unavailable in dev — simulating a successful payment', err)
      return { status: 'success' }
    }
    console.error('[payment] could not get a signed order', err)
    return { status: 'failed', reason: 'generic' }
  }

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = CHECKOUT_URL
  form.acceptCharset = 'utf-8'
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
  return { status: 'redirecting' }
}
