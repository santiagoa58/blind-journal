# Blind Journal engineering standards

This document defines the acceptance criteria for Blind Journal. Tooling enforces mechanical rules;
these standards and code review cover architecture, security, accessibility, and product behavior
that static analysis cannot evaluate.

The words **must**, **must not**, **required**, and **never** identify non-negotiable requirements.
**Should** identifies the expected default; departures require a clear reason.

## Decision priorities

When requirements compete, use this order:

1. Preserve the zero-knowledge boundary and prevent disclosure of plaintext or secret keys.
2. Preserve user data and make failures observable without exposing sensitive details.
3. Preserve strict isolation between users.
4. Prefer the smallest design with one clear owner and one source of truth.
5. Use documented framework and library primitives before adding application abstractions.
6. Optimize only after correctness, accessibility, and maintainability are established.

Here, **simple** means few concepts and predictable ownership. It does not mean omitting validation,
authorization, error handling, durable storage, or tests at a trust boundary.

## Architectural ownership

- `api/` owns browser endpoint functions and contracts shared across the HTTP boundary. Shared
  contract names use `Api`; browser-only inputs, state, and failures use `Client`.
- `app/api/v1/` owns versioned Route Handlers and HTTP concerns such as status codes, headers,
  request limits, and response formatting.
- `server/` owns application services, authentication, authorization, sessions, persistence, and
  server-only error mappings. Client code must never import it.
- `crypto/` contains low-level primitive adapters. Account and journal protocol orchestration stays
  with the owning domain so versions, context, and invariants remain visible together.
- Components and hooks are named for product responsibilities. Avoid generic `utils`, `helpers`,
  `manager`, `wrapper`, and `context` modules unless the term describes the actual responsibility.
- A value has one canonical name across a boundary. Do not use `browser`, `API`, and `server`
  interchangeably.

## State ownership

Choose the owner in this order:

1. URL state for navigable or shareable view choices.
2. TanStack Query for remote server data and decrypted data cached while unlocked.
3. Local React state for a component-owned draft or display control.
4. Zustand for small in-memory state shared by independent components, including the unlocked user
   and key-encryption key.

React context is reserved for library integration or stable dependency injection. It must not
become a second application state system, and TanStack Query data must not be copied into Zustand.
Unlocked keys and decrypted journal content must never be persisted to browser storage.

## React components

- A component should have one recognizable UI responsibility. Extract a child when it has its own
  interaction, accessibility semantics, translation namespace, or independently testable state;
  do not extract markup solely to shorten a file.
- Keep Client Component boundaries as small as practical. Server Components compose static page
  structure; Client Components own browser APIs and interaction.
- Derive values during render when possible. Use `useState` for genuine local state such as form
  fields, editor drafts, search input, and dialog visibility—not copies of props or query data.
- Use `useEffect` to synchronize with an external system. Navigation, requests, and derived state
  should use the owning framework or library's declarative mechanism.
- Loading, empty, failure, disabled, pending, and destructive states must remain accessible and
  must not silently discard user work.

## TanStack Query

- Queries read; mutations write. Query keys must include every value used by the query function,
  especially the authenticated user ID for private data.
- Keep key construction next to query options or in a small domain key module. Use the same key for
  reads, cache updates, invalidation, removal, and logout cleanup.
- Update authoritative immutable cache data from mutation responses with `setQueryData`. Invalidate
  when a response is not authoritative or affects several queries.
- A caught mutation error must produce visible state, a localized notification, or deliberate
  reporting. It must never disappear silently.
- Retry only failures that can plausibly succeed without changing the request. Authentication,
  validation, decryption, and deterministic cryptographic failures are not retryable.
- Use cancellation signals, mutation serialization, and shared pending state wherever stale
  requests or concurrent writes could corrupt or expose user data.

## HTTP API and errors

- Successful endpoints return their data directly. Failures use an appropriate non-2xx status and
  return only `{ code }`, where `code` is a stable, domain-namespaced contract value.
- API, browser-domain, and worker failures remain distinct. Error codes are independent of locale
  message paths; an exhaustive UI mapping selects the localized message.
- Unknown codes are programming or protocol failures. Report them and require the caller to choose
  an intentional generic fallback.
- Never expose stack traces, database errors, validation internals, authentication material,
  passwords, keys, plaintext, session identifiers, or unnecessary user data.
- Validate unknown request bodies and persistence reads at their trust boundaries. TypeScript
  assertions and `.json<T>()` do not perform runtime validation.
- Authenticate and authorize every private operation in both the handler and service path.
- Cookie-authenticated mutations require same-origin or CSRF protection, bounded bodies, rate
  limiting, and `Cache-Control: no-store`.
- Browser code reasons about domain codes and native HTTP, network, timeout, and cancellation
  errors—not numeric status values.

## Authentication and sessions

- Account creation and sign-in are explicit flows. An unknown sign-in must never create an account.
- The salt endpoint returns the same response shape for existing and unknown usernames. Credential
  failures remain generic, verification work is timing-resistant, and public authentication routes
  are rate-limited across server instances.
- The browser derives authentication and key-encryption material from the password. The server
  receives only the authentication key over HTTPS and stores only its one-way verifier.
