# Deployment — GIWESA public website

This document describes the **public website** deployment only. It is separate
from the internal GIWESA FMS and never uses the FMS database, integrations or
deployment directory.

The production target is a DirectAdmin/HOSTAFRICA-style Linux Node application
running the Next.js standalone server. Node version comes from `.nvmrc`
(`20.20.2`); pnpm version comes from `packageManager` in `package.json`.

## Branch and pipeline behaviour

| Branch / event        | Workflow                           | Behaviour                                                                  |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| Push to `development` | `.github/workflows/ci.yml`         | Validate, test, build and package. **Never deploys.**                      |
| Push to `main`        | `.github/workflows/production.yml` | Calls the same CI workflow, then optionally deploys the exact CI artifact. |
| Manual dispatch       | Either workflow                    | Runs the same validation; deployment remains gated by `DEPLOY_ENABLED`.    |

Production does **not** rebuild the application. It downloads the tarball that
passed the reusable CI workflow for the same `github.sha` and deploys those bytes.

## CI jobs

1. **Lint, typecheck and formatting** — `pnpm lint`, `pnpm typecheck`,
   `pnpm format:check`.
2. **Unit and component tests** — `pnpm test`.
3. **Integration tests** — ephemeral MySQL 8 service, committed migrations,
   `pnpm test:integration`.
4. **Production build and Linux artifact** — ephemeral MySQL 8 for realistic
   static generation, `pnpm db:deploy`, `pnpm db:seed` (test content only),
   `pnpm build`, `pnpm release:package`, archive verification, artifact upload.
5. **Packaged-release smoke** — downloads that exact archive, runs native
   Argon2/sharp checks from inside it, applies migrations with the release's
   Prisma CLI, starts its `server.js`, and checks `/api/health`, `/` and
   `/admin/login` against a throwaway MySQL database.

A failure at any stage prevents deployment.

## CI-only credentials

CI uses throwaway MySQL 8 services:

```text
root / ci-only-root-password
```

Database/service containers are destroyed with the runner. CI also pins SMTP,
media and notification settings to empty or local values. It does not hold
production credentials.

## Required GitHub repository variables

Set these under **Settings → Secrets and variables → Actions → Variables**.

| Variable                 | Required     | Purpose                                                                                                                                   |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_ENABLED`         | Always       | Must be exactly `true` to deploy. Anything else validates/packages only.                                                                  |
| `DEPLOY_HOST`            | When enabled | SSH host name or IP.                                                                                                                      |
| `DEPLOY_USER`            | When enabled | SSH deployment user.                                                                                                                      |
| `DEPLOY_APP_ROOT`        | When enabled | Absolute application directory that contains `releases/`, `shared/` and `current`.                                                        |
| `PRODUCTION_URL`         | When enabled | Public HTTPS origin, no trailing slash. Example for documentation: `https://www.giwesa.co.ke`. Confirm the actual domain before enabling. |
| `DEPLOY_PORT`            | Optional     | SSH port; defaults to `22`.                                                                                                               |
| `DEPLOY_RESTART_COMMAND` | Optional     | Command to restart the DirectAdmin/Node application. Defaults to `mkdir -p tmp && touch tmp/restart.txt` inside the activated release.    |

Use a dedicated deployment user. Do not point `DEPLOY_APP_ROOT` at the FMS
application or at a production data directory.

## Required GitHub repository secrets

Set these under **Settings → Secrets and variables → Actions → Secrets**.

| Secret               | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `DEPLOY_SSH_KEY`     | Private key for the deployment user.                                      |
| `DEPLOY_KNOWN_HOSTS` | Reviewed `ssh-keyscan` output for the host. Host-key checking is enabled. |

The deploy job may optionally use a protected GitHub **environment** named
`production` for required reviewers. It does not receive a database credential.

Never add `DATABASE_URL`, SMTP passwords, admin passwords or production media
credentials to GitHub. The host owns those.

## Host secrets

The production database credential remains on the host:

```text
~/.config/giwesa-public/deploy.env
```

Required content:

```bash
DATABASE_URL="mysql://<user>:<password>@localhost:3306/<public_site_db>"
```

Recommended permissions:

```bash
chmod 700 ~/.config/giwesa-public
chmod 600 ~/.config/giwesa-public/deploy.env
```

The application's normal runtime environment (including `DATABASE_URL`,
`APP_URL`, SMTP and `MEDIA_ROOT`) is supplied by the DirectAdmin Node.js
application environment, not by a file in the release. The deploy workflow
sources `deploy.env` with `set -a` for host-side `prisma migrate deploy`, so a
plain `DATABASE_URL=...` line is exported to the migration process.

## Host directory model

Prepare this once:

```text
/home/<deploy-user>/domains/<public-domain>/app/
├── releases/
│   ├── <old-sha>/
│   └── <new-sha>/
├── current -> releases/<active-sha>
└── shared/
    └── uploads/
```

`RELEASES` are immutable. Each release has its own `server.js`, `.next`,
`node_modules`, `public`, `prisma` and `release.json`.

Each release gets a `public/uploads` symlink to `../../shared/uploads`, so media
survives release changes. `public/uploads` is intentionally excluded from the
release tarball.

### One-time setup

```bash
APP_ROOT=/home/<deploy-user>/domains/<public-domain>/app
mkdir -p "$APP_ROOT/releases" "$APP_ROOT/shared/uploads"
chmod 750 "$APP_ROOT/shared/uploads"
mkdir -p "$HOME/.config/giwesa-public"
# Create deploy.env with DATABASE_URL, chmod 600.
```

