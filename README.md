# E-Commerce Platform: storefront

The customer-facing web shop for the [E-Commerce Platform API](https://github.com/AbubakrHamdy/ecommerce-platform), built with Angular 22 and Tailwind CSS.

Customers browse and search the catalog, keep a cart, check out with a saved address, pay on Stripe's or Paymob's hosted page, and follow their orders.

## Features

| Area | What it does |
|---|---|
| Catalog | Home page, category tree, search, price filter and sorting, all kept in the URL so results can be shared and restored with the back button |
| Product page | Image gallery, stock status, quantity picker, related products |
| Accounts | Sign up, log in, forgot and reset password. Sessions refresh automatically, without tabs racing each other to refresh |
| Cart | Stored on the server per customer. Change quantities, remove lines, and see warnings for products that sold out or were archived since they were added |
| Checkout | Pick a saved address or add one, choose Stripe or Paymob (only the providers the store has configured), then go to the provider's secure payment page |
| Orders | Order history, order details with a progress tracker, pay or cancel a pending order, and a confirmation step after payment that waits for the provider's webhook instead of trusting the redirect |
| Account | Profile, address book (add, edit, delete, set default), change password by email |

## How it works

- **Standalone components and signals**, zoneless change detection, `rxResource` for data loading, lazy-loaded routes per feature.
- **Sessions:** the access token is kept in memory; the refresh token in `localStorage`. An HTTP interceptor adds the token, refreshes it once when it expires (one shared refresh for parallel requests, and a Web Lock across tabs), and signs out when refreshing fails.
- **Payments:** card details never touch this app or the API. The order page shows "Paid" only once the API has received the provider's signed webhook.
- **Money** is shown in each order's own currency, formatted like the order emails (`EGP 1,249.50`).
- **Errors:** every API error has the same shape, so forms show the API's per-field messages under the right inputs.

## Tech stack

Angular 22 (standalone, signals, zoneless) · TypeScript 6 · Tailwind CSS 4 · RxJS · Vitest · Prettier

## Getting started

**Requirements:** Node.js 26 LTS (with npm 11), and the [backend](https://github.com/AbubakrHamdy/ecommerce-platform) running on `http://localhost:3330` with the `dev` profile (it loads sample products and the seed accounts).

```bash
npm install
npm start
```

Open <http://localhost:4200>. During development, `proxy.conf.json` forwards `/api` to the backend, so the browser only talks to one origin and the API needs no CORS setup.

**Seed accounts (backend `dev` profile only):**

| Role | Email | Password |
|---|---|---|
| Customer | `customer@example.com` | `Customer@123` |
| Admin | `admin@example.com` | `Admin@123` |

To try payments without real accounts, run the backend against Stripe's [`stripe-mock`](https://github.com/stripe/stripe-mock) as described in the backend's `docs/payments.md`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Development server with the API proxy, on port 4200 |
| `npm test` | Unit and component tests (Vitest) |
| `npm run build` | Production build into `dist/` |
| `npx prettier --write src` | Format the code |

## Project structure

```
src/app/
├── core/                 # App-wide services, created once
│   ├── api/              # API base URL, page and error types
│   ├── auth/             # Session, token refresh interceptor, route guards, safe return URLs
│   ├── browser/          # Redirect to external pages (replaceable in tests)
│   ├── layout/           # Header, footer, page titles
│   └── store/            # Store settings: currency, payment providers
├── features/             # One folder per area, each lazy-loaded
│   ├── home/
│   ├── catalog/          # Product list, product page, product card
│   ├── auth/             # Login, register, forgot and reset password
│   ├── cart/             # Cart service and page, stock warnings
│   ├── checkout/
│   ├── orders/           # Order history, order page, payment method picker
│   ├── account/          # Account page, address book, address form
│   └── not-found/
└── shared/               # Icons, money pipe, pagination, toasts, form helpers
```

## Tests

`npm test` runs 39 tests. They cover:
- the auth service and token refresh
- safe return URLs
- cart stock warnings
- checkout: which address is used, the redirect to the payment page, and what happens when payment or stock fails
- the order page's payment-confirmation polling
- the address book
- money formatting
- the category tree
- the "not found" pages

HTTP calls are tested against Angular's `HttpTestingController`.

## Related

- Backend API: <https://github.com/AbubakrHamdy/ecommerce-platform> (Spring Boot 4, PostgreSQL, Redis, Stripe and Paymob)
- An admin dashboard is the next phase of this project.
