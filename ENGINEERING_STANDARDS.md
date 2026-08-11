# Blind Journal engineering standards

These are the review standards for the intended production application. They are intentionally
small and decision-oriented: tooling enforces mechanical rules, while this document and code
review cover architecture, security, and product behavior that a linter cannot understand.

## Priorities

1. Preserve the zero-knowledge boundary and prevent plaintext or key disclosure.
2. Preserve user data and make failures observable without exposing sensitive details.
3. Prefer the smallest design that has one clear owner and one source of truth.
4. Use framework and library primitives as documented before introducing application abstractions.
5. Optimize only after correctness, accessibility, and maintainability are established.

“Simple” means few concepts and predictable ownership. It does not mean omitting validation,
authorization, error handling, durable storage, or tests at a trust boundary.

## Naming and ownership

- `api/` owns browser endpoint functions and contracts shared across the HTTP boundary. Shared
  contract names use `Api`; browser-only inputs, state, and failures use `Client`.
- `server/` owns application services, sessions, persistence, and server-only error-to-HTTP
  mappings. Client code must never import it. Server entry modules use `server-only` where an
  accidental client import must fail the build.
- `crypto/` contains primitive adapters. Domain-specific protocol orchestration stays with its
  domain so that context, versions, and invariants are visible together.
- Components and hooks are named for a product responsibility, not a technical pattern. Avoid
  generic `utils`, `helpers`, `manager`, `wrapper`, and `context` modules unless that term is the
  actual responsibility.
- A value has one canonical name across its boundary. Do not use `client`, `API client`, and
  `server` interchangeably.

## React components

- Components should have one recognizable UI responsibility. Extract a child when it has its own
  interaction, accessibility semantics, translation namespace, or independently testable state;
  do not extract markup solely to shorten a file.
- Keep Client Component boundaries as small as practical. Server Components compose static page
  structure; Client Components own browser APIs and interaction.
- Prefer derived values during render. Use `useState` for real local state such as a form draft,
  editor draft, search input, or dialog visibility—not for copies of props or query data.
- `useEffect` is for synchronizing with an external system. Navigation, data fetching, and derived
  state should use the framework or owning library when it provides a declarative mechanism.
- Do not pass callbacks through layers merely to reach an operation's owning component. Do pass
  explicit props when they make a reusable component's contract clearer than hidden global state.
- Every loading, empty, failure, disabled, and destructive state must remain accessible and must
  not silently discard user work.

## State ownership

Use this order when deciding where state belongs:

1. URL state for navigable/shareable view choices.
2. TanStack Query for remote and cached server data.
3. Local React state for a component-owned draft or display control.
4. Zustand for client state used by multiple independent components, including the in-memory
   unlocked user/key state and cross-workspace selection.

React context is reserved for library/provider integration or stable dependency injection. Do not
use it as a second application state system, and do not copy TanStack Query data into Zustand.
Never persist unlocked keys or decrypted journal data to browser storage.

## TanStack Query

- Queries read; mutations write. Query keys must uniquely identify the data and include every
  variable used by the query function, especially the authenticated user ID for private data.
- Keep key construction next to query options or in a small domain key module. Use the same key for
  reads, cache updates, invalidation, removal, and logout cleanup.
- Updating immutable cache data from a successful mutation response with `setQueryData` is
  expected. Use invalidation when the response is not authoritative or several queries are
  affected. Do not maintain a second derived list beside the cache.
- Global cache callbacks may present generic, localized notifications. Components handle local
  recovery UI and navigation. A caught mutation error must never disappear without either a visible
  state, a global notification, or deliberate reporting.
- Retry only failures that can plausibly succeed unchanged. Authentication, validation,
  decryption, and deterministic crypto failures are not retryable.
- Cancellation signals, mutation serialization, and shared pending state must be used where stale
  requests or concurrent writes could corrupt or expose user data.

## HTTP API and errors

- A successful HTTP status returns data directly. Failures return the appropriate non-2xx status
  and only `{ code }`, where `code` is a stable domain-namespaced contract value.
- API, client-domain, and worker failures remain distinct. Error codes are independent of message
  catalog paths; one exhaustive UI mapping selects the localized message.
