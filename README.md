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

Ported from the postpartum-yoga landing (`yoga-pregnancy-recover`) and adapted to the funnel.

```
Checkout CTA ─► POST /api/wayforpay-sign        server prices + HMAC-MD5 signature (secret never in the browser)
             ─► <form> POST → secure.wayforpay.com/pay
WayForPay    ─► POST /api/wayforpay-webhook     server-to-server result → verify signature → fulfil() → signed "accept"
             ─► POST /api/wayforpay-return      browser return → 302 /ricbt1rj (paid) or /final_paywall?payment=failed
```

- `src/funnel/payment.ts` – client: fetches the signed order, submits the form. The client sends only
  `productId`/`email`/`locale`; it can never set an amount. In `vite dev` (no `/api`) it simulates success.
- `api/wayforpay-sign.js` – product catalog and price live here. Prefills `clientEmail` with the e-mail from the funnel.
- `api/wayforpay-return.js` – turns WayForPay's multipart POST into a GET redirect. Cosmetic only, grants nothing.
- `api/wayforpay-webhook.js` – the only trustworthy "paid" signal; calls `api/_fulfil.js` (**TODO: plug delivery in**).
  Must be idempotent per `orderReference` – WayForPay may retry.
- `api/_wayforpay.js` – shared signing/parsing. Parsing is manual on purpose: the webhook is JSON labelled as
  urlencoded and the return is multipart, neither survives Vercel's default body parser.
- `tests/wayforpay.test.mjs` – `node --test tests/wayforpay.test.mjs` (signature order, forged callbacks, return routing).

Set in Vercel → Project Settings → Environment Variables (see `.env.example`); there are **no sandbox fallbacks** –
WayForPay's published sandbox secret would let anyone forge a "paid" callback:
`WAYFORPAY_MERCHANT_ACCOUNT`, `WAYFORPAY_MERCHANT_SECRET`, `WAYFORPAY_PRICE_REPORT` (required),
`WAYFORPAY_CURRENCY` (default `UAH`), `WAYFORPAY_PRODUCT_NAME`.

`vercel.json` rewrites everything except `/api/*` to the SPA. Prices shown on the paywall (JSON) are display-only –
keep them in sync with `WAYFORPAY_PRICE_REPORT`. Declines always show the generic failure popup (WayForPay reason
codes are not mapped to the "insufficient funds"/"invalid card" popups yet).

## Not copied / to implement

- Third-party scripts of the source funnel (analytics, Primer/Stripe checkout, subscription check, the
  "insights teaser" iframe widget) are not loaded. The teaser screen is skipped, like the source does
  when its widget is unavailable.
- `accountcreation`/`login` links still point at the source's external app; change them in the
  screen JSON.
- Texts, images and branding in `content/` and `public/assets/` come from the source site and are
  placeholders for the rework — replace them before publishing.
