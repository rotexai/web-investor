// Every outbound link and contact on the page. Route text lives in src/i18n (hub.routes.<id>).
// A null href renders as a static card, so nothing points nowhere.
export const CONTACT_EMAIL = 'contact@rotexai.com'
export const PORTAL_URL = 'https://portal.rotexai.com'
export const FOUNDER_URL = 'https://qvanle.rotexai.com'
export const DECK_URL = 'https://deck.rotexai.com'

// The founder form POSTs JSON { name, firm, email, note, lang } here. Unset: the form says it is not connected yet.
export const DECK_REQUEST_URL = import.meta.env.VITE_DECK_REQUEST_URL || null

export const ROUTES = [
  { id: 'deck', href: DECK_URL },
  { id: 'product', href: PORTAL_URL },
  { id: 'call', href: null }, // [Calendar link]
  { id: 'dataRoom', href: null }, // by invitation
]
