// Run: node --test tests/
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { Readable } from 'node:stream'
import { test } from 'node:test'

process.env.WAYFORPAY_MERCHANT_ACCOUNT = 'test_merch'
process.env.WAYFORPAY_MERCHANT_SECRET = 'test_secret'
process.env.WAYFORPAY_PRICE_REPORT = '99'

const md5 = (s) => createHmac('md5', 'test_secret').update(s, 'utf8').digest('hex')
const { default: signHandler } = await import('../api/wayforpay-sign.js')
const { default: returnHandler } = await import('../api/wayforpay-return.js')
const { default: webhookHandler } = await import('../api/wayforpay-webhook.js')

const res = () => {
  const r = { code: 200, body: undefined, headers: {} }
  r.status = (c) => ((r.code = c), r)
  r.json = (b) => ((r.body = b), r)
  r.end = () => r
  r.writeHead = (c, h) => ((r.code = c), (r.headers = h), r)
  return r
}
const post = (body, headers = {}, url = '/') => Object.assign(Readable.from([Buffer.from(body)]), { method: 'POST', url, headers: { host: 'quiz.test', ...headers } })

const approved = (over = {}) => {
  const b = { merchantAccount: 'test_merch', orderReference: 'o-1', amount: '99', currency: 'UAH', authCode: '123', cardPan: '41****11', transactionStatus: 'Approved', reasonCode: '1100', ...over }
  b.merchantSignature = md5([b.merchantAccount, b.orderReference, b.amount, b.currency, b.authCode, b.cardPan, b.transactionStatus, b.reasonCode].join(';'))
  return b
}

test('sign: signature covers fields in WayForPay order; amount comes from server catalog', () => {
  const r = res()
  signHandler({ method: 'POST', headers: { host: 'quiz.test' }, body: { productId: 'archetype-report', email: 'a@b.co', locale: 'uk', amount: '1' } }, r)
  const f = r.body.fields
  assert.equal(r.code, 200)
  assert.equal(f.amount, '99') // client-supplied amount is ignored
  assert.equal(f.language, 'UA')
  assert.equal(f.clientEmail, 'a@b.co')
  assert.equal(f.returnUrl, 'https://quiz.test/api/wayforpay-return?locale=uk')
  const expected = md5(['test_merch', 'quiz.test', f.orderReference, f.orderDate, '99', 'UAH', 'Archetype report', '1', '99'].join(';'))
  assert.equal(f.merchantSignature, expected)
})

test('sign: rejects unknown product, bad e-mail is not forwarded, GET is refused', () => {
  let r = res()
  signHandler({ method: 'POST', headers: { host: 'x' }, body: { productId: 'nope' } }, r)
  assert.equal(r.code, 400)
  r = res()
  signHandler({ method: 'POST', headers: { host: 'x' }, body: { productId: 'archetype-report', email: 'not-an-email' } }, r)
  assert.equal('clientEmail' in r.body.fields, false)
  r = res()
  signHandler({ method: 'GET', headers: { host: 'x' } }, r)
  assert.equal(r.code, 405)
})

test('webhook: valid Approved callback is accepted with a signed answer', async () => {
  const r = res()
  await webhookHandler(post(JSON.stringify({ ...approved(), email: 'a@b.co' }), { 'content-type': 'application/x-www-form-urlencoded' }), r)
  assert.equal(r.code, 200)
  assert.equal(r.body.status, 'accept')
  assert.equal(r.body.signature, md5(['o-1', 'accept', String(r.body.time)].join(';')))
})

test('webhook: forged signature is rejected', async () => {
  const r = res()
  await webhookHandler(post(JSON.stringify({ ...approved(), merchantSignature: 'f'.repeat(32) })), r)
  assert.equal(r.code, 400)
})

test('return: multipart Approved -> /ricbt1rj; declined or forged -> paywall with payment=failed', async () => {
  const multipart = (b) => {
    const boundary = 'XYZ'
    const body = Object.entries(b).map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`).join('') + `--${boundary}--\r\n`
    return post(body, { 'content-type': `multipart/form-data; boundary=${boundary}` }, '/api/wayforpay-return?locale=ru')
  }
  let r = res()
  await returnHandler(multipart(approved()), r)
  assert.equal(r.code, 302)
  assert.match(r.headers.Location, /\/archetype-test-v9\/ricbt1rj\?ff-locale=ru&order=o-1$/)

  r = res()
  await returnHandler(multipart(approved({ transactionStatus: 'Declined', reasonCode: '1101' })), r)
  assert.match(r.headers.Location, /final_paywall\?ff-locale=ru&payment=failed&order=o-1$/)

  r = res()
  await returnHandler(multipart({ ...approved(), merchantSignature: 'bad' }), r)
  assert.match(r.headers.Location, /payment=failed/)

  r = res()
  await returnHandler({ method: 'GET', url: '/api/wayforpay-return', headers: { host: 'quiz.test' } }, r)
  assert.match(r.headers.Location, /\/archetype-test-v9\/welcome\?/)
})
