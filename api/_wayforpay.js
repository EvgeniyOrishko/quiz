// Shared helpers for the WayForPay serverless functions (files starting with "_" are not routed by Vercel).
// Protocol reference: https://wiki.wayforpay.com/en/view/852102
import { createHmac, timingSafeEqual } from "node:crypto";

export const FUNNEL_BASE = "/archetype-test-v9";
export const CHECKOUT_URL = "https://secure.wayforpay.com/pay";

/** WayForPay checkout page languages, keyed by funnel locale. Anything else falls back to EN. */
const PAGE_LANGUAGE = { uk: "UA", ru: "RU", en: "EN" };
const KNOWN_LOCALES = new Set(["ru", "en", "es", "de", "pl", "fr", "uk", "pt"]);

export const pageLanguage = (locale) => PAGE_LANGUAGE[locale] ?? "EN";
export const safeLocale = (locale) => (KNOWN_LOCALES.has(locale) ? locale : "ru");

/** HMAC-MD5 over the `;`-joined fields — the signature scheme WayForPay mandates. */
export function sign(secret, fields) {
  return createHmac("md5", secret).update(fields.join(";"), "utf8").digest("hex");
}

/** Field order of the signature on payment-status callbacks (webhook and browser return). */
export function callbackSignature(secret, b) {
  return sign(secret, [
    b.merchantAccount,
    b.orderReference,
    b.amount,
    b.currency,
    b.authCode || "",
    b.cardPan || "",
    b.transactionStatus,
    b.reasonCode,
  ]);
}

export function signatureMatches(expected, received) {
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(received ?? ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function originOf(req) {
  const host = req.headers.host || "localhost";
  return { host: host.split(":")[0], origin: `${req.headers["x-forwarded-proto"] || "https"}://${host}` };
}

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Minimal text-only multipart/form-data reader: WayForPay's fields are plain strings, never files.
function parseMultipart(raw, boundary) {
  const fields = {};
  for (const part of raw.split(`--${boundary}`)) {
    const trimmed = part.trim();
    if (!trimmed || trimmed === "--") continue;
    const m = /Content-Disposition:\s*form-data;\s*name="([^"]+)"\s*\r?\n\r?\n([\s\S]*)/i.exec(trimmed);
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

/**
 * Body parsing is manual on purpose (`bodyParser: false` in each function's config):
 *  - the browser return is a real multipart/form-data POST, which Vercel's default parser skips;
 *  - the server-to-server callback is JSON mislabelled as application/x-www-form-urlencoded, which the
 *    default parser mangles into one bogus key. Parsing the raw text ourselves works for every shape.
 */
export function parseBody(raw, contentType = "") {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (contentType.includes("multipart/form-data") && boundary) {
    return parseMultipart(raw, (boundary[1] || boundary[2]).trim());
  }
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}
