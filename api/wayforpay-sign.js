// Builds one signed WayForPay "Purchase" order. Runs server-side: the merchant secret must never reach the
// browser, and prices live here so the client can only pick a product by id, never dictate an amount.
//
// Env (Vercel → Project Settings → Environment Variables; deliberately no sandbox fallbacks — WayForPay's
// public sandbox secret would let anyone forge a signed "paid" callback):
//   WAYFORPAY_MERCHANT_ACCOUNT, WAYFORPAY_MERCHANT_SECRET   required
//   WAYFORPAY_PRICE_REPORT                                  required, amount in WAYFORPAY_CURRENCY
//   WAYFORPAY_CURRENCY (default UAH), WAYFORPAY_PRODUCT_NAME (default "Archetype report")
import { FUNNEL_BASE, originOf, pageLanguage, safeLocale, sign } from "./_wayforpay.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function catalog() {
  return {
    "archetype-report": {
      name: process.env.WAYFORPAY_PRODUCT_NAME || "Archetype report",
      amount: Number(process.env.WAYFORPAY_PRICE_REPORT),
      currency: process.env.WAYFORPAY_CURRENCY || "UAH",
    },
  };
}

export default function handler(req, res) {
  const account = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET;
  if (!account || !secret) {
    console.error("[wayforpay] WAYFORPAY_MERCHANT_ACCOUNT / WAYFORPAY_MERCHANT_SECRET are not set");
    return res.status(500).json({ error: "payments are not configured" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { productId, email, locale } = req.body || {};
  const product = catalog()[productId];
  if (!product) return res.status(400).json({ error: "unknown productId" });
  if (!Number.isFinite(product.amount) || product.amount <= 0) {
    console.error("[wayforpay] WAYFORPAY_PRICE_REPORT is not set to a positive number");
    return res.status(500).json({ error: "price is not configured" });
  }

  const { host, origin } = originOf(req);
  const loc = safeLocale(locale);
  const amount = String(product.amount);
  const orderReference = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const orderDate = String(Math.floor(Date.now() / 1000));

  const merchantSignature = sign(secret, [account, host, orderReference, orderDate, amount, product.currency, product.name, "1", amount]);

  const fields = {
    merchantAccount: account,
    merchantAuthType: "SimpleSignature",
    merchantDomainName: host,
    merchantTransactionSecureType: "AUTO",
    merchantSignature,
    orderReference,
    orderDate,
    amount,
    currency: product.currency,
    "productName[]": product.name,
    "productPrice[]": amount,
    "productCount[]": "1",
    language: pageLanguage(loc),
    paymentSystems: "card;applePay;googlePay",
    returnUrl: `${origin}/api/wayforpay-return?locale=${loc}`,
    serviceUrl: `${origin}/api/wayforpay-webhook`,
  };
  // The funnel already collected the e-mail; prefilling it avoids the "paid order without e-mail" case.
  if (typeof email === "string" && EMAIL.test(email)) fields.clientEmail = email;

  res.status(200).json({ fields, funnel: FUNNEL_BASE });
}
