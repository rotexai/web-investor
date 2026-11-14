import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { CONTACT_EMAIL, DECK_REQUEST_URL, FOUNDER_URL, PORTAL_URL, ROUTES } from './config.js'
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

function DeckForm() {
  const { t, lang } = useLang()
  const f = t.form
  const [state, setState] = useState('idle')

  async function submit(e) {
    e.preventDefault()
    if (!DECK_REQUEST_URL) {
      setState('offline')
      return
    }
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), lang }
    setState('sending')
    try {
      const res = await fetch(DECK_REQUEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
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
          <input id="deck-name" name="name" autoComplete="name" required />
        </label>
        <label className="field" htmlFor="deck-firm">
          <span>{f.firm}</span>
          <input id="deck-firm" name="firm" autoComplete="organization" required />
        </label>
      </div>
      <label className="field" htmlFor="deck-email">
        <span>{f.email}</span>
        <input id="deck-email" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field field-grow" htmlFor="deck-note">
        <span>{f.note} <em>{f.optional}</em></span>
        <textarea id="deck-note" name="note" rows="2" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? f.sending : f.submit}
      </button>
      {state === 'offline' && (
        <p className="form-note" role="status">
          {f.offlineBefore} <span className="select">{CONTACT_EMAIL}</span> {f.offlineAfter}
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

// Why RotexAI (design: "Hộp kính, không phải hộp đen"). Left, the black box: code you cannot read behind a
// pulsing "?". Right, the glass box: the bakery's restock workflow running step by step, with a run log.
// Timeline, one tick per 1.2 s while on screen: 0 idle, 1 Mai, 2 first link, 3 Anna, 4 second link, 5 the app,
// 6-8 hold finished. Starts finished, so reduced motion and no JS show the whole run.
const GB_TICKS = 9
const GB_DONE = 6
function useGlassRun(ref) {
  const [tick, setTick] = useState(GB_DONE)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    let timer = null
    const io = new IntersectionObserver(
      ([e]) => {
        clearInterval(timer)
        if (!e.isIntersecting) return
        setTick(0)
        timer = setInterval(() => setTick((t) => (t + 1) % GB_TICKS), 1200)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearInterval(timer)
    }
  }, [ref])
  return tick
}

const GB_ICONS = [
  <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  <><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  <><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
]
const GB_POINT_ICONS = [
  <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  <path d="M4 6h16M4 12h16M4 18h10" />,
  <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5V15a3 3 0 003 3h6.5" /><path d="M18 15.5V9a3 3 0 00-3-3H8.5" /></>,
]
const Svg = ({ size, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
)

function GlassBox() {
  const { t } = useLang()
  const g = t.glassBox
  const ref = useRef(null)
  const tick = useGlassRun(ref)
  const node = (at) => (tick === at ? 'now' : tick > at ? 'done' : '')
  const link = (at) => (tick === at ? 'moving' : tick > at ? 'filled' : '')
  const shown = tick >= 5 ? 3 : tick >= 3 ? 2 : tick >= 1 ? 1 : 0
  const bars = [62, 80, 54, 70, 40, 76, 58, 66, 46, 30]
  const indent = [0, 24, 24, 48, 48, 24, 24, 48, 24, 0]
  return (
    <>
      <div className="gb">
        <figure className="gb-col reveal">
          <div className="gb-panel gb-black">
            <span className="gb-status"><span className="gb-blink" aria-hidden="true" />{g.black.status}</span>
            <div className="gb-code" aria-hidden="true">
              <div className="gb-scroll">
                {[...bars, ...bars].map((w, i) => (
                  <span key={i} style={{ width: `${w}%`, marginLeft: indent[i % bars.length] }} />
                ))}
              </div>
            </div>
            <span className="gb-q" aria-hidden="true">?</span>
          </div>
          <figcaption>
            <h3>{g.black.title}</h3>
            <p>{g.black.line}</p>
          </figcaption>
        </figure>

        <figure ref={ref} className="gb-col gb-col-glass reveal" style={{ '--d': '0.12s' }}>
          <div className="gb-panel gb-glass">
            <span className="gb-status gb-status-live"><span className="gb-blink" aria-hidden="true" />{g.glass.status}</span>
            <ol className="gb-flow">
              {g.steps.map((st, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <li className={`gb-link ${link(i * 2)}`} aria-hidden="true">
                      <span className="gb-fill" />
                      <span className="gb-dot" />
                    </li>
                  )}
                  <li className={`gb-node ${node(i * 2 + 1)}`}>
                    <span className="gb-tile">
                      <Svg size={30} strokeWidth="1.8">{GB_ICONS[i]}</Svg>
                      <span className="gb-check" aria-hidden="true"><Svg size={14} strokeWidth="3"><path d="M20 6L9 17l-5-5" /></Svg></span>
                    </span>
                    <span className="gb-who">{st.who}</span>
                    <span className="gb-what">{st.what}</span>
                  </li>
                </Fragment>
              ))}
            </ol>
            <div className="gb-log">
              <span className="gb-log-label">{g.logLabel}</span>
              <ul>
                {g.log.map((row, i) => (
                  <li key={i} className={i < shown ? 'shown' : ''}>
                    <time>{row.at}</time>
                    <span>{row.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <figcaption>
            <h3>{g.glass.title}</h3>
            <p>{g.glass.line}</p>
          </figcaption>
        </figure>
      </div>

      <ul className="gb-points reveal">
        {g.points.map((pt, i) => (
          <li key={i}>
            <Svg size={18} strokeWidth="1.9">{GB_POINT_ICONS[i]}</Svg>
            {pt}
          </li>
        ))}
      </ul>
    </>
  )
}

function Heading({ label, text }) {
  return (
    <header className="section-head reveal">
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
          <a href="#next" className="btn btn-primary btn-sm bar-cta">{t.cta.deck}</a>
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
              <a href="#next" className="btn btn-primary">{t.cta.deck}</a>
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
            <header className="section-head section-head-center gb-head reveal">
              <h2 className="h2">
                <Words text={t.glassBox.titleA} /> <span className="gb-dim"><Words text={t.glassBox.titleB} start={0.2} /></span>
              </h2>
              <p className="lead">{t.glassBox.lead}</p>
            </header>
            <GlassBox />
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
          <div className="wrap split">
            <div className="split-col">
              <Heading label={t.market.label} text={t.market.title} />
              <p className="figure reveal"><Slot>{t.market.size}</Slot></p>
              <p className="body reveal"><Slot>{t.market.count}</Slot> {t.market.countAfter}</p>
              <p className="source reveal">{t.market.source} <Slot>{t.market.sourceSlot}</Slot></p>
            </div>
            <div className="split-col">
              <Heading label={t.whyNow.label} text={t.whyNow.title} />
              <ul className="reasons reveal">
                {t.whyNow.reasons.map((r, i) => <li key={i}><Slot>{r}</Slot></li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="team" className="section">
          <div className="wrap split">
            <div className="split-col">
              <Heading label={t.people.label} text={t.people.title} />
              <div className="person reveal">
                <img className="avatar" src="/media/founder.jpg" alt="" width="64" height="64" loading="lazy" />
                <div>
                  <p className="title">{t.people.name}</p>
                  <p className="small">{t.people.role}</p>
                  <p className="body">{t.people.background}</p>
                  <a className="person-link" href={FOUNDER_URL} target="_blank" rel="noopener">
                    {t.people.site} · qvanle.rotexai.com <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="split-col">
              <Heading label={t.round.label} text={t.round.title} />
              <dl className="terms reveal">
                <div><dt>{t.round.stage}</dt><dd>{t.round.stageValue}</dd></div>
                <div><dt>{t.round.raising}</dt><dd><Slot>{t.round.raisingValue}</Slot></dd></div>
                <div><dt>{t.round.funds}</dt><dd><Slot>{t.round.fundsValue}</Slot></dd></div>
              </dl>
            </div>
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
