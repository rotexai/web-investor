import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { CONTACT_EMAIL, DECK_REQUEST_URL, DECK_URL, FOUNDER_URL, PORTAL_URL, ROUTES, TURNSTILE_SITE_KEY } from './config.js'
import { COPY, LangContext, initialLang, saveLang, useLang } from './i18n/index.js'
import './investor.css'

// Investor page: a calling card that routes investors to the deck, the product, a call or the data room.
// Styling follows the video-shotcraft shot "aurora-bloom-bg-flip", recoloured to the brand AI gradient + orange.
// No opener: the page opens on ink, the aurora rises and the headline blurs in word by word.
// Bracketed text in a dashed box is a placeholder slot for a real fact. Never replace one with a guess.
// All copy lives in src/i18n/{en,vi}.js; the header switch flips the whole page between English and Vietnamese.

// Reversed lockup for the ink background: the mark keeps its white tile (brand/logo/favicon), the wordmark turns white.
function Lockup() {
  return (
    <svg className="lockup" viewBox="0 0 142 40" fill="none" role="img" aria-label="RotexAI">
      <defs>
        <linearGradient id="ai" gradientUnits="userSpaceOnUse" x1="107" y1="0" x2="131" y2="0">
          <stop offset="0" stopColor="#5B43E8" />
          <stop offset="0.6" stopColor="#4CC9F0" />
          <stop offset="1" stopColor="#A390FF" />
        </linearGradient>
      </defs>
      <g transform="scale(1.5385)">
        <rect width="26" height="26" rx="7" fill="#FFFFFF" />
        <rect x="1" y="1" width="24" height="24" rx="6" stroke="#0E1A24" strokeWidth="1.6" />
        <circle cx="8" cy="9" r="2.4" fill="#2445E8" />
        <circle cx="18" cy="13" r="2.4" fill="#2445E8" />
        <circle cx="9" cy="18.5" r="2.4" fill="#F26A1B" />
        <path d="M10 9.6l6 2.6M16.2 14.2l-5.4 3.2" stroke="#0E1A24" strokeWidth="1.3" />
      </g>
      <text x="50" y="27" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="20" fontWeight="800" letterSpacing="-0.4" fill="#F2F5F8">
        Rotex<tspan fontFamily="'JetBrains Mono', ui-monospace, monospace" letterSpacing="0.4" fill="url(#ai)">AI</tspan>
      </text>
      <circle cx="135" cy="11" r="2.5" fill="#4CC9F0" />
    </svg>
  )
}

function Slot({ children }) {
  return <span className="slot">{children}</span>
}

// Splits a line into words so each can blur in on its own beat (--d = delay in seconds).
function Words({ text, start = 0, step = 0.06 }) {
  const words = text.split(' ')
  return words.map((w, i) => (
    <Fragment key={i}>
      <span className="w" style={{ '--d': `${(start + i * step).toFixed(2)}s` }}>{w}</span>
      {i < words.length - 1 && ' '}
    </Fragment>
  ))
}

// The aurora: violet body, lavender bridge, orange core, white edge (light phase only).
function Aurora({ className = '' }) {
  return (
    <div className={`aurora ${className}`} aria-hidden="true">
      <div className="aurora-rise">
        <div className="aurora-dim">
          <span className="blob blob-violet" />
          <span className="blob blob-bridge" />
          <span className="blob blob-core" />
          <span className="blob blob-white" />
        </div>
      </div>
    </div>
  )
}

// Adds .in to every .reveal element as it scrolls into view. Without JS or with reduced motion, nothing is hidden.
function useReveal() {
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still || !('IntersectionObserver' in window)) return
    const root = document.documentElement
    root.classList.add('reveal-on')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      root.classList.remove('reveal-on')
    }
  }, [])
}

// Product scenes are cut from the RotexAI walkthrough video (aos video/videos/piece-4-how-to): the portal rebuilt
// from its source, labelled as a simulation. Clips play only while on screen; reduced motion shows the poster.
// Each language has its own render (English files have no suffix, Vietnamese ones end in .vi).
const mediaPath = (name, lang) => `/media/${name}${lang === 'en' ? '' : `.${lang}`}`

function Clip({ name, label }) {
  const { lang } = useLang()
  const src = mediaPath(name, lang)
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.3 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  // key={src}: a new language mounts a fresh element, since changing <source> alone does not reload a video.
  return (
    <div className="clip">
      <video key={src} ref={ref} muted loop playsInline preload="none" width="1280" height="720" poster={`${src}.jpg`} aria-label={label}>
        <source src={`${src}.mp4`} type="video/mp4" />
      </video>
    </div>
  )
}

function Showcase() {
  const { t } = useLang()
  const c = t.showcase
  return (
    <figure className="showcase">
      <div className="showcase-frame glass">
        <Clip name="app" label={c.clipLabel} />
      </div>
      <blockquote className="showcase-quote glass">
        <span className="label">{c.quoteLabel}</span>
        <p>{c.quote}</p>
      </blockquote>
      <figcaption className="showcase-cap">
        <span>{c.caption}</span>
        <span className="label label-quiet">{c.simulated}</span>
      </figcaption>
    </figure>
  )
}

