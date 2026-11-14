// Every outbound link and contact on the page. Route text lives in src/i18n (hub.routes.<id>).
// A null href renders as a static card, so nothing points nowhere.
export const CONTACT_EMAIL = 'contact@rotexai.com'
export const PORTAL_URL = 'https://portal.rotexai.com'

// Deck requests POST JSON { name, firm, email, note, lang } here. Unset: the form says requests are not connected yet.
export const DECK_REQUEST_URL = import.meta.env.VITE_DECK_REQUEST_URL || null

export const ROUTES = [
  { id: 'product', href: PORTAL_URL },
  { id: 'call', href: null }, // [Calendar link]
  { id: 'onePager', href: '#film' }, // [One-pager link] to add
  { id: 'dataRoom', href: null }, // by invitation
]