- Browser sessions use random, opaque identifiers in `Secure`, `HttpOnly`, appropriately
  `SameSite` cookies. They are expiring, revocable, rotated at authentication boundaries, and stored
  as one-way hashes in the database.
- Signing out clears local keys and private caches immediately, even if remote session revocation
  fails. The UI must explain any resulting server-side failure without leaving plaintext unlocked.

## Zero-knowledge protocol

### Allowed server data

The server may store usernames, opaque identifiers, KDF salts and parameters, authentication
verifiers, hashed session tokens, timestamps, ciphertext, IVs, and wrapped entry keys.

It must never receive a master password, password-derived master key, key-encryption key, unwrapped
entry key, plaintext title, or plaintext journal body.

### Cryptographic requirements

- Treat the account key schedule and encrypted-entry envelope as versioned protocols. Persist every
  parameter required to reproduce them, and keep protocol versions aligned with AAD construction.
- Derive authentication and key-encryption material independently with explicit domain separation.
  Use vetted primitives through libsodium and Web Crypto; never implement cryptographic algorithms.
- AES-GCM requires a fresh, unpredictable 96-bit IV for every encryption under a key. Bind the
  envelope version, user identifier, and entry identifier as authenticated additional data.
- Make derived `CryptoKey` objects non-extractable, clear owned byte arrays best-effort, and keep
  passwords, plaintext, and raw key material in memory for the shortest practical time.
- Treat XSS prevention and third-party script control as part of the cryptographic boundary. A
  restrictive CSP and appropriate browser security headers are release requirements.

## Server database

- Accounts, authentication verifiers, hashed sessions, entry metadata, wrapped keys, and ciphertext
  reside in one durable, transactional database. Process memory is never authoritative.
- The schema enforces normalized-username uniqueness, ownership relationships, foreign keys, data
  bounds, and the indexes required by authenticated queries.
- Account and session creation, encrypted entry writes, and destructive operations are atomic.
- Every entry query is scoped by the authenticated user ID at the database and service layers.
- The persistence boundary validates rows read from the database before returning them to services.
- Session expiry cleanup and account storage quotas are bounded and observable.
- Resource exhaustion fails closed and visibly. It must never fall back to process memory or
  silently enable unapproved paid overages.

## Account deletion

- Account deletion is available only to an authenticated user and requires the master password to
  be re-entered and verified immediately before deletion.
- The operation requires explicit destructive confirmation and is protected by the same-origin,
  body-size, and rate-limit controls as other authenticated mutations.
- One database transaction deletes every journal entry and session owned by the user before deleting
  the user record. If any step fails, the database remains unchanged and the application reports
  failure.
- The response expires the browser cookie. The browser clears the unlocked key, user state, private
  query cache, and drafts regardless of whether navigation succeeds.
- Deleted data is not retained for recovery. Logs contain no journal content, credentials, or other
  data that would recreate the deleted account.

## Internationalization, accessibility, and styling

- All user-visible text—including metadata, placeholders, tooltips, accessibility labels, errors,
  and success messages—comes from locale catalogs. Protocol values, identifiers, developer
  diagnostics, and code comments are not translated.
- English defines the catalog shape. Every supported locale must pass strict catalog validation.
- Radix Themes and Radix primitives are the design system. Prefer their semantic components,
  responsive properties, variants, and tokens.
- Custom CSS is appropriate only for document-level setup or behavior Radix cannot express, such as
  the rich-text editing canvas.
- Preserve native semantics and keyboard behavior when using `asChild`. Every interaction needs an
  accessible name, visible focus, and meaningful pending and failure states.
- Destructive actions require confirmation and must never imply success before the server confirms
  the operation.

## Deployment and operations

- Production browser requests remain same-origin unless cross-origin operation is deliberately
  designed and secured.
- Server secrets live only in validated server environment variables. `NEXT_PUBLIC_` configuration
  must never contain credentials or private infrastructure details.
- Server modules read configuration through `server/environment.ts`. Biome rejects direct
  `process.env` access outside the environment boundary and narrowly scoped bootstrap or test code.
- HTTPS, CSP, security headers, and request-size limits are deployment requirements.
- Logs use server-generated request IDs for correlation and contain no passwords, raw session
  tokens, key material, plaintext journal content, or ciphertext payloads.

## Verification and release review

Automated tests cover:

- Cryptographic round trips, tampering, key-schedule determinism, and domain separation.
- Account enumeration defenses, distributed rate limits, and session creation, expiry, and
  revocation.
- Request validation, per-user authorization, and cross-user isolation.
- Database constraints, transactions, cleanup, quotas, and complete account deletion.
- Query-cache isolation and clearing of unlocked state.
- Critical account creation, sign-in, journal create, edit, delete, account deletion, and logout
  flows.

Before handing off a change, run:

```bash
pnpm check
pnpm build
```

Security-sensitive changes also require a regression test that fails when the intended invariant is
removed. CI installs the frozen lockfile and runs `pnpm check`, `pnpm build`, and
`pnpm audit --prod` for every pull request and push to the main branch.

Biome and TypeScript enforce mechanical consistency. They cannot prove correct ownership,
authorization, user isolation, safe cryptographic parameters, accessible UX, or whether text is
genuinely user-facing. Those remain explicit review responsibilities.
