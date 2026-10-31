// WayForPay sends the customer's browser back to `returnUrl` with a POST (multipart/form-data), which a
// static host cannot serve (HTTP 405). This function turns it into a 302 to a plain GET page of the funnel.
//
// It verifies the callback signature only to choose between the success and the retry page. That is NOT
// payment confirmation and grants nothing — fulfilment happens only in api/wayforpay-webhook.js. Worst case
// of a forged request: someone sees the "payment successful" screen without paying (cosmetic).
import { FUNNEL_BASE, callbackSignature, originOf, parseBody, readRawBody, safeLocale, signatureMatches } from "./_wayforpay.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const { origin } = originOf(req);
  const locale = safeLocale(new URL(req.url, origin).searchParams.get("locale"));
  const go = (slug, extra = {}) => {
    const q = new URLSearchParams({ "ff-locale": locale, ...extra });
    res.writeHead(302, { Location: `${origin}${FUNNEL_BASE}/${slug}?${q}` });
    res.end();
  };

  const secret = process.env.WAYFORPAY_MERCHANT_SECRET;
  let body = {};
  if (req.method === "POST") {
    try {
      body = parseBody(await readRawBody(req), req.headers["content-type"]);
    } catch (err) {
      console.error("[wayforpay] return body could not be parsed", err);
    }
  }
  // Nothing usable (someone opened the URL directly): send them back to the start.
  if (!body.orderReference || !body.merchantSignature || !secret) return go("welcome");

  if (!signatureMatches(callbackSignature(secret, body), body.merchantSignature)) {
    console.error("[wayforpay] return signature mismatch for order", body.orderReference);
    return go("final_paywall", { payment: "failed", order: body.orderReference });
  }
  if (body.transactionStatus === "Approved") return go("ricbt1rj", { order: body.orderReference });
  return go("final_paywall", { payment: "failed", order: body.orderReference });
}
