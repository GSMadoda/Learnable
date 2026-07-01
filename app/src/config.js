// Front-end display copy for the pricing model that the *existing* backend implements:
// a one-time charge per program (server.js `PRICE`, default $35), which unlocks that
// program's course for life and includes its credential. There is no subscription or
// trial in the backend, so the marketing + checkout copy reflect the one-off model.
//
// PRICE_LABEL mirrors the server's default PRICE. If you change the PRICE env var (or
// the Dodo product price), update this string so the marketing figure stays truthful.
export const PRICE_LABEL = '$35'
export const PRICE_TAGLINE = 'One payment per program. Yours to keep, forever.'
