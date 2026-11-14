# web-investor

The RotexAI investor page at <https://investor.rotexai.com>: a calling card that routes investors to the deck
request, the live product, a call and the data room. Vite + React, one page, English and Vietnamese.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build    # dist/
```

## Content

- All page copy lives in `src/i18n/en.js` (source of truth) and `src/i18n/vi.js` (same keys). The EN | VI switch
  in the header remembers the visitor's choice; a first visit follows the browser language.
- Bracketed text such as `[Founder name]` is a placeholder for a real fact and renders in a dashed box. Replace it
  with the fact, never with a guess.
- Links, the contact email and the hub routes are in `src/config.js`. A route with `href: null` renders as a static
  card.
- Deck requests POST JSON `{ name, firm, email, note, lang }` to `VITE_DECK_REQUEST_URL` (build-time env). Unset,
  the form tells the visitor to email instead.
- Product clips in `public/media/` are cut from the RotexAI walkthrough video, which shows the portal rebuilt from
  its source code. The page labels them as a simulated interface; keep that label.

## Deploy

Every push to `main` builds and publishes to GitHub Pages (`.github/workflows/deploy.yml`). The custom domain
`investor.rotexai.com` is set in the repository's Pages settings and needs a DNS `CNAME investor -> rotexai.github.io`
record. The page is `noindex` until the round is ready to be found by search.