// Thesis as a picture: how a shop runs today (notebook, chat, spreadsheet) next to the app RotexAI builds.
// The "today" objects are drawn in HTML so they stay sharp; their Vietnamese text is the shop's real vernacular.
function Thesis() {
  const { t } = useLang()
  const c = t.thesis
  return (
    <div className="before-after">
      <div className="today reveal" aria-label={c.todayAria}>
        <span className="label label-quiet ba-tag">{c.today}</span>
        <div className="paper notebook" aria-hidden="true">
          <span className="nb-title">Kho · T11</span>
          <span>Bột mì — 20 bao</span>
          <span className="nb-strike">Bơ — 10 kg</span>
          <span>Bơ — hết!! gọi NCC</span>
          <span>Trứng — 6 khay?</span>
        </div>
        <div className="paper chat" aria-hidden="true">
          <span className="bubble in">Chị ơi bột còn không?</span>
          <span className="bubble out">Hết rồi em 😥</span>
          <span className="bubble in">Ai đặt chưa??</span>
          <span className="chat-time">21:47</span>
        </div>
        <div className="paper sheet" aria-hidden="true">
          {['Hàng', 'SL', 'Ngày', 'Bột', '20', '3/11', 'Bơ', '#REF!', '5/11', 'Trứng', '6', '?'].map((c, i) => (
            <span key={i} className={c === '#REF!' ? 'cell cell-err' : i < 3 ? 'cell cell-head' : 'cell'}>{c}</span>
          ))}
        </div>
        <p className="ba-cap">{c.todayCaption}</p>
      </div>

      <div className="ba-arrow reveal" style={{ '--d': '0.2s' }} aria-hidden="true">
        <svg viewBox="0 0 120 24" fill="none">
          <defs>
            <linearGradient id="arrow" x1="0" x2="120" y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#5B43E8" />
              <stop offset="0.6" stopColor="#4CC9F0" />
              <stop offset="1" stopColor="#A390FF" />
            </linearGradient>
          </defs>
          <path d="M2 12h112M104 4l10 8-10 8" stroke="url(#arrow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="label">{c.arrow}</span>
      </div>

      <div className="with reveal" style={{ '--d': '0.35s' }}>
        <span className="label ba-tag">{c.with}</span>
        <div className="with-frame glass">
          <Clip name="ready" label={c.withClipLabel} />
        </div>
        <p className="ba-cap">{c.withCaption}</p>
      </div>
    </div>
  )
}

// Clip per step, in order; the step text is how.steps in the dictionary.
const STEP_CLIPS = ['describe', 'plan', 'build', 'change']

// Chapter start times in the walkthrough; titles are film.chapters in the dictionary (the video's own captions).
const FILM_CHAPTERS = [
  ['0:08', 8],
  ['0:20', 20],
  ['0:38', 38],
  ['0:55', 55],
  ['1:15', 75],
  ['1:33', 93],
  ['1:48', 108],
  ['2:04', 124],
]

function Film() {
  const { t, lang } = useLang()
  const ref = useRef(null)
  // Chapter captions follow the page language.
  useEffect(() => {
    const tracks = ref.current?.textTracks
    if (!tracks) return
    for (const tr of tracks) tr.mode = tr.language === lang ? 'showing' : 'disabled'
  }, [lang])
  const seek = (at) => {
    const v = ref.current
    if (!v) return
    v.currentTime = at
    v.play().catch(() => {})
  }
  return (
    <div className="film">
      <div className="film-frame glass">
        <video key={lang} ref={ref} controls preload="none" playsInline width="1280" height="720" poster={`${mediaPath('walkthrough', lang)}.jpg`}>
          <source src={`${mediaPath('walkthrough', lang)}.mp4`} type="video/mp4" />
          <track kind="captions" src="/media/walkthrough.en.vtt" srcLang="en" label="English" default={lang === 'en'} />
          <track kind="captions" src="/media/walkthrough.vi.vtt" srcLang="vi" label="Tiếng Việt" default={lang === 'vi'} />
        </video>
      </div>
      <ol className="chapters">
        {FILM_CHAPTERS.map(([stamp, at], i) => (
          <li key={at}>
            <button type="button" className="chapter" onClick={() => seek(at)}>
              <span className="chapter-time">{stamp}</span>
              <span>{t.film.chapters[i]}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

// Turnstile (spec 261118): the script loads once, the widget runs a check only when Cloudflare needs one.
let turnstileScript = null
function loadTurnstile() {
  turnstileScript ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve(window.turnstile)
    s.onerror = reject
    document.head.appendChild(s)
  })
  return turnstileScript
}

const LIVE = Boolean(DECK_REQUEST_URL && TURNSTILE_SITE_KEY)

// The page that linked here, read once at load (later in-page navigation would overwrite it).
const ARRIVED = typeof document === 'undefined' ? '' : document.referrer

/** Browser details for the sender check in the founder's email (spec 261118, R13). Each read may fail; skip it then. */
function clientInfo() {
  const out = {}
  const tryIt = (fn) => {
    try {
      fn()
    } catch {
      /* not available in this browser */
    }
  }
  tryIt(() => (out.tz = Intl.DateTimeFormat().resolvedOptions().timeZone))
  tryIt(() => (out.offset = new Date().getTimezoneOffset()))
  tryIt(() => (out.screen = { w: window.screen.width, h: window.screen.height }))
  tryIt(() => (out.langs = [...navigator.languages].slice(0, 5)))
  if (ARRIVED) out.arrived = ARRIVED
  return out
}

function DeckForm() {
  const { t, lang } = useLang()
  const f = t.form
  const [state, setState] = useState('idle')
  const started = useRef(0)
  const box = useRef(null)
  const widget = useRef(null)
  const token = useRef('')

  // Render time on the page's own monotonic clock, for the Worker's too-fast-to-be-human check: the fill time is
  // measured here, because the visitor's wall clock can be minutes off the Worker's.
  useEffect(() => {
    started.current = performance.now()
  }, [])

  useEffect(() => {
    if (!LIVE) return
    let gone = false
    loadTurnstile()
      .then((ts) => {
        if (gone || !box.current || !ts) return
        widget.current = ts.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          language: lang,
          callback: (v) => (token.current = v),
          'expired-callback': () => (token.current = ''),
          'error-callback': () => (token.current = ''),
        })
      })
      .catch(() => {})
    return () => {
      gone = true
      if (widget.current != null) window.turnstile?.remove(widget.current)
      widget.current = null
      token.current = ''
    }
  }, [lang])

  async function submit(e) {
    e.preventDefault()
    if (!LIVE) {
      setState('offline')
      return
    }
    const elapsed = Math.round(performance.now() - started.current)
    // `started` (wall-clock render time) keeps a Worker deployed before `elapsed` working.
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), lang, elapsed, started: Date.now() - elapsed, turnstile: token.current, client: clientInfo() }
    setState('sending')
    let sent = false
    try {
      const res = await fetch(DECK_REQUEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      sent = res.ok
      // 429 rate limit, 502 mail failure, 503 daily cap: point to the address instead of asking to retry.
      setState(res.ok ? 'sent' : [429, 502, 503].includes(res.status) ? 'busy' : 'error')
    } catch {
      setState('error')
    }
    // A token works once, and a dropped connection may already have spent it: get a fresh one before a retry.
    if (!sent && widget.current != null) {
      token.current = ''
      window.turnstile?.reset(widget.current)
    }
  }

  if (state === 'sent') {
    return (
      <div className="deck-done" role="status">
        <h3 className="title">{f.sentTitle}</h3>
        <p className="body">{f.sentBody}</p>
      </div>
    )
  }

  return (
    <form className="deck-form" onSubmit={submit}>
      <div className="field-row">
        <label className="field" htmlFor="deck-name">
          <span>{f.name}</span>
          <input id="deck-name" name="name" autoComplete="name" maxLength={120} required />
        </label>
        <label className="field" htmlFor="deck-firm">
          <span>{f.firm}</span>
          <input id="deck-firm" name="firm" autoComplete="organization" maxLength={160} required />
        </label>
      </div>
      <label className="field" htmlFor="deck-email">
        <span>{f.email}</span>
        <input id="deck-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      </label>
      {/* Decoy for bots; people never see or fill it. */}
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="field field-grow" htmlFor="deck-note">
        <span>{f.note} <em>{f.optional}</em></span>
        {/* Field limits match the Worker's (spec 261118): a longer note would be refused, not cut. */}
        <textarea id="deck-note" name="note" rows="2" maxLength={2000} />
      </label>
      <div ref={box} className="turnstile" />
      <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? f.sending : f.submit}
      </button>
      <p className="form-privacy">{f.notice}</p>
      {state === 'offline' && (
        <p className="form-note" role="status">
          {f.offlineBefore} <span className="select">{CONTACT_EMAIL}</span> {f.offlineAfter}
        </p>
      )}
      {state === 'busy' && (
        <p className="form-note" role="status">
          {f.busyBefore} <span className="select">{CONTACT_EMAIL}</span> {f.busyAfter}
        </p>
      )}
      {state === 'error' && (
        <p className="form-note form-note-error" role="alert">
          {f.errorBefore} <span className="select">{CONTACT_EMAIL}</span>{f.errorAfter}
        </p>
      )}
    </form>
  )
}