### First migration to the symlink model

Some hosts already have `app/current` as a **real directory**. The workflow
refuses to overwrite that state:

```text
current exists AND current is not a symlink  →  deployment fails safely
```

A human must migrate it once, preserving the running files, for example:

```bash
cd "$APP_ROOT"
# Stop the application first using the host's supported method.
legacy="releases/legacy-$(date +%Y%m%d%H%M%S)"
mv current "$legacy"
ln -s "$legacy" current
readlink -f current
```

Do not use `rm -rf current`. After the migration, start the application from the
new `current` path and verify it before re-enabling deployment.

The automated workflow also requires `current`, when present, to resolve inside
`releases/`. `current.next` must never be a real directory.

## Deployment order

For each enabled production run:

1. CI validation and packaging complete for `github.sha`.
2. The exact artifact is downloaded by the deploy job.
3. SSH preflight verifies host layout, safe `current` state and the host deploy env.
4. The artifact is uploaded to `releases/<sha>/` and extracted.
5. The archive's `release.json` commit is checked against `github.sha`.
6. `public/uploads` is linked to `shared/uploads`.
7. `prisma migrate deploy` runs **on the host**.
8. `current.next` is created and atomically moved to `current`.
9. The configured restart command runs.
10. Old releases beyond three are pruned without deleting `current`.
11. Public `/api/health`, `/` and `/admin/login` are checked from GitHub.

If upload, extraction or migration fails, `current` is untouched and the old
release remains active.

## Migrations

Production runs only:

```bash
node node_modules/prisma/build/index.js migrate deploy \
  --config prisma.config.mjs \
  --schema prisma/schema.prisma
```

The packaged release includes the Prisma CLI as a production dependency, the
schema/migrations, and an import-free `prisma.config.mjs`. It does not include
`prisma/seed.ts`.

Never run in production:

```text
prisma migrate dev
prisma db push
prisma migrate reset
prisma db seed
```

Database migrations are applied before activation, so a failed migration leaves
the current running release untouched. If the new release later fails health
verification, migrations are **not** automatically reversed.

## Restart

DirectAdmin/Passenger may use a restart marker:

```bash
mkdir -p "$APP_ROOT/current/tmp"
touch "$APP_ROOT/current/tmp/restart.txt"
```

This is the default. If the hosting account requires a different mechanism, set
the repository variable `DEPLOY_RESTART_COMMAND` to the verified command. Do not
assume Passenger semantics without testing the account.

## Activation and rollback

Activation is:

```bash
ln -s "releases/<new-sha>" current.next
mv -Tf current.next current
```

The previous releases remain on disk. Prefer rollback to the previous known-good
release if the new release is unhealthy:

```bash
cd "$APP_ROOT"
readlink -f current                 # record the bad release
ln -s "releases/<previous-sha>" current.next
mv -Tf current.next current
mkdir -p current/tmp && touch current/tmp/restart.txt
```

Then re-run the configured restart and public checks. Do **not** automatically
reverse schema migrations; assess database compatibility first. The workflow
never performs automatic rollback.

Retention keeps the current release, the previous release and one additional
rollback candidate (three releases). The current release is never pruned.

## Health endpoint

`GET /api/health` is public, uncached and checks the database:

```json
{
  "status": "ok",
  "service": "giwesa-public",
  "database": "up",
  "version": "0.1.0",
  "commit": "<full-sha>"
}
```

It returns `503` with `status: "degraded"` if the database is unreachable. It
exposes no credentials, paths, environment values or visitor data. The deploy
verification also checks `/` and `/admin/login` anonymously; it does not perform
a production admin login.

## Local release testing

Release assembly is intentionally Linux-only because `@node-rs/argon2` and
`sharp` install platform-specific native binaries. From a Linux environment with
Node 20.20.2 and pnpm 12:

```bash
APP_COMMIT="$(git rev-parse HEAD)" pnpm build
pnpm release:package
SMOKE_DATABASE_URL="mysql://.../giwesa_public_smoke_test" \
SMOKE_EXPECT_COMMIT="$(git rev-parse HEAD)" \
node scripts/smoke-standalone.mjs .release/giwesa-public-home-0.1.0-<sha>
```

`smoke-standalone.mjs` refuses any database name that does not end in `_test`.
It applies migrations only; it never seeds.

## Deployment enablement checklist

- [ ] Host DirectAdmin/Node application exists and starts the standalone app.
- [ ] `APP_ROOT`, `releases/`, `shared/uploads/` prepared.
- [ ] `current` is absent or a symlink inside `releases/`.
- [ ] `~/.config/giwesa-public/deploy.env` exists, mode 600, with production DB URL.
- [ ] Runtime environment is set in DirectAdmin (`APP_URL`, `DATABASE_URL`, SMTP optional).
- [ ] `DEPLOY_SSH_KEY` and reviewed `DEPLOY_KNOWN_HOSTS` are configured.
- [ ] Repository variables configured.
- [ ] Manual deploy once with `DEPLOY_ENABLED` unset/`false`, review the build artifact.
- [ ] Then set `DEPLOY_ENABLED=true` and run the production workflow.
- [ ] Confirm `/api/health` reports the new commit and `/`/`/admin/login` return 200.

## Security notes

- SSH host-key verification is enabled; `StrictHostKeyChecking=no` is never used.
- GitHub receives no production database, SMTP or admin credentials.
- The artifact contains no `.env`, local uploads, Git data or seed file.
- Deployment logs never print the private key, database URL or passwords.
- The release artifact is retained for 7 days and is tied to the commit SHA.
