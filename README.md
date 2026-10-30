# GIWESA Solutions — public website

The public-facing website for **GIWESA Solutions & Welfare**, a Kenyan microfinance
organisation. It is a separate application from the internal GIWESA Financial
Management System and uses its own database schema.

The site promotes GIWESA's savings and micro-loan, welfare and community
solutions, publishes practical financial-education articles, and captures
inquiries and consultation requests for authorised staff.

## Technology

- Next.js 16.4 (App Router, Cache Components, Partial Prefetching, Turbopack)
- React 19 and TypeScript (strict)
- Tailwind CSS v4
- Prisma 7 + `@prisma/adapter-mariadb` + MySQL 8/MariaDB
- Server Actions + Route Handlers
- React Hook Form + Zod
- `@node-rs/argon2` password hashing
- Nodemailer (optional notifications)
- Sharp (image processing)
- Vitest + Testing Library
- pnpm

No analytics, advertising pixels, CAPTCHA provider or third-party CMS is used.

## Local setup

Requirements: Node 20.20.2 or newer, pnpm 12, and a running MySQL 8/MariaDB
server.

```bash
cp .env.example .env
# Edit DATABASE_URL and TEST_DATABASE_URL first.
pnpm install
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>. The admin area is at `/admin`.

The database user needs normal DML/DDL rights on the application and test
databases. Integration tests refuse to run unless the test database name ends in
`_test`. See `.env.example` for every environment variable.

### Seed content and development admin

`pnpm db:seed` is idempotent for existing rows: it creates missing seed content
and leaves edited content alone.

Unless `NODE_ENV=production`, it creates a development-only administrator using
the `SEED_ADMIN_*` values. Local default:

```text
admin@giwesa.local / ChangeMe123!
```

These credentials are development-only. They are never created in production
unless the deliberate `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD`
bootstrap variables are explicitly supplied to a one-off seed. Change the
password immediately after a bootstrap and remove the variables. There is no
public administrator registration.

The seed also creates the current confirmed site settings, three solutions and
three initial editorial articles. The articles are original, conservative
educational content, not customer stories or performance claims. GIWESA should
review the initial editorial copy before a public launch.

## Architecture

```text
src/
  app/
    (public)/          Public marketing, solutions, insights, contact and booking
    admin/             Staff login + protected operations area
    api/               Public inquiry and booking endpoints
  components/
    public/            Public UI, forms and page composition
    admin/             Admin navigation, tables and forms
    ui/                Shared primitives
  config/              Site content, product terms/FAQs and validated environment
  db/                  Prisma client singleton
  domains/
    auth/              Passwords, sessions, authorization policy
    blog/              Article schemas, services and public queries
    bookings/          Consultation requests
    inquiries/         Public inquiries
    products/          Solution content
    site-settings/     Editable public contact/hero settings
    media/             Validated image upload and processing
    email/             Optional Nodemailer notifications
    audit/             Append-only operational audit records
  lib/                 Markdown, SEO, dates, rate limiting, validation helpers
prisma/
  migrations/          Committed, deployable migrations
  schema.prisma
  seed.ts
tests/
  unit/                Parsers, schemas, forms, roles, proxy
  integration/         Isolated MySQL tests for auth, blog, leads and privacy
```

Public pages use Server Components by default. Client Components are limited to
the mobile navigation, forms, the share control and admin chrome. Public content
queries are cached with `use cache` and invalidated by tag after admin changes;
inquiries, bookings, authentication and admin reads are never cached publicly.

## Public routes

| Route                                                  | Purpose                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| `/`                                                    | Marketing homepage                                               |
| `/about`                                               | Organisation, mission, vision and values                         |
| `/solutions`                                           | Solution overview                                                |
| `/solutions/[slug]`                                    | Savings & micro-loans, welfare protection, community development |
| `/insights`                                            | Published articles with topic filtering and pagination           |
| `/insights/[slug]`                                     | Published article                                                |
| `/contact`                                             | Inquiry form and contact details                                 |
| `/book`                                                | Consultation request form                                        |
| `/privacy`                                             | Working-draft privacy notice                                     |
| `/terms`                                               | Working-draft website terms                                      |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Crawl and app metadata                                           |

Legal pages are deliberately marked as drafts pending GIWESA/legal approval and
are excluded from search indexing.

## Admin

`/admin` is protected by a database-backed session. The proxy performs an
optimistic cookie-presence redirect only; every admin page, data access and
Server Action verifies the session and role on the server.

Two roles are supported:

- **ADMIN** — all content, leads, products and settings.
- **CONTENT_MANAGER** — insights and solutions only; no leads or settings.

Implemented modules: overview, insights (create/edit/preview/publish/unpublish/
archive/delete), inquiries, bookings, solutions, site settings and account
password change. There is no member portal and no access to internal FMS member,
loan or payment data.

### Blog content

Articles use a deliberately small Markdown subset (`##`, `###`, lists, quotes,
bold, italic, links). The parser returns React elements and never accepts raw
HTML or scriptable content. The admin editor offers a preview saved through the
protected admin route. Cover images are validated by decoding with Sharp,
re-encoded as WebP, restricted in size and written with generated filenames.