- Unknown codes are programmer/protocol failures: report them and let the caller choose an
  intentional generic fallback. Do not leak stack traces, database errors, validation internals,
  usernames, ciphertext, keys, or passwords to clients or logs.
- Validate unknown request bodies and persistence reads at their trust boundaries. TypeScript
  assertions and `.json<T>()` do not perform runtime validation.
- Authenticate and authorize every private endpoint in the handler/service path. Cookie-authenticated
  mutations require same-origin/CSRF protection, bounded bodies, rate limiting, and `no-store`.
- Use named HTTP status constants on the server. Browser code reasons about domain error codes and
  native HTTP/network/timeout error types, not numeric statuses.

## Zero-knowledge protocol

- The server may store public identifiers and metadata, password-KDF salt and versioned parameters,
  authentication verifier material, opaque sessions, ciphertext, IVs, and wrapped entry keys. It
  must never receive a password, master key, key-encryption key, unwrapped entry key, or plaintext.
- The account KDF/key schedule and encrypted-entry envelope are versioned protocols. Persist all
  parameters needed to reproduce them; version labels and authenticated-data construction must not
  drift independently.
- Derive independent authentication and key-encryption material with explicit domain separation.
  Use vetted primitives through libsodium/Web Crypto; do not implement cryptographic algorithms.
- AES-GCM requires a fresh 96-bit IV for each encryption under a key. Bind the envelope version,
  owner, and entry identity as authenticated additional data. Define whether rollback/replay is in
  the threat model and implement revision protection if it is claimed.
- Keep secret material in memory for the shortest practical time, use non-extractable `CryptoKey`s
  after wrapping, clear owned byte arrays best-effort, and clear private caches immediately on lock
  or logout—even if remote session revocation fails.
- Treat XSS prevention and third-party script control as part of the cryptographic boundary. A
  restrictive CSP and security headers are release requirements.

## Internationalization, UI, and styling

- All user-visible text—including metadata, placeholders, tooltips, accessibility labels, errors,
  and success messages—comes from the locale catalogs. Protocol values, identifiers, developer
  diagnostics, and code comments are not translated.
- English defines the catalog shape; every supported locale must pass strict catalog validation.
- Radix Themes and Radix primitives are the design system. Prefer their semantic components,
  responsive props, variants, and tokens. Custom CSS is appropriate only for document-level setup
  or behavior Radix cannot express, such as the rich-text editing canvas.
- Preserve native semantics and keyboard behavior when using `asChild`; destructive actions require
  confirmation and must represent pending/failure states accurately.

## Server persistence and deployment

- Production cannot use process memory for accounts, sessions, salts, or entries. Vercel functions
  are ephemeral and horizontally isolated.
- Use one durable, transactional server store with uniqueness constraints, ownership-scoped
  queries, atomic account/session creation, optimistic revision checks where required, and bounded
  cleanup for expired records.
- The intended deployment uses only an explicitly selected free tier. Resource exhaustion must fail
  closed and visibly; it must never silently fall back to memory or enable paid overages.
- Secrets stay in server-only environment variables. `NEXT_PUBLIC_` configuration contains no
  credentials and production browser requests remain same-origin unless cross-origin operation is
  deliberately designed and secured.

## Verification and review

- Tests cover crypto round trips and tampering, KDF/key-schedule compatibility, auth enumeration and
  rate limits, session lifecycle, request validation, per-user authorization, persistence
  constraints, query-cache isolation, and critical create/edit/delete/logout flows.
- Run `pnpm check` and `pnpm build` before handoff. Security-sensitive changes also require tests
  that fail when the intended invariant is removed.
- Biome and TypeScript enforce mechanical consistency. They cannot prove state ownership,
  separation of concerns, correct query keys, authorization, safe crypto parameters, useful UX, or
  whether text is genuinely user-facing; those remain explicit code-review responsibilities.

Review comments use `TODO(review-<severity>-<topic>)`, where severity is `critical`, `high`,
`medium`, or `low`. Each comment states the violated invariant and the required outcome, without
prescribing a large abstraction.