// Who we compete with: a 2×2 of "fits Vietnamese firms" against "owner can change it alone". Each group sits in a
// quadrant by judgement (the copy says so); the map has no scale. Chip places are in CSS (.cm-<id>).
function Competition() {
  const { t } = useLang()
  const c = t.competition
  return (
    <div className="comp">
      <header className="section-head split-head reveal">
        <div>
          <span className="label">{c.label}</span>
          <h2 className="h2"><Words text={c.title} /></h2>
        </div>
        <p className="lead split-lead">{c.lead}</p>
      </header>
      <div className="comp-start reveal">
        <div>
          <span className="label label-quiet">{c.start.label}</span>
          <span className="comp-start-name">{c.start.name}</span>
        </div>
        <p>{c.start.lineBefore} <strong>{c.start.lineStrong}</strong> {c.start.lineAfter}</p>
      </div>
      <div className="comp-grid">
        <figure className="cmap reveal" role="img" aria-label={c.mapAria}>
          <span className="cmap-y"><span>{c.axisY}</span></span>
          <span className="cmap-x"><span className="cmap-x-long">{c.axisX}</span><span className="cmap-x-short">{c.axisXShort}</span></span>
          <div className="cmap-plot">
            <div className="cmap-quads">
              {['tl', 'tr', 'bl', 'br'].map((q) => <span key={q} className={`q-${q}`}><i>{c.quadrants[q]}</i></span>)}
            </div>
            {c.groups.map((g) => (
              <span key={g.id} className={`cm-chip cm-${g.id}`}><b>{g.name}</b><small>{g.chip}</small></span>
            ))}
            <span className="cm-chip cm-us"><b><i className="dot" />RotexAI</b><small>{c.us.chip}</small></span>
          </div>
        </figure>
        <ul className="comp-list reveal" style={{ '--d': '0.1s' }}>
          {c.groups.map((g) => (
            <li key={g.id} className={`cl cl-${g.id}`}>
              <span className="cl-mark" aria-hidden="true" />
              <div>
                <span className="label label-quiet">{g.role}</span>
                <h3>{g.name}</h3>
                <p>{g.line}</p>
              </div>
            </li>
          ))}
          <li className="cl cl-us">
            <span className="cl-mark" aria-hidden="true" />
            <div>
              <span className="label">{c.us.role}</span>
              <h3>RotexAI</h3>
              <p>{c.us.line}</p>
            </div>
          </li>
        </ul>
      </div>
      <p className="source comp-source">{c.source}</p>
    </div>
  )
}

// Share of surveyed firms, in percent (MOIT E-commerce White Book 2022, 2021 survey). Bars are drawn to scale.
const SOFTWARE_USE = { accounting: 88, erp: 15 }
const AXIS_TICKS = [0, 25, 50, 75, 100]

