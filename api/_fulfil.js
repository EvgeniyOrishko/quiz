// Called by the webhook once WayForPay has confirmed (and signed) an Approved payment.
// This is the ONLY trustworthy "was it paid" signal — the browser return redirect is cosmetic.
//
// Plug your delivery here (create the account, unlock the report, send the e-mail, …). The webhook may
// be delivered more than once for the same order, so make this idempotent on `orderReference`.
export async function fulfil({ orderReference, amount, currency, email, phone }) {
  if (!email) {
    // WayForPay does not always return the e-mail (wallets may withhold it). The funnel passes the e-mail it
    // collected as `clientEmail`, which normally prefills it — but if it is missing, follow up by hand.
    console.error("[fulfil] approved order has no email — manual follow-up needed:", orderReference, amount, currency, phone || "(no phone)");
    return;
  }
  console.log("[fulfil] approved order", orderReference, amount, currency, email);
  // TODO: grant access / send the report here.
}