### Media storage

Development stores media in `public/uploads/` (gitignored). Production releases
are immutable, so the deploy workflow links each release's `public/uploads` to a
persistent `app/shared/uploads` directory. The release tarball never contains
local uploads. The storage boundary is isolated in
`src/domains/media/service.ts` for a future object-storage adapter.

## Database and migrations

```bash
pnpm db:migrate      # development only; creates a new migration
pnpm db:deploy       # applies committed migrations (CI/production)
pnpm db:seed         # idempotent missing-data seed
pnpm db:studio
```

Do **not** use `prisma db push` as a deployment strategy. Production schema
changes must be committed migrations applied with `prisma migrate deploy`.
Never reset or seed a production database without an explicit, reviewed
procedure.

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test                 # unit + component tests, no database
pnpm test:integration     # applies migrations to TEST_DATABASE_URL and runs MySQL tests
pnpm format:check
pnpm build
```

The integration harness derives its target only from `TEST_DATABASE_URL`,
requires a `_test` database name, applies committed migrations, and resets test
tables between cases. It does not use the development database.

## Health and build identity

`GET /api/health` is public, uncached and request-time. It checks the database and
reports the build version and commit, returning `503` if the database is down. It
never exposes credentials, paths or visitor data.

Build identity is inlined by `next.config.ts` from `APP_VERSION` (package
version) and `APP_COMMIT` (CI commit SHA). It is also written into the package
`release.json`, allowing deployment verification to prove the running bytes match
the validated commit.

## CI and release packaging

GitHub Actions is defined in `.github/workflows/ci.yml` and
`.github/workflows/production.yml`.

- `development` pushes validate only: lint, typecheck, formatting, unit tests,
  MySQL integration tests, production build, Linux artifact packaging and a
  packaged-runtime smoke test.
- `main` calls the same CI workflow, then optionally deploys the exact artifact
  that passed validation.
- Deployment is gated behind the repository variable `DEPLOY_ENABLED=true`.
- Production never receives a database credential; migrations run on the host
  from `~/.config/giwesa-public/deploy.env`.
- Production deployment, release layout, first-time symlink setup, migration
  policy, rollback and required variables/secrets are documented in
  [DEPLOYMENT.md](DEPLOYMENT.md).

Local packaging is Linux-only because Argon2 and Sharp use platform-specific
native binaries:

```bash
APP_COMMIT="$(git rev-parse HEAD)" pnpm build
pnpm release:package
SMOKE_DATABASE_URL="mysql://.../giwesa_public_smoke_test" \
SMOKE_EXPECT_COMMIT="$(git rev-parse HEAD)" \
pnpm release:smoke .release/<release-directory>
```

The package contains `server.js`, `.next` (including static assets), `public`,
production `node_modules` (including the Prisma CLI for host migrations),
`prisma/schema.prisma`, `prisma/migrations`, `prisma.config.mjs` and
`release.json`. It never contains `.env`, local uploads or `prisma/seed.ts`.

## Email notifications

New inquiry and booking notifications use Nodemailer when SMTP and
`NOTIFICATION_EMAIL` are configured. Email is attempted after the inquiry or
booking has been persisted, so an SMTP failure never loses a lead. Delivery
failures are logged without visitor message content or credentials. No visitor
auto-acknowledgement is sent by default.

## Anti-abuse controls

- Server-side Zod validation on every public and admin input
- Honeypot field
- Form-open timing check
- Per-IP and per-email in-memory rate limits
- Request body size limits
- Strict upload validation and re-encoding
- Parameterised Prisma queries

The in-memory limiter is adequate for a single Node process. If the site is
deployed across multiple instances, move the same interface to a shared store
(e.g. the database or Redis) and document the change.

## Production notes

- Node 20.20.2 (`.nvmrc`), pnpm 12, standalone Next.js output and
  HOSTAFRICA/DirectAdmin-style hosting are the deployment baseline.
- Set `APP_URL` to the real public HTTPS URL; canonical URLs, sitemap and social
  images depend on it.
- Use the Linux artifact from CI and run `prisma migrate deploy` on the host
  before activating the release.
- `app/shared/uploads` is persistent; each immutable release links
  `public/uploads` to it.
- Set real SMTP values only through host environment variables.
- Serve over HTTPS so session cookies are `Secure` in production.
- Deployment remains gated and no production deployment has been performed.

## Content accuracy

Confirmed public facts — office location, phone, email, mission, vision,
savings/loan terms, welfare fee/packages/maturity/support benefits, and
community focus areas — are based on GIWESA's supplied flier and business
context. Rates, limits and minimum conditions are shown only where confirmed.
No interest rates, approval times, customer counts, awards, testimonials,
regulator relationships or performance statistics have been invented.

Marketing layout stays in code; high-value editable copy (hero, contact details,
social links, solutions and blog posts) is managed in the admin area.
Rate cards and package terms live in `src/config/site.ts` and should be changed
only after business confirmation.
