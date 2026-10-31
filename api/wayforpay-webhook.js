// Server-to-server payment-status callback (the `serviceUrl` of every order) — the only trustworthy
// source of "was this paid". Verifies the callback signature, runs fulfil() on Approved, and answers with
// the signed `accept` WayForPay expects (otherwise it keeps retrying).
import { callbackSignature, readRawBody, sign, signatureMatches } from "./_wayforpay.js";
import { fulfil } from "./_fulfil.js";

// JSON arrives with a urlencoded Content-Type (see parseBody in _wayforpay.js), so read the raw text.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET;
  if (!secret) {
    console.error("[wayforpay] WAYFORPAY_MERCHANT_SECRET is not set");
    return res.status(500).json({ error: "payments are not configured" });
  }
  if (req.method !== "POST") return res.status(405).end();

  let body;
  try {
    body = JSON.parse(await readRawBody(req));
  } catch (err) {
    console.error("[wayforpay] webhook body was not valid JSON", err);
    return res.status(400).json({ error: "invalid body" });
  }
  if (!body.orderReference || !body.merchantSignature) {
    return res.status(400).json({ error: "missing orderReference/merchantSignature" });
  }
  // Never fulfil on an unverifiable callback — this check is the whole point of the endpoint.
  if (!signatureMatches(callbackSignature(secret, body), body.merchantSignature)) {
    console.error("[wayforpay] webhook signature mismatch for order", body.orderReference);
    return res.status(400).json({ error: "signature mismatch" });
  }

  if (body.transactionStatus === "Approved") {
    await fulfil({ orderReference: body.orderReference, amount: body.amount, currency: body.currency, email: body.email, phone: body.phone });
  } else {
    console.log("[wayforpay] non-approved callback:", body.orderReference, body.transactionStatus);
  }

  const time = String(Math.floor(Date.now() / 1000));
  res.status(200).json({
    orderReference: body.orderReference,
    status: "accept",
    time: Number(time),
    signature: sign(secret, [body.orderReference, "accept", time]),
  });
}
