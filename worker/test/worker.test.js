import { beforeEach, describe, expect, it, vi } from 'vitest'

// worker-mailer opens TCP sockets through cloudflare:sockets, which only exists inside Workers.
const mailerSend = vi.fn()
vi.mock('worker-mailer', () => ({ WorkerMailer: { send: (...a) => mailerSend(...a) } }))
const { handle, clean } = await import('../src/index.js')

const NOW = Date.parse('2026-11-18T09:00:00Z')
const ORIGIN = 'https://investor.rotexai.com'

function kv() {
  const m = new Map()
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) }
}
function env(over = {}) {
  return {
    ALLOWED_ORIGINS: ORIGIN,
    MAIL_TO: 'inbox@example.test',
    MAIL_FROM: 'sender@example.test',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '465',
    SMTP_USER: 'sender@example.test',
    SMTP_PASS: 'not-a-real-value',
    TURNSTILE_SECRET: 'test-secret',
    COUNTS: kv(),
    LIMITER: { limit: async () => ({ success: true }) },
    ...over,
  }
}
const good = { name: 'Lan Pham', firm: 'Saigon Angels', email: 'lan@angels.vn', note: 'Hello', lang: 'vi', turnstile: 'tok', started: NOW - 10_000 }
const CF = { asn: 7552, asOrganization: 'Viettel Group', city: 'Ho Chi Minh City', region: 'Ho Chi Minh', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' }
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
function req(body = good, { origin = ORIGIN, method = 'POST', raw, cf = CF, ua = UA } = {}) {
  const r = new Request('https://contact.example.workers.dev/', {
    method,
    headers: { 'Content-Type': 'application/json', Origin: origin, 'CF-Connecting-IP': '203.0.113.7', 'CF-IPCountry': 'VN', 'User-Agent': ua },
    body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined,
  })
  // Node's Request has no request.cf; the Workers runtime fills it from Cloudflare's edge.
  Object.defineProperty(r, 'cf', { value: cf })
  return r
}
let verify, dns
beforeEach(() => {
  mailerSend.mockReset()
  verify = { success: true, hostname: 'investor.rotexai.com', challenge_ts: '2026-11-18T08:59:58Z' }
  dns = { Status: 0, Answer: [{ type: 15, data: '10 mx.angels.vn.' }] }
  vi.stubGlobal('fetch', vi.fn(async (url) => new Response(JSON.stringify(String(url).includes('dns-query') ? dns : verify))))
})
const run = (r, e = env()) => handle(r, e, { now: () => NOW })

describe('investor contact worker (spec 261118)', () => {
  it('R1, R8: a valid request sends one email to MAIL_TO with Reply-To the investor', async () => {
    const r = await run(req({ ...good, to: 'victim@example.com', mail_to: 'victim@example.com' }))
    expect(r.status).toBe(200)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(mailerSend).toHaveBeenCalledTimes(1)
    const [smtp, mail] = mailerSend.mock.calls[0]
    expect(smtp).toMatchObject({ host: 'smtp.example.test', port: 465, secure: true })
    expect(mail.to).toEqual({ email: 'inbox@example.test' })
    expect(mail.reply).toEqual({ name: 'Lan Pham', email: 'lan@angels.vn' })
    expect(mail.subject).toBe('Investor contact: Lan Pham (Saigon Angels)')
    expect(mail.text).toContain('Ho Chi Minh City, Vietnam')
    expect(mail.html).toContain('<!doctype html>')
    expect(mail.html).toContain('Reply to Lan Pham')
  })

  it('R13: the email carries the sender details from Cloudflare, the browser and the page', async () => {
    const client = { tz: 'Asia/Ho_Chi_Minh', offset: -420, screen: { w: 1512, h: 982 }, langs: ['vi-VN', 'en'], arrived: 'https://deck.rotexai.com/?s=12' }
    expect((await run(req({ ...good, client }))).status).toBe(200)
    const { text, html } = mailerSend.mock.calls[0][1]
    for (const part of [text, html]) {
      expect(part).toContain('203.0.113.7')
      expect(part).toContain('Viettel Group (AS7552)')
      expect(part).toContain('Chrome 131 on macOS, computer')
      expect(part).toContain('1512 × 982')
      expect(part).toContain('vi-VN, en')
      expect(part).toContain('https://deck.rotexai.com/')
      expect(part).toContain('10 seconds')
      expect(part).toContain('angels.vn receives mail')
      expect(part).toContain('1 message from this IP')
      expect(part).toContain('Turnstile passed at 08:59:58 UTC')
      expect(part).toContain('16:00 Vietnam time (09:00 UTC)')
    }
    expect(text).toContain('SENDER CHECK: 1 thing to check before replying')
    expect(text).toContain('Form filled in 10 seconds.')
    expect(text).toContain('Came from the pitch deck.')
  })

  it('R13: every value is HTML-escaped and the DNS check is skipped for rejected requests', async () => {
    const hostile = { ...good, name: 'Mai <b>Tran</b>', firm: 'Acme "Capital" & Co', note: '<a href="http://evil.example">Verify</a>\n<script>alert(1)</' + 'script>' }
    await run(req(hostile, { ua: '<img src=x onerror=alert(1)> HeadlessChrome/131.0.0.0' }))
    const { html, text } = mailerSend.mock.calls[0][1]
    expect(html).not.toMatch(/<script|<b>|<img|href="http:\/\/evil/)
    expect(html).toContain('Mai &lt;b&gt;Tran&lt;/b&gt;')
    expect(html).toContain('Acme &quot;Capital&quot; &amp; Co')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(text).toContain('SENDER CHECK: Stop')
    fetch.mockClear()
    await run(req(good, { origin: 'https://evil.example' }))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('R14: a domain with no mail server stops; a DNS failure raises no flag', async () => {
    dns = { Status: 3 }
    await run(req())
    expect(mailerSend.mock.calls[0][1].text).toContain('angels.vn has no mail server')
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('dns-query')) throw new Error('timeout')
      return new Response(JSON.stringify(verify))
    }))
    await run(req())
    const t = mailerSend.mock.calls[1][1].text
    expect(t).toContain('could not be checked')
    expect(t).not.toContain('no mail server')
  })

  it('R2: another origin gets 403 and sends nothing; the preflight is refused too', async () => {
    expect((await run(req(good, { origin: 'https://evil.example' }))).status).toBe(403)
    expect((await run(req(good, { origin: 'https://evil.example', method: 'OPTIONS' }))).status).toBe(403)
    expect((await run(req(good, { method: 'OPTIONS' }))).status).toBe(204)
    expect(mailerSend).not.toHaveBeenCalled()
  })

  it('R3: a failed token, a wrong hostname or no token gets 403', async () => {
    verify = { success: false }
    expect((await run(req())).status).toBe(403)
    verify = { success: true, hostname: 'evil.example' }
    expect((await run(req())).status).toBe(403)
    verify = { success: true, hostname: 'investor.rotexai.com' }
    expect((await run(req({ ...good, turnstile: '' }))).status).toBe(403)
    expect(mailerSend).not.toHaveBeenCalled()
  })

  it('R4: the per-IP rate limit answers 429 before Turnstile is called', async () => {
    const r = await run(req(), env({ LIMITER: { limit: async () => ({ success: false }) } }))
    expect(r.status).toBe(429)
    expect(fetch).not.toHaveBeenCalled()
    expect(mailerSend).not.toHaveBeenCalled()
  })

  it('R5: 5 emails per IP per day, then 429; 50 in total per day, then 503', async () => {
    const e = env()
    for (let i = 0; i < 5; i++) expect((await run(req(), e)).status).toBe(200)
    expect((await run(req(), e)).status).toBe(429)
    const g = env()
    g.COUNTS.m.set('all:2026-11-18', '50')
    expect((await run(req(), g)).status).toBe(503)
    expect(mailerSend).toHaveBeenCalledTimes(5)
  })

  it('R6: a filled decoy field or a submit within 3 s looks fine and sends nothing', async () => {
    expect((await run(req({ ...good, website: 'http://spam' }))).status).toBe(200)
    expect((await run(req({ ...good, started: NOW - 1000 }))).status).toBe(200)
    expect((await run(req({ ...good, started: undefined }))).status).toBe(200)
    expect(mailerSend).not.toHaveBeenCalled()
  })

  it('R7: bad fields get 400, a large body 413, and header fields lose CR and LF', async () => {
    expect((await run(req({ ...good, name: '' }))).status).toBe(400)
    expect((await run(req({ ...good, email: 'not-an-email' }))).status).toBe(400)
    expect((await run(req({ ...good, note: 'x'.repeat(2001) }))).status).toBe(400)
    expect((await run(req(good, { raw: JSON.stringify({ ...good, note: 'x'.repeat(9000) }) }))).status).toBe(413)
    expect((await run(req(good, { raw: '{nope' }))).status).toBe(400)
    expect(mailerSend).not.toHaveBeenCalled()
    await run(req({ ...good, name: 'Lan\r\nBcc: victim@example.com', firm: 'A\nB' }))
    const mail = mailerSend.mock.calls[0][1]
    expect(mail.subject).not.toMatch(/[\r\n]/)
    expect(mail.reply.name).toBe('Lan Bcc: victim@example.com')
    expect(clean('a\r\n\tb', 10)).toBe('a b')
  })

  it('an SMTP failure answers 502 so the page shows the email fallback', async () => {
    mailerSend.mockRejectedValueOnce(new Error('auth failed'))
    expect((await run(req())).status).toBe(502)
  })

  it('only POST and OPTIONS are served', async () => {
    expect((await run(req(good, { method: 'GET' }))).status).toBe(405)
  })
})