function UseBar({ label, value, gapTo, className }) {
  return (
    <div className={`mk-bar ${className}`}>
      <div className="mk-bar-head"><span>{label}</span><span className="mk-bar-val">{value}%</span></div>
      <div className="mk-track" aria-hidden="true">
        <span className="mk-fill" style={{ width: `${value}%` }} />
        {gapTo != null && <span className="mk-gapfill" style={{ left: `${value}%`, width: `${gapTo - value}%` }} />}
      </div>
    </div>
  )
}

function Market() {
  const { t } = useLang()
  const m = t.market
  const { accounting, erp } = SOFTWARE_USE
  return (
    <>
      <Heading label={m.label} text={m.title} />
      <div className="mk">
        <div className="mk-facts reveal">
          <p className="mk-big"><span className="mk-num">{m.size}</span><span className="mk-unit">{m.sizeUnit}</span></p>
          <div className="mk-stats">
            {m.stats.map((s) => <p key={s.value}><strong>{s.value}</strong><span>{s.line}</span></p>)}
          </div>
          <p className="mk-start"><i className="dot" aria-hidden="true" />{m.start}</p>
        </div>
        <figure className="mk-chart glass reveal" style={{ '--d': '0.1s' }}>
          <figcaption>
            <span className="label label-quiet">{m.chart.label}</span>
            <span className="mk-chart-title">{m.chart.title}</span>
          </figcaption>
          <div className="mk-bars">
            <UseBar className="mk-bar-books" label={m.chart.accounting} value={accounting} />
            <UseBar className="mk-bar-erp" label={m.chart.erp} value={erp} gapTo={accounting} />
            <div className="mk-axis" aria-hidden="true">
              {AXIS_TICKS.map((v) => <span key={v} style={{ '--x': `${v}%` }}>{v === 100 ? '100%' : v}</span>)}
            </div>
          </div>
          <p className="mk-gap"><span className="mk-gap-num">{accounting - erp}</span><span>{m.chart.gap}</span></p>
        </figure>
      </div>
      <p className="source mk-source">{m.source}</p>
    </>
  )
}

// Why now: three dated reasons on a rail that runs into "Now" (across on wide screens, down the left on phones).
function WhyNow() {
  const { t } = useLang()
  const w = t.whyNow
  return (
    <div className="wn-block">
      <header className="section-head split-head reveal">
        <div>
          <span className="label">{w.label}</span>
          <h2 className="h2"><Words text={w.title} /></h2>
        </div>
        <p className="lead split-lead">{w.lead}</p>
      </header>
      <div className="wn">
        <ol className="wn-list">
          {w.reasons.map((r, i) => (
            <li key={r.date} className="wn-card glass reveal" style={{ '--d': `${0.08 * i}s` }}>
              <div className="wn-meta"><span className="wn-date">{r.date}</span><span className="wn-tag">{r.tag}</span></div>
              <h3>{r.title}</h3>
              <p>{r.line}</p>
              <span className="wn-source">{r.source}</span>
            </li>
          ))}
        </ol>
        <span className="wn-now">{w.now}</span>
      </div>
    </div>
  )
}

// What the founder has shipped, in the order of people.built in the dictionary.
const BUILT_LINKS = [
  { href: PORTAL_URL, live: true },
  { href: DECK_URL, live: true },
  { href: '#film', live: false },
]

