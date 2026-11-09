# Membership registration (public website side)

`/membership` lets a visitor apply for Giwesa membership without creating an
account. The website is an **entry point**, not a membership system: it holds no
membership tables and enforces no membership decisions of its own. It validates
the form and the files, then submits the application to the internal Giwesa
Membership & Financial Management System (FMS) over a signed server-to-server
channel.

The FMS-side runbook — data model, approval workflow, payment states, emails, PDF
rules and operations — is `giwesa-m-fms/docs/public-membership-registration.md`.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `FMS_API_URL` | to enable the page | FMS base URL, no trailing slash |
| `FMS_CHANNEL_KEY` | to enable the page | Shared channel key (must match the FMS `PUBLIC_CHANNEL_API_KEY`) |
| `FMS_CHANNEL_SECRET` | to enable the page | Shared HMAC secret (must match `PUBLIC_CHANNEL_API_SECRET`) |
| `FMS_REQUEST_TIMEOUT_MS` | no (20000) | Per-call timeout |

When any of the three is unset, `/membership` renders an "online registration is
not available" state with the office contact details. There is deliberately no
local fallback.

**The channel secret is server-only.** It is read in
`src/domains/membership/fms-client.ts` (which imports `server-only`), used to sign
requests from this site's server, and never exposed to the browser — there is no
`NEXT_PUBLIC_` variable anywhere in this feature.

## How a submission flows

1. The browser posts one multipart request to `/api/membership/applications`
   (fields + National ID + photograph + optional supporting document + an
   idempotency key).
2. The route checks the origin, the request size, the per-IP and per-email
   limits, validates every field with the shared schema, and validates each file
   by its **content signature** (not its extension or declared MIME type).
3. The server creates the application in the FMS (signed request, idempotency
   key), uploads the documents, and submits it into the existing approval
   workflow.
4. The response carries the application reference, payment position and the
   applicant's per-application token. The browser then offers the payment step:
   STK Push via `/api/membership/applications/{id}/stk`, a manual PayBill claim
   via `.../manual-payment`, or the Pay Later instructions.
5. Status polling (`.../status`) updates the confirmation screen while an M-Pesa
   request is outstanding.

## Files

```
src/app/(public)/membership/page.tsx                     the page
src/components/public/forms/membership-registration-form.tsx  the form + confirmation
src/app/api/membership/config/route.ts                   fee/options proxy
src/app/api/membership/applications/route.ts             submission
src/app/api/membership/applications/[id]/status/route.ts  status proxy
src/app/api/membership/applications/[id]/stk/route.ts     STK initiation
src/app/api/membership/applications/[id]/manual-payment/route.ts  manual claim
src/domains/membership/schema.ts                         form validation
src/domains/membership/files.ts                          upload validation
src/domains/membership/signing.ts                        the signature protocol
src/domains/membership/fms-client.ts                     signed HTTP client
src/domains/membership/service.ts                        orchestration + config cache
src/domains/membership/http.ts                           origin/token/limit helpers
src/domains/membership/types.ts                          shared shapes (browser-safe)
```

## Reliability choices

- **Idempotency.** The browser keeps a submission key in `sessionStorage`, so a
  double click, a retry after a timeout or a page reload collapses into one FMS
  application. The FMS enforces the uniqueness.
- **Application before payment.** The application is created and submitted before
  any payment is attempted; a failed STK push or an abandoned prompt cannot lose
  it, and a failed push leaves the application in place.
- **Retry-safe partial failure.** If an upload or the submit call fails after the
  draft was created, the page tells the applicant the application was saved and
  that pressing Submit again is safe. A retry re-uses the same application, and
  the FMS treats a re-uploaded identical document as idempotent.
- **No false payment claims.** The site never marks anything paid: verification
  happens on the FMS/provider side, and the page only displays what the FMS
  reports.

## Security

- Server-side validation of every field and every file; content-signature check.
- Same-origin `Origin` check on every mutation.
- Per-IP request windows (creation, status, STK, manual claim) and a per-email
  cap; body-size ceiling.
- The applicant token travels in an `x-membership-token` header, never a query
  string, and scopes every follow-up call to that one application.
- FMS errors are translated into visitor-facing messages; internals, credentials
  and provider wording are never forwarded.

## Tests

```bash
pnpm test
```

covers the form schema, file validation (signatures, size, declared-type
mismatch, hostile file names), the signing protocol, and the FMS client's request
signing and error translation. An end-to-end run against a live FMS is described
in the FMS document's testing section.
