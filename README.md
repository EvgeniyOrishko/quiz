# Archetype quiz (Vite + React + TypeScript)

Data-driven funnel player. The funnel is a set of JSON screens; the renderer turns them into UI,
so replacing questions/texts/layout means editing JSON, not code.

```
npm install
npm run dev          # http://localhost:5173/archetype-test-v9/welcome?ff-locale=ru
npm run build
```

## Layout

```
src/funnel/
  content/<locale>/       order.json (screen order) · pages.json (id ↔ slug) · theme.json · screens/<slug>.json
  content.ts              loads a locale (import.meta.glob)
  state.tsx               answers, email, per-screen visibility, navigate/back, action runner
  Renderer.tsx            hierarchy → element registry (Text, Container, Options, Button, Image, …)
  elements/*.tsx          one component per element type
  Screen.tsx              header (back, logo, 4-segment progress) + body
  payment.ts              payment boundary (WayForPay) — currently a mock that always succeeds
public/assets/            images referenced by the screens
```

Routes: `/archetype-test-v9/<slug>?ff-locale=<locale>`. Add a language by adding `content/<locale>/`.

## Screen schema (short)

`elements[]` (flat, each `{id,type,props,styles,visibility?}`) + `hierarchy` (tree of ids). Actions:
`navigate` (`null` = next in `order.json`, string = page id), `visibility`, `scroll`, `link`.
`{{email}}`, `{{encodedEmail}}`, `{{user.session_id}}`, `{{countdown}}` are interpolated in texts/links.

Behaviours worth knowing: an Options block auto-advances on tap unless the screen has a Continue
button; a hidden Continue button appears once required Options are answered; `Processing` pauses at
50% of a step while its question popup is open; the paywall renders one currency variant
(`?ff-variant=0|1|2`).

## Payment (WayForPay)

`Checkout` calls `startPayment()` in `src/funnel/payment.ts`. Without `VITE_WAYFORPAY_INVOICE_ENDPOINT`
it resolves as success (so the post-payment screens `ricbt1rj → loader → accountcreation/login` can
be explored). WayForPay requires a server-side signature: implement the endpoint
(`POST {planId,email,sessionId} → {payUrl}`) and point the merchant return URL at
`/archetype-test-v9/ricbt1rj`.

## Not copied / to implement

- Third-party scripts of the source funnel (analytics, Stripe/Primer, subscription check, the
  "insights teaser" iframe widget) are not loaded. The teaser screen is skipped, like the source does
  when its widget is unavailable.
- `accountcreation`/`login` links still point at the source's external app; change them in the
  screen JSON.
- Texts, images and branding in `content/` and `public/assets/` come from the source site and are
  placeholders for the rework — replace them before publishing.