function Founder() {
  const { t } = useLang()
  const p = t.people
  return (
    <div className="founder">
      <figure className="founder-photo reveal">
        <img src="/media/founder-portrait.jpg" alt={p.photoAlt} width="960" height="1280" loading="lazy" />
      </figure>
      <Heading label={p.label} text={p.title} className="founder-head" />
      <div className="founder-body reveal" style={{ '--d': '0.1s' }}>
        <div className="founder-name">
          <span className="founder-n">{p.name}</span>
          <span className="label">{p.role}</span>
        </div>
        <p className="founder-bio">{p.background}</p>
        <div className="built">
          <span className="label label-quiet">{p.builtLabel}</span>
          <ul>
            {p.built.map((b, i) => {
              const { href, live } = BUILT_LINKS[i]
              const external = href.startsWith('http')
              return (
                <li key={b.name}>
                  <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                    <span className="built-name">{b.name}{external && <span aria-hidden="true"> ↗</span>}</span>
                    <span className="built-line">{b.line}</span>
                  </a>
                  <span className={live ? 'built-badge live' : 'built-badge'}>{b.badge}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <a className="person-link" href={FOUNDER_URL} target="_blank" rel="noopener">
          {p.site} · qvanle.rotexai.com <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  )
}

// Share of the round per use of funds, in percent, in the order of round.funds in the dictionary.
const FUND_SHARES = [40, 20, 20, 20]

function Round() {
  const { t } = useLang()
  const r = t.round
  const cols = FUND_SHARES.map((s) => `${s}fr`).join(' ')
  return (
    <>
      <header className="section-head round-head reveal">
        <div>
          <span className="label">{r.label}</span>
          <h2 className="h2"><Words text={r.title} /></h2>
        </div>
        <div className="round-actions">
          <a href="#next" className="btn btn-primary">{r.talk}</a>
          <a href={DECK_URL} className="btn btn-ghost" target="_blank" rel="noreferrer">{t.cta.deck}<span className="btn-arrow" aria-hidden="true">↗</span></a>
        </div>
      </header>
      <div className="round glass reveal">
        <dl className="round-keys">
          <div><dt>{r.stage}</dt><dd>{r.stageValue}</dd></div>
          <div><dt>{r.raising}</dt><dd>{r.raisingValue} <small>{r.raisingUnit}</small></dd></div>
          <div><dt>{r.runway}</dt><dd>{r.runwayValue}</dd></div>
        </dl>
        <div className="funds" style={{ '--cols': cols }}>
          <div className="funds-head"><span className="label label-quiet">{r.fundsLabel}</span><span className="funds-total">{r.fundsTotal}</span></div>
          <div className="funds-bar" role="img" aria-label={r.fundsAria}>
            {r.funds.map((f, i) => (
              <div key={f.use} className={`fb fb-${i}`}><span>{FUND_SHARES[i]}%</span><b>{f.amount}</b></div>
            ))}
          </div>
          <ul className="funds-legend">
            {r.funds.map((f, i) => (
              <li key={f.use} className={`fl fl-${i}`}><i aria-hidden="true" /><span className="fl-use">{f.use}</span><span className="fl-detail">{f.detail}</span></li>
            ))}
          </ul>
        </div>
        <p className="round-burn"><strong>{r.burnStrong}</strong> {r.burnAfter}</p>
      </div>
    </>
  )
}

function Route({ route, i }) {
  const { t } = useLang()
  const copy = t.hub.routes[route.id]
  const body = (
    <>
      <span className="route-title">
        {copy.title}
        {route.href && <span className="route-arrow" aria-hidden="true">{route.href.startsWith('http') ? '↗' : '↓'}</span>}
      </span>
      <span className="route-line">{copy.line}</span>
      <span className={route.href ? 'route-label' : 'route-label route-label-pending'}>{copy.label}</span>
    </>
  )
  const style = { '--d': `${0.15 + i * 0.1}s` }
  const external = route.href?.startsWith('http')
  return route.href ? (
    <a className="route glass" style={style} href={route.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{body}</a>
  ) : (
    <div className="route glass route-static" style={style}>{body}</div>
  )
}

const GB_POINT_ICONS = [
  <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  <path d="M4 6h16M4 12h16M4 18h10" />,
  <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5V15a3 3 0 003 3h6.5" /><path d="M18 15.5V9a3 3 0 00-3-3H8.5" /></>,
]

// Why RotexAI: generated code you cannot read (black box) beside the portal's run canvas (glass box). The canvas
// is drawn by hand after the portal's RunCanvas/RunFlowNode: a card per step, coloured by step type, bordered by
// state; edges take the colour of the card they leave and fade where the run did not go. A run log under it tells
// the run in plain words, one line per step, while the card in focus rings and speaks in a bubble.
const Svg = ({ size, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
)

// Generated-looking code for the black box (illustrative only). A segment is plain text or [token class, text].
const GB_CODE = [
  [['k', 'export async function'], ' handleRestock(req, ctx) {'],
  ['  ', ['k', 'const'], ' r = ', ['k', 'await'], ' db.q(', ['s', '`SELECT * FROM stk WHERE id=$1`'], ', [req.id])'],
  ['  ', ['k', 'if'], ' (u?.r === ', ['n', '2'], ' && !f.ok) ', ['k', 'return'], ' h(', ['n', '409'], ')'],
  ['  ', ['k', 'const'], ' apv = (x) => x.s > ', ['n', '3'], ' ? ok(x) : rj(x)'],
  ['  ', ['k', 'await'], ' fetch(SUP_URL, { method: ', ['s', '"POST"'], ', body: enc(o) })'],
  ['  ', ['s', '// TODO: handle partial approvals']],
  ['  ', ['k', 'try'], ' { sync(o, { force: ', ['k', 'true'], ' }) } ', ['k', 'catch'], ' {}'],
  ['  ', ['k', 'const'], ' q = rows.filter((z) => z.t && !z.d).map(mk)'],
  ['  ', ['k', 'if'], ' (!cache[k]) cache[k] = ', ['k', 'await'], ' load(k, opts)'],
  ['  ', ['k', 'return'], ' { ...state, pending: q.length > ', ['n', '0'], ' }'],
  ['}'],
  [''],
]

// Card order: 0 request, 1 decision, 2 manager, 3 send, 4 auto-approve (the branch this run does not take).
const GB_TYPES = [
  { color: '#10b981', icon: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></> },
  { color: '#f59e0b', icon: <><path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></> },
  { color: '#ec4899', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></> },
  { color: '#3b82f6', icon: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></> },
  { color: '#f97316', icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /> },
]
const GB_NODE_TIME = ['18:02', '18:02', '18:05', '18:05', '']
const GB_EDGES = [[0, 1, null], [1, 2, 'yes'], [1, 4, 'no'], [2, 3, null], [4, 3, null]] // [from, to, label]
const GB_TOP = 46 // headroom above the cards for the bubble
// Two hand-placed layouts, fitted to the width like React Flow's fitView: wide (left to right), narrow (top down).
const GB_LAYOUT = {
  h: { w: 818, h: 286 + GB_TOP, dir: 'h', nh: 122,
    nodes: [[12, 82 + GB_TOP, 164], [222, 82 + GB_TOP, 164], [432, 8 + GB_TOP, 164], [642, 82 + GB_TOP, 164], [432, 156 + GB_TOP, 164]] },
  v: { w: 336, h: 674 + GB_TOP, dir: 'v', nh: 126,
    nodes: [[78, 8 + GB_TOP, 180], [78, 186 + GB_TOP, 180], [8, 364 + GB_TOP, 150], [78, 540 + GB_TOP, 180], [178, 364 + GB_TOP, 150]] },
}
// The run, one entry per log line: each card's state, the card in focus and the log time.
const GB_STEPS = [
  { st: ['running', 'notReached', 'notReached', 'notReached', 'notReached'], focus: 0, at: '18:02:04' },
  { st: ['done', 'running', 'notReached', 'notReached', 'notReached'], focus: 1, at: '18:02:05' },
  { st: ['done', 'done', 'waiting', 'notReached', 'skipped'], focus: 2, at: '18:02:05' },
  { st: ['done', 'done', 'done', 'notReached', 'skipped'], focus: 2, at: '18:05:31' },
  { st: ['done', 'done', 'done', 'running', 'skipped'], focus: 3, at: '18:05:32' },
  { st: ['done', 'done', 'done', 'done', 'skipped'], focus: 3, at: '18:05:33' },
]
const GB_LAST = GB_STEPS.length - 1

function gbAnchors(L, from, to) {
  const [fx, fy, fw] = L.nodes[from]
  const [tx, ty, tw] = L.nodes[to]
  if (L.dir === 'h') return [fx + fw, fy + L.nh / 2, tx, ty + L.nh / 2]
  return [fx + fw / 2, fy + L.nh, tx + tw / 2, ty]
}
function gbCurve(L, [sx, sy, tx, ty]) {
  if (L.dir === 'h') {
    const d = Math.max(24, (tx - sx) / 2)
    return `M${sx} ${sy}C${sx + d} ${sy} ${tx - d} ${ty} ${tx} ${ty}`
  }
  const d = Math.max(24, (ty - sy) / 2)
  return `M${sx} ${sy}C${sx} ${sy + d} ${tx} ${ty - d} ${tx} ${ty}`
}
function gbEdgeState([from, to], st) {
  if (from === 4 || to === 4) return st[4] === 'skipped' ? 'skip' : 'off'
  if (st[to] === 'running' || st[to] === 'waiting') return 'flow'
  return st[to] === 'done' ? '' : 'off'
}

// Picks the layout for the canvas width and the scale that fits it; ResizeObserver also fires once on observe.
function useCanvasFit(ref) {
  const [fit, setFit] = useState({ key: 'h', scale: 1, offset: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el || !('ResizeObserver' in window)) return
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 24
      const key = avail < 560 ? 'v' : 'h'
      const L = GB_LAYOUT[key]
      const scale = Math.min(1, avail / L.w)
      setFit({ key, scale, offset: Math.max(0, (avail - L.w * scale) / 2) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return fit
}

// The run: opens finished; while on screen it replays a line every 2.2 s with a 5 s hold at the end. Pointing at a
// log line pins the canvas to that step and pauses. Reduced motion stays finished until the viewer presses Replay.
function useRun(ref) {
  const [reduce] = useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [at, setAt] = useState(GB_LAST)
  const [pinned, setPinned] = useState(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, reduce])
  useEffect(() => {
    if (!playing || pinned !== null || (reduce && at === GB_LAST)) return
    const id = setTimeout(() => setAt((a) => (a === GB_LAST ? 0 : a + 1)), at === GB_LAST ? 5000 : 2200)
    return () => clearTimeout(id)
  }, [playing, pinned, at, reduce])
  const replay = () => {
    setPinned(null)
    setAt(0)
    setPlaying(true)
  }
  return { at, view: pinned ?? at, setPinned, replay }
}

function RunCanvas({ g, view, fit }) {
  const L = GB_LAYOUT[fit.key]
  const step = GB_STEPS[view]
  const st = step.st
  const [fx, fy, fw] = L.nodes[step.focus]
  const cx = fx + fw / 2
  const bx = Math.min(Math.max(cx, 105), L.w - 105)
  return (
    <div
      className="gb-stage"
      aria-hidden="true"
      style={{ width: L.w, height: L.h, transform: `scale(${fit.scale})`, marginLeft: fit.offset, marginBottom: L.h * fit.scale - L.h }}
    >
      <svg className="gb-edges" width={L.w} height={L.h}>
        {GB_EDGES.map((e) => {
          const a = gbAnchors(L, e[0], e[1])
          return (
            <Fragment key={`${e[0]}-${e[1]}`}>
              <path className={`gb-edge ${gbEdgeState(e, st)}`} stroke={GB_TYPES[e[0]].color} d={gbCurve(L, a)} />
              <circle className="gb-port" cx={a[0]} cy={a[1]} r="3.5" />
              <circle className="gb-port" cx={a[2]} cy={a[3]} r="3.5" />
            </Fragment>
          )
        })}
      </svg>
      {GB_EDGES.filter((e) => e[2]).map((e) => {
        const [sx, sy, tx, ty] = gbAnchors(L, e[0], e[1])
        const cls = e[2] === 'yes' ? (st[2] !== 'notReached' ? 'on' : '') : st[4] === 'skipped' ? 'skip' : ''
        return (
          <span key={e[2]} className={`gb-elabel ${cls}`} style={{ left: (sx + tx) / 2, top: (sy + ty) / 2 }}>{g[e[2]]}</span>
        )
      })}
      {L.nodes.map(([x, y, w], i) => {
        const s = st[i]
        const meta = s === 'done' ? [g.who[i], GB_NODE_TIME[i]].filter(Boolean).join(' · ') : s === 'waiting' ? g.who[i] : ''
        return (
          <div key={i} className={`gb-node ${s}${i === step.focus ? ' focus' : ''}`} style={{ left: x, top: y, width: w, height: L.nh }}>
            <div className="gb-nhead">
              <span className="gb-nicon" style={{ background: GB_TYPES[i].color }}><Svg size={14} strokeWidth="2">{GB_TYPES[i].icon}</Svg></span>
              <span className="gb-nname">{g.nodes[i].name}</span>
            </div>
            <p className="gb-nsum">{g.nodes[i].summary}</p>
            <div className="gb-nfoot">
              <span className="gb-nstate">{g.states[s]}</span>
              {meta && <span className="gb-nmeta">{meta}</span>}
            </div>
          </div>
        )
      })}
      <div key={view} className="gb-bubble" style={{ left: bx, top: fy - 10, '--ax': `${cx - bx}px` }}>{g.steps[view].msg}</div>
    </div>
  )
}

function GlassBox() {
  const { t } = useLang()
  const b = t.glassBox.black
  const g = t.glassBox.glass
  const runRef = useRef(null)
  const canvasRef = useRef(null)
  const { at, view, setPinned, replay } = useRun(runRef)
  const fit = useCanvasFit(canvasRef)
  const rowOf = (e) => e.target.closest?.('.gb-lrow:not(.future)')
  const done = at === GB_LAST
  return (
    <>
      <div className="gb-bento">
        <figure className="tile glass gb-tile-black reveal">
          <div className="gb-win gb-win-black" aria-hidden="true">
            <div className="gb-chrome">
              <span className="gb-dots"><i /><i /><i /></span>
              <span className="gb-url">{b.url}</span>
            </div>
            <div className="gb-editor">
              <div className="gb-tabbar"><b>{b.file}</b><span>{b.lines}</span></div>
              <div className="gb-code">
                <div className="gb-roll">
                  {[...GB_CODE, ...GB_CODE].map((line, i) => (
                    <div key={i} className="gb-row">
                      <s>{(i % GB_CODE.length) + 412}</s>
                      <span>{line.map((seg, j) => (typeof seg === 'string' ? seg : <span key={j} className={`gb-${seg[0]}`}>{seg[1]}</span>))}{line.length === 1 && line[0] === '' ? ' ' : null}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="gb-ask">
                <span className="gb-q">?</span>
                <p>{b.question}<span>{b.answer}</span></p>
              </div>
            </div>
          </div>
          <figcaption>
            <h3 className="title">{b.title}</h3>
            <p className="body">{b.line}</p>
          </figcaption>
        </figure>

        <figure ref={runRef} className="tile glass gb-tile-glass reveal" style={{ '--d': '0.12s' }}>
          <div className="gb-win gb-win-glass">
            <div className="gb-chrome" aria-hidden="true">
              <span className="gb-dots"><i /><i /><i /></span>
              <span className="gb-url">
                <Svg size={10} strokeWidth="2.4"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
                portal.rotexai.com
              </span>
              <span className="gb-sim">{g.sim}</span>
            </div>
            <div className="gb-app">
              <div className="gb-appbar">
                <span className="gb-cb">CB</span>
                <span className="gb-crumb"><span>{g.crumb}</span><i>/</i><b>{g.wfName}</b></span>
                <span className="gb-runid">{g.run}</span>
                <span className={`gb-runpill ${done ? 'done' : 'running'}`}><i />{g.states[done ? 'done' : 'running']}</span>
              </div>
              <div ref={canvasRef} className={`gb-canvas${fit.key === 'v' ? ' v' : ''}`}>
                <div className="gb-zoom" aria-hidden="true"><span>+</span><span>−</span></div>
                <RunCanvas g={g} view={view} fit={fit} />
              </div>
              <div className="gb-runlog">
                <div className="gb-runlog-head">
                  <h4>{g.log.title}</h4>
                  <span className="gb-runlog-hint">{g.log.hint}</span>
                  <button type="button" className="gb-replay" onClick={replay}>
                    <Svg size={13} strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Svg>
                    {g.log.replay}
                  </button>
                </div>
                <ol
                  className="gb-lrows"
                  onPointerOver={(e) => { const r = e.pointerType === 'mouse' && rowOf(e); if (r) setPinned(+r.dataset.i) }}
                  onPointerLeave={(e) => { if (e.pointerType === 'mouse') setPinned(null) }}
                  onFocus={(e) => { const r = rowOf(e); if (r) setPinned(+r.dataset.i) }}
                  onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPinned(null) }}
                >
                  {g.steps.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        data-i={i}
                        className={`gb-lrow${i > at ? ' future' : ''}${i === view ? ' cur' : ''}`}
                        tabIndex={i > at ? -1 : 0}
                        aria-hidden={i > at ? true : undefined}
                        aria-current={i === view ? 'step' : undefined}
                        onClick={(e) => { if (e.nativeEvent.pointerType === 'touch' || e.nativeEvent.pointerType === 'pen') setPinned((p) => (p === i ? null : i)) }}
                      >
                        <time>{GB_STEPS[i].at}</time>
                        <i style={{ background: GB_TYPES[GB_STEPS[i].focus].color }} />
                        <span>{s.log}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <figcaption>
            <h3 className="title">{g.title}</h3>
            <p className="body">{g.line}</p>
          </figcaption>
        </figure>
      </div>

      <ul className="gb-points reveal">
        {t.glassBox.points.map((p, i) => (
          <li key={i}>
            <Svg size={20} strokeWidth="1.9">{GB_POINT_ICONS[i]}</Svg>
            <div>
              <h3>{p.title}</h3>
              <p>{p.line}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function Heading({ label, text, className = '' }) {
  return (
    <header className={`section-head reveal ${className}`.trim()}>
      <span className="label">{label}</span>
      <h2 className="h2"><Words text={text} /></h2>
    </header>
  )
}

// EN | VI segmented switch in the header. Each button names its language in that language.
function LangSwitch() {
  const { lang, setLang, t } = useLang()
  const opts = [
    ['en', 'EN', 'English'],
    ['vi', 'VI', 'Tiếng Việt'],
  ]
  return (
    <div className="lang" role="group" aria-label={t.nav.language}>
      {opts.map(([id, short, name]) => (
        <button key={id} type="button" lang={id} className="lang-btn" aria-pressed={lang === id} aria-label={name} title={name} onClick={() => setLang(id)}>
          {short}
        </button>
      ))}
    </div>
  )
}

function Page() {
  const { t } = useLang()
  useReveal()

  return (
    <div id="top">
      <div className="grain" aria-hidden="true" />

      <header className="bar">
        <div className="wrap bar-inner">
          <a href="#top" className="brand"><Lockup /></a>
          <nav className="nav" aria-label={t.nav.sections}>
            <a href="#how">{t.nav.how}</a>
            <a href="#why">{t.nav.why}</a>
            <a href="#market">{t.nav.market}</a>
            <a href="#team">{t.nav.team}</a>
          </nav>
          <LangSwitch />
          <a href={DECK_URL} className="btn btn-primary btn-sm bar-cta" target="_blank" rel="noreferrer">{t.cta.deck}</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-sky" aria-hidden="true" />
          <Aurora className="aurora-hero" />
          <div className="vignette" aria-hidden="true" />

          <div className="wrap hero-inner">
            <span className="label hero-kicker">{t.hero.kicker}</span>
            <h1 className="display line-b"><Words text={t.hero.lineB} start={0.15} step={0.08} /></h1>
            <p className="lead hero-after">{t.hero.lead}</p>
            <div className="hero-actions hero-after">
              <a href={DECK_URL} className="btn btn-primary" target="_blank" rel="noreferrer">{t.cta.deck}</a>
              <a href={PORTAL_URL} className="btn btn-ghost" target="_blank" rel="noreferrer">{t.cta.product}</a>
            </div>
          </div>
        </section>

        <section className="demo">
          <div className="wrap">
            <Showcase />
          </div>
        </section>

        <section className="thesis">
          <span className="glow glow-left" aria-hidden="true" />
          <div className="wrap">
            <header className="section-head section-head-center reveal">
              <span className="label">{t.thesis.label}</span>
              <h2 className="h2 thesis-title"><Words text={t.thesis.title} /></h2>
              <p className="lead thesis-lead">{t.thesis.lead} <strong>{t.thesis.leadStrong}</strong></p>
            </header>
            <Thesis />
          </div>
        </section>

        <section id="how" className="section">
          <div className="wrap">
            <Heading label={t.how.label} text={t.how.title} />
            <ol className="steps">
              {t.how.steps.map((s, i) => (
                <li key={STEP_CLIPS[i]} className="step">
                  <div className="step-copy reveal">
                    <span className="step-num">{String(i + 1).padStart(2, '0')} / {String(STEP_CLIPS.length).padStart(2, '0')}</span>
                    <h3 className="h3">{s.title}</h3>
                    <p className="body">{s.line}</p>
                  </div>
                  <div className="step-media glass reveal" style={{ '--d': '0.1s' }}>
                    <Clip name={STEP_CLIPS[i]} label={s.alt} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="why" className="section section-tight">
          <div className="wrap">
            <header className="section-head gb-head reveal">
              <span className="label">{t.glassBox.label}</span>
              <h2 className="h2">
                <Words text={t.glassBox.titleA} /> <span className="gb-dim"><Words text={t.glassBox.titleB} start={0.2} /></span>
              </h2>
              <p className="lead">{t.glassBox.lead}</p>
            </header>
            <GlassBox />
            <Competition />
          </div>
        </section>

        <section className="section section-tight">
          <div className="wrap">
            <Heading label={t.team.label} text={t.team.title} />
            <div className="bento">
              <figure className="tile glass reveal">
                <Clip name="team" label={t.team.rolesClipLabel} />
                <figcaption>
                  <h3 className="title">{t.team.rolesTitle}</h3>
                  <p className="body">{t.team.rolesBody}</p>
                </figcaption>
              </figure>
              <figure className="tile glass reveal" style={{ '--d': '0.12s' }}>
                <Clip name="marketplace" label={t.team.marketClipLabel} />
                <figcaption>
                  <h3 className="title">{t.team.marketTitle}</h3>
                  <p className="body">{t.team.marketBody}</p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="film" className="section section-tight">
          <div className="wrap">
            <Heading label={t.film.label} text={t.film.title} />
            <Film />
            <p className="note">{t.film.note}</p>
          </div>
        </section>

        <section id="market" className="section">
          <div className="wrap">
            <Market />
            <WhyNow />
          </div>
        </section>

        <section id="team" className="section">
          <div className="wrap">
            <Founder />
          </div>
        </section>

        <section id="round" className="section section-tight">
          <div className="wrap">
            <Round />
          </div>
        </section>

        <section id="next" className="section hub reveal">
          <Aurora className="aurora-hub" />
          <div className="wrap hub-inner">
            <header className="section-head section-head-center">
              <span className="label">{t.hub.label}</span>
              <h2 className="h2"><Words text={t.hub.title} /></h2>
            </header>
            <div className="hub-grid">
              <div className="deck glass">
                <h3 className="deck-title">{t.hub.deckTitle}</h3>
                <p className="body">{t.hub.deckBody}</p>
                <DeckForm />
              </div>
              <div className="routes">
                {ROUTES.map((r, i) => <Route key={r.id} route={r} i={i} />)}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-inner">
          <span className="small">© 2026 RotexAI</span>
          <span className="small select">{CONTACT_EMAIL}</span>
          <a className="small" href="https://rotexai.com">rotexai.com</a>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [lang, setLangState] = useState(initialLang)

  // Keep <html lang>, the tab title and the description in step with the page language.
  useEffect(() => {
    const copy = COPY[lang]
    document.documentElement.lang = lang
    document.title = copy.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.meta.description)
  }, [lang])

  const value = useMemo(() => {
    const setLang = (next) => {
      if (next === lang) return
      saveLang(next)
      setLangState(next)
    }
    return { lang, t: COPY[lang], setLang }
  }, [lang])

  return (
    <LangContext.Provider value={value}>
      <Page />
    </LangContext.Provider>
  )
}
